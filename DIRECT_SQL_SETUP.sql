-- LabManager Direct SQL Setup
-- Run these commands directly in your Neon database console

-- =============================================================================
-- STEP 1: CREATE INITIAL ADMIN USER
-- =============================================================================

-- Create admin user with hashed password (admin123)
INSERT INTO users (id, email, password, role, first_name, last_name, created_at)
VALUES (
  gen_random_uuid(),
  'admin@labmanager.com',
  '$2b$10$cFKaFSkzUoO0HxZ2uxZXhu/sPUBiKU3X2pRbrmzZeQUjxWBIzjCr2',  -- This is 'admin123' hashed
  'instructor',
  'System',
  'Administrator',
  NOW()
);

-- =============================================================================
-- STEP 2: CREATE TEST LABS
-- =============================================================================

-- Insert test labs
INSERT INTO labs (id, name, description, location, capacity, created_at) VALUES
(gen_random_uuid(), 'Computer Lab A', 'Main computer laboratory with 30 workstations', 'Building A, Ground Floor', 30, NOW()),
(gen_random_uuid(), 'Computer Lab B', 'Secondary computer laboratory with 20 workstations', 'Building B, First Floor', 20, NOW()),
(gen_random_uuid(), 'Programming Lab', 'Specialized programming laboratory with advanced hardware', 'Building A, Second Floor', 25, NOW());

-- =============================================================================
-- STEP 3: CREATE TEST INSTRUCTORS
-- =============================================================================

-- Create test instructors (password: instructor123)
INSERT INTO users (id, email, password, role, first_name, last_name, created_at) VALUES
(gen_random_uuid(), 'john.smith@school.edu', '$2b$10$/scyFshOr/ZLv.Cgebyu3OYYbQLxnkxCKzHCEM2RHBz2URtDDTbcK', 'instructor', 'John', 'Smith', NOW()),
(gen_random_uuid(), 'sarah.johnson@school.edu', '$2b$10$/scyFshOr/ZLv.Cgebyu3OYYbQLxnkxCKzHCEM2RHBz2URtDDTbcK', 'instructor', 'Sarah', 'Johnson', NOW()),
(gen_random_uuid(), 'mike.davis@school.edu', '$2b$10$/scyFshOr/ZLv.Cgebyu3OYYbQLxnkxCKzHCEM2RHBz2URtDDTbcK', 'instructor', 'Mike', 'Davis', NOW());

-- =============================================================================
-- STEP 4: CREATE TEST STUDENTS
-- =============================================================================

-- Create test students (password: student123)
INSERT INTO users (id, email, password, role, first_name, last_name, created_at) VALUES
(gen_random_uuid(), 'alice.anderson@student.edu', '$2b$10$ojDxT.4ExDogOOjxjotMdOg7dRDhNpjNevQUDf/fH0Z2pJbcBCAAm', 'student', 'Alice', 'Anderson', NOW()),
(gen_random_uuid(), 'bob.brown@student.edu', '$2b$10$ojDxT.4ExDogOOjxjotMdOg7dRDhNpjNevQUDf/fH0Z2pJbcBCAAm', 'student', 'Bob', 'Brown', NOW()),
(gen_random_uuid(), 'carol.clark@student.edu', '$2b$10$ojDxT.4ExDogOOjxjotMdOg7dRDhNpjNevQUDf/fH0Z2pJbcBCAAm', 'student', 'Carol', 'Clark', NOW()),
(gen_random_uuid(), 'david.davis@student.edu', '$2b$10$ojDxT.4ExDogOOjxjotMdOg7dRDhNpjNevQUDf/fH0Z2pJbcBCAAm', 'student', 'David', 'Davis', NOW()),
(gen_random_uuid(), 'eva.evans@student.edu', '$2b$10$ojDxT.4ExDogOOjxjotMdOg7dRDhNpjNevQUDf/fH0Z2pJbcBCAAm', 'student', 'Eva', 'Evans', NOW());

-- =============================================================================
-- STEP 5: CREATE COMPUTERS FOR LABS
-- =============================================================================

-- Get lab IDs for computer creation (you'll need to replace these with actual IDs)
-- First, run this to get lab IDs:
-- SELECT id, name FROM labs ORDER BY name;

-- Then replace 'LAB_A_ID', 'LAB_B_ID', 'LAB_P_ID' with actual UUIDs from above query

-- Computers for Lab A (replace LAB_A_ID with actual UUID)
-- INSERT INTO computers (id, name, lab_id, specs, status, created_at, updated_at) VALUES
-- (gen_random_uuid(), 'PC-A01', 'LAB_A_ID', 'Intel i7, 16GB RAM, 512GB SSD, Windows 11', 'available', NOW(), NOW()),
-- (gen_random_uuid(), 'PC-A02', 'LAB_A_ID', 'Intel i7, 16GB RAM, 512GB SSD, Windows 11', 'available', NOW(), NOW()),
-- (gen_random_uuid(), 'PC-A03', 'LAB_A_ID', 'Intel i7, 16GB RAM, 512GB SSD, Windows 11', 'available', NOW(), NOW());

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check created users
SELECT email, role, first_name, last_name FROM users ORDER BY role, email;

-- Check created labs
SELECT name, description, capacity FROM labs ORDER BY name;

-- Check total counts
SELECT 
  (SELECT COUNT(*) FROM users WHERE role = 'instructor') as instructors,
  (SELECT COUNT(*) FROM users WHERE role = 'student') as students,
  (SELECT COUNT(*) FROM labs) as labs,
  (SELECT COUNT(*) FROM computers) as computers;

-- =============================================================================
-- LOGIN CREDENTIALS AFTER RUNNING THIS SQL
-- =============================================================================

/*
ADMIN LOGIN:
Email: admin@labmanager.com
Password: admin123

INSTRUCTOR LOGINS:
Email: john.smith@school.edu
Password: instructor123

Email: sarah.johnson@school.edu  
Password: instructor123

Email: mike.davis@school.edu
Password: instructor123

STUDENT LOGINS:
Email: alice.anderson@student.edu
Password: student123

Email: bob.brown@student.edu
Password: student123

Email: carol.clark@student.edu
Password: student123

Email: david.davis@student.edu
Password: student123

Email: eva.evans@student.edu
Password: student123

⚠️  IMPORTANT: Change the admin password immediately after first login!
*/
