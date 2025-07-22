import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";

// Configure WebSocket for Neon - handle Vercel serverless environment
if (typeof WebSocket === 'undefined') {
  // In Node.js environments (including Vercel), use the ws package
  try {
    const ws = require("ws");
    neonConfig.webSocketConstructor = ws;
  } catch (error) {
    // If ws is not available, Neon will fall back to HTTP mode
    console.warn("WebSocket not available, falling back to HTTP mode");
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });