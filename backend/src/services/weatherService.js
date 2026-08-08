const axios = require('axios');
const logger = require('../utils/logger');

async function getWeather(lat, lon) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return {
      available: false,
      message: 'Weather data unavailable — set OPENWEATHER_API_KEY to enable',
    };
  }

  try {
    const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { lat, lon, appid: apiKey, units: 'metric' },
      timeout: 8000,
    });

    const weather = data.weather?.[0];
    const main = data.main || {};
    const wind = data.wind || {};
    const risk = assessWeatherRisk(weather?.main, main.temp, wind.speed);

    return {
      available: true,
      location: data.name,
      description: weather?.description || 'Unknown',
      condition: weather?.main || 'Unknown',
      temperatureC: main.temp,
      humidity: main.humidity,
      windSpeedMs: wind.speed,
      risk,
    };
  } catch (err) {
    logger.warn('Weather API failed', { error: err.message });
    return {
      available: false,
      message: 'Weather data unavailable',
    };
  }
}

function assessWeatherRisk(condition, tempC, windMs) {
  const severe = ['Thunderstorm', 'Tornado', 'Squall'];
  const caution = ['Rain', 'Snow', 'Drizzle', 'Mist', 'Fog'];

  if (severe.includes(condition) || (windMs && windMs > 15)) {
    return { level: 'high', note: 'Severe weather may delay road/air operations' };
  }
  if (caution.includes(condition) || (tempC != null && (tempC > 42 || tempC < 2))) {
    return { level: 'medium', note: 'Weather may slow deliveries; monitor ETA' };
  }
  return { level: 'low', note: 'Weather conditions look operational' };
}

async function getRouteWeather(origin, destination) {
  const [originWeather, destinationWeather] = await Promise.all([
    getWeather(origin.latitude, origin.longitude),
    getWeather(destination.latitude, destination.longitude),
  ]);

  const risks = [originWeather.risk?.level, destinationWeather.risk?.level].filter(Boolean);
  let overallRisk = 'unknown';
  if (risks.includes('high')) overallRisk = 'high';
  else if (risks.includes('medium')) overallRisk = 'medium';
  else if (risks.includes('low')) overallRisk = 'low';

  return {
    origin: originWeather,
    destination: destinationWeather,
    overallRisk,
  };
}

module.exports = { getWeather, getRouteWeather };
