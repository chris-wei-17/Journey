-- Migration: Update photos table to store images as base64 data
-- Run this in your Supabase SQL Editor

-- Add new columns for base64 image data
ALTER TABLE photos 
ADD COLUMN image_data TEXT,
ADD COLUMN thumbnail_data TEXT;

-- Remove the old thumbnail_filename column (after data migration if needed)
-- Note: Only run this after ensuring all photos have been migrated to base64 format
-- ALTER TABLE photos DROP COLUMN thumbnail_filename;

-- Update the table structure comment
COMMENT ON TABLE photos IS 'Photos table - stores images as base64 data in database for serverless compatibility';
COMMENT ON COLUMN photos.image_data IS 'Base64 encoded full resolution image';
COMMENT ON COLUMN photos.thumbnail_data IS 'Base64 encoded thumbnail image (200x200)';

-- Create index for better performance on user queries
CREATE INDEX IF NOT EXISTS idx_photos_user_date ON photos(user_id, date);