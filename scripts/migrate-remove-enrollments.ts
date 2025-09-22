#!/usr/bin/env tsx

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Starting enrollment system removal migration...');
    
    // Read the migration SQL file
    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations', 'add_group_id_to_users.sql'), 
      'utf8'
    );
    
    // Execute the migration
    console.log('📝 Executing migration SQL...');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the migration
    console.log('🔍 Verifying migration...');
    
    // Check if group_id column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'group_id'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ group_id column added to users table');
    } else {
      console.log('❌ group_id column not found in users table');
    }
    
    // Check if enrollments table still exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'enrollments'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('✅ enrollments table successfully removed');
    } else {
      console.log('⚠️  enrollments table still exists');
    }
    
    // Count users with groups
    const userGroupCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE group_id IS NOT NULL AND role = 'student'
    `);
    
    console.log(`📊 Students with group assignments: ${userGroupCount.rows[0].count}`);
    
    console.log('🎉 Migration verification completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration().catch(console.error);
