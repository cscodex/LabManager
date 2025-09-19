#!/usr/bin/env tsx

/**
 * Production Startup Script for LabManager
 * 
 * This script handles database initialization and starts the application.
 * It's designed to run in production environments like Render.
 */

// Load environment variables
import { config } from 'dotenv';
config();

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import * as schema from "../shared/schema";
import { sql } from 'drizzle-orm';
import { spawn } from 'child_process';

// Configure Neon for serverless environment
neonConfig.webSocketConstructor = ws;

async function initializeAndStart() {
  console.log('🚀 Starting LabManager production server...');
  
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

    // Check if database is initialized
    try {
      const tables = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'labs', 'classes')
      `);
      
      if (tables.rows.length === 0) {
        console.log('📝 Database not initialized, creating schema...');
        
        // Run database push to create schema
        const { execSync } = await import('child_process');
        execSync('npx drizzle-kit push --force', { 
          stdio: 'inherit',
          env: { ...process.env }
        });
        
        console.log('✅ Database schema created');
      } else {
        console.log('✅ Database already initialized');
      }
    } catch (error: any) {
      console.log('📝 Initializing database schema...');
      
      // Run database push to create schema
      const { execSync } = await import('child_process');
      execSync('npx drizzle-kit push --force', { 
        stdio: 'inherit',
        env: { ...process.env }
      });
      
      console.log('✅ Database schema created');
    }

    // Close the connection
    await pool.end();
    
    console.log('🎉 Database initialization completed!');
    console.log('🚀 Starting application server...');

    // Start the main application
    const server = spawn('node', ['dist/index.js'], {
      stdio: 'inherit',
      env: { ...process.env }
    });

    server.on('error', (error) => {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    });

    server.on('exit', (code) => {
      console.log(`Server exited with code ${code}`);
      process.exit(code || 0);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      server.kill('SIGTERM');
    });

    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down gracefully...');
      server.kill('SIGINT');
    });

  } catch (error: any) {
    console.error('❌ Startup failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the startup process
initializeAndStart().catch((error) => {
  console.error('💥 Unexpected error during startup:', error);
  process.exit(1);
});
