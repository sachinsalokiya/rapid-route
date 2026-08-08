const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema(
  {
    shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    origin: {
      latitude: Number,
      longitude: Number,
      label: String,
    },
    destination: {
      latitude: Number,
      longitude: Number,
      label: String,
    },
    waypoints: [
      {
        latitude: Number,
        longitude: Number,
        label: String,
      },
    ],
    distanceKm: Number,
    durationHours: Number,
    geometry: {
      type: { type: String, enum: ['LineString'], default: 'LineString' },
      coordinates: [[Number]],
    },
    provider: { type: String, default: 'OSRM' },
    optimizationNotes: { type: String, default: '' },
    recommendedMode: String,
    recommendedVehicleType: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Route', routeSchema);
