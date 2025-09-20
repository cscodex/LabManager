-- ============================================================================
-- CORRECTED SQL FOR LABMANAGER (Fixed schema issues)
-- Copy and paste this into your Neon database console
-- ============================================================================

-- 1. CREATE ADMIN USER (Login: admin@labmanager.com / admin123)
INSERT INTO users (id, email, password, role, first_name, last_name, created_at)
VALUES (
  gen_random_uuid(),
  'admin@labmanager.com',
  '$2b$10$cFKaFSkzUoO0HxZ2uxZXhu/sPUBiKU3X2pRbrmzZeQUjxWBIzjCr2',
  'instructor',
  'System',
  'Administrator',
  NOW()
);

-- 2. CREATE TEST LABS
INSERT INTO labs (id, name, description, location, capacity, created_at) VALUES
(gen_random_uuid(), 'Computer Lab A', 'Main computer laboratory', 'Building A, Room 101', 30, NOW()),
(gen_random_uuid(), 'Computer Lab B', 'Secondary computer lab', 'Building B, Room 201', 20, NOW());

-- 3. CREATE TEST INSTRUCTOR (Login: john.smith@school.edu / instructor123)
INSERT INTO users (id, email, password, role, first_name, last_name, created_at)
VALUES (
  gen_random_uuid(),
  'john.smith@school.edu',
  '$2b$10$/scyFshOr/ZLv.Cgebyu3OYYbQLxnkxCKzHCEM2RHBz2URtDDTbcK',
  'instructor',
  'John',
  'Smith',
  NOW()
);

-- 4. CREATE TEST STUDENTS (All use password: student123)
INSERT INTO users (id, email, password, role, first_name, last_name, created_at) VALUES
(gen_random_uuid(), 'alice.anderson@student.edu', '$2b$10$ojDxT.4ExDogOOjxjotMdOg7dRDhNpjNevQUDf/fH0Z2pJbcBCAAm', 'student', 'Alice', 'Anderson', NOW()),
(gen_random_uuid(), 'bob.brown@student.edu', '$2b$10$ojDxT.4ExDogOOjxjotMdOg7dRDhNpjNevQUDf/fH0Z2pJbcBCAAm', 'student', 'Bob', 'Brown', NOW()),
(gen_random_uuid(), 'carol.clark@student.edu', '$2b$10$ojDxT.4ExDogOOjxjotMdOg7dRDhNpjNevQUDf/fH0Z2pJbcBCAAm', 'student', 'Carol', 'Clark', NOW());

-- 5. VERIFY SETUP
SELECT 'Users created:' as info, COUNT(*) as count FROM users
UNION ALL
SELECT 'Labs created:', COUNT(*) FROM labs;
