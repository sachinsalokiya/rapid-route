const express = require('express');
const driverController = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'dispatcher'), driverController.listDrivers);
router.get('/:id', authorize('admin', 'dispatcher', 'driver'), driverController.getDriver);
router.post('/', authorize('admin', 'dispatcher'), driverController.createDriver);
router.patch('/:id', authorize('admin', 'dispatcher'), driverController.updateDriver);
router.delete('/:id', authorize('admin'), driverController.deleteDriver);
router.post('/:id/assign-vehicle', authorize('admin', 'dispatcher'), driverController.assignVehicle);

module.exports = router;
