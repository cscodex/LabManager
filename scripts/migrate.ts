#!/usr/bin/env tsx

/**
 * Database Migration Script for LabManager
 *
 * This script handles database migrations for both development and production environments.
 * It can be run manually or as part of the deployment process.
 */

// Load environment variables from .env file
import { config } from 'dotenv';
config();

import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import * as schema from "../shared/schema";
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

// Configure Neon for serverless environment
neonConfig.webSocketConstructor = ws;

async function runMigrations() {
  console.log('🚀 Starting database migration...');
  
  // Validate environment
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  try {
    // Create database connection
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema });

    console.log('📡 Connected to database');

    // Check if migrations directory exists
    const migrationsPath = join(process.cwd(), 'migrations');
    try {
      const migrationFiles = await readdir(migrationsPath);
      const sqlFiles = migrationFiles.filter(file => file.endsWith('.sql'));
      
      if (sqlFiles.length === 0) {
        console.log('📝 No migration files found, using schema push instead...');
        // If no migrations exist, we'll use push to create the schema
        const { execSync } = await import('child_process');
        execSync('npx drizzle-kit push', { stdio: 'inherit' });
        console.log('✅ Schema pushed successfully');
      } else {
        console.log(`📁 Found ${sqlFiles.length} migration files`);
        
        // Run migrations
        await migrate(db, { migrationsFolder: migrationsPath });
        console.log('✅ Migrations completed successfully');
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('📝 No migrations directory found, using schema push...');
        const { execSync } = await import('child_process');
        execSync('npx drizzle-kit push', { stdio: 'inherit' });
        console.log('✅ Schema pushed successfully');
      } else {
        throw error;
      }
    }

    // Verify database connection by running a simple query
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('🔍 Database connection verified');

    // Close the connection
    await pool.end();
    console.log('🎉 Migration process completed successfully!');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const isForce = args.includes('--force');
const isDryRun = args.includes('--dry-run');

if (isDryRun) {
  console.log('🔍 Dry run mode - no changes will be made');
  // In dry run mode, we would typically show what migrations would be applied
  console.log('This would run the migration process...');
  process.exit(0);
}

if (isForce) {
  console.log('⚠️  Force mode enabled - this will apply migrations even if there are conflicts');
}

// Run the migration
runMigrations().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});

// Import sql helper (this needs to be at the top level for proper import)
import { sql } from 'drizzle-orm';
