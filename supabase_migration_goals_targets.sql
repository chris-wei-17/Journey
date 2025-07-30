-- Goals Targets Migration
-- Add specific goal targets with values and units

-- Create goals table for specific goals with target values
CREATE TABLE IF NOT EXISTS goal_targets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_type VARCHAR(100) NOT NULL, -- 'sleep', 'nutrition', 'daily_move', 'custom'
  goal_name VARCHAR(255) NOT NULL, -- Display name for the goal
  target_value_primary DECIMAL(10,2) NOT NULL, -- Main value (hours for sleep, calories for nutrition)
  target_unit_primary VARCHAR(50) NOT NULL, -- 'hours', 'calories', 'minutes', etc.
  target_value_secondary DECIMAL(10,2), -- Optional secondary value (minutes for sleep/move)
  target_unit_secondary VARCHAR(50), -- 'minutes', etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_goal_targets_user_id ON goal_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_targets_user_active ON goal_targets(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_goal_targets_type ON goal_targets(goal_type);

-- Create goal progress tracking table
CREATE TABLE IF NOT EXISTS goal_progress (
  id SERIAL PRIMARY KEY,
  goal_target_id INTEGER NOT NULL REFERENCES goal_targets(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL,
  actual_value_primary DECIMAL(10,2) NOT NULL,
  actual_value_secondary DECIMAL(10,2),
  percentage_achieved DECIMAL(5,2), -- Calculated percentage of goal achieved
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for goal progress
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal_id ON goal_progress(goal_target_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_user_date ON goal_progress(user_id, progress_date);
CREATE INDEX IF NOT EXISTS idx_goal_progress_date ON goal_progress(progress_date);

-- Create unique constraint to prevent duplicate goals per user for same type
CREATE UNIQUE INDEX IF NOT EXISTS idx_goal_targets_user_type_unique 
ON goal_targets(user_id, goal_type) 
WHERE is_active = true;

-- Create unique constraint for progress entries per goal per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_goal_progress_goal_date_unique 
ON goal_progress(goal_target_id, progress_date);

-- Insert some example goals for testing (these would normally be created by users)
-- Note: Replace user_id = 1 with actual user IDs in production

-- Example sleep goal: 8 hours 30 minutes
INSERT INTO goal_targets (user_id, goal_type, goal_name, target_value_primary, target_unit_primary, target_value_secondary, target_unit_secondary)
VALUES (1, 'sleep', 'Daily Sleep Goal', 8, 'hours', 30, 'minutes')
ON CONFLICT DO NOTHING;

-- Example nutrition goal: 2000 calories
INSERT INTO goal_targets (user_id, goal_type, goal_name, target_value_primary, target_unit_primary)
VALUES (1, 'nutrition', 'Daily Calorie Goal', 2000, 'calories')
ON CONFLICT DO NOTHING;

-- Example daily move goal: 1 hour 30 minutes
INSERT INTO goal_targets (user_id, goal_type, goal_name, target_value_primary, target_unit_primary, target_value_secondary, target_unit_secondary)
VALUES (1, 'daily_move', 'Daily Movement Goal', 1, 'hours', 30, 'minutes')
ON CONFLICT DO NOTHING;