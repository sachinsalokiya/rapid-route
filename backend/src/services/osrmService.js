const axios = require('axios');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const getOsrmBaseUrl = () =>
  (process.env.OSRM_BASE_URL || 'https://router.project-osrm.org').replace(/\/$/, '');

/**
 * OSRM expects coordinates as longitude,latitude
 */
async function getRoute(originLng, originLat, destinationLng, destinationLat, options = {}) {
  const base = getOsrmBaseUrl();
  const coords = `${originLng},${originLat};${destinationLng},${destinationLat}`;
  const url = `${base}/route/v1/driving/${coords}`;

  try {
    const { data } = await axios.get(url, {
      params: {
        overview: options.overview || 'full',
        geometries: options.geometries || 'geojson',
        steps: options.steps || false,
      },
      timeout: 15000,
    });

    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new AppError('No route found between the given coordinates', 404);
    }

    const route = data.routes[0];
    return {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      distanceKm: Number((route.distance / 1000).toFixed(2)),
      durationHours: Number((route.duration / 3600).toFixed(2)),
      geometry: route.geometry,
      provider: 'OSRM',
      baseUrl: base,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.warn('OSRM route request failed', { error: err.message, base });
    throw new AppError(
      `Routing service unavailable (${base}). Configure OSRM_BASE_URL or check connectivity.`,
      503
    );
  }
}

async function getTrip(coordinates) {
  // coordinates: [{lng, lat}, ...]
  if (!coordinates || coordinates.length < 2) {
    throw new AppError('At least two coordinates are required for trip optimization', 400);
  }

  const base = getOsrmBaseUrl();
  const coords = coordinates.map((c) => `${c.lng},${c.lat}`).join(';');
  const url = `${base}/trip/v1/driving/${coords}`;

  try {
    const { data } = await axios.get(url, {
      params: {
        overview: 'full',
        geometries: 'geojson',
        source: 'first',
        destination: 'last',
        roundtrip: false,
      },
      timeout: 20000,
    });

    if (data.code !== 'Ok' || !data.trips?.length) {
      throw new AppError('Trip optimization failed for the given stops', 404);
    }

    const trip = data.trips[0];
    return {
      distanceKm: Number((trip.distance / 1000).toFixed(2)),
      durationHours: Number((trip.duration / 3600).toFixed(2)),
      geometry: trip.geometry,
      waypoints: data.waypoints,
      provider: 'OSRM',
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.warn('OSRM trip request failed', { error: err.message });
    throw new AppError('Trip optimization service unavailable', 503);
  }
}

async function getTable(coordinates) {
  const base = getOsrmBaseUrl();
  const coords = coordinates.map((c) => `${c.lng},${c.lat}`).join(';');
  const url = `${base}/table/v1/driving/${coords}`;

  try {
    const { data } = await axios.get(url, {
      params: { annotations: 'duration,distance' },
      timeout: 20000,
    });
    if (data.code !== 'Ok') {
      throw new AppError('Distance matrix request failed', 404);
    }
    return {
      durations: data.durations,
      distances: data.distances,
      provider: 'OSRM',
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Distance matrix service unavailable', 503);
  }
}

module.exports = {
  getOsrmBaseUrl,
  getRoute,
  getTrip,
  getTable,
};
