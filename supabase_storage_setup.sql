-- Project Peak storage setup
-- Run this in Supabase Dashboard -> SQL Editor.
-- It creates the public buckets used for payment screenshots, body photos,
-- and admin-uploaded program images.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'registrations',
  'registrations',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
),
(
  'program-assets',
  'program-assets',
  true,
  8388608,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
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

DROP POLICY IF EXISTS "Project Peak program assets public read" ON storage.objects;
CREATE POLICY "Project Peak program assets public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'program-assets');

DROP POLICY IF EXISTS "Project Peak program assets service write" ON storage.objects;
CREATE POLICY "Project Peak program assets service write"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'program-assets');

DROP POLICY IF EXISTS "Project Peak program assets service update" ON storage.objects;
CREATE POLICY "Project Peak program assets service update"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'program-assets')
WITH CHECK (bucket_id = 'program-assets');

DROP POLICY IF EXISTS "Project Peak program assets service delete" ON storage.objects;
CREATE POLICY "Project Peak program assets service delete"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'program-assets');

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
