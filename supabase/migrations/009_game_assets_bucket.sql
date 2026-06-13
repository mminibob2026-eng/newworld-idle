-- Create storage bucket for game assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'game-assets',
  'game-assets',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload/update/delete in game-assets
CREATE POLICY "authenticated_upload_game_assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'game-assets'
);

CREATE POLICY "authenticated_update_game_assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'game-assets')
WITH CHECK (bucket_id = 'game-assets');

CREATE POLICY "authenticated_delete_game_assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'game-assets');

-- Public read
CREATE POLICY "public_read_game_assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'game-assets');
