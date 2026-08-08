const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'delayed_shipment',
  'capacity_exceeded',
  'delivery_completed',
  'route_issue',
  'maintenance_required',
  'assignment',
  'system',
];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['info', 'warning', 'critical', 'success'], default: 'info' },
    relatedShipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', default: null },
    relatedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
