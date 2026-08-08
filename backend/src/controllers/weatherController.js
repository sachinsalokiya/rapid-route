const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const weatherService = require('../services/weatherService');
const Shipment = require('../models/Shipment');

async function getWeatherForCoords(req, res, next) {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      throw new AppError('lat and lon query params are required', 400);
    }
    const weather = await weatherService.getWeather(lat, lon);
    sendSuccess(res, weather);
  } catch (err) {
    next(err);
  }
}

async function getWeatherForShipment(req, res, next) {
  try {
    const shipment = await Shipment.findById(req.params.shipmentId);
    if (!shipment) throw new AppError('Shipment not found', 404);
    const weather = await weatherService.getRouteWeather(shipment.origin, shipment.destination);
    sendSuccess(res, weather);
  } catch (err) {
    next(err);
  }
}

module.exports = { getWeatherForCoords, getWeatherForShipment };
