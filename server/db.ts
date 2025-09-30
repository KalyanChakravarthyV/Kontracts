import dotenv from "dotenv";
dotenv.config();

import fs from 'fs';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "./model/schema.ts";

// PostgreSQL configuration
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ,
  host: process.env.DB_HOST || "pg-1f58af3a-pg-contracts.h.aivencloud.com",
  port: parseInt(process.env.DB_PORT || "25648"),
  database: process.env.DB_NAME || "defaultdb",
  ssl: process.env.DB_CA_CERT ? {
    rejectUnauthorized: true,
    ca: fs.readFileSync(process.env.DB_CA_CERT).toString(),
  } : {
    rejectUnauthorized: false,
  },
  // Connection pool configuration
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Support for both individual config and connection string (for backward compatibility)
let poolConfig;
if (process.env.DATABASE_URL && !process.env.DB_HOST) {
  // Use connection string if no individual config provided
  poolConfig = { connectionString: process.env.DATABASE_URL };
} else {
  // Use individual configuration
  poolConfig = config;
}

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });

// Test connection and log database version
pool.connect()
  .then(client => {
    return client.query('SELECT VERSION()').then(result => {
      console.log('✅ PostgreSQL connected:', result.rows[0].version);
      client.release();
    });
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection failed:', err.message);
  });
