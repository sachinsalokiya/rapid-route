const mongoose = require('mongoose');

const SHIPMENT_STATUSES = [
  'Pending',
  'Assigned',
  'In Transit',
  'Delivered',
  'Delayed',
  'Cancelled',
];

const URGENCY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const TRANSPORT_MODES = ['Bike', 'Van', 'Truck', 'Train', 'Air'];
const PACKAGE_TYPES = [
  'Documents',
  'Electronics',
  'Apparel',
  'Food',
  'Fragile',
  'Industrial',
  'Pharmaceutical',
  'Other',
];

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: '' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    shipmentId: { type: String, required: true, unique: true, index: true },
    trackingNumber: { type: String, required: true, unique: true, index: true },
    origin: { type: locationSchema, required: true },
    destination: { type: locationSchema, required: true },
    packageType: { type: String, enum: PACKAGE_TYPES, default: 'Other' },
    weightKg: { type: Number, required: true, min: 0.1 },
    urgency: { type: String, enum: URGENCY_LEVELS, default: 'Medium' },
    dimensions: {
      lengthCm: { type: Number, default: 0 },
      widthCm: { type: Number, default: 0 },
      heightCm: { type: Number, default: 0 },
    },
    status: { type: String, enum: SHIPMENT_STATUSES, default: 'Pending', index: true },
    assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
    transportationMode: { type: String, enum: TRANSPORT_MODES, default: null },
    routeDistanceKm: { type: Number, default: null },
    routeDurationHours: { type: Number, default: null },
    predictedEtaHours: { type: Number, default: null },
    estimatedDeliveryTime: { type: Date, default: null },
    actualDeliveryTime: { type: Date, default: null },
    currentLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
    routeGeometry: {
      type: { type: String, enum: ['LineString'], default: 'LineString' },
      coordinates: { type: [[Number]], default: [] },
    },
    simulation: {
      enabled: { type: Boolean, default: false },
      progress: { type: Number, default: 0 },
      routeIndex: { type: Number, default: 0 },
    },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shipment', shipmentSchema);
module.exports.SHIPMENT_STATUSES = SHIPMENT_STATUSES;
module.exports.URGENCY_LEVELS = URGENCY_LEVELS;
module.exports.TRANSPORT_MODES = TRANSPORT_MODES;
module.exports.PACKAGE_TYPES = PACKAGE_TYPES;
