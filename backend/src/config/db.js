const dns = require('dns');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

if (typeof dns.setDefaultResultOrder === 'function') {
  // Prefer IPv4 so Atlas SRV hosts resolve on platforms that fail IPv6 (Render).
  dns.setDefaultResultOrder('ipv4first');
}

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
