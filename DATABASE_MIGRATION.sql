-- LabManager Database Migration: Enhanced Student Management & Computer Data
-- Run this SQL to add new fields and tables to your existing database

-- 1. Add new columns to users table for enhanced student management
ALTER TABLE users 
ADD COLUMN student_id TEXT UNIQUE,
ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female')),
ADD COLUMN phone TEXT,
ADD COLUMN address TEXT;

-- 2. Create computers table
CREATE TABLE computers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lab_id VARCHAR NOT NULL REFERENCES labs(id),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance')),
  cpu TEXT,
  ram TEXT,
  storage TEXT,
  os TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 3. Create index for better performance
CREATE INDEX idx_computers_lab_id ON computers(lab_id);
CREATE INDEX idx_computers_status ON computers(status);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_grade_trade_section ON users(grade_level, trade_type, section);

-- 4. Add computers to Computer Lab A (15 computers)
INSERT INTO computers (name, lab_id, cpu, ram, storage, os)
SELECT 
  'CL1-PC-' || LPAD(generate_series::text, 3, '0'),
  (SELECT id FROM labs WHERE name = 'Computer Lab A' LIMIT 1),
  'Intel Core i5-12400',
  '16GB DDR4',
  '512GB SSD',
  'Windows 11 Pro'
FROM generate_series(1, 15);

-- 5. Add computers to Computer Lab B (19 computers)
INSERT INTO computers (name, lab_id, cpu, ram, storage, os)
SELECT 
  'CL2-PC-' || LPAD(generate_series::text, 3, '0'),
  (SELECT id FROM labs WHERE name = 'Computer Lab B' LIMIT 1),
  'Intel Core i5-12400',
  '16GB DDR4',
  '512GB SSD',
  'Windows 11 Pro'
FROM generate_series(1, 19);

-- 6. Verification queries
SELECT 'Migration completed successfully!' as status;

SELECT 'Users table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

SELECT 'Computers created:' as info, COUNT(*) as count FROM computers;

SELECT 'Computers by lab:' as info;
SELECT l.name as lab_name, COUNT(c.id) as computer_count
FROM labs l
LEFT JOIN computers c ON l.id = c.lab_id
GROUP BY l.id, l.name
ORDER BY l.name;

SELECT 'Sample computers:' as info;
SELECT c.name, l.name as lab_name, c.cpu, c.ram, c.storage, c.os, c.status
FROM computers c
JOIN labs l ON c.lab_id = l.id
ORDER BY c.name
LIMIT 10;
