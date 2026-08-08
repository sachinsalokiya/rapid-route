const Shipment = require('../models/Shipment');
const TrackingEvent = require('../models/TrackingEvent');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

async function trackByNumber(req, res, next) {
  try {
    const trackingNumber = (req.params.trackingNumber || '').toUpperCase();
    const shipment = await Shipment.findOne({ trackingNumber })
      .populate('assignedVehicle', 'vehicleId registrationNumber vehicleType status currentLocation')
      .populate('assignedDriver', 'name phone status');

    if (!shipment) throw new AppError('Tracking number not found', 404);

    const events = await TrackingEvent.find({ trackingNumber: shipment.trackingNumber }).sort({
      createdAt: 1,
    });

    sendSuccess(res, {
      shipment: {
        trackingNumber: shipment.trackingNumber,
        shipmentId: shipment.shipmentId,
        status: shipment.status,
        origin: shipment.origin,
        destination: shipment.destination,
        currentLocation: shipment.currentLocation,
        transportationMode: shipment.transportationMode,
        routeDistanceKm: shipment.routeDistanceKm,
        routeDurationHours: shipment.routeDurationHours,
        predictedEtaHours: shipment.predictedEtaHours,
        estimatedDeliveryTime: shipment.estimatedDeliveryTime,
        actualDeliveryTime: shipment.actualDeliveryTime,
        routeGeometry: shipment.routeGeometry,
        packageType: shipment.packageType,
        weightKg: shipment.weightKg,
        urgency: shipment.urgency,
        assignedVehicle: shipment.assignedVehicle,
        assignedDriver: shipment.assignedDriver,
        simulation: {
          enabled: shipment.simulation?.enabled || false,
          progress: shipment.simulation?.progress || 0,
          mode: 'demo_simulation',
          note: 'Vehicle movement is simulated for demo purposes — not live GPS hardware.',
        },
      },
      timeline: events,
    });
  } catch (err) {
    next(err);
  }
}

async function listActiveTracking(req, res, next) {
  try {
    const items = await Shipment.find({ status: { $in: ['In Transit', 'Assigned', 'Delayed'] } })
      .select(
        'trackingNumber shipmentId status origin destination currentLocation transportationMode simulation estimatedDeliveryTime assignedVehicle routeGeometry'
      )
      .populate('assignedVehicle', 'vehicleId registrationNumber currentLocation status');
    sendSuccess(res, {
      items,
      simulationMode: process.env.TRACKING_SIMULATION_ENABLED !== 'false',
      note: 'Active deliveries use demo simulation unless a real GPS feed is integrated.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { trackByNumber, listActiveTracking };
