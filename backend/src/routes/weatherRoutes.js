const express = require('express');
const weatherController = require('../controllers/weatherController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, weatherController.getWeatherForCoords);
router.get(
  '/shipment/:shipmentId',
  protect,
  authorize('admin', 'dispatcher'),
  weatherController.getWeatherForShipment
);

module.exports = router;
