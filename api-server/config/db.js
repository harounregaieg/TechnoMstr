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

// Cloud database
const cloudPool = new Pool({
  user: process.env.CLOUD_DB_USER,
  host: process.env.CLOUD_DB_HOST,
  database: process.env.CLOUD_DB_DATABASE,
  password: process.env.CLOUD_DB_PASSWORD,
  port: process.env.CLOUD_DB_PORT,
});

module.exports = {
  localPool,
  cloudPool
};