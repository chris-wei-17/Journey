-- Migration: Set default membership to Free for new users
-- Run this in your Supabase SQL Editor

-- Set default to Free
ALTER TABLE users ALTER COLUMN membership SET DEFAULT 'Free';

-- Optional: backfill any null or placeholder membership values to Free
UPDATE users SET membership = 'Free' WHERE membership IS NULL OR membership = '';