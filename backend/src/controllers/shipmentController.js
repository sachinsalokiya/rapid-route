const Shipment = require('../models/Shipment');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const TrackingEvent = require('../models/TrackingEvent');
const Route = require('../models/Route');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { generateTrackingNumber, generateShipmentId, paginate } = require('../utils/helpers');
const osrmService = require('../services/osrmService');
const mlService = require('../services/mlService');
const { createNotification } = require('../services/notificationService');

async function listShipments(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query, req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.urgency) filter.urgency = req.query.urgency;
    if (req.query.mode) filter.transportationMode = req.query.mode;
    if (req.query.q) {
      filter.$or = [
        { trackingNumber: new RegExp(req.query.q, 'i') },
        { shipmentId: new RegExp(req.query.q, 'i') },
        { 'origin.city': new RegExp(req.query.q, 'i') },
        { 'destination.city': new RegExp(req.query.q, 'i') },
      ];
    }

    const sortField = req.query.sortBy || 'createdAt';
    const sortDir = req.query.sortDir === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      Shipment.find(filter)
        .populate('assignedVehicle', 'vehicleId registrationNumber vehicleType status')
        .populate('assignedDriver', 'name phone status')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit),
      Shipment.countDocuments(filter),
    ]);

    sendSuccess(res, { items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

async function getShipment(req, res, next) {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('assignedVehicle')
      .populate('assignedDriver')
      .populate('createdBy', 'name email');
    if (!shipment) throw new AppError('Shipment not found', 404);

    const events = await TrackingEvent.find({ shipment: shipment._id }).sort({ createdAt: 1 });
    sendSuccess(res, { shipment, events });
  } catch (err) {
    next(err);
  }
}

async function createShipment(req, res, next) {
  try {
    const count = await Shipment.countDocuments();
    const shipmentId = generateShipmentId(count + 1);
    const trackingNumber = generateTrackingNumber();

    let routeDistanceKm = null;
    let routeDurationHours = null;
    let geometry = { type: 'LineString', coordinates: [] };
    let predictedEtaHours = null;
    let transportationMode = req.body.transportationMode || null;
    let estimatedDeliveryTime = null;

    try {
      const route = await osrmService.getRoute(
        req.body.origin.longitude,
        req.body.origin.latitude,
        req.body.destination.longitude,
        req.body.destination.latitude
      );
      routeDistanceKm = route.distanceKm;
      routeDurationHours = route.durationHours;
      geometry = route.geometry;

      const prediction = await mlService.predict({
        packageType: req.body.packageType || 'Other',
        distance: routeDistanceKm,
        weight: req.body.weightKg,
        urgency: req.body.urgency || 'Medium',
        transportMode: transportationMode,
        routeDurationHours,
      });
      transportationMode = prediction.transportMode;
      predictedEtaHours = prediction.estimatedHours;
      estimatedDeliveryTime = new Date(Date.now() + predictedEtaHours * 3600 * 1000);
    } catch {
      // Routing may be unavailable during create; shipment still saved
    }

    const shipment = await Shipment.create({
      shipmentId,
      trackingNumber,
      origin: req.body.origin,
      destination: req.body.destination,
      packageType: req.body.packageType || 'Other',
      weightKg: req.body.weightKg,
      urgency: req.body.urgency || 'Medium',
      dimensions: req.body.dimensions || {},
      status: 'Pending',
      transportationMode,
      routeDistanceKm,
      routeDurationHours,
      predictedEtaHours,
      estimatedDeliveryTime,
      routeGeometry: geometry,
      notes: req.body.notes || '',
      createdBy: req.user._id,
      currentLocation: {
        latitude: req.body.origin.latitude,
        longitude: req.body.origin.longitude,
        updatedAt: new Date(),
      },
    });

    await TrackingEvent.create({
      shipment: shipment._id,
      trackingNumber,
      eventType: 'Shipment Created',
      description: `Shipment created from ${shipment.origin.city} to ${shipment.destination.city}`,
      location: {
        latitude: shipment.origin.latitude,
        longitude: shipment.origin.longitude,
        label: shipment.origin.city,
      },
    });

    sendSuccess(res, { shipment }, 'Shipment created', 201);
  } catch (err) {
    next(err);
  }
}

async function updateShipment(req, res, next) {
  try {
    const allowed = [
      'origin',
      'destination',
      'packageType',
      'weightKg',
      'urgency',
      'dimensions',
      'status',
      'notes',
      'transportationMode',
    ];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const shipment = await Shipment.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!shipment) throw new AppError('Shipment not found', 404);

    if (updates.status === 'Delayed') {
      await createNotification({
        type: 'delayed_shipment',
        title: 'Shipment delayed',
        message: `${shipment.trackingNumber} marked as Delayed`,
        severity: 'warning',
        relatedShipment: shipment._id,
        io: req.app.get('io'),
      });
      await TrackingEvent.create({
        shipment: shipment._id,
        trackingNumber: shipment.trackingNumber,
        eventType: 'Delayed',
        description: 'Shipment marked delayed',
        simulated: false,
      });
    }

    sendSuccess(res, { shipment }, 'Shipment updated');
  } catch (err) {
    next(err);
  }
}

async function deleteShipment(req, res, next) {
  try {
    const shipment = await Shipment.findByIdAndDelete(req.params.id);
    if (!shipment) throw new AppError('Shipment not found', 404);
    await TrackingEvent.deleteMany({ shipment: shipment._id });
    sendSuccess(res, null, 'Shipment deleted');
  } catch (err) {
    next(err);
  }
}

async function assignShipment(req, res, next) {
  try {
    const { vehicleId, driverId } = req.body;
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) throw new AppError('Shipment not found', 404);
    if (['Delivered', 'Cancelled'].includes(shipment.status)) {
      throw new AppError('Cannot assign a delivered or cancelled shipment', 400);
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) throw new AppError('Vehicle not found', 404);

    const available = vehicle.capacityKg - vehicle.currentLoadKg;
    if (available < shipment.weightKg) {
      await createNotification({
        type: 'capacity_exceeded',
        title: 'Vehicle capacity exceeded',
        message: `${vehicle.registrationNumber} cannot take ${shipment.weightKg}kg (available ${available}kg)`,
        severity: 'critical',
        relatedShipment: shipment._id,
        relatedVehicle: vehicle._id,
        io: req.app.get('io'),
      });
      throw new AppError('Vehicle capacity exceeded', 400);
    }

    let driver = null;
    if (driverId) {
      driver = await Driver.findById(driverId);
      if (!driver) throw new AppError('Driver not found', 404);
    } else if (vehicle.driver) {
      driver = await Driver.findById(vehicle.driver);
    }

    shipment.assignedVehicle = vehicle._id;
    shipment.assignedDriver = driver?._id || null;
    shipment.status = 'Assigned';
    await shipment.save();

    vehicle.currentLoadKg += shipment.weightKg;
    vehicle.status = 'Assigned';
    if (driver) vehicle.driver = driver._id;
    await vehicle.save();

    if (driver) {
      driver.assignedVehicle = vehicle._id;
      driver.status = 'On Delivery';
      await driver.save();
    }

    await TrackingEvent.create({
      shipment: shipment._id,
      trackingNumber: shipment.trackingNumber,
      eventType: 'Assigned',
      description: `Assigned to ${vehicle.registrationNumber}${driver ? ` / ${driver.name}` : ''}`,
    });

    await createNotification({
      type: 'assignment',
      title: 'Shipment assigned',
      message: `${shipment.trackingNumber} assigned to ${vehicle.registrationNumber}`,
      severity: 'info',
      relatedShipment: shipment._id,
      relatedVehicle: vehicle._id,
      io: req.app.get('io'),
    });

    const populated = await Shipment.findById(shipment._id)
      .populate('assignedVehicle')
      .populate('assignedDriver');

    sendSuccess(res, { shipment: populated }, 'Shipment assigned');
  } catch (err) {
    next(err);
  }
}

async function startTransit(req, res, next) {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) throw new AppError('Shipment not found', 404);
    if (!shipment.assignedVehicle) throw new AppError('Assign a vehicle before starting transit', 400);

    if (!shipment.routeGeometry?.coordinates?.length) {
      const route = await osrmService.getRoute(
        shipment.origin.longitude,
        shipment.origin.latitude,
        shipment.destination.longitude,
        shipment.destination.latitude
      );
      shipment.routeGeometry = route.geometry;
      shipment.routeDistanceKm = route.distanceKm;
      shipment.routeDurationHours = route.durationHours;

      await Route.create({
        shipment: shipment._id,
        vehicle: shipment.assignedVehicle,
        origin: {
          latitude: shipment.origin.latitude,
          longitude: shipment.origin.longitude,
          label: shipment.origin.city,
        },
        destination: {
          latitude: shipment.destination.latitude,
          longitude: shipment.destination.longitude,
          label: shipment.destination.city,
        },
        distanceKm: route.distanceKm,
        durationHours: route.durationHours,
        geometry: route.geometry,
      });
    }

    shipment.status = 'In Transit';
    shipment.simulation = {
      enabled: process.env.TRACKING_SIMULATION_ENABLED !== 'false',
      progress: 0,
      routeIndex: 0,
    };
    await shipment.save();

    await Vehicle.findByIdAndUpdate(shipment.assignedVehicle, { status: 'In Transit' });

    await TrackingEvent.create({
      shipment: shipment._id,
      trackingNumber: shipment.trackingNumber,
      eventType: 'Picked Up',
      description: 'Package picked up',
      location: {
        latitude: shipment.origin.latitude,
        longitude: shipment.origin.longitude,
        label: shipment.origin.city,
      },
      simulated: true,
    });

    await TrackingEvent.create({
      shipment: shipment._id,
      trackingNumber: shipment.trackingNumber,
      eventType: 'In Transit',
      description: 'Shipment in transit (demo simulation mode)',
      simulated: true,
    });

    sendSuccess(res, { shipment, simulationMode: true }, 'Transit started (simulation mode)');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
  assignShipment,
  startTransit,
};
