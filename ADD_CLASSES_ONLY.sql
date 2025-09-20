-- ============================================================================
-- ADD CLASSES TO EXISTING LABMANAGER SETUP
-- Run this AFTER you've already created users and labs
-- ============================================================================

-- GRADE 11 CLASSES

-- Non Medical (NM) - Sections A to F (6 classes)
INSERT INTO classes (id, name, code, grade_level, trade_type, section, display_name, lab_id, instructor_id, semester, year, is_active, created_at)
SELECT 
  gen_random_uuid(),
  '11 NM ' || section_letter,
  'CS11NM' || section_letter,
  11,
  'NM',
  section_letter,
  '11 NM ' || section_letter,
  (SELECT id FROM labs WHERE name = 'Computer Lab A' LIMIT 1),
  (SELECT id FROM users WHERE role = 'instructor' AND email = 'john.smith@school.edu' LIMIT 1),
  'Fall',
  2024,
  true,
  NOW()
FROM (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F')) AS sections(section_letter);

-- Medical (M) - Sections G to H (2 classes)
INSERT INTO classes (id, name, code, grade_level, trade_type, section, display_name, lab_id, instructor_id, semester, year, is_active, created_at)
SELECT 
  gen_random_uuid(),
  '11 M ' || section_letter,
  'CS11M' || section_letter,
  11,
  'M',
  section_letter,
  '11 M ' || section_letter,
  (SELECT id FROM labs WHERE name = 'Computer Lab B' LIMIT 1),
  (SELECT id FROM users WHERE role = 'instructor' AND email = 'sarah.johnson@school.edu' LIMIT 1),
  'Fall',
  2024,
  true,
  NOW()
FROM (VALUES ('G'), ('H')) AS sections(section_letter);

-- Commerce (C) - Sections I to J (2 classes)
INSERT INTO classes (id, name, code, grade_level, trade_type, section, display_name, lab_id, instructor_id, semester, year, is_active, created_at)
SELECT 
  gen_random_uuid(),
  '11 C ' || section_letter,
  'CS11C' || section_letter,
  11,
  'C',
  section_letter,
  '11 C ' || section_letter,
  (SELECT id FROM labs WHERE name = 'Computer Lab C' LIMIT 1),
  (SELECT id FROM users WHERE role = 'instructor' AND email = 'mike.davis@school.edu' LIMIT 1),
  'Fall',
  2024,
  true,
  NOW()
FROM (VALUES ('I'), ('J')) AS sections(section_letter);

-- GRADE 12 CLASSES

-- Non Medical (NM) - Sections A to F (6 classes)
INSERT INTO classes (id, name, code, grade_level, trade_type, section, display_name, lab_id, instructor_id, semester, year, is_active, created_at)
SELECT 
  gen_random_uuid(),
  '12 NM ' || section_letter,
  'CS12NM' || section_letter,
  12,
  'NM',
  section_letter,
  '12 NM ' || section_letter,
  (SELECT id FROM labs WHERE name = 'Computer Lab A' LIMIT 1),
  (SELECT id FROM users WHERE role = 'instructor' AND email = 'john.smith@school.edu' LIMIT 1),
  'Fall',
  2024,
  true,
  NOW()
FROM (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F')) AS sections(section_letter);

-- Medical (M) - Sections G to H (2 classes)
INSERT INTO classes (id, name, code, grade_level, trade_type, section, display_name, lab_id, instructor_id, semester, year, is_active, created_at)
SELECT 
  gen_random_uuid(),
  '12 M ' || section_letter,
  'CS12M' || section_letter,
  12,
  'M',
  section_letter,
  '12 M ' || section_letter,
  (SELECT id FROM labs WHERE name = 'Computer Lab B' LIMIT 1),
  (SELECT id FROM users WHERE role = 'instructor' AND email = 'sarah.johnson@school.edu' LIMIT 1),
  'Fall',
  2024,
  true,
  NOW()
FROM (VALUES ('G'), ('H')) AS sections(section_letter);

-- Commerce (C) - Sections I to J (2 classes)
INSERT INTO classes (id, name, code, grade_level, trade_type, section, display_name, lab_id, instructor_id, semester, year, is_active, created_at)
SELECT 
  gen_random_uuid(),
  '12 C ' || section_letter,
  'CS12C' || section_letter,
  12,
  'C',
  section_letter,
  '12 C ' || section_letter,
  (SELECT id FROM labs WHERE name = 'Computer Lab C' LIMIT 1),
  (SELECT id FROM users WHERE role = 'instructor' AND email = 'mike.davis@school.edu' LIMIT 1),
  'Fall',
  2024,
  true,
  NOW()
FROM (VALUES ('I'), ('J')) AS sections(section_letter);

-- VERIFY CLASSES CREATED
SELECT 
  'Total classes created:' as info, 
  COUNT(*) as count 
FROM classes
UNION ALL
SELECT 
  'Classes by grade/trade:',
  COUNT(*)
FROM classes
GROUP BY grade_level, trade_type
ORDER BY info;

-- VIEW ALL CLASSES
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
