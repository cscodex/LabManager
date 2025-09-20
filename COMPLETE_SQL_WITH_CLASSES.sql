-- ============================================================================
-- COMPLETE LABMANAGER SETUP WITH CLASSES
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
(gen_random_uuid(), 'Computer Lab B', 'Secondary computer lab', 'Building B, Room 201', 20, NOW()),
(gen_random_uuid(), 'Computer Lab C', 'Advanced computer lab', 'Building C, Room 301', 25, NOW());

-- 3. CREATE TEST INSTRUCTORS
INSERT INTO users (id, email, password, role, first_name, last_name, created_at) VALUES
(gen_random_uuid(), 'john.smith@school.edu', '$2b$10$/scyFshOr/ZLv.Cgebyu3OYYbQLxnkxCKzHCEM2RHBz2URtDDTbcK', 'instructor', 'John', 'Smith', NOW()),
(gen_random_uuid(), 'sarah.johnson@school.edu', '$2b$10$/scyFshOr/ZLv.Cgebyu3OYYbQLxnkxCKzHCEM2RHBz2URtDDTbcK', 'instructor', 'Sarah', 'Johnson', NOW()),
(gen_random_uuid(), 'mike.davis@school.edu', '$2b$10$/scyFshOr/ZLv.Cgebyu3OYYbQLxnkxCKzHCEM2RHBz2URtDDTbcK', 'instructor', 'Mike', 'Davis', NOW());

-- 4. CREATE TEST STUDENTS (All use password: student123)
INSERT INTO users (id, email, password, role, first_name, last_name, created_at) VALUES
(gen_random_uuid(), 'alice.anderson@student.edu', '$2b$10$ojDxT.4ExDogOOjxjotMdOg7dRDhNpjNevQUDf/fH0Z2pJbcBCAAm', 'student', 'Alice', 'Anderson', NOW()),
(gen_random_uuid(), 'bob.brown@student.edu', '$2b$10$ojDxT.4ExDogOOjxjotMdOg7dRDhNpjNevQUDf/fH0Z2pJbcBCAAm', 'student', 'Bob', 'Brown', NOW()),
(gen_random_uuid(), 'carol.clark@student.edu', '$2b$10$ojDxT.4ExDogOOjxjotMdOg7dRDhNpjNevQUDf/fH0Z2pJbcBCAAm', 'student', 'Carol', 'Clark', NOW()),
(gen_random_uuid(), 'david.davis@student.edu', '$2b$10$ojDxT.4ExDogOOjxjotMdOg7dRDhNpjNevQUDf/fH0Z2pJbcBCAAm', 'student', 'David', 'Davis', NOW()),
(gen_random_uuid(), 'eva.evans@student.edu', '$2b$10$ojDxT.4ExDogOOjxjotMdOg7dRDhNpjNevQUDf/fH0Z2pJbcBCAAm', 'student', 'Eva', 'Evans', NOW());

-- 5. CREATE CLASSES FOR GRADE 11 & 12 WITH PROPER TRADE/SECTION STRUCTURE
-- Get lab and instructor IDs for class creation (we'll use the first ones created)

-- GRADE 11 CLASSES
-- Non Medical (NM) - Sections A to F
INSERT INTO classes (id, name, code, grade_level, trade_type, section, display_name, lab_id, instructor_id, semester, year, is_active, created_at)
SELECT 
  gen_random_uuid(),
  '11 NM ' || section_letter,
  'CS11NM' || section_letter,
  11,
  'NM',
  section_letter,
  '11 NM ' || section_letter,
  (SELECT id FROM labs LIMIT 1),
  (SELECT id FROM users WHERE role = 'instructor' LIMIT 1),
  'Fall',
  2024,
  true,
  NOW()
FROM (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F')) AS sections(section_letter);

-- Medical (M) - Sections G to H
INSERT INTO classes (id, name, code, grade_level, trade_type, section, display_name, lab_id, instructor_id, semester, year, is_active, created_at)
SELECT 
  gen_random_uuid(),
  '11 M ' || section_letter,
  'CS11M' || section_letter,
  11,
  'M',
  section_letter,
  '11 M ' || section_letter,
  (SELECT id FROM labs OFFSET 1 LIMIT 1),
  (SELECT id FROM users WHERE role = 'instructor' OFFSET 1 LIMIT 1),
  'Fall',
  2024,
  true,
  NOW()
FROM (VALUES ('G'), ('H')) AS sections(section_letter);

-- Commerce (C) - Sections I to J
INSERT INTO classes (id, name, code, grade_level, trade_type, section, display_name, lab_id, instructor_id, semester, year, is_active, created_at)
SELECT 
  gen_random_uuid(),
  '11 C ' || section_letter,
  'CS11C' || section_letter,
  11,
  'C',
  section_letter,
  '11 C ' || section_letter,
  (SELECT id FROM labs OFFSET 2 LIMIT 1),
  (SELECT id FROM users WHERE role = 'instructor' OFFSET 2 LIMIT 1),
  'Fall',
  2024,
  true,
  NOW()
FROM (VALUES ('I'), ('J')) AS sections(section_letter);

-- GRADE 12 CLASSES
-- Non Medical (NM) - Sections A to F
INSERT INTO classes (id, name, code, grade_level, trade_type, section, display_name, lab_id, instructor_id, semester, year, is_active, created_at)
SELECT 
  gen_random_uuid(),
  '12 NM ' || section_letter,
  'CS12NM' || section_letter,
  12,
  'NM',
  section_letter,
  '12 NM ' || section_letter,
  (SELECT id FROM labs LIMIT 1),
  (SELECT id FROM users WHERE role = 'instructor' LIMIT 1),
  'Fall',
  2024,
  true,
  NOW()
FROM (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F')) AS sections(section_letter);

-- Medical (M) - Sections G to H
INSERT INTO classes (id, name, code, grade_level, trade_type, section, display_name, lab_id, instructor_id, semester, year, is_active, created_at)
SELECT 
  gen_random_uuid(),
  '12 M ' || section_letter,
  'CS12M' || section_letter,
  12,
  'M',
  section_letter,
  '12 M ' || section_letter,
  (SELECT id FROM labs OFFSET 1 LIMIT 1),
  (SELECT id FROM users WHERE role = 'instructor' OFFSET 1 LIMIT 1),
  'Fall',
  2024,
  true,
  NOW()
FROM (VALUES ('G'), ('H')) AS sections(section_letter);

-- Commerce (C) - Sections I to J
INSERT INTO classes (id, name, code, grade_level, trade_type, section, display_name, lab_id, instructor_id, semester, year, is_active, created_at)
SELECT 
  gen_random_uuid(),
  '12 C ' || section_letter,
  'CS12C' || section_letter,
  12,
  'C',
  section_letter,
  '12 C ' || section_letter,
  (SELECT id FROM labs OFFSET 2 LIMIT 1),
  (SELECT id FROM users WHERE role = 'instructor' OFFSET 2 LIMIT 1),
  'Fall',
  2024,
  true,
  NOW()
FROM (VALUES ('I'), ('J')) AS sections(section_letter);

-- 6. VERIFY SETUP
SELECT 'Users created:' as info, COUNT(*) as count FROM users
UNION ALL
SELECT 'Labs created:', COUNT(*) FROM labs
UNION ALL
SELECT 'Classes created:', COUNT(*) FROM classes
UNION ALL
SELECT 'Grade 11 classes:', COUNT(*) FROM classes WHERE grade_level = 11
UNION ALL
SELECT 'Grade 12 classes:', COUNT(*) FROM classes WHERE grade_level = 12
UNION ALL
SELECT 'Non Medical classes:', COUNT(*) FROM classes WHERE trade_type = 'NM'
UNION ALL
SELECT 'Medical classes:', COUNT(*) FROM classes WHERE trade_type = 'M'
UNION ALL
SELECT 'Commerce classes:', COUNT(*) FROM classes WHERE trade_type = 'C';

-- 7. VIEW ALL CREATED CLASSES
SELECT 
  display_name,
  code,
  grade_level,
  trade_type,
  section,
  semester,
  year
FROM classes 
ORDER BY grade_level, trade_type, section;
