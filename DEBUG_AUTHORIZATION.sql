-- ============================================================================
-- DEBUG AUTHORIZATION ISSUES FOR LABMANAGER
-- Run these queries to diagnose and fix instructor-class assignment problems
-- ============================================================================

-- 1. CHECK CURRENT USER AUTHENTICATION AND ROLES
SELECT 
  id,
  email,
  role,
  first_name,
  last_name,
  created_at
FROM users 
WHERE role = 'instructor'
ORDER BY created_at;

-- 2. CHECK PROBLEMATIC CLASSES (11 NM A, B, C, D)
SELECT 
  c.id,
  c.display_name,
  c.instructor_id,
  c.grade_level,
  c.trade_type,
  c.section,
  u.email as instructor_email,
  u.first_name as instructor_first_name,
  u.last_name as instructor_last_name
FROM classes c
LEFT JOIN users u ON c.instructor_id = u.id
WHERE c.display_name IN ('11 NM A', '11 NM B', '11 NM C', '11 NM D')
ORDER BY c.display_name;

-- 3. CHECK ALL CLASSES AND THEIR INSTRUCTOR ASSIGNMENTS
SELECT 
  c.id,
  c.display_name,
  c.instructor_id,
  u.email as instructor_email,
  u.first_name || ' ' || u.last_name as instructor_name,
  CASE 
    WHEN u.id IS NULL THEN 'NO INSTRUCTOR ASSIGNED'
    WHEN u.role != 'instructor' THEN 'INVALID ROLE'
    ELSE 'OK'
  END as status
FROM classes c
LEFT JOIN users u ON c.instructor_id = u.id
ORDER BY c.grade_level, c.trade_type, c.section;

-- 4. CHECK FOR ORPHANED CLASSES (classes without valid instructors)
SELECT 
  c.id,
  c.display_name,
  c.instructor_id,
  'ORPHANED CLASS' as issue
FROM classes c
LEFT JOIN users u ON c.instructor_id = u.id
WHERE u.id IS NULL OR u.role != 'instructor';

-- 5. CHECK FOR DUPLICATE CLASS ASSIGNMENTS
SELECT 
  display_name,
  COUNT(*) as count,
  STRING_AGG(instructor_id, ', ') as instructor_ids
FROM classes
GROUP BY display_name
HAVING COUNT(*) > 1;

-- 6. GET FIRST INSTRUCTOR ID FOR FIXING ASSIGNMENTS
SELECT 
  id as first_instructor_id,
  email,
  first_name || ' ' || last_name as name
FROM users 
WHERE role = 'instructor' 
ORDER BY created_at 
LIMIT 1;

-- ============================================================================
-- POTENTIAL FIXES (RUN ONLY AFTER REVIEWING ABOVE RESULTS)
-- ============================================================================

-- FIX 1: Assign all problematic classes to the first instructor
-- (Replace 'FIRST_INSTRUCTOR_ID_HERE' with actual ID from query 6)
/*
UPDATE classes 
SET instructor_id = 'FIRST_INSTRUCTOR_ID_HERE'
WHERE display_name IN ('11 NM A', '11 NM B', '11 NM C', '11 NM D')
  AND (instructor_id IS NULL OR instructor_id NOT IN (
    SELECT id FROM users WHERE role = 'instructor'
  ));
*/

-- FIX 2: Create a default admin instructor if none exists
/*
INSERT INTO users (id, email, password, role, first_name, last_name, created_at)
SELECT 
  gen_random_uuid(),
  'admin@labmanager.com',
  '$2b$10$cFKaFSkzUoO0HxZ2uxZXhu/sPUBiKU3X2pRbrmzZeQUjxWBIzjCr2',
  'instructor',
  'System',
  'Administrator',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@labmanager.com'
);
*/

-- FIX 3: Assign all orphaned classes to admin instructor
/*
UPDATE classes 
SET instructor_id = (
  SELECT id FROM users 
  WHERE email = 'admin@labmanager.com' AND role = 'instructor'
  LIMIT 1
)
WHERE instructor_id IS NULL 
   OR instructor_id NOT IN (
     SELECT id FROM users WHERE role = 'instructor'
   );
*/

-- ============================================================================
-- VERIFICATION QUERIES (RUN AFTER FIXES)
-- ============================================================================

-- VERIFY 1: Check that all classes have valid instructors
/*
SELECT 
  COUNT(*) as total_classes,
  COUNT(CASE WHEN u.id IS NOT NULL AND u.role = 'instructor' THEN 1 END) as classes_with_valid_instructors,
  COUNT(CASE WHEN u.id IS NULL OR u.role != 'instructor' THEN 1 END) as orphaned_classes
FROM classes c
LEFT JOIN users u ON c.instructor_id = u.id;
*/

-- VERIFY 2: Check problematic classes are now assigned
/*
SELECT 
  c.display_name,
  u.email as instructor_email,
  u.first_name || ' ' || u.last_name as instructor_name
FROM classes c
JOIN users u ON c.instructor_id = u.id
WHERE c.display_name IN ('11 NM A', '11 NM B', '11 NM C', '11 NM D')
ORDER BY c.display_name;
*/
