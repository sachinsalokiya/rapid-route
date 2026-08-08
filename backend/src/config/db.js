const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rapidroute';

  if (!process.env.MONGODB_URI) {
    logger.warn('MONGODB_URI not set — using local default');
  }

  mongoose.set('strictQuery', true);

  // family: 4 forces IPv4 — required on many Render + Atlas setups
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 30000,
    family: 4,
  });

  logger.info('Connected to MongoDB', { db: mongoose.connection.name });
}

module.exports = connectDB;
