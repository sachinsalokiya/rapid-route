const { parseCoordPair, cityLocation } = require('../src/utils/helpers');
const { heuristicPredict } = require('../src/services/mlService');
const { recommendVehicle } = require('../src/services/optimizationService');

describe('helpers', () => {
  test('parseCoordPair reads lng,lat', () => {
    expect(parseCoordPair('77.41,23.25')).toEqual({ longitude: 77.41, latitude: 23.25 });
    expect(parseCoordPair('bad')).toBeNull();
  });

  test('cityLocation returns Indian hub coordinates', () => {
    const bhopal = cityLocation('Bhopal');
    expect(bhopal.city).toBe('Bhopal');
    expect(bhopal.latitude).toBeCloseTo(23.2599, 3);
  });
});

describe('ml heuristic fallback', () => {
  test('recommends bike for light short haul', () => {
    const result = heuristicPredict({
      packageType: 'Documents',
      distance: 12,
      weight: 2,
      urgency: 'Medium',
    });
    expect(result.transportMode).toBe('Bike');
    expect(result.estimatedHours).toBeGreaterThan(0);
    expect(result.source).toBe('heuristic_fallback');
  });
});

describe('vehicle recommendation', () => {
  test('picks fitting available vehicle', () => {
    const result = recommendVehicle({
      mode: 'Van',
      weightKg: 50,
      availableVehicles: [
        { status: 'Available', vehicleType: 'Bike', capacityKg: 20, currentLoadKg: 0 },
        { status: 'Available', vehicleType: 'Van', capacityKg: 800, currentLoadKg: 100, _id: 'v1' },
      ],
    });
    expect(result.preferredType).toBe('Van');
    expect(result.capacityFit).toBe('fits');
    expect(result.vehicle._id).toBe('v1');
  });
});
