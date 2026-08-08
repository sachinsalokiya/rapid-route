const CITIES = {
  Bhopal: { latitude: 23.2599, longitude: 77.4126, state: 'Madhya Pradesh' },
  Delhi: { latitude: 28.6139, longitude: 77.209, state: 'Delhi' },
  Mumbai: { latitude: 19.076, longitude: 72.8777, state: 'Maharashtra' },
  Bengaluru: { latitude: 12.9716, longitude: 77.5946, state: 'Karnataka' },
  Pune: { latitude: 18.5204, longitude: 73.8567, state: 'Maharashtra' },
  Hyderabad: { latitude: 17.385, longitude: 78.4867, state: 'Telangana' },
  Chennai: { latitude: 13.0827, longitude: 80.2707, state: 'Tamil Nadu' },
  Kolkata: { latitude: 22.5726, longitude: 88.3639, state: 'West Bengal' },
  Jaipur: { latitude: 26.9124, longitude: 75.7873, state: 'Rajasthan' },
};

function cityLocation(city, address) {
  const c = CITIES[city];
  if (!c) throw new Error(`Unknown city: ${city}`);
  return {
    address: address || `${city} Logistics Hub`,
    city,
    state: c.state,
    latitude: c.latitude,
    longitude: c.longitude,
  };
}

function generateTrackingNumber() {
  const part = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RR${Date.now().toString().slice(-8)}${part}`;
}

function generateShipmentId(seq) {
  return `SHP-${String(seq).padStart(5, '0')}`;
}

function generateVehicleId(seq) {
  return `VEH-${String(seq).padStart(4, '0')}`;
}

function parseCoordPair(value) {
  // expects "lng,lat"
  if (!value || typeof value !== 'string') return null;
  const [lng, lat] = value.split(',').map(Number);
  if (Number.isNaN(lng) || Number.isNaN(lat)) return null;
  return { longitude: lng, latitude: lat };
}

function paginate(query, { page = 1, limit = 10 }) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (p - 1) * l;
  return { page: p, limit: l, skip };
}

module.exports = {
  CITIES,
  cityLocation,
  generateTrackingNumber,
  generateShipmentId,
  generateVehicleId,
  parseCoordPair,
  paginate,
};
