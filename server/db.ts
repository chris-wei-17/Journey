// Use standard PostgreSQL driver for better compatibility
import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Configuring PostgreSQL connection for serverless...');
console.log('Using standard PostgreSQL driver (no WebSocket issues)');

// Create connection pool with proper SSL configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
  // Optimize for serverless
  max: 1, // Reduce connection pool size for serverless
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 5000,
});

console.log('Initializing Drizzle ORM with PostgreSQL driver...');
export const db = drizzle(pool, { schema });
export { pool };