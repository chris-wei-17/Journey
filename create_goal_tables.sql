-- Create goal_targets table if it doesn't exist
CREATE TABLE IF NOT EXISTS goal_targets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_type VARCHAR(100) NOT NULL,
  goal_name VARCHAR(255) NOT NULL,
  target_value_primary DECIMAL(10,2) NOT NULL,
  target_unit_primary VARCHAR(50) NOT NULL,
  target_value_secondary DECIMAL(10,2),
  target_unit_secondary VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create goal_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS goal_progress (
  id SERIAL PRIMARY KEY,
  goal_target_id INTEGER NOT NULL REFERENCES goal_targets(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL,
  actual_value_primary DECIMAL(10,2) NOT NULL,
  actual_value_secondary DECIMAL(10,2),
  percentage_achieved DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_goal_targets_user_id ON goal_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_targets_user_active ON goal_targets(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_goal_targets_type ON goal_targets(goal_type);

CREATE INDEX IF NOT EXISTS idx_goal_progress_goal_id ON goal_progress(goal_target_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_user_date ON goal_progress(user_id, progress_date);
CREATE INDEX IF NOT EXISTS idx_goal_progress_date ON goal_progress(progress_date);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_goal_targets_user_type_unique 
ON goal_targets(user_id, goal_type) 
WHERE is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_goal_progress_goal_date_unique 
ON goal_progress(goal_target_id, progress_date);

-- Verify tables were created
SELECT 'goal_targets' as table_name, COUNT(*) as exists 
FROM information_schema.tables 
WHERE table_name = 'goal_targets' AND table_schema = 'public'
UNION ALL
SELECT 'goal_progress' as table_name, COUNT(*) as exists 
FROM information_schema.tables 
WHERE table_name = 'goal_progress' AND table_schema = 'public';