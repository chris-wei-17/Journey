-- Rollback: Remove PIN protection fields from users table
-- Date: 2024-01-XX
-- Description: Removes photos_pin and photos_pin_enabled columns if rollback is needed

-- Remove the optional index if it was created
-- DROP INDEX IF EXISTS idx_users_photos_pin_enabled;

-- Remove the PIN protection columns
ALTER TABLE users 
DROP COLUMN IF EXISTS photos_pin_enabled;

ALTER TABLE users 
DROP COLUMN IF EXISTS photos_pin;