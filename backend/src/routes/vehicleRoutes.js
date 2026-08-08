const express = require('express');
const vehicleController = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'dispatcher', 'driver'), vehicleController.listVehicles);
router.get('/:id', authorize('admin', 'dispatcher', 'driver'), vehicleController.getVehicle);
router.post('/', authorize('admin', 'dispatcher'), vehicleController.createVehicle);
router.patch('/:id', authorize('admin', 'dispatcher'), vehicleController.updateVehicle);
router.delete('/:id', authorize('admin'), vehicleController.deleteVehicle);
router.post('/:id/assign-driver', authorize('admin', 'dispatcher'), vehicleController.assignDriver);

module.exports = router;
