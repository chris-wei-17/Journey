-- Simple migration: Add duration_minutes column to activities table
-- Run this in your Supabase SQL Editor

ALTER TABLE activities ADD COLUMN duration_minutes INTEGER;