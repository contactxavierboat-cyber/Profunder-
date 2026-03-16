#!/bin/bash
set -e

node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT');
  console.log('DB migrations complete');
  await pool.end();
})().catch(e => { console.error(e); process.exit(1); });
"
