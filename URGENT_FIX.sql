-- URGENT: Run this SQL in Neon Console to fix production immediately
-- This will add the missing group_id column and remove enrollment system

-- Step 1: Add group_id column to users table
ALTER TABLE users ADD COLUMN group_id VARCHAR;

-- Step 2: Add foreign key constraint
ALTER TABLE users ADD CONSTRAINT users_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id);

-- Step 3: Create index for performance
CREATE INDEX users_group_idx ON users(group_id);

-- Step 4: Migrate existing enrollment data (if enrollments table exists)
DO $$
BEGIN
    -- Check if enrollments table exists and migrate data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'enrollments') THEN
        -- Migrate group assignments from enrollments to users
        UPDATE users 
        SET group_id = e.group_id 
        FROM enrollments e 
        WHERE users.id = e.student_id 
        AND e.is_active = true 
        AND e.group_id IS NOT NULL;
        
        -- Drop the enrollments table after migration
        DROP TABLE IF EXISTS enrollments CASCADE;
        
        RAISE NOTICE 'Enrollment data migrated and enrollments table dropped';
    ELSE
        RAISE NOTICE 'Enrollments table does not exist, skipping migration';
    END IF;
END $$;

-- Step 5: Verify the changes
SELECT 
    'group_id column added' as status,
    COUNT(*) as users_with_groups 
FROM users 
WHERE group_id IS NOT NULL AND role = 'student';

-- Check if enrollments table still exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'enrollments') 
        THEN 'enrollments table still exists' 
        ELSE 'enrollments table successfully removed' 
    END as enrollment_status;
