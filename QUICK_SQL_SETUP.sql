-- ============================================================================
-- QUICK SQL SETUP FOR LABMANAGER
-- Copy and paste these commands into your Neon database console
-- ============================================================================

-- 1. CREATE ADMIN USER (Login: admin@labmanager.com / admin123)
INSERT INTO users (id, email, password, role, first_name, last_name, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@labmanager.com',
  '$2b$10$cFKaFSkzUoO0HxZ2uxZXhu/sPUBiKU3X2pRbrmzZeQUjxWBIzjCr2',
  'instructor',
  'System',
  'Administrator',
  NOW(),
  NOW()
);

-- 2. CREATE TEST LABS
INSERT INTO labs (id, name, description, location, capacity, created_at, updated_at) VALUES
(gen_random_uuid(), 'Computer Lab A', 'Main computer laboratory', 'Building A, Room 101', 30, NOW(), NOW()),
(gen_random_uuid(), 'Computer Lab B', 'Secondary computer lab', 'Building B, Room 201', 20, NOW(), NOW());

-- 3. CREATE TEST INSTRUCTOR (Login: john.smith@school.edu / instructor123)
INSERT INTO users (id, email, password, role, first_name, last_name, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'john.smith@school.edu',
  '$2b$10$/scyFshOr/ZLv.Cgebyu3OYYbQLxnkxCKzHCEM2RHBz2URtDDTbcK',
  'instructor',
  'John',
  'Smith',
  NOW(),
  NOW()
);

-- 4. CREATE TEST STUDENTS (Login: alice.anderson@student.edu / student123, etc.)
INSERT INTO users (id, email, password, role, first_name, last_name, created_at, updated_at) VALUES
(gen_random_uuid(), 'alice.anderson@student.edu', '$2b$10$ojDxT.4ExDogOOjxjotMdOg7dRDhNpjNevQUDf/fH0Z2pJbcBCAAm', 'student', 'Alice', 'Anderson', NOW(), NOW()),
(gen_random_uuid(), 'bob.brown@student.edu', '$2b$10$ojDxT.4ExDogOOjxjotMdOg7dRDhNpjNevQUDf/fH0Z2pJbcBCAAm', 'student', 'Bob', 'Brown', NOW(), NOW()),
(gen_random_uuid(), 'carol.clark@student.edu', '$2b$10$ojDxT.4ExDogOOjxjotMdOg7dRDhNpjNevQUDf/fH0Z2pJbcBCAAm', 'student', 'Carol', 'Clark', NOW(), NOW());

-- 5. VERIFY SETUP
SELECT 'Users created:' as info, COUNT(*) as count FROM users
UNION ALL
SELECT 'Labs created:', COUNT(*) FROM labs;

-- ============================================================================
-- LOGIN CREDENTIALS AFTER RUNNING THIS SQL:
-- ============================================================================
/*
ADMIN:
Email: admin@labmanager.com
Password: admin123

INSTRUCTOR:
Email: john.smith@school.edu
Password: instructor123

STUDENTS:
Email: alice.anderson@student.edu
Password: student123

Email: bob.brown@student.edu
Password: student123

Email: carol.clark@student.edu
Password: student123

⚠️  CHANGE ADMIN PASSWORD IMMEDIATELY AFTER FIRST LOGIN!
*/
