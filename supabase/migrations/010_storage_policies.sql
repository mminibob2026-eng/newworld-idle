-- Storage bucket policies for game-assets
-- Allow authenticated users to upload/update/delete
-- Allow public read

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'authenticated_upload_game_assets'
  ) THEN
    CREATE POLICY "authenticated_upload_game_assets"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'game-assets');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'authenticated_update_game_assets'
  ) THEN
    CREATE POLICY "authenticated_update_game_assets"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'game-assets')
    WITH CHECK (bucket_id = 'game-assets');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'authenticated_delete_game_assets'
  ) THEN
    CREATE POLICY "authenticated_delete_game_assets"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'game-assets');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'public_read_game_assets'
  ) THEN
    CREATE POLICY "public_read_game_assets"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'game-assets');
  END IF;
END
$$;
