const { sendSuccess } = require('../utils/response');
const mlService = require('../services/mlService');
const AppError = require('../utils/AppError');

async function predict(req, res, next) {
  try {
    const { packageType, distance, weight, urgency, transportMode, routeDurationHours } = req.body;
    if (distance == null || weight == null) {
      throw new AppError('distance and weight are required', 400);
    }

    const result = await mlService.predict({
      packageType: packageType || 'Other',
      distance: Number(distance),
      weight: Number(weight),
      urgency: urgency || 'Medium',
      transportMode,
      routeDurationHours,
    });

    sendSuccess(res, {
      transportMode: result.transportMode,
      estimatedHours: result.estimatedHours,
      source: result.source || 'ml_service',
      note: result.note,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { predict };
