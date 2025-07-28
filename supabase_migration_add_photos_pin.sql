-- Migration: Add PIN protection fields to users table
-- Date: 2024-01-XX
-- Description: Adds photos_pin and photos_pin_enabled columns to support optional PIN protection for photos

-- Add photos_pin column to store hashed PIN (nullable)
ALTER TABLE users 
ADD COLUMN photos_pin VARCHAR;

-- Add photos_pin_enabled column to track if PIN protection is enabled (nullable, defaults to NULL for new feature detection)
ALTER TABLE users 
ADD COLUMN photos_pin_enabled BOOLEAN;

-- Add comments for documentation
COMMENT ON COLUMN users.photos_pin IS 'Hashed PIN for photos protection (bcrypt)';
COMMENT ON COLUMN users.photos_pin_enabled IS 'Whether PIN protection is enabled for photos. NULL = not set, FALSE = disabled, TRUE = enabled';

-- Optional: Add index for performance if needed in the future
-- CREATE INDEX idx_users_photos_pin_enabled ON users(photos_pin_enabled) WHERE photos_pin_enabled IS NOT NULL;