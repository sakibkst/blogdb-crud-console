const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');

const DB_NAME = 'blogdb';
const SCHEMA_FILE = path.join(__dirname, '..', '..', 'db', 'schema.sql');

const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  dateStrings: true, // show DATETIME/TIMESTAMP as 'YYYY-MM-DD HH:MM:SS'
};

let pool;

/**
 * Creates the `blogdb` database and its tables if they do not exist yet,
 * then opens a connection pool against it.
 */
async function initDatabase() {
  const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf8');
  const setupConnection = await mysql.createConnection({
    ...connectionConfig,
    multipleStatements: true,
  });
  try {
    await setupConnection.query(schemaSql);
  } finally {
    await setupConnection.end();
  }

  pool = mysql.createPool({ ...connectionConfig, database: DB_NAME, connectionLimit: 5 });
  await pool.query('SELECT 1');
}

function getPool() {
  if (!pool) throw new Error('Database is not initialised. Call initDatabase() first.');
  return pool;
}

async function closeDatabase() {
  if (pool) {
    const current = pool;
    pool = undefined;
    await current.end();
  }
}

module.exports = { initDatabase, getPool, closeDatabase, DB_NAME };
