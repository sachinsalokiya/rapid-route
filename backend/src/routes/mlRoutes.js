const express = require('express');
const mlController = require('../controllers/mlController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/predict', protect, authorize('admin', 'dispatcher'), mlController.predict);

module.exports = router;
