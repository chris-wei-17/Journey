# Supabase Storage Setup for Photos

This guide explains how to set up Supabase Storage for the FitJourney app photo storage system.

## Required Environment Variables

Add these to your Vercel environment variables:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 1. Get Supabase URL and Service Role Key

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `SUPABASE_URL`
   - **service_role secret** → Use as `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important**: Use the `service_role` key (not the `anon` key) for server-side operations.

## 2. Create Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click **Create Bucket**
3. Set bucket name: `photos`
4. Make it **Public** (for direct URL access)
5. Click **Create bucket**

## 3. Configure Bucket Policies (Optional Security)

If you want to restrict access, you can set up Row Level Security:

```sql
-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own photos" ON storage.objects FOR INSERT WITH CHECK (
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own photos
CREATE POLICY "Users can view their own photos" ON storage.objects FOR SELECT USING (
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own photos" ON storage.objects FOR DELETE USING (
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 4. Run Database Migration

Execute the SQL migration in your Supabase SQL Editor:

```sql
-- Drop the base64 columns if they exist
ALTER TABLE photos DROP COLUMN IF EXISTS image_data;
ALTER TABLE photos DROP COLUMN IF EXISTS thumbnail_data;

-- Add new columns for Supabase Storage URLs
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS image_url VARCHAR,
ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR,
ADD COLUMN IF NOT EXISTS bucket_path VARCHAR;
```

## 5. Update Vercel Environment Variables

In your Vercel project settings, add:

1. `SUPABASE_URL` - Your project URL
2. `SUPABASE_SERVICE_ROLE_KEY` - Your service role key

## File Organization Structure

Photos are organized in the bucket as:
```
photos/
├── user_1/
│   ├── 2025-01-15/
│   │   ├── 1642234567890_abc123.jpg
│   │   ├── 1642234567890_abc123_thumb.jpg
│   │   └── ...
│   └── 2025-01-16/
│       └── ...
└── user_2/
    └── ...
```

## Benefits of This Approach

✅ **Viewable Images**: Direct URLs that can be viewed in browser  
✅ **Analytics Ready**: Easy to download and analyze images  
✅ **Better Performance**: CDN-served images with caching  
✅ **Scalable**: Supabase handles file storage and delivery  
✅ **Organized**: Files organized by user and date  
✅ **Bidirectional**: Easy upload and download access  

## Testing

After setup, test by:
1. Uploading a photo through the app
2. Check the `photos` table - should have `image_url` and `thumbnail_url`
3. Visit the URLs directly - should display the images
4. Check Supabase Storage dashboard - should see files organized by user/date