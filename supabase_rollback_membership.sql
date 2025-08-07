-- Rollback: Remove membership system from users table
-- CAUTION: This will permanently delete membership data!

-- Drop the view
DROP VIEW IF EXISTS user_membership_stats;

-- Drop the helper function
DROP FUNCTION IF EXISTS get_membership_display_name(VARCHAR);

-- Drop the index
DROP INDEX IF EXISTS idx_users_membership;

-- Remove the membership column (this will delete all membership data!)
ALTER TABLE users DROP COLUMN IF EXISTS membership;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '⚠️  User membership system removed!';
    RAISE NOTICE 'All membership data has been permanently deleted';
    RAISE NOTICE 'Users table restored to previous state';
END $$;