-- Custom Activities Table Migration
-- This creates a table for user-defined custom workout activities

CREATE TABLE IF NOT EXISTS custom_activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  category VARCHAR NOT NULL DEFAULT 'STRAIN',
  icon VARCHAR DEFAULT 'fa-dumbbell',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name) -- Prevent duplicate activity names per user
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_custom_activities_user_id ON custom_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_activities_name ON custom_activities(name);

-- Add RLS (Row Level Security) policy for custom activities
ALTER TABLE custom_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own custom activities
CREATE POLICY custom_activities_user_policy ON custom_activities
  FOR ALL USING (auth.uid()::text = user_id::text);