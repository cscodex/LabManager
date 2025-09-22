import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Optimized connection pool configuration
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Performance optimizations
  max: 20, // Maximum number of connections in the pool
  min: 2,  // Minimum number of connections to maintain
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout for new connections
  maxUses: 7500, // Close connections after 7500 uses to prevent memory leaks
});

export const db = drizzle({ client: pool, schema });
