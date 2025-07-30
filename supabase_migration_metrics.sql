-- Supabase Migration: Create Metrics Tables
-- Run this in your Supabase SQL Editor if metrics functionality isn't working

-- Create metrics table for body metrics and measurements tracking
CREATE TABLE IF NOT EXISTS metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    weight NUMERIC(5,2), -- Weight in lbs/kg
    custom_fields JSONB DEFAULT '{}', -- Store custom measurements like waist, chest, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create custom metric fields table for user-defined measurement types
CREATE TABLE IF NOT EXISTS custom_metric_fields (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL, -- e.g., "Waist", "Chest", "Body Fat %"
    unit VARCHAR(20) NOT NULL, -- e.g., "in", "cm", "%", "lbs"
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_metrics_user_id ON metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON metrics(date);
CREATE INDEX IF NOT EXISTS idx_metrics_user_date ON metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_custom_metric_fields_user_id ON custom_metric_fields(user_id);

-- Ensure unique custom field names per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_metric_fields_unique 
ON custom_metric_fields(user_id, field_name);

-- Enable RLS (Row Level Security)
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_metric_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies for metrics
DROP POLICY IF EXISTS "Users can manage own metrics" ON metrics;
CREATE POLICY "Users can manage own metrics" ON metrics
FOR ALL USING (auth.uid()::text = user_id::text);

-- RLS Policies for custom metric fields  
DROP POLICY IF EXISTS "Users can manage own custom metric fields" ON custom_metric_fields;
CREATE POLICY "Users can manage own custom metric fields" ON custom_metric_fields
FOR ALL USING (auth.uid()::text = user_id::text);

-- Verify tables exist
DO $$
BEGIN
    RAISE NOTICE 'Metrics tables migration completed successfully!';
    RAISE NOTICE 'Tables created/verified: metrics, custom_metric_fields';
    RAISE NOTICE 'Indexes created: idx_metrics_user_id, idx_metrics_date, idx_metrics_user_date, idx_custom_metric_fields_user_id';
    RAISE NOTICE 'RLS policies enabled for both tables';
END $$;