const Shipment = require('../models/Shipment');
const Vehicle = require('../models/Vehicle');
const TrackingEvent = require('../models/TrackingEvent');
const { createNotification } = require('./notificationService');
const logger = require('../utils/logger');

let timer = null;

function interpolate(coords, progress) {
  if (!coords || coords.length < 2) return null;
  const total = coords.length - 1;
  const pos = Math.min(0.999, Math.max(0, progress)) * total;
  const idx = Math.floor(pos);
  const t = pos - idx;
  const [lng1, lat1] = coords[idx];
  const [lng2, lat2] = coords[Math.min(idx + 1, coords.length - 1)];
  return {
    longitude: lng1 + (lng2 - lng1) * t,
    latitude: lat1 + (lat2 - lat1) * t,
    routeIndex: idx,
  };
}

function startTrackingSimulator(io) {
  if (timer) return;
  const tickMs = Number(process.env.TRACKING_TICK_MS || 2000);

  timer = setInterval(async () => {
    try {
      const active = await Shipment.find({
        status: 'In Transit',
        'simulation.enabled': true,
      }).limit(50);

      for (const shipment of active) {
        const coords = shipment.routeGeometry?.coordinates || [];
        if (coords.length < 2) continue;

        const nextProgress = Math.min(1, (shipment.simulation.progress || 0) + 0.02);
        const point = interpolate(coords, nextProgress);
        if (!point) continue;

        shipment.simulation.progress = nextProgress;
        shipment.simulation.routeIndex = point.routeIndex;
        shipment.currentLocation = {
          latitude: point.latitude,
          longitude: point.longitude,
          updatedAt: new Date(),
        };

        if (shipment.assignedVehicle) {
          await Vehicle.findByIdAndUpdate(shipment.assignedVehicle, {
            currentLocation: {
              latitude: point.latitude,
              longitude: point.longitude,
              city: shipment.destination.city,
              updatedAt: new Date(),
            },
            status: 'In Transit',
          });
        }

        const remainingFraction = 1 - nextProgress;
        if (shipment.predictedEtaHours != null) {
          const remainingHours = Number((shipment.predictedEtaHours * remainingFraction).toFixed(2));
          shipment.estimatedDeliveryTime = new Date(Date.now() + remainingHours * 3600 * 1000);
        }

        let completed = false;
        if (nextProgress >= 1) {
          shipment.status = 'Delivered';
          shipment.actualDeliveryTime = new Date();
          shipment.simulation.enabled = false;
          completed = true;

          if (shipment.assignedVehicle) {
            await Vehicle.findByIdAndUpdate(shipment.assignedVehicle, {
              status: 'Available',
              currentLoadKg: 0,
              currentLocation: {
                latitude: shipment.destination.latitude,
                longitude: shipment.destination.longitude,
                city: shipment.destination.city,
                updatedAt: new Date(),
              },
            });
          }

          await TrackingEvent.create({
            shipment: shipment._id,
            trackingNumber: shipment.trackingNumber,
            eventType: 'Delivered',
            description: 'Shipment delivered (simulation)',
            location: {
              latitude: shipment.destination.latitude,
              longitude: shipment.destination.longitude,
              label: shipment.destination.city,
            },
            simulated: true,
          });

          await createNotification({
            type: 'delivery_completed',
            title: 'Delivery completed',
            message: `${shipment.trackingNumber} delivered to ${shipment.destination.city}`,
            severity: 'success',
            relatedShipment: shipment._id,
            io,
          });
        }

        await shipment.save();

        if (io) {
          io.emit('tracking:update', {
            shipmentId: shipment._id,
            trackingNumber: shipment.trackingNumber,
            status: shipment.status,
            currentLocation: shipment.currentLocation,
            progress: shipment.simulation.progress,
            estimatedDeliveryTime: shipment.estimatedDeliveryTime,
            simulated: true,
            completed,
          });
        }
      }
    } catch (err) {
      logger.warn('Tracking simulator tick failed', { error: err.message });
    }
  }, tickMs);

  logger.info('Demo vehicle tracking simulator started', { tickMs });
}

function stopTrackingSimulator() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = { startTrackingSimulator, stopTrackingSimulator, interpolate };
