-- Migration: Add calories column to macros table
-- Run this in your Supabase SQL Editor

-- Adds an optional calories column to macros entries
ALTER TABLE macros ADD COLUMN IF NOT EXISTS calories NUMERIC(6,1);

-- Optional: comment for clarity
COMMENT ON COLUMN macros.calories IS 'Optional calories for entries created in calorie mode';

-- Index to keep user/date queries performant (if not already present)
CREATE INDEX IF NOT EXISTS idx_macros_user_date ON macros(user_id, date);