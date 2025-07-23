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

// Parse the connection string for debugging
const url = new URL(process.env.DATABASE_URL);
console.log('Connection details:', {
  host: url.hostname,
  port: url.port,
  database: url.pathname,
  username: url.username,
  hasPassword: !!url.password
});

// Create connection pool with proper SSL and authentication configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
  // Optimize for serverless
  max: 1, // Reduce connection pool size for serverless
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 10000, // Increase timeout
  // Explicitly set application name for debugging
  application_name: 'fitjourney-vercel',
  // Handle authentication issues
  statement_timeout: 30000,
  query_timeout: 30000,
});

console.log('Initializing Drizzle ORM with PostgreSQL driver...');
export const db = drizzle(pool, { schema });
export { pool };