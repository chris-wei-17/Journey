-- Migration: Update photos table for Supabase Storage integration
-- Run this in your Supabase SQL Editor

-- Drop the base64 columns if they exist
ALTER TABLE photos DROP COLUMN IF EXISTS image_data;
ALTER TABLE photos DROP COLUMN IF EXISTS thumbnail_data;

-- Add new columns for Supabase Storage file paths (private bucket)
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS image_path VARCHAR,
ADD COLUMN IF NOT EXISTS thumbnail_path VARCHAR,
ADD COLUMN IF NOT EXISTS bucket_path VARCHAR;

-- Make the new columns NOT NULL (after ensuring all rows have values)
-- Note: Run this only after migrating existing data
-- ALTER TABLE photos 
-- ALTER COLUMN image_path SET NOT NULL,
-- ALTER COLUMN thumbnail_path SET NOT NULL,
-- ALTER COLUMN bucket_path SET NOT NULL;

-- Update table comments
COMMENT ON TABLE photos IS 'Photos table - stores file paths for private Supabase Storage bucket access';
COMMENT ON COLUMN photos.image_path IS 'File path for full resolution image in private Supabase Storage bucket';
COMMENT ON COLUMN photos.thumbnail_path IS 'File path for thumbnail image in private Supabase Storage bucket';
COMMENT ON COLUMN photos.bucket_path IS 'Base folder path in storage bucket for organization and management';

-- Create index for better performance on user queries
CREATE INDEX IF NOT EXISTS idx_photos_user_date ON photos(user_id, date);
CREATE INDEX IF NOT EXISTS idx_photos_bucket_path ON photos(bucket_path);

-- Create the photos storage bucket (if not exists)
-- Note: This needs to be done in the Supabase Dashboard Storage section
-- Bucket name: 'photos'
-- Public: false (PRIVATE bucket for security)
-- File size limit: 5MB per file
-- Allowed MIME types: image/*

-- Enable RLS (Row Level Security) on the bucket for user-specific access
-- CREATE POLICY "Users can upload their own photos" ON storage.objects FOR INSERT WITH CHECK (
--   auth.uid()::text = (storage.foldername(name))[1]
-- );
-- CREATE POLICY "Users can view their own photos" ON storage.objects FOR SELECT USING (
--   auth.uid()::text = (storage.foldername(name))[1]
-- );
-- CREATE POLICY "Users can delete their own photos" ON storage.objects FOR DELETE USING (
--   auth.uid()::text = (storage.foldername(name))[1]
-- );