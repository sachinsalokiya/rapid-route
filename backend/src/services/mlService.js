const axios = require('axios');
const logger = require('../utils/logger');

const getMlUrl = () => (process.env.ML_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '');

async function predict({ packageType, distance, weight, urgency, transportMode, routeDurationHours }) {
  const url = `${getMlUrl()}/predict`;
  try {
    const { data } = await axios.post(
      url,
      {
        packageType,
        distance,
        weight,
        urgency,
        transportMode,
        routeDurationHours,
      },
      { timeout: 10000 }
    );
    return data;
  } catch (err) {
    logger.warn('ML service unavailable, using heuristic fallback', { error: err.message });
    return heuristicPredict({ packageType, distance, weight, urgency, transportMode, routeDurationHours });
  }
}

/**
 * Explainable fallback when ML service is down.
 * Not claimed as ML — used only for resilience.
 */
function heuristicPredict({ packageType, distance, weight, urgency, transportMode, routeDurationHours }) {
  let mode = transportMode;
  if (!mode) {
    if (weight <= 5 && distance <= 30) mode = 'Bike';
    else if (weight <= 50 && distance <= 150) mode = 'Van';
    else if (distance > 1200 && urgency === 'Critical') mode = 'Air';
    else if (distance > 800 && weight > 200) mode = 'Train';
    else mode = 'Truck';
  }

  const speedByMode = { Bike: 25, Van: 45, Truck: 50, Train: 70, Air: 650 };
  const baseHours =
    routeDurationHours != null
      ? routeDurationHours
      : distance / (speedByMode[mode] || 50);

  const urgencyFactor = { Low: 1.15, Medium: 1.0, High: 0.9, Critical: 0.8 }[urgency] || 1;
  const packageFactor = packageType === 'Fragile' || packageType === 'Pharmaceutical' ? 1.1 : 1;
  const estimatedHours = Number((baseHours * urgencyFactor * packageFactor * 1.12).toFixed(2));

  return {
    transportMode: mode,
    estimatedHours,
    source: 'heuristic_fallback',
    note: 'ML service unavailable; used explainable heuristic fallback',
  };
}

module.exports = { predict, heuristicPredict };
