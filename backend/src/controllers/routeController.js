const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { parseCoordPair } = require('../utils/helpers');
const osrmService = require('../services/osrmService');
const optimizationService = require('../services/optimizationService');
const Vehicle = require('../models/Vehicle');
const Route = require('../models/Route');

async function getRoute(req, res, next) {
  try {
    const origin = parseCoordPair(req.query.origin);
    const destination = parseCoordPair(req.query.destination);

    if (!origin || !destination) {
      throw new AppError('origin and destination are required as lng,lat', 400);
    }

    const route = await osrmService.getRoute(
      origin.longitude,
      origin.latitude,
      destination.longitude,
      destination.latitude
    );

    sendSuccess(res, {
      origin,
      destination,
      distanceKm: route.distanceKm,
      durationHours: route.durationHours,
      durationSeconds: route.durationSeconds,
      geometry: route.geometry,
      provider: route.provider,
      osrmBaseUrl: route.baseUrl,
    });
  } catch (err) {
    next(err);
  }
}

async function optimize(req, res, next) {
  try {
    const {
      origin,
      destination,
      waypoints = [],
      vehicleCapacityKg,
      shipmentWeightKg,
      urgency,
      packageType,
      preferredMode,
    } = req.body;

    if (!origin?.latitude || !origin?.longitude || !destination?.latitude || !destination?.longitude) {
      throw new AppError('origin and destination with latitude/longitude are required', 400);
    }
    if (!shipmentWeightKg) throw new AppError('shipmentWeightKg is required', 400);

    const availableVehicles = await Vehicle.find({ status: 'Available' }).limit(50);
    const result = await optimizationService.optimizeRoute({
      origin,
      destination,
      waypoints,
      vehicleCapacityKg,
      shipmentWeightKg,
      urgency,
      packageType,
      preferredMode,
      availableVehicles,
    });

    const saved = await Route.create({
      origin: {
        latitude: origin.latitude,
        longitude: origin.longitude,
        label: origin.city || origin.address || 'Origin',
      },
      destination: {
        latitude: destination.latitude,
        longitude: destination.longitude,
        label: destination.city || destination.address || 'Destination',
      },
      waypoints: waypoints.map((w) => ({
        latitude: w.latitude,
        longitude: w.longitude,
        label: w.city || w.address || 'Stop',
      })),
      distanceKm: result.totalDistanceKm,
      durationHours: result.estimatedDurationHours,
      geometry: result.recommendedRoute.geometry,
      optimizationNotes: result.explanation,
      recommendedMode: result.transportationRecommendation,
      recommendedVehicleType: result.vehicleRecommendation.preferredType,
      vehicle: result.vehicleRecommendation.vehicle?._id || null,
    });

    sendSuccess(res, { ...result, routeId: saved._id });
  } catch (err) {
    next(err);
  }
}

async function listRoutes(req, res, next) {
  try {
    const items = await Route.find()
      .populate('shipment', 'trackingNumber status')
      .populate('vehicle', 'vehicleId registrationNumber')
      .sort({ createdAt: -1 })
      .limit(50);
    sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRoute, optimize, listRoutes };
