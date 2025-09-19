#!/usr/bin/env tsx

/**
 * Create Test Users Script for LabManager
 * 
 * This script creates basic test users for development and testing.
 * Run this if you need simple login credentials without full seeding.
 */

// Load environment variables
import { config } from 'dotenv';
config();

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import * as schema from "../shared/schema";
import { sql } from 'drizzle-orm';

// Configure Neon for serverless environment
neonConfig.webSocketConstructor = ws;

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'instructor' | 'student';
}

const testUsers: TestUser[] = [
  // Admin/Instructor accounts
  {
    email: 'admin@labmanager.com',
    password: 'admin123',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'instructor'
  },
  {
    email: 'instructor@test.com',
    password: 'instructor123',
    firstName: 'Test',
    lastName: 'Instructor',
    role: 'instructor'
  },
  // Student accounts
  {
    email: 'student1@test.com',
    password: 'student123',
    firstName: 'Test',
    lastName: 'Student One',
    role: 'student'
  },
  {
    email: 'student2@test.com',
    password: 'student123',
    firstName: 'Test',
    lastName: 'Student Two',
    role: 'student'
  },
  {
    email: 'student3@test.com',
    password: 'student123',
    firstName: 'Test',
    lastName: 'Student Three',
    role: 'student'
  }
];

async function createTestUsers() {
  console.log('👥 Creating test users for LabManager...');
  
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

    // Import bcrypt for password hashing
    const bcrypt = await import('bcrypt');

    let created = 0;
    let skipped = 0;

    for (const user of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await db.execute(sql`
          SELECT id FROM users WHERE email = ${user.email}
        `);

        if (existingUser.rows.length > 0) {
          console.log(`⏭️  User ${user.email} already exists, skipping...`);
          skipped++;
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // Create user
        await db.execute(sql`
          INSERT INTO users (email, password, role, first_name, last_name)
          VALUES (${user.email}, ${hashedPassword}, ${user.role}, ${user.firstName}, ${user.lastName})
        `);

        console.log(`✅ Created ${user.role}: ${user.email}`);
        created++;

      } catch (error: any) {
        console.error(`❌ Failed to create user ${user.email}:`, error.message);
      }
    }

    // Close connection
    await pool.end();

    console.log('\n🎉 Test user creation completed!');
    console.log(`📊 Summary: ${created} created, ${skipped} skipped`);

    if (created > 0) {
      console.log('\n🔐 Login Credentials:');
      console.log('👨‍🏫 Admin: admin@labmanager.com / admin123');
      console.log('👨‍🏫 Instructor: instructor@test.com / instructor123');
      console.log('👨‍🎓 Student: student1@test.com / student123');
      console.log('👨‍🎓 Student: student2@test.com / student123');
      console.log('👨‍🎓 Student: student3@test.com / student123');
      console.log('\n⚠️  Remember to change default passwords in production!');
    }

  } catch (error: any) {
    console.error('❌ Failed to create test users:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
LabManager Test User Creation

Usage: tsx scripts/create-test-users.ts

Creates basic test users for development and testing:
- 1 Admin user (admin@labmanager.com)
- 1 Instructor user (instructor@test.com)  
- 3 Student users (student1-3@test.com)

All users use simple passwords for testing.
Change passwords in production!

Examples:
  tsx scripts/create-test-users.ts    # Create test users
  npm run create-test-users           # If script is added to package.json
`);
  process.exit(0);
}

// Run user creation
createTestUsers().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
