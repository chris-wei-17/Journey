-- Migration: Add timezone support to user_profiles
-- Date: 2024

-- Add timezone column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';

-- Add index for timezone queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_timezone ON user_profiles(timezone);

-- Update existing users to have UTC as default timezone
UPDATE user_profiles 
SET timezone = 'UTC' 
WHERE timezone IS NULL;