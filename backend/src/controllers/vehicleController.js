const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Shipment = require('../models/Shipment');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { generateVehicleId, paginate } = require('../utils/helpers');
const { createNotification } = require('../services/notificationService');

async function listVehicles(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query, req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.vehicleType = req.query.type;
    if (req.query.q) {
      filter.$or = [
        { vehicleId: new RegExp(req.query.q, 'i') },
        { registrationNumber: new RegExp(req.query.q, 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      Vehicle.find(filter)
        .populate('driver', 'name phone status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Vehicle.countDocuments(filter),
    ]);

    sendSuccess(res, { items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

async function getVehicle(req, res, next) {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('driver').populate('currentRoute');
    if (!vehicle) throw new AppError('Vehicle not found', 404);
    const shipments = await Shipment.find({
      assignedVehicle: vehicle._id,
      status: { $in: ['Assigned', 'In Transit', 'Delayed'] },
    }).select('shipmentId trackingNumber status origin destination weightKg');
    sendSuccess(res, { vehicle, activeShipments: shipments });
  } catch (err) {
    next(err);
  }
}

async function createVehicle(req, res, next) {
  try {
    const count = await Vehicle.countDocuments();
    const vehicle = await Vehicle.create({
      vehicleId: generateVehicleId(count + 1),
      registrationNumber: req.body.registrationNumber,
      vehicleType: req.body.vehicleType,
      capacityKg: req.body.capacityKg,
      currentLoadKg: req.body.currentLoadKg || 0,
      currentLocation: req.body.currentLocation || {},
      status: req.body.status || 'Available',
      fuelType: req.body.fuelType || 'Diesel',
      notes: req.body.notes || '',
    });
    sendSuccess(res, { vehicle }, 'Vehicle created', 201);
  } catch (err) {
    next(err);
  }
}

async function updateVehicle(req, res, next) {
  try {
    const allowed = [
      'registrationNumber',
      'vehicleType',
      'capacityKg',
      'currentLoadKg',
      'currentLocation',
      'status',
      'fuelType',
      'notes',
    ];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!vehicle) throw new AppError('Vehicle not found', 404);

    if (updates.status === 'Maintenance') {
      await createNotification({
        type: 'maintenance_required',
        title: 'Vehicle maintenance',
        message: `${vehicle.registrationNumber} marked for maintenance`,
        severity: 'warning',
        relatedVehicle: vehicle._id,
        io: req.app.get('io'),
      });
    }

    sendSuccess(res, { vehicle }, 'Vehicle updated');
  } catch (err) {
    next(err);
  }
}

async function deleteVehicle(req, res, next) {
  try {
    const active = await Shipment.countDocuments({
      assignedVehicle: req.params.id,
      status: { $in: ['Assigned', 'In Transit'] },
    });
    if (active > 0) throw new AppError('Cannot delete vehicle with active shipments', 400);

    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) throw new AppError('Vehicle not found', 404);
    sendSuccess(res, null, 'Vehicle deleted');
  } catch (err) {
    next(err);
  }
}

async function assignDriver(req, res, next) {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) throw new AppError('Vehicle not found', 404);
    const driver = await Driver.findById(req.body.driverId);
    if (!driver) throw new AppError('Driver not found', 404);

    if (vehicle.driver && String(vehicle.driver) !== String(driver._id)) {
      await Driver.findByIdAndUpdate(vehicle.driver, { assignedVehicle: null, status: 'Available' });
    }

    vehicle.driver = driver._id;
    await vehicle.save();
    driver.assignedVehicle = vehicle._id;
    if (driver.status === 'Available') driver.status = 'Available';
    await driver.save();

    const populated = await Vehicle.findById(vehicle._id).populate('driver');
    sendSuccess(res, { vehicle: populated }, 'Driver assigned to vehicle');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  assignDriver,
};
