#!/usr/bin/env tsx

/**
 * Database Performance Optimization Script
 * 
 * This script applies performance optimizations to the LabManager database:
 * - Adds database indexes for faster queries
 * - Analyzes tables for query planner optimization
 * - Provides performance monitoring queries
 */

import { config } from 'dotenv';
config();

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "../shared/schema";
import { readFile } from 'fs/promises';
import { join } from 'path';

// Configure Neon for serverless environment
neonConfig.webSocketConstructor = ws;

async function optimizeDatabase() {
  console.log('🚀 Starting database performance optimization...');
  
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

    // Read and execute the migration SQL
    const migrationPath = join(process.cwd(), 'migrations', 'add_performance_indexes.sql');
    const migrationSQL = await readFile(migrationPath, 'utf-8');
    
    console.log('📊 Adding performance indexes...');
    await db.execute(sql.raw(migrationSQL));
    
    console.log('✅ Performance indexes added successfully');

    // Check current database performance
    console.log('📈 Checking database performance...');
    
    // Get table sizes
    const tableSizes = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `);
    
    console.log('\n📋 Table Sizes:');
    tableSizes.rows.forEach((row: any) => {
      console.log(`  ${row.tablename}: ${row.size}`);
    });

    // Get index information
    const indexes = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      AND indexname LIKE '%_idx'
      ORDER BY tablename, indexname;
    `);
    
    console.log('\n🔍 Performance Indexes:');
    indexes.rows.forEach((row: any) => {
      console.log(`  ${row.tablename}.${row.indexname}`);
    });

    // Get slow query recommendations
    console.log('\n💡 Performance Tips:');
    console.log('  - Indexes have been added for common query patterns');
    console.log('  - Query cache is configured for 5-minute stale time');
    console.log('  - Connection pool optimized for 20 max connections');
    console.log('  - Monitor slow queries in your Neon dashboard');

    await pool.end();
    console.log('\n🎉 Database optimization completed successfully!');

  } catch (error) {
    console.error('❌ Error during database optimization:', error);
    process.exit(1);
  }
}

// Performance monitoring queries for future use
export const performanceQueries = {
  // Check slow queries (if pg_stat_statements is enabled)
  slowQueries: sql`
    SELECT 
      query,
      calls,
      total_time,
      mean_time,
      rows
    FROM pg_stat_statements 
    ORDER BY mean_time DESC 
    LIMIT 10;
  `,
  
  // Check index usage
  indexUsage: sql`
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan,
      idx_tup_read,
      idx_tup_fetch
    FROM pg_stat_user_indexes 
    ORDER BY idx_scan DESC;
  `,
  
  // Check table statistics
  tableStats: sql`
    SELECT 
      schemaname,
      tablename,
      n_tup_ins,
      n_tup_upd,
      n_tup_del,
      n_live_tup,
      n_dead_tup
    FROM pg_stat_user_tables 
    ORDER BY n_live_tup DESC;
  `
};

// Run optimization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  optimizeDatabase().catch(console.error);
}

export default optimizeDatabase;
