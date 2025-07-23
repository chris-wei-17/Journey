-- Migration: Update photos table for Supabase Storage integration
-- Run this in your Supabase SQL Editor

-- Drop the base64 columns if they exist
ALTER TABLE photos DROP COLUMN IF EXISTS image_data;
ALTER TABLE photos DROP COLUMN IF EXISTS thumbnail_data;

-- Add new columns for Supabase Storage URLs
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS image_url VARCHAR,
ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR,
ADD COLUMN IF NOT EXISTS bucket_path VARCHAR;

-- Make the new columns NOT NULL (after ensuring all rows have values)
-- Note: Run this only after migrating existing data
-- ALTER TABLE photos 
-- ALTER COLUMN image_url SET NOT NULL,
-- ALTER COLUMN thumbnail_url SET NOT NULL,
-- ALTER COLUMN bucket_path SET NOT NULL;

-- Update table comments
COMMENT ON TABLE photos IS 'Photos table - stores image URLs from Supabase Storage for better performance and analytics';
COMMENT ON COLUMN photos.image_url IS 'Public URL for full resolution image in Supabase Storage';
COMMENT ON COLUMN photos.thumbnail_url IS 'Public URL for thumbnail image in Supabase Storage';
COMMENT ON COLUMN photos.bucket_path IS 'Path in storage bucket for organization and management';

-- Create index for better performance on user queries
CREATE INDEX IF NOT EXISTS idx_photos_user_date ON photos(user_id, date);
CREATE INDEX IF NOT EXISTS idx_photos_bucket_path ON photos(bucket_path);

-- Create the photos storage bucket (if not exists)
-- Note: This needs to be done in the Supabase Dashboard Storage section
-- Bucket name: 'photos'
-- Public: true (for direct URL access)
-- File size limit: 5MB per file
-- Allowed MIME types: image/*