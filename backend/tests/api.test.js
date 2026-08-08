const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

let mongo;
let dbReady = false;

async function connectDb() {
  const candidates = [];
  if (process.env.MONGODB_URI) candidates.push(process.env.MONGODB_URI);
  candidates.push('mongodb://127.0.0.1:27017/rapidroute_test');

  for (const uri of candidates) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
      dbReady = true;
      return;
    } catch {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect().catch(() => {});
      }
    }
  }

  // Opt-in only — downloading MongoDB binaries can be very slow on constrained networks.
  if (process.env.MONGOMS_ENABLED === 'true') {
    try {
      mongo = await MongoMemoryServer.create({
        binary: { version: process.env.MONGOMS_VERSION || '4.4.18' },
      });
      await mongoose.connect(mongo.getUri());
      dbReady = true;
      return;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`MongoMemoryServer failed: ${err.message}`);
    }
  }

  // eslint-disable-next-line no-console
  console.warn('DB integration tests skipped (start MongoDB or set MONGOMS_ENABLED=true)');
  dbReady = false;
}

beforeAll(async () => {
  await connectDb();
}, 300000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect().catch(() => {});
  }
  if (mongo) await mongo.stop().catch(() => {});
});

beforeEach(async () => {
  if (!dbReady) return;
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

function requireDb() {
  if (!dbReady) {
    // eslint-disable-next-line no-console
    console.warn('Skipping test — MongoDB unavailable');
    return false;
  }
  return true;
}

async function createAdmin() {
  await User.create({
    name: 'Admin',
    email: 'admin@test.com',
    password: 'Admin@123',
    role: 'admin',
  });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'Admin@123' });
  return { token: login.body.data.token };
}

describe('Auth', () => {
  test('registers and logs in', async () => {
    if (!requireDb()) return;

    const reg = await request(app).post('/api/auth/register').send({
      name: 'Dispatcher One',
      email: 'disp@test.com',
      password: 'Admin@123',
      role: 'dispatcher',
    });
    expect(reg.status).toBe(201);
    expect(reg.body.success).toBe(true);
    expect(reg.body.data.token).toBeTruthy();

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'disp@test.com', password: 'Admin@123' });
    expect(login.status).toBe(200);
    expect(login.body.data.user.role).toBe('dispatcher');
  });

  test('rejects invalid login', async () => {
    if (!requireDb()) return;

    await User.create({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'Admin@123',
      role: 'admin',
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  test('protects /api/auth/me', async () => {
    if (!requireDb()) return;

    const denied = await request(app).get('/api/auth/me');
    expect(denied.status).toBe(401);

    const { token } = await createAdmin();
    const ok = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.user.email).toBe('admin@test.com');
  });
});

describe('Shipments & Vehicles', () => {
  test('CRUD shipment and vehicle with authorization', async () => {
    if (!requireDb()) return;

    const { token } = await createAdmin();

    const vehicleRes = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        registrationNumber: 'MP04-TEST-01',
        vehicleType: 'Van',
        capacityKg: 500,
        currentLocation: { latitude: 23.25, longitude: 77.41, city: 'Bhopal' },
      });
    expect(vehicleRes.status).toBe(201);
    const vehicleId = vehicleRes.body.data.vehicle._id;

    const shipmentRes = await request(app)
      .post('/api/shipments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        origin: {
          address: 'Bhopal Hub',
          city: 'Bhopal',
          state: 'MP',
          latitude: 23.2599,
          longitude: 77.4126,
        },
        destination: {
          address: 'Indore Hub',
          city: 'Indore',
          state: 'MP',
          latitude: 22.7196,
          longitude: 75.8577,
        },
        packageType: 'Electronics',
        weightKg: 12,
        urgency: 'High',
      });
    expect(shipmentRes.status).toBe(201);
    expect(shipmentRes.body.data.shipment.trackingNumber).toMatch(/^RR/);

    const list = await request(app)
      .get('/api/shipments')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.total).toBe(1);

    const shipmentId = shipmentRes.body.data.shipment._id;
    const assign = await request(app)
      .post(`/api/shipments/${shipmentId}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicleId });
    expect(assign.status).toBe(200);
    expect(assign.body.data.shipment.status).toBe('Assigned');

    const vehicles = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${token}`);
    expect(vehicles.status).toBe(200);
    expect(vehicles.body.data.total).toBe(1);
  });

  test('driver cannot create shipment', async () => {
    if (!requireDb()) return;

    await User.create({
      name: 'Driver',
      email: 'driver@test.com',
      password: 'Admin@123',
      role: 'driver',
    });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'driver@test.com', password: 'Admin@123' });

    const res = await request(app)
      .post('/api/shipments')
      .set('Authorization', `Bearer ${login.body.data.token}`)
      .send({
        origin: {
          address: 'A',
          city: 'Bhopal',
          latitude: 23.25,
          longitude: 77.41,
        },
        destination: {
          address: 'B',
          city: 'Delhi',
          latitude: 28.61,
          longitude: 77.2,
        },
        weightKg: 10,
      });
    expect(res.status).toBe(403);
  });
});

describe('Routes', () => {
  test('route endpoint validates coordinates', async () => {
    const res = await request(app).get('/api/routes');
    expect(res.status).toBe(400);
  });

  test('route endpoint returns geometry when OSRM is reachable', async () => {
    const res = await request(app).get('/api/routes').query({
      origin: '77.4126,23.2599',
      destination: '77.2090,28.6139',
    });

    if (res.status === 503) {
      expect(res.body.success).toBe(false);
      return;
    }

    expect(res.status).toBe(200);
    expect(res.body.data.distanceKm).toBeGreaterThan(0);
    expect(res.body.data.geometry.type).toBe('LineString');
  });
});
