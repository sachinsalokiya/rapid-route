export const CITIES = [
  { city: 'Bhopal', state: 'Madhya Pradesh', latitude: 23.2599, longitude: 77.4126 },
  { city: 'Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.209 },
  { city: 'Mumbai', state: 'Maharashtra', latitude: 19.076, longitude: 72.8777 },
  { city: 'Bengaluru', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
  { city: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
  { city: 'Hyderabad', state: 'Telangana', latitude: 17.385, longitude: 78.4867 },
  { city: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
  { city: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
  { city: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
];

export function cityToLocation(cityName, address) {
  const found = CITIES.find((c) => c.city === cityName);
  if (!found) return null;
  return {
    address: address || `${cityName} Logistics Hub`,
    city: found.city,
    state: found.state,
    latitude: found.latitude,
    longitude: found.longitude,
  };
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(value, digits = 1) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString('en-IN', {
    maximumFractionDigits: digits,
  });
}

export function getErrorMessage(err, fallback = 'Something went wrong') {
  return err?.response?.data?.message || err?.message || fallback;
}
