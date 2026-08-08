const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const shipmentRoutes = require('./shipmentRoutes');
const vehicleRoutes = require('./vehicleRoutes');
const driverRoutes = require('./driverRoutes');
const routeRoutes = require('./routeRoutes');
const trackingRoutes = require('./trackingRoutes');
const notificationRoutes = require('./notificationRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const mlRoutes = require('./mlRoutes');
const weatherRoutes = require('./weatherRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);
router.use('/routes', routeRoutes);
router.use('/tracking', trackingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/ml', mlRoutes);
router.use('/weather', weatherRoutes);

module.exports = router;
