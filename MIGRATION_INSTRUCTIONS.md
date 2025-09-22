# Database Migration Instructions

## Issue
The production database is missing the `group_id` column in the `users` table, causing errors:
```
error: column "group_id" does not exist
```

## Solution
Run the database migration to add the `group_id` column and remove the enrollment system.

## Steps to Fix Production

### Option 1: Run Migration via Render Shell
1. Go to your Render dashboard
2. Open the LabManager service
3. Go to the "Shell" tab
4. Run the migration command:
```bash
npm run db:migrate-remove-enrollments
```

### Option 2: Manual SQL Execution
If the shell method doesn't work, you can run the SQL directly:

1. Connect to your Neon database using the connection string
2. Execute the following SQL:

```sql
-- Add group_id column to users table
ALTER TABLE users ADD COLUMN group_id VARCHAR REFERENCES groups(id);

-- Create index for performance
CREATE INDEX users_group_idx ON users(group_id);

-- Migrate existing enrollment data (if enrollments table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'enrollments') THEN
        UPDATE users 
        SET group_id = e.group_id 
        FROM enrollments e 
        WHERE users.id = e.student_id 
        AND e.is_active = true 
        AND e.group_id IS NOT NULL;
        
        DROP TABLE IF EXISTS enrollments CASCADE;
    END IF;
END $$;
```

### Option 3: Neon Console
1. Go to your Neon console
2. Open the SQL Editor
3. Paste and execute the SQL from Option 2

## Verification
After running the migration, verify it worked:

```sql
-- Check if group_id column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'group_id';

-- Check if enrollments table is gone
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'enrollments';

-- Count users with groups
SELECT COUNT(*) as users_with_groups 
FROM users 
WHERE group_id IS NOT NULL AND role = 'student';
```

## Expected Results
- ✅ `group_id` column added to `users` table
- ✅ `enrollments` table removed
- ✅ No more "column group_id does not exist" errors
- ✅ Group creation and student updates work correctly

## Rollback (if needed)
If something goes wrong, you can rollback by:
1. Removing the `group_id` column: `ALTER TABLE users DROP COLUMN group_id;`
2. Recreating the enrollments table (but this would require restoring from backup)

**Note**: It's recommended to backup your database before running the migration.
