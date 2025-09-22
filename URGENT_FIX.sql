-- URGENT: Run this SQL in Neon Console to fix production immediately
-- This will add the missing group_id column and remove enrollment system
-- Run each statement separately if needed

-- Step 1: Add group_id column to users table (run this first)
ALTER TABLE users ADD COLUMN IF NOT EXISTS group_id VARCHAR;

-- Step 2: Create index for performance (run this second)
CREATE INDEX IF NOT EXISTS users_group_idx ON users(group_id);

-- Step 3: Add foreign key constraint (run this third)
-- Note: This might fail if constraint already exists, that's OK
ALTER TABLE users ADD CONSTRAINT users_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id);

-- Step 4: Check if enrollments table exists (run this fourth)
SELECT table_name FROM information_schema.tables WHERE table_name = 'enrollments';

-- Step 5: If enrollments table exists, migrate data (run this fifth)
-- Only run this if the previous query returned a row
UPDATE users
SET group_id = e.group_id
FROM enrollments e
WHERE users.id = e.student_id
AND e.is_active = true
AND e.group_id IS NOT NULL;

-- Step 6: Drop enrollments table (run this sixth)
-- Only run this if enrollments table exists
DROP TABLE IF EXISTS enrollments CASCADE;

-- Step 7: Verify the changes (run this last)
SELECT
    'group_id column added' as status,
    COUNT(*) as users_with_groups
FROM users
WHERE group_id IS NOT NULL AND role = 'student';

-- Final check - this should return no rows if successful
SELECT table_name FROM information_schema.tables WHERE table_name = 'enrollments';
