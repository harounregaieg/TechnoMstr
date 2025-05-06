const { Pool } = require('pg');
require('dotenv').config();

// Local database
const localPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Cloud database with short timeout
const cloudPool = new Pool({
  user: process.env.CLOUD_DB_USER,
  host: process.env.CLOUD_DB_HOST,
  database: process.env.CLOUD_DB_DATABASE,
  password: process.env.CLOUD_DB_PASSWORD,
  port: process.env.CLOUD_DB_PORT,
  // Add timeouts to prevent long waits
  connectionTimeoutMillis: 3000, // 3 seconds connection timeout
  query_timeout: 5000, // 5 seconds query timeout
  idle_in_transaction_session_timeout: 5000 // 5 seconds idle timeout
});

module.exports = {
  localPool,
  cloudPool
};