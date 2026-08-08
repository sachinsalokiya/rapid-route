const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Shipment = require('../models/Shipment');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { paginate } = require('../utils/helpers');

async function listDrivers(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query, req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.q) {
      filter.$or = [
        { name: new RegExp(req.query.q, 'i') },
        { email: new RegExp(req.query.q, 'i') },
        { licenseNumber: new RegExp(req.query.q, 'i') },
        { phone: new RegExp(req.query.q, 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      Driver.find(filter)
        .populate('assignedVehicle', 'vehicleId registrationNumber vehicleType status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Driver.countDocuments(filter),
    ]);

    sendSuccess(res, { items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

async function getDriver(req, res, next) {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('assignedVehicle')
      .populate('deliveryHistory.shipment', 'trackingNumber status origin destination');
    if (!driver) throw new AppError('Driver not found', 404);

    const activeRoute = await Shipment.findOne({
      assignedDriver: driver._id,
      status: { $in: ['Assigned', 'In Transit', 'Delayed'] },
    });

    sendSuccess(res, { driver, activeRoute });
  } catch (err) {
    next(err);
  }
}

async function createDriver(req, res, next) {
  try {
    const driver = await Driver.create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      licenseNumber: req.body.licenseNumber,
      status: req.body.status || 'Available',
      currentLocation: req.body.currentLocation || {},
    });
    sendSuccess(res, { driver }, 'Driver created', 201);
  } catch (err) {
    next(err);
  }
}

async function updateDriver(req, res, next) {
  try {
    const allowed = ['name', 'phone', 'email', 'licenseNumber', 'status', 'currentLocation'];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const driver = await Driver.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!driver) throw new AppError('Driver not found', 404);
    sendSuccess(res, { driver }, 'Driver updated');
  } catch (err) {
    next(err);
  }
}

async function deleteDriver(req, res, next) {
  try {
    const active = await Shipment.countDocuments({
      assignedDriver: req.params.id,
      status: { $in: ['Assigned', 'In Transit'] },
    });
    if (active > 0) throw new AppError('Cannot delete driver with active shipments', 400);

    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) throw new AppError('Driver not found', 404);

    if (driver.assignedVehicle) {
      await Vehicle.findByIdAndUpdate(driver.assignedVehicle, { driver: null });
    }

    sendSuccess(res, null, 'Driver deleted');
  } catch (err) {
    next(err);
  }
}

async function assignVehicle(req, res, next) {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) throw new AppError('Driver not found', 404);
    const vehicle = await Vehicle.findById(req.body.vehicleId);
    if (!vehicle) throw new AppError('Vehicle not found', 404);

    driver.assignedVehicle = vehicle._id;
    await driver.save();
    vehicle.driver = driver._id;
    await vehicle.save();

    const populated = await Driver.findById(driver._id).populate('assignedVehicle');
    sendSuccess(res, { driver: populated }, 'Vehicle assigned to driver');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  assignVehicle,
};
