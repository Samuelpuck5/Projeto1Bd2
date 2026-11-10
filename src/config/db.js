// Conexão com o PostgreSQL/PostGIS do Supabase
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Supabase exige SSL
});

module.exports = pool;
