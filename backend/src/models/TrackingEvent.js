const mongoose = require('mongoose');

const EVENT_TYPES = [
  'Shipment Created',
  'Assigned',
  'Picked Up',
  'In Transit',
  'Out for Delivery',
  'Delivered',
  'Delayed',
  'Cancelled',
  'Location Update',
];

const trackingEventSchema = new mongoose.Schema(
  {
    shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true, index: true },
    trackingNumber: { type: String, required: true, index: true },
    eventType: { type: String, enum: EVENT_TYPES, required: true },
    description: { type: String, default: '' },
    location: {
      latitude: Number,
      longitude: Number,
      label: String,
    },
    simulated: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrackingEvent', trackingEventSchema);
module.exports.EVENT_TYPES = EVENT_TYPES;
