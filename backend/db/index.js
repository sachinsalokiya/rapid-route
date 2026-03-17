// Import the pg package
// pg = PostgreSQL client for Node.js
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

// Create a "pool" of connections to the database
// Think of it like a group of phone lines between
// your backend and PostgreSQL
// Instead of opening and closing one connection every time,
// a pool keeps several connections ready and reuses them
const pool = new Pool({
  host: process.env.DB_HOST,         // localhost
  port: process.env.DB_PORT,         // 5432
  database: process.env.DB_NAME,     // rapidroute
  user: process.env.DB_USER,         // postgres
  password: process.env.DB_PASSWORD, // your password
});

// Test the connection when this file is first loaded
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL successfully!');
    release(); // release the connection back to the pool
  }
});

// Export the pool so other files can use it
module.exports = pool;