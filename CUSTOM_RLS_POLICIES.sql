-- Custom RLS Policies for Supabase Storage with Custom JWT Auth
-- OPTIONAL: Only run this if you want extra security layers
-- Your current setup is already secure without these policies

-- Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow service role (your server) to manage all files
-- This ensures your server can upload/delete files using the service role key
CREATE POLICY "Service role can manage all files"
ON storage.objects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Block direct access from anon/authenticated roles
-- This prevents any client-side access, forcing all operations through your server
CREATE POLICY "Block direct client access"
ON storage.objects
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Alternative Policy (if you want file-path based security):
-- This allows access only to files in the user's folder structure
-- But requires additional setup to pass user context to Supabase
/*
CREATE POLICY "User folder access only"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'photos' AND 
  (storage.foldername(name))[1] = current_setting('app.current_user_id', true)
);
*/

-- Note: The alternative policy above would require setting a custom context
-- in your server code before each Supabase operation:
-- SELECT set_config('app.current_user_id', user_id::text, true);

-- To check if RLS is working:
-- SELECT * FROM storage.objects; -- Should return empty for non-service-role users