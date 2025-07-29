-- Migration: Add duration_minutes column to activities table
-- Date: 2024-01-XX
-- Description: Adds duration_minutes column to store calculated activity duration for analytics

-- Add duration_minutes column to activities table
ALTER TABLE activities 
ADD COLUMN duration_minutes INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN activities.duration_minutes IS 'Duration in minutes calculated from start_time and end_time, for analytics and reporting';

-- Optional: Update existing records with calculated duration (if any exist)
-- This will calculate duration for existing activities
UPDATE activities 
SET duration_minutes = EXTRACT(EPOCH FROM (end_time - start_time)) / 60
WHERE duration_minutes IS NULL AND start_time IS NOT NULL AND end_time IS NOT NULL;

-- Optional: Add index for performance on duration-based queries
-- CREATE INDEX idx_activities_duration ON activities(duration_minutes) WHERE duration_minutes IS NOT NULL;