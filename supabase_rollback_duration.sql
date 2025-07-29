-- Rollback: Remove duration_minutes column from activities table
-- Date: 2024-01-XX
-- Description: Removes duration_minutes column if rollback is needed

-- Remove the optional index if it was created
-- DROP INDEX IF EXISTS idx_activities_duration;

-- Remove the duration_minutes column
ALTER TABLE activities 
DROP COLUMN IF EXISTS duration_minutes;