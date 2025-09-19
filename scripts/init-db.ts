#!/usr/bin/env tsx

/**
 * Database Initialization Script for LabManager
 *
 * This script initializes the database for production deployment.
 * It handles schema creation, initial data setup, and verification.
 */

// Load environment variables from .env file
import { config } from 'dotenv';
config();

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import * as schema from "../shared/schema";
import { sql } from 'drizzle-orm';

// Configure Neon for serverless environment
neonConfig.webSocketConstructor = ws;

interface InitOptions {
  skipSeed?: boolean;
  force?: boolean;
  verbose?: boolean;
}

async function initializeDatabase(options: InitOptions = {}) {
  const { skipSeed = false, force = false, verbose = false } = options;
  
  console.log('🚀 Initializing LabManager database...');
  
  if (verbose) {
    console.log('Options:', { skipSeed, force, verbose });
  }

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

    // Check if database is already initialized
    if (!force) {
      try {
        const existingTables = await db.execute(sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('users', 'labs', 'classes')
        `);
        
        if (existingTables.rows.length > 0) {
          console.log('⚠️  Database appears to be already initialized');
          console.log('Use --force flag to reinitialize');
          await pool.end();
          return;
        }
      } catch (error) {
        // If we can't check tables, assume database needs initialization
        if (verbose) {
          console.log('Could not check existing tables, proceeding with initialization');
        }
      }
    }

    // Create schema using Drizzle push
    console.log('📝 Creating database schema...');
    const { execSync } = await import('child_process');
    
    try {
      execSync('npx drizzle-kit push --force', { 
        stdio: verbose ? 'inherit' : 'pipe',
        env: { ...process.env }
      });
      console.log('✅ Schema created successfully');
    } catch (error: any) {
      console.error('❌ Failed to create schema:', error.message);
      throw error;
    }

    // Verify schema creation
    console.log('🔍 Verifying schema...');
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tableNames = tables.rows.map((row: any) => row.table_name);
    console.log(`📊 Created ${tableNames.length} tables:`, tableNames.join(', '));

    // Create initial admin user if in production and not skipping seed
    if (!skipSeed && process.env.NODE_ENV === 'production') {
      console.log('👤 Creating initial admin user...');
      
      try {
        // Check if any users exist
        const existingUsers = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
        const userCount = parseInt(existingUsers.rows[0].count as string);
        
        if (userCount === 0) {
          // Create default admin user
          const bcrypt = await import('bcrypt');
          const hashedPassword = await bcrypt.hash('admin123', 10);
          
          await db.execute(sql`
            INSERT INTO users (email, password, role, first_name, last_name)
            VALUES ('admin@labmanager.com', ${hashedPassword}, 'instructor', 'System', 'Administrator')
          `);
          
          console.log('✅ Initial admin user created');
          console.log('📧 Email: admin@labmanager.com');
          console.log('🔑 Password: admin123 (CHANGE THIS IMMEDIATELY!)');
        } else {
          console.log('👥 Users already exist, skipping admin creation');
        }
      } catch (error: any) {
        console.warn('⚠️  Could not create admin user:', error.message);
      }
    }

    // Run basic health checks
    console.log('🏥 Running health checks...');
    
    // Test basic queries
    const healthChecks = [
      { name: 'Users table', query: sql`SELECT COUNT(*) FROM users` },
      { name: 'Labs table', query: sql`SELECT COUNT(*) FROM labs` },
      { name: 'Classes table', query: sql`SELECT COUNT(*) FROM classes` },
    ];

    for (const check of healthChecks) {
      try {
        await db.execute(check.query);
        console.log(`✅ ${check.name} - OK`);
      } catch (error: any) {
        console.error(`❌ ${check.name} - FAILED:`, error.message);
        throw error;
      }
    }

    // Close connection
    await pool.end();
    console.log('🎉 Database initialization completed successfully!');
    
    if (!skipSeed && process.env.NODE_ENV !== 'production') {
      console.log('\n💡 Next steps:');
      console.log('1. Start your application: npm run dev');
      console.log('2. Visit /api/admin/seed to create sample data');
      console.log('3. Or run: npm run db:seed');
    }

  } catch (error: any) {
    console.error('❌ Database initialization failed:', error.message);
    if (error.stack && options.verbose) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: InitOptions = {
  skipSeed: args.includes('--skip-seed'),
  force: args.includes('--force'),
  verbose: args.includes('--verbose') || args.includes('-v'),
};

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
LabManager Database Initialization

Usage: tsx scripts/init-db.ts [options]

Options:
  --skip-seed    Skip creating initial admin user
  --force        Force initialization even if database exists
  --verbose, -v  Show detailed output
  --help, -h     Show this help message

Examples:
  tsx scripts/init-db.ts                    # Normal initialization
  tsx scripts/init-db.ts --force            # Force reinitialize
  tsx scripts/init-db.ts --skip-seed        # Skip admin user creation
  tsx scripts/init-db.ts --verbose          # Detailed output
`);
  process.exit(0);
}

// Run initialization
initializeDatabase(options).catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
