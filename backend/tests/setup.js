process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_rapid_route';
process.env.TRACKING_SIMULATION_ENABLED = 'false';
process.env.OSRM_BASE_URL = 'https://router.project-osrm.org';
process.env.ML_SERVICE_URL = 'http://127.0.0.1:9';
process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || '4.4.18';

jest.setTimeout(180000);
