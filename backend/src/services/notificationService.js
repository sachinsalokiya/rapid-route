const Notification = require('../models/Notification');

async function createNotification({
  user = null,
  type,
  title,
  message,
  severity = 'info',
  relatedShipment = null,
  relatedVehicle = null,
  io = null,
}) {
  const notification = await Notification.create({
    user,
    type,
    title,
    message,
    severity,
    relatedShipment,
    relatedVehicle,
  });

  if (io) {
    io.emit('notification:new', notification);
  }

  return notification;
}

module.exports = { createNotification };
