#!/usr/bin/env tsx

import { config } from "dotenv";
import { storage } from "../server/storage";

// Load environment variables
config();

interface AdminUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin';
}

const adminUsers: AdminUser[] = [
  {
    email: 'admin@labmanager.com',
    password: 'admin123',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin'
  },
  {
    email: 'superadmin@labmanager.com',
    password: 'superadmin123',
    firstName: 'Super',
    lastName: 'Administrator',
    role: 'admin'
  }
];

async function createAdminUsers() {
  console.log("👑 Creating admin users for LabManager...");
  
  try {
    console.log("📡 Connected to database");
    
    let created = 0;
    let skipped = 0;
    
    for (const adminData of adminUsers) {
      try {
        // Check if user already exists
        const existingUser = await storage.getUserByEmail(adminData.email);
        
        if (existingUser) {
          console.log(`⏭️  Admin ${adminData.email} already exists, skipping...`);
          skipped++;
          continue;
        }
        
        // Create admin user
        const admin = await storage.createUserWithRole(adminData);
        console.log(`✅ Created admin: ${admin.email}`);
        created++;
        
      } catch (error) {
        console.error(`❌ Failed to create admin ${adminData.email}:`, error);
      }
    }
    
    console.log(`\n🎉 Admin user creation completed!`);
    console.log(`📊 Summary: ${created} created, ${skipped} skipped`);
    
    if (created > 0) {
      console.log(`\n🔐 Admin Login Credentials:`);
      adminUsers.forEach(admin => {
        console.log(`👑 Admin: ${admin.email} / ${admin.password}`);
      });
      console.log(`\n⚠️  Remember to change default passwords in production!`);
    }
    
  } catch (error) {
    console.error("❌ Failed to create admin users:", error);
    console.log("Admin creation failed:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
createAdminUsers();
