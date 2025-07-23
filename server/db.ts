import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "../shared/schema.js";

// Configure Neon for serverless environment
// Force HTTP mode in production/Vercel to avoid WebSocket issues
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  console.log('Configuring Neon for serverless environment (HTTP mode)');
  neonConfig.webSocketConstructor = undefined;
  neonConfig.pipelineConnect = false;
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineSession = false;
} else {
  // In development, try to use WebSocket if available
  if (typeof WebSocket === 'undefined') {
    try {
      const ws = require("ws");
      neonConfig.webSocketConstructor = ws;
    } catch (error) {
      console.warn("WebSocket not available, falling back to HTTP mode");
    }
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Initializing database connection...');
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });