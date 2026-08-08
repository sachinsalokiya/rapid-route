const express = require('express');
const trackingController = require('../controllers/trackingController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('admin', 'dispatcher'), trackingController.listActiveTracking);
router.get('/:trackingNumber', optionalAuth, trackingController.trackByNumber);

module.exports = router;
