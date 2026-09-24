require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Driver = require('../src/models/Driver');
const Vehicle = require('../src/models/Vehicle');
const Shipment = require('../src/models/Shipment');
const TrackingEvent = require('../src/models/TrackingEvent');
const Notification = require('../src/models/Notification');
const Route = require('../src/models/Route');
const { cityLocation, generateTrackingNumber } = require('../src/utils/helpers');
const osrmService = require('../src/services/osrmService');
const mlService = require('../src/services/mlService');

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Admin@123';

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rapidroute';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for seeding');
  }

  await Promise.all([
    User.deleteMany({}),
    Driver.deleteMany({}),
    Vehicle.deleteMany({}),
    Shipment.deleteMany({}),
    TrackingEvent.deleteMany({}),
    Notification.deleteMany({}),
    Route.deleteMany({}),
  ]);

  await User.create({
    name: 'Admin User',
    email: 'admin@rapidroute.in',
    password: DEMO_PASSWORD,
    role: 'admin',
    phone: '+91-9876500001',
  });

  const dispatcher = await User.create({
    name: 'Priya Sharma',
    email: 'dispatcher@rapidroute.in',
    password: DEMO_PASSWORD,
    role: 'dispatcher',
    phone: '+91-9876500002',
  });

  const driverUsers = await User.create([
    {
      name: 'Ravi Kumar',
      email: 'ravi.driver@rapidroute.in',
      password: DEMO_PASSWORD,
      role: 'driver',
      phone: '+91-9876501001',
    },
    {
      name: 'Asha Patil',
      email: 'asha.driver@rapidroute.in',
      password: DEMO_PASSWORD,
      role: 'driver',
      phone: '+91-9876501002',
    },
  ]);

  const drivers = await Driver.create([
    {
      name: 'Ravi Kumar',
      phone: '+91-9876501001',
      email: 'ravi.driver@rapidroute.in',
      licenseNumber: 'MP14-2020-77881',
      status: 'Available',
      currentLocation: { ...cityLocation('Bhopal'), updatedAt: new Date() },
      user: driverUsers[0]._id,
    },
    {
      name: 'Asha Patil',
      phone: '+91-9876501002',
      email: 'asha.driver@rapidroute.in',
      licenseNumber: 'MH12-2019-44521',
      status: 'Available',
      currentLocation: { ...cityLocation('Pune'), updatedAt: new Date() },
      user: driverUsers[1]._id,
    },
    {
      name: 'Imran Khan',
      phone: '+91-9876501003',
      email: 'imran.driver@rapidroute.in',
      licenseNumber: 'DL01-2021-99012',
      status: 'Available',
      currentLocation: { ...cityLocation('Delhi'), updatedAt: new Date() },
    },
    {
      name: 'Sneha Reddy',
      phone: '+91-9876501004',
      email: 'sneha.driver@rapidroute.in',
      licenseNumber: 'TS09-2018-33110',
      status: 'Off Duty',
      currentLocation: { ...cityLocation('Hyderabad'), updatedAt: new Date() },
    },
  ]);

  await User.findByIdAndUpdate(driverUsers[0]._id, { driverProfile: drivers[0]._id });
  await User.findByIdAndUpdate(driverUsers[1]._id, { driverProfile: drivers[1]._id });

  const vehicles = await Vehicle.create([
    {
      vehicleId: 'VEH-0001',
      registrationNumber: 'MP04-AB-2190',
      vehicleType: 'Bike',
      capacityKg: 25,
      currentLoadKg: 0,
      status: 'Available',
      fuelType: 'Petrol',
      driver: drivers[0]._id,
      currentLocation: { ...cityLocation('Bhopal'), updatedAt: new Date() },
    },
    {
      vehicleId: 'VEH-0002',
      registrationNumber: 'MH12-CD-4412',
      vehicleType: 'Van',
      capacityKg: 800,
      currentLoadKg: 0,
      status: 'Available',
      fuelType: 'Diesel',
      driver: drivers[1]._id,
      currentLocation: { ...cityLocation('Pune'), updatedAt: new Date() },
    },
    {
      vehicleId: 'VEH-0003',
      registrationNumber: 'DL01-EF-7788',
      vehicleType: 'Truck',
      capacityKg: 12000,
      currentLoadKg: 0,
      status: 'Available',
      fuelType: 'Diesel',
      driver: drivers[2]._id,
      currentLocation: { ...cityLocation('Delhi'), updatedAt: new Date() },
    },
    {
      vehicleId: 'VEH-0004',
      registrationNumber: 'KA03-GH-5521',
      vehicleType: 'Truck',
      capacityKg: 18000,
      currentLoadKg: 0,
      status: 'Maintenance',
      fuelType: 'Diesel',
      currentLocation: { ...cityLocation('Bengaluru'), updatedAt: new Date() },
    },
    {
      vehicleId: 'VEH-0005',
      registrationNumber: 'TN09-IJ-3344',
      vehicleType: 'Van',
      capacityKg: 1000,
      currentLoadKg: 0,
      status: 'Available',
      fuelType: 'CNG',
      currentLocation: { ...cityLocation('Chennai'), updatedAt: new Date() },
    },
    {
      vehicleId: 'VEH-0006',
      registrationNumber: 'RR-RAIL-01',
      vehicleType: 'Train',
      capacityKg: 50000,
      currentLoadKg: 0,
      status: 'Available',
      fuelType: 'Electric',
      currentLocation: { ...cityLocation('Kolkata'), updatedAt: new Date() },
    },
  ]);

  for (let i = 0; i < 3; i++) {
    drivers[i].assignedVehicle = vehicles[i]._id;
    await drivers[i].save();
  }

  const lanes = [
    { from: 'Bhopal', to: 'Delhi', packageType: 'Electronics', weightKg: 18, urgency: 'High' },
    { from: 'Mumbai', to: 'Pune', packageType: 'Documents', weightKg: 2, urgency: 'Critical' },
    { from: 'Bengaluru', to: 'Chennai', packageType: 'Pharmaceutical', weightKg: 40, urgency: 'High' },
    { from: 'Delhi', to: 'Jaipur', packageType: 'Apparel', weightKg: 120, urgency: 'Medium' },
    { from: 'Hyderabad', to: 'Mumbai', packageType: 'Industrial', weightKg: 450, urgency: 'Medium' },
    { from: 'Chennai', to: 'Kolkata', packageType: 'Fragile', weightKg: 35, urgency: 'High' },
    { from: 'Pune', to: 'Bengaluru', packageType: 'Food', weightKg: 80, urgency: 'Low' },
    { from: 'Jaipur', to: 'Delhi', packageType: 'Electronics', weightKg: 25, urgency: 'Medium' },
    { from: 'Kolkata', to: 'Hyderabad', packageType: 'Other', weightKg: 200, urgency: 'Low' },
    { from: 'Mumbai', to: 'Delhi', packageType: 'Industrial', weightKg: 900, urgency: 'High' },
  ];

  const statuses = [
    'Pending',
    'Assigned',
    'In Transit',
    'Delivered',
    'Delayed',
    'Pending',
    'Delivered',
    'Assigned',
    'Delivered',
    'In Transit',
  ];

  for (let i = 0; i < lanes.length; i++) {
    const lane = lanes[i];
    const origin = cityLocation(lane.from);
    const destination = cityLocation(lane.to);
    const trackingNumber = generateTrackingNumber();
    const shipmentId = `SHP-${String(i + 1).padStart(5, '0')}`;

    let routeDistanceKm = null;
    let routeDurationHours = null;
    let geometry = { type: 'LineString', coordinates: [] };
    let predictedEtaHours = null;
    let transportationMode = null;

    try {
      const route = await osrmService.getRoute(
        origin.longitude,
        origin.latitude,
        destination.longitude,
        destination.latitude
      );
      routeDistanceKm = route.distanceKm;
      routeDurationHours = route.durationHours;
      geometry = route.geometry;

      const prediction = await mlService.predict({
        packageType: lane.packageType,
        distance: routeDistanceKm,
        weight: lane.weightKg,
        urgency: lane.urgency,
        routeDurationHours,
      });
      transportationMode = prediction.transportMode;
      predictedEtaHours = prediction.estimatedHours;
    } catch (err) {
      console.warn(`Route/ML skipped for ${lane.from}->${lane.to}: ${err.message}`);
      const approx = haversineKm(origin, destination);
      routeDistanceKm = approx;
      routeDurationHours = Number((approx / 50).toFixed(2));
      transportationMode = lane.weightKg > 200 ? 'Truck' : 'Van';
      predictedEtaHours = Number((routeDurationHours * 1.15).toFixed(2));
      geometry = {
        type: 'LineString',
        coordinates: [
          [origin.longitude, origin.latitude],
          [destination.longitude, destination.latitude],
        ],
      };
    }

    const status = statuses[i];
    const vehicle = status === 'Pending' ? null : vehicles[i % vehicles.length];
    const driver = vehicle?.driver ? drivers.find((d) => String(d._id) === String(vehicle.driver)) : null;

    const createdAt = new Date(Date.now() - (lanes.length - i) * 86400000);
    const estimatedDeliveryTime = predictedEtaHours
      ? new Date(createdAt.getTime() + predictedEtaHours * 3600000)
      : null;

    const shipment = await Shipment.create({
      shipmentId,
      trackingNumber,
      origin,
      destination,
      packageType: lane.packageType,
      weightKg: lane.weightKg,
      urgency: lane.urgency,
      dimensions: { lengthCm: 40, widthCm: 30, heightCm: 25 },
      status,
      assignedVehicle: vehicle?._id || null,
      assignedDriver: driver?._id || null,
      transportationMode,
      routeDistanceKm,
      routeDurationHours,
      predictedEtaHours,
      estimatedDeliveryTime,
      actualDeliveryTime: status === 'Delivered' ? estimatedDeliveryTime : null,
      routeGeometry: geometry,
      currentLocation: {
        latitude: status === 'Delivered' ? destination.latitude : origin.latitude,
        longitude: status === 'Delivered' ? destination.longitude : origin.longitude,
        updatedAt: new Date(),
      },
      simulation: {
        enabled: status === 'In Transit',
        progress: status === 'In Transit' ? 0.35 : 0,
        routeIndex: 0,
      },
      createdBy: dispatcher._id,
      createdAt,
      updatedAt: createdAt,
    });

    if (vehicle && status !== 'Pending' && status !== 'Delivered') {
      vehicle.currentLoadKg = Math.min(vehicle.capacityKg, (vehicle.currentLoadKg || 0) + lane.weightKg);
      vehicle.status = status === 'In Transit' ? 'In Transit' : 'Assigned';
      await vehicle.save();
    }

    const events = [{ eventType: 'Shipment Created', description: 'Shipment booked at origin hub' }];
    if (['Assigned', 'In Transit', 'Delivered', 'Delayed'].includes(status)) {
      events.push({ eventType: 'Assigned', description: 'Vehicle and driver assigned' });
    }
    if (['In Transit', 'Delivered', 'Delayed'].includes(status)) {
      events.push({ eventType: 'Picked Up', description: 'Package picked up from origin' });
      events.push({
        eventType: 'In Transit',
        description: 'En route (demo simulation where applicable)',
        simulated: status === 'In Transit',
      });
    }
    if (status === 'Delivered') {
      events.push({ eventType: 'Out for Delivery', description: 'Out for delivery' });
      events.push({ eventType: 'Delivered', description: 'Delivered to consignee' });
    }
    if (status === 'Delayed') {
      events.push({ eventType: 'Delayed', description: 'Delay reported due to congestion' });
    }

    for (const ev of events) {
      await TrackingEvent.create({
        shipment: shipment._id,
        trackingNumber,
        eventType: ev.eventType,
        description: ev.description,
        simulated: Boolean(ev.simulated),
        location: {
          latitude: origin.latitude,
          longitude: origin.longitude,
          label: origin.city,
        },
      });
    }
  }

  await Notification.create([
    {
      type: 'delayed_shipment',
      title: 'Shipment delayed',
      message: 'A Delhi–Jaipur shipment is marked Delayed',
      severity: 'warning',
    },
    {
      type: 'maintenance_required',
      title: 'Vehicle maintenance',
      message: 'KA03-GH-5521 requires maintenance in Bengaluru',
      severity: 'warning',
      relatedVehicle: vehicles[3]._id,
    },
    {
      type: 'delivery_completed',
      title: 'Delivery completed',
      message: 'Recent Mumbai–Pune document shipment delivered',
      severity: 'success',
    },
  ]);

  console.log('Seed complete');
  console.log('Demo accounts (password: ' + DEMO_PASSWORD + '):');
  console.log('  admin@rapidroute.in (admin)');
  console.log('  dispatcher@rapidroute.in (dispatcher)');
  console.log('  ravi.driver@rapidroute.in (driver)');
}

function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Number((2 * R * Math.asin(Math.sqrt(h))).toFixed(2));
}

if (require.main === module) {
  seed()
    .then(() => mongoose.disconnect())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seed;
