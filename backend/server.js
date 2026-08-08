require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/socket');
const { startTrackingSimulator } = require('./src/services/trackingSimulator');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();

  const server = http.createServer(app);
  const io = initSocket(server);
  app.set('io', io);

  if (process.env.TRACKING_SIMULATION_ENABLED !== 'false') {
    startTrackingSimulator(io);
  }

  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Rapid Route API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  // console.error so Render logs always show the real reason
  console.error('Failed to start server:', err);
  logger.error('Failed to start server', { error: err.message, stack: err.stack });
  process.exit(1);
});
