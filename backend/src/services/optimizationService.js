const { VEHICLE_TYPES } = require('../models/Vehicle');
const osrmService = require('./osrmService');
const mlService = require('./mlService');

/**
 * Explainable optimization layer on top of OSRM shortest-path routing.
 * Scores candidate modes/vehicles using distance, capacity, urgency, and ETA.
 * This is NOT advanced OR solvers / VRP — documented as a scoring heuristic.
 */
async function optimizeRoute({
  origin,
  destination,
  waypoints = [],
  vehicleCapacityKg,
  shipmentWeightKg,
  urgency = 'Medium',
  packageType = 'Other',
  preferredMode,
  availableVehicles = [],
}) {
  let routeResult;

  if (waypoints.length > 0) {
    const coords = [
      { lng: origin.longitude, lat: origin.latitude },
      ...waypoints.map((w) => ({ lng: w.longitude, lat: w.latitude })),
      { lng: destination.longitude, lat: destination.latitude },
    ];
    const trip = await osrmService.getTrip(coords);
    routeResult = {
      distanceKm: trip.distanceKm,
      durationHours: trip.durationHours,
      geometry: trip.geometry,
      provider: trip.provider,
    };
  } else {
    routeResult = await osrmService.getRoute(
      origin.longitude,
      origin.latitude,
      destination.longitude,
      destination.latitude
    );
  }

  const prediction = await mlService.predict({
    packageType,
    distance: routeResult.distanceKm,
    weight: shipmentWeightKg,
    urgency,
    transportMode: preferredMode,
    routeDurationHours: routeResult.durationHours,
  });

  const recommendedMode = preferredMode || prediction.transportMode;
  const vehicleRecommendation = recommendVehicle({
    mode: recommendedMode,
    weightKg: shipmentWeightKg,
    capacityHint: vehicleCapacityKg,
    availableVehicles,
  });

  const scoreBreakdown = {
    distanceKm: routeResult.distanceKm,
    osrmDurationHours: routeResult.durationHours,
    urgencyWeight: urgencyScore(urgency),
    capacityFit: vehicleRecommendation.capacityFit,
    mode: recommendedMode,
  };

  return {
    recommendedRoute: {
      distanceKm: routeResult.distanceKm,
      durationHours: routeResult.durationHours,
      geometry: routeResult.geometry,
      stops: [
        { type: 'origin', ...origin },
        ...waypoints.map((w, i) => ({ type: 'stop', order: i + 1, ...w })),
        { type: 'destination', ...destination },
      ],
    },
    totalDistanceKm: routeResult.distanceKm,
    estimatedDurationHours: routeResult.durationHours,
    predictedLogisticsEtaHours: prediction.estimatedHours,
    vehicleRecommendation,
    transportationRecommendation: recommendedMode,
    scoreBreakdown,
    explanation:
      'OSRM provides the road path (distance/duration). A scoring layer then recommends mode/vehicle using weight, urgency, capacity, and ML/heuristic ETA — not a full vehicle-routing solver.',
    predictionSource: prediction.source || 'ml_service',
  };
}

function urgencyScore(urgency) {
  return { Low: 1, Medium: 2, High: 3, Critical: 4 }[urgency] || 2;
}

function recommendVehicle({ mode, weightKg, capacityHint, availableVehicles }) {
  const typeForMode = {
    Bike: 'Bike',
    Van: 'Van',
    Truck: 'Truck',
    Train: 'Train',
    Air: 'Air',
  };
  const preferredType = typeForMode[mode] || 'Truck';

  const candidates = (availableVehicles || []).filter(
    (v) =>
      v.status === 'Available' &&
      v.capacityKg - (v.currentLoadKg || 0) >= weightKg &&
      (v.vehicleType === preferredType || VEHICLE_TYPES.includes(v.vehicleType))
  );

  const sorted = candidates.sort((a, b) => {
    const aAvail = a.capacityKg - (a.currentLoadKg || 0);
    const bAvail = b.capacityKg - (b.currentLoadKg || 0);
    const aTypeBoost = a.vehicleType === preferredType ? 0 : 1000;
    const bTypeBoost = b.vehicleType === preferredType ? 0 : 1000;
    return aAvail + aTypeBoost - (bAvail + bTypeBoost);
  });

  const best = sorted[0] || null;
  return {
    preferredType,
    vehicle: best,
    capacityFit: best
      ? 'fits'
      : capacityHint && capacityHint >= weightKg
        ? 'capacity_ok_no_vehicle'
        : 'insufficient_capacity',
  };
}

module.exports = { optimizeRoute, recommendVehicle };
