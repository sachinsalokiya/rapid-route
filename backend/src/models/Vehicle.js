const mongoose = require('mongoose');

const VEHICLE_TYPES = ['Bike', 'Van', 'Truck', 'Train', 'Air', 'Other'];
const VEHICLE_STATUSES = ['Available', 'Assigned', 'In Transit', 'Maintenance', 'Offline'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid', 'Aviation Fuel', 'Other'];

const vehicleSchema = new mongoose.Schema(
  {
    vehicleId: { type: String, required: true, unique: true, index: true },
    registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    vehicleType: { type: String, enum: VEHICLE_TYPES, required: true },
    capacityKg: { type: Number, required: true, min: 1 },
    currentLoadKg: { type: Number, default: 0, min: 0 },
    currentLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      city: { type: String, default: '' },
      updatedAt: { type: Date, default: Date.now },
    },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
    status: { type: String, enum: VEHICLE_STATUSES, default: 'Available', index: true },
    fuelType: { type: String, enum: FUEL_TYPES, default: 'Diesel' },
    currentRoute: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

vehicleSchema.virtual('availableCapacityKg').get(function availableCapacityKg() {
  return Math.max(0, this.capacityKg - this.currentLoadKg);
});

vehicleSchema.set('toJSON', { virtuals: true });
vehicleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
module.exports.VEHICLE_TYPES = VEHICLE_TYPES;
module.exports.VEHICLE_STATUSES = VEHICLE_STATUSES;
