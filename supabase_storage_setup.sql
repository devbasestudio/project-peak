-- Project Peak storage setup
-- Run this in Supabase Dashboard -> SQL Editor.
-- It creates the public bucket used for payment screenshots and body photos.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'registrations',
  'registrations',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Project Peak registration files public read" ON storage.objects;
CREATE POLICY "Project Peak registration files public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'registrations');

DROP POLICY IF EXISTS "Project Peak registration files service write" ON storage.objects;
CREATE POLICY "Project Peak registration files service write"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'registrations');

DROP POLICY IF EXISTS "Project Peak registration files service update" ON storage.objects;
CREATE POLICY "Project Peak registration files service update"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'registrations')
WITH CHECK (bucket_id = 'registrations');

DROP POLICY IF EXISTS "Project Peak registration files service delete" ON storage.objects;
CREATE POLICY "Project Peak registration files service delete"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'registrations');
