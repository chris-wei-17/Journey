-- Migration: Add membership tier to users table
-- Run this in your Supabase SQL Editor to add membership functionality

-- Add membership column to users table with enum constraint
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS membership VARCHAR(20) 
DEFAULT 'Premium (beta)' 
CHECK (membership IN ('Free', 'Ad-free', 'Premium', 'Premium (beta)'));

-- Set all existing users to "Premium (beta)" (in case column already exists with NULL values)
UPDATE users 
SET membership = 'Premium (beta)' 
WHERE membership IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE users 
ALTER COLUMN membership SET NOT NULL;

-- Add index for membership queries (for analytics and filtering)
CREATE INDEX IF NOT EXISTS idx_users_membership ON users(membership);

-- Add comments for documentation
COMMENT ON COLUMN users.membership IS 'User membership tier: Free, Ad-free, Premium, or Premium (beta)';

-- Create a function to get membership display name (optional helper)
CREATE OR REPLACE FUNCTION get_membership_display_name(membership_tier VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    CASE membership_tier
        WHEN 'Free' THEN RETURN '🆓 Free';
        WHEN 'Ad-free' THEN RETURN '🚫 Ad-free';
        WHEN 'Premium' THEN RETURN '⭐ Premium';
        WHEN 'Premium (beta)' THEN RETURN '🧪 Premium (Beta)';
        ELSE RETURN membership_tier;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create a view for user membership statistics (optional)
CREATE OR REPLACE VIEW user_membership_stats AS
SELECT 
    membership,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM users 
GROUP BY membership
ORDER BY user_count DESC;

-- Grant permissions for the new column and functions
GRANT SELECT ON user_membership_stats TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ User membership system added successfully!';
    RAISE NOTICE 'Membership tiers: Free, Ad-free, Premium, Premium (beta)';
    RAISE NOTICE 'All existing users set to: Premium (beta)';
    RAISE NOTICE 'Index created for performance optimization';
    RAISE NOTICE 'Helper functions and views created';
END $$;