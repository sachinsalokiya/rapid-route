const mongoose = require('mongoose');

const DRIVER_STATUSES = ['Available', 'On Delivery', 'Off Duty', 'On Leave'];

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    licenseNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
    status: { type: String, enum: DRIVER_STATUSES, default: 'Available', index: true },
    currentLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      city: { type: String, default: '' },
      updatedAt: { type: Date, default: Date.now },
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deliveryHistory: [
      {
        shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
        completedAt: Date,
        notes: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Driver', driverSchema);
module.exports.DRIVER_STATUSES = DRIVER_STATUSES;
