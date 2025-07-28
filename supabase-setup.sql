-- FitJourney Database Setup Script for Supabase
-- Run this script in your Supabase SQL Editor to create all required tables

-- Enable RLS (Row Level Security) by default
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS macro_targets CASCADE;
DROP TABLE IF EXISTS macros CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS custom_metric_fields CASCADE;
DROP TABLE IF EXISTS metrics CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS progress_entries CASCADE;
DROP TABLE IF EXISTS user_goals CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table - Main user authentication and profile data
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    is_email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_profiles table - Extended fitness-specific user information
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gender VARCHAR,
    birthday DATE,
    height VARCHAR,
    weight VARCHAR,
    body_type VARCHAR,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_goals table - Fitness goals tracking
CREATE TABLE user_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR NOT NULL, -- general-fitness, cardio, strength, muscle-mass, weight-loss, improve-diet
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create progress_entries table - Progress tracking against goals
CREATE TABLE progress_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR NOT NULL,
    progress_value INTEGER NOT NULL CHECK (progress_value >= 0 AND progress_value <= 100),
    entry_date TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create photos table - User uploaded photos
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR NOT NULL,
    original_name VARCHAR NOT NULL,
    thumbnail_filename VARCHAR,
    mime_type VARCHAR NOT NULL,
    size INTEGER NOT NULL,
    date TIMESTAMP NOT NULL,
    upload_date TIMESTAMP DEFAULT NOW()
);

-- Create user_sessions table - JWT token management
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create metrics table - Body metrics and measurements tracking
CREATE TABLE metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    weight NUMERIC(5, 2),
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create custom_metric_fields table - User-defined metric fields
CREATE TABLE custom_metric_fields (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_name VARCHAR NOT NULL,
    unit VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create activities table - Daily activity tracking
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR NOT NULL, -- walking, running, cycling, gym, etc.
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    date TIMESTAMP NOT NULL,
    location VARCHAR,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create macros table - Nutrition tracking
CREATE TABLE macros (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    protein NUMERIC(5, 1) NOT NULL CHECK (protein >= 0),
    fats NUMERIC(5, 1) NOT NULL CHECK (fats >= 0),
    carbs NUMERIC(5, 1) NOT NULL CHECK (carbs >= 0),
    date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create macro_targets table - Nutrition goals per user
CREATE TABLE macro_targets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    protein_target NUMERIC(5, 1) NOT NULL DEFAULT 0 CHECK (protein_target >= 0),
    fats_target NUMERIC(5, 1) NOT NULL DEFAULT 0 CHECK (fats_target >= 0),
    carbs_target NUMERIC(5, 1) NOT NULL DEFAULT 0 CHECK (carbs_target >= 0),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_progress_entries_user_id ON progress_entries(user_id);
CREATE INDEX idx_progress_entries_date ON progress_entries(entry_date);
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_date ON photos(date);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_metrics_user_id ON metrics(user_id);
CREATE INDEX idx_metrics_date ON metrics(date);
CREATE INDEX idx_custom_metric_fields_user_id ON custom_metric_fields(user_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_date ON activities(date);
CREATE INDEX idx_macros_user_id ON macros(user_id);
CREATE INDEX idx_macros_date ON macros(date);
CREATE INDEX idx_macro_targets_user_id ON macro_targets(user_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_metric_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE macros ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_targets ENABLE ROW LEVEL SECURITY;

-- Create Row Level Security Policies
-- Note: These policies assume authentication is handled by your application
-- and the user_id is available in the JWT token or session context

-- Users table policies - Users can only access their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR ALL USING (auth.uid()::text = user_id::text);

-- User goals policies  
CREATE POLICY "Users can manage own goals" ON user_goals
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Progress entries policies
CREATE POLICY "Users can manage own progress" ON progress_entries
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Photos policies
CREATE POLICY "Users can manage own photos" ON photos
    FOR ALL USING (auth.uid()::text = user_id::text);

-- User sessions policies
CREATE POLICY "Users can manage own sessions" ON user_sessions
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Metrics policies
CREATE POLICY "Users can manage own metrics" ON metrics
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Custom metric fields policies
CREATE POLICY "Users can manage own custom fields" ON custom_metric_fields
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Activities policies
CREATE POLICY "Users can manage own activities" ON activities
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Macros policies
CREATE POLICY "Users can manage own macros" ON macros
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Macro targets policies
CREATE POLICY "Users can manage own macro targets" ON macro_targets
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_macro_targets_updated_at BEFORE UPDATE ON macro_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE 'plpgsql';

-- Grant necessary permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;

-- Insert some initial data for goal types (optional)
-- You can uncomment these if you want to seed some data
/*
INSERT INTO user_goals (user_id, goal_type, is_active) VALUES 
(1, 'general-fitness', true),
(1, 'cardio', true),
(1, 'strength', true),
(1, 'muscle-mass', false),
(1, 'weight-loss', false),
(1, 'improve-diet', true)
ON CONFLICT DO NOTHING;
*/

-- Custom Activities Table for user-defined workout activities
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

-- Enable RLS on custom_activities table
ALTER TABLE custom_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for custom_activities - users can only see their own
CREATE POLICY custom_activities_user_policy ON custom_activities
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'FitJourney database setup completed successfully!';
    RAISE NOTICE 'Tables created: users, user_profiles, user_goals, progress_entries, photos, user_sessions, metrics, custom_metric_fields, activities, macros, macro_targets, custom_activities';
    RAISE NOTICE 'Row Level Security enabled on all tables';
    RAISE NOTICE 'Indexes created for optimal performance';
    RAISE NOTICE 'Triggers set up for automatic timestamp updates';
END $$;