-- ============================================================================
-- ADD STUDENTS TO EACH SECTION (10 per section, 6 girls : 4 boys ratio)
-- Total: 200 students (20 sections × 10 students each)
-- ============================================================================

-- Create students for Grade 11 Non Medical sections (A-F)
WITH student_data AS (
  SELECT 
    c.id as class_id,
    c.grade_level,
    c.trade_type,
    c.section,
    s.student_num,
    CASE 
      WHEN s.student_num <= 6 THEN 'female'
      ELSE 'male'
    END as gender,
    CASE 
      WHEN s.student_num <= 6 THEN 
        (ARRAY['Aisha', 'Fatima', 'Zainab', 'Khadija', 'Maryam', 'Ayesha', 'Sana', 'Hira', 'Noor', 'Rabia'])[s.student_num]
      ELSE 
        (ARRAY['Ahmed', 'Ali', 'Hassan', 'Omar', 'Usman', 'Bilal', 'Hamza', 'Saad', 'Zain', 'Faisal'])[s.student_num - 6]
    END as first_name,
    CASE 
      WHEN s.student_num <= 6 THEN 
        (ARRAY['Khan', 'Sheikh', 'Ahmad', 'Ali', 'Hassan', 'Malik', 'Butt', 'Chaudhry', 'Awan', 'Qureshi'])[s.student_num]
      ELSE 
        (ARRAY['Khan', 'Sheikh', 'Ahmad', 'Ali', 'Hassan', 'Malik', 'Butt', 'Chaudhry', 'Awan', 'Qureshi'])[s.student_num - 6]
    END as last_name
  FROM classes c
  CROSS JOIN generate_series(1, 10) s(student_num)
  WHERE c.grade_level = 11 AND c.trade_type = 'NM'
)
INSERT INTO users (id, email, password, first_name, last_name, role, student_id, gender, phone, address, created_at)
SELECT 
  gen_random_uuid(),
  LOWER(first_name || '.' || last_name || '.' || grade_level || trade_type || section || student_num || '@student.edu'),
  'student123',
  first_name,
  last_name,
  'student',
  grade_level || trade_type || section || LPAD(student_num::text, 3, '0'),
  gender,
  '+92-300-' || LPAD((1000000 + (grade_level * 10000) + (ASCII(section) * 100) + student_num)::text, 7, '0'),
  'House #' || student_num || ', Street ' || ASCII(section) || ', Sector ' || grade_level || ', Islamabad',
  NOW()
FROM student_data;

-- Create students for Grade 11 Medical sections (G-H)
WITH student_data AS (
  SELECT 
    c.id as class_id,
    c.grade_level,
    c.trade_type,
    c.section,
    s.student_num,
    CASE 
      WHEN s.student_num <= 6 THEN 'female'
      ELSE 'male'
    END as gender,
    CASE 
      WHEN s.student_num <= 6 THEN 
        (ARRAY['Amna', 'Bushra', 'Farah', 'Hina', 'Iqra', 'Javeria', 'Kinza', 'Laiba', 'Mahnoor', 'Nimra'])[s.student_num]
      ELSE 
        (ARRAY['Adnan', 'Babar', 'Danish', 'Fahad', 'Haris', 'Imran', 'Junaid', 'Kamran', 'Luqman', 'Nabeel'])[s.student_num - 6]
    END as first_name,
    CASE 
      WHEN s.student_num <= 6 THEN 
        (ARRAY['Siddiqui', 'Ansari', 'Rizvi', 'Naqvi', 'Kazmi', 'Gillani', 'Gardezi', 'Hashmi', 'Jafri', 'Bukhari'])[s.student_num]
      ELSE 
        (ARRAY['Siddiqui', 'Ansari', 'Rizvi', 'Naqvi', 'Kazmi', 'Gillani', 'Gardezi', 'Hashmi', 'Jafri', 'Bukhari'])[s.student_num - 6]
    END as last_name
  FROM classes c
  CROSS JOIN generate_series(1, 10) s(student_num)
  WHERE c.grade_level = 11 AND c.trade_type = 'M'
)
INSERT INTO users (id, email, password, first_name, last_name, role, student_id, gender, phone, address, created_at)
SELECT 
  gen_random_uuid(),
  LOWER(first_name || '.' || last_name || '.' || grade_level || trade_type || section || student_num || '@student.edu'),
  'student123',
  first_name,
  last_name,
  'student',
  grade_level || trade_type || section || LPAD(student_num::text, 3, '0'),
  gender,
  '+92-301-' || LPAD((1000000 + (grade_level * 10000) + (ASCII(section) * 100) + student_num)::text, 7, '0'),
  'House #' || student_num || ', Street ' || ASCII(section) || ', Sector ' || grade_level || ', Lahore',
  NOW()
FROM student_data;

-- Create students for Grade 11 Commerce sections (I-J)
WITH student_data AS (
  SELECT 
    c.id as class_id,
    c.grade_level,
    c.trade_type,
    c.section,
    s.student_num,
    CASE 
      WHEN s.student_num <= 6 THEN 'female'
      ELSE 'male'
    END as gender,
    CASE 
      WHEN s.student_num <= 6 THEN 
        (ARRAY['Palwasha', 'Qurat', 'Rida', 'Sidra', 'Tayyaba', 'Urooj', 'Warda', 'Yumna', 'Zahra', 'Aliza'])[s.student_num]
      ELSE 
        (ARRAY['Osama', 'Qasim', 'Rehan', 'Shahzad', 'Talha', 'Usama', 'Waleed', 'Yasir', 'Zubair', 'Arslan'])[s.student_num - 6]
    END as first_name,
    CASE 
      WHEN s.student_num <= 6 THEN 
        (ARRAY['Tariq', 'Iqbal', 'Hussain', 'Abbas', 'Raza', 'Shah', 'Mirza', 'Baig', 'Dar', 'Lone'])[s.student_num]
      ELSE 
        (ARRAY['Tariq', 'Iqbal', 'Hussain', 'Abbas', 'Raza', 'Shah', 'Mirza', 'Baig', 'Dar', 'Lone'])[s.student_num - 6]
    END as last_name
  FROM classes c
  CROSS JOIN generate_series(1, 10) s(student_num)
  WHERE c.grade_level = 11 AND c.trade_type = 'C'
)
INSERT INTO users (id, email, password, first_name, last_name, role, student_id, gender, phone, address, created_at)
SELECT 
  gen_random_uuid(),
  LOWER(first_name || '.' || last_name || '.' || grade_level || trade_type || section || student_num || '@student.edu'),
  'student123',
  first_name,
  last_name,
  'student',
  grade_level || trade_type || section || LPAD(student_num::text, 3, '0'),
  gender,
  '+92-302-' || LPAD((1000000 + (grade_level * 10000) + (ASCII(section) * 100) + student_num)::text, 7, '0'),
  'House #' || student_num || ', Street ' || ASCII(section) || ', Sector ' || grade_level || ', Karachi',
  NOW()
FROM student_data;

-- Create students for Grade 12 Non Medical sections (A-F)
WITH student_data AS (
  SELECT
    c.id as class_id,
    c.grade_level,
    c.trade_type,
    c.section,
    s.student_num,
    CASE
      WHEN s.student_num <= 6 THEN 'female'
      ELSE 'male'
    END as gender,
    CASE
      WHEN s.student_num <= 6 THEN
        (ARRAY['Areeba', 'Bisma', 'Dua', 'Esha', 'Gul', 'Hajra', 'Iram', 'Jannat', 'Komal', 'Laraib'])[s.student_num]
      ELSE
        (ARRAY['Ashar', 'Basit', 'Daniyal', 'Ehsan', 'Ghulam', 'Haider', 'Ibrahim', 'Jawad', 'Kashif', 'Latif'])[s.student_num - 6]
    END as first_name,
    CASE
      WHEN s.student_num <= 6 THEN
        (ARRAY['Ahmed', 'Bhatti', 'Cheema', 'Durrani', 'Farooq', 'Gondal', 'Hafeez', 'Iqbal', 'Javed', 'Khattak'])[s.student_num]
      ELSE
        (ARRAY['Ahmed', 'Bhatti', 'Cheema', 'Durrani', 'Farooq', 'Gondal', 'Hafeez', 'Iqbal', 'Javed', 'Khattak'])[s.student_num - 6]
    END as last_name
  FROM classes c
  CROSS JOIN generate_series(1, 10) s(student_num)
  WHERE c.grade_level = 12 AND c.trade_type = 'NM'
)
INSERT INTO users (id, email, password, first_name, last_name, role, student_id, gender, phone, address, created_at)
SELECT
  gen_random_uuid(),
  LOWER(first_name || '.' || last_name || '.' || grade_level || trade_type || section || student_num || '@student.edu'),
  'student123',
  first_name,
  last_name,
  'student',
  grade_level || trade_type || section || LPAD(student_num::text, 3, '0'),
  gender,
  '+92-303-' || LPAD((1000000 + (grade_level * 10000) + (ASCII(section) * 100) + student_num)::text, 7, '0'),
  'House #' || student_num || ', Street ' || ASCII(section) || ', Sector ' || grade_level || ', Faisalabad',
  NOW()
FROM student_data;

-- Create students for Grade 12 Medical sections (G-H)
WITH student_data AS (
  SELECT
    c.id as class_id,
    c.grade_level,
    c.trade_type,
    c.section,
    s.student_num,
    CASE
      WHEN s.student_num <= 6 THEN 'female'
      ELSE 'male'
    END as gender,
    CASE
      WHEN s.student_num <= 6 THEN
        (ARRAY['Mehak', 'Nayab', 'Oshba', 'Parishay', 'Quratulain', 'Ramsha', 'Samreen', 'Tehreem', 'Umme', 'Vaneeza'])[s.student_num]
      ELSE
        (ARRAY['Muneeb', 'Noman', 'Owais', 'Parvez', 'Qadeer', 'Rafay', 'Salman', 'Taimoor', 'Umair', 'Waqas'])[s.student_num - 6]
    END as first_name,
    CASE
      WHEN s.student_num <= 6 THEN
        (ARRAY['Lodhi', 'Mughal', 'Niazi', 'Orakzai', 'Pathan', 'Qazi', 'Rajput', 'Syed', 'Tareen', 'Usmani'])[s.student_num]
      ELSE
        (ARRAY['Lodhi', 'Mughal', 'Niazi', 'Orakzai', 'Pathan', 'Qazi', 'Rajput', 'Syed', 'Tareen', 'Usmani'])[s.student_num - 6]
    END as last_name
  FROM classes c
  CROSS JOIN generate_series(1, 10) s(student_num)
  WHERE c.grade_level = 12 AND c.trade_type = 'M'
)
INSERT INTO users (id, email, password, first_name, last_name, role, student_id, gender, phone, address, created_at)
SELECT
  gen_random_uuid(),
  LOWER(first_name || '.' || last_name || '.' || grade_level || trade_type || section || student_num || '@student.edu'),
  'student123',
  first_name,
  last_name,
  'student',
  grade_level || trade_type || section || LPAD(student_num::text, 3, '0'),
  gender,
  '+92-304-' || LPAD((1000000 + (grade_level * 10000) + (ASCII(section) * 100) + student_num)::text, 7, '0'),
  'House #' || student_num || ', Street ' || ASCII(section) || ', Sector ' || grade_level || ', Rawalpindi',
  NOW()
FROM student_data;

-- Create students for Grade 12 Commerce sections (I-J)
WITH student_data AS (
  SELECT
    c.id as class_id,
    c.grade_level,
    c.trade_type,
    c.section,
    s.student_num,
    CASE
      WHEN s.student_num <= 6 THEN 'female'
      ELSE 'male'
    END as gender,
    CASE
      WHEN s.student_num <= 6 THEN
        (ARRAY['Wajiha', 'Xahra', 'Yusra', 'Zara', 'Abeeha', 'Bareera', 'Chand', 'Dania', 'Emaan', 'Falak'])[s.student_num]
      ELSE
        (ARRAY['Waheed', 'Ximran', 'Yousuf', 'Zaheer', 'Abrar', 'Bashir', 'Chaudhary', 'Dawood', 'Ejaz', 'Farhan'])[s.student_num - 6]
    END as first_name,
    CASE
      WHEN s.student_num <= 6 THEN
        (ARRAY['Warraich', 'Yousafzai', 'Zafar', 'Abbasi', 'Baloch', 'Chandio', 'Dahar', 'Effendi', 'Farooqui', 'Ghauri'])[s.student_num]
      ELSE
        (ARRAY['Warraich', 'Yousafzai', 'Zafar', 'Abbasi', 'Baloch', 'Chandio', 'Dahar', 'Effendi', 'Farooqui', 'Ghauri'])[s.student_num - 6]
    END as last_name
  FROM classes c
  CROSS JOIN generate_series(1, 10) s(student_num)
  WHERE c.grade_level = 12 AND c.trade_type = 'C'
)
INSERT INTO users (id, email, password, first_name, last_name, role, student_id, gender, phone, address, created_at)
SELECT
  gen_random_uuid(),
  LOWER(first_name || '.' || last_name || '.' || grade_level || trade_type || section || student_num || '@student.edu'),
  'student123',
  first_name,
  last_name,
  'student',
  grade_level || trade_type || section || LPAD(student_num::text, 3, '0'),
  gender,
  '+92-305-' || LPAD((1000000 + (grade_level * 10000) + (ASCII(section) * 100) + student_num)::text, 7, '0'),
  'House #' || student_num || ', Street ' || ASCII(section) || ', Sector ' || grade_level || ', Multan',
  NOW()
FROM student_data;

-- ============================================================================
-- AUTO-ENROLL STUDENTS IN THEIR RESPECTIVE CLASSES
-- ============================================================================

-- Enroll students in their classes based on student_id pattern
INSERT INTO enrollments (id, student_id, class_id, is_active, enrolled_at)
SELECT
  gen_random_uuid(),
  u.id as student_id,
  c.id as class_id,
  true,
  NOW()
FROM users u
JOIN classes c ON (
  u.student_id LIKE c.grade_level || c.trade_type || c.section || '%'
)
WHERE u.role = 'student'
  AND u.student_id ~ '^[0-9]{2}[A-Z]{1,2}[A-J][0-9]{3}$'
  AND NOT EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.student_id = u.id AND e.class_id = c.id
  );

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

-- Overall summary
SELECT
  'OVERALL SUMMARY' as report_type,
  COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as total_students,
  COUNT(DISTINCT c.id) as total_classes,
  SUM(CASE WHEN u.gender = 'female' AND u.role = 'student' THEN 1 ELSE 0 END) as total_girls,
  SUM(CASE WHEN u.gender = 'male' AND u.role = 'student' THEN 1 ELSE 0 END) as total_boys,
  ROUND(SUM(CASE WHEN u.gender = 'female' AND u.role = 'student' THEN 1 ELSE 0 END) * 100.0 /
        NULLIF(COUNT(CASE WHEN u.role = 'student' THEN 1 END), 0), 1) as girls_percentage,
  ROUND(SUM(CASE WHEN u.gender = 'male' AND u.role = 'student' THEN 1 ELSE 0 END) * 100.0 /
        NULLIF(COUNT(CASE WHEN u.role = 'student' THEN 1 END), 0), 1) as boys_percentage
FROM users u
LEFT JOIN enrollments e ON u.id = e.student_id
LEFT JOIN classes c ON e.class_id = c.id;
