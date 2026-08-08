const express = require('express');
const routeController = require('../controllers/routeController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, routeController.getRoute);
router.get('/saved', protect, authorize('admin', 'dispatcher'), routeController.listRoutes);
router.post('/optimize', protect, authorize('admin', 'dispatcher'), routeController.optimize);

module.exports = router;
