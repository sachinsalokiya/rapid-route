const express = require('express');
const shipmentController = require('../controllers/shipmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'dispatcher', 'driver'), shipmentController.listShipments);
router.get('/:id', authorize('admin', 'dispatcher', 'driver'), shipmentController.getShipment);
router.post('/', authorize('admin', 'dispatcher'), shipmentController.createShipment);
router.patch('/:id', authorize('admin', 'dispatcher'), shipmentController.updateShipment);
router.delete('/:id', authorize('admin'), shipmentController.deleteShipment);
router.post('/:id/assign', authorize('admin', 'dispatcher'), shipmentController.assignShipment);
router.post('/:id/start-transit', authorize('admin', 'dispatcher'), shipmentController.startTransit);

module.exports = router;
