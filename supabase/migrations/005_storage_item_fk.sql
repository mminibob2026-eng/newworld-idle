-- Migration 005: Add FK constraint between storage.item_id and content_items.id
-- The storage table originally had item_id TEXT without a FK, which prevented
-- PostgREST from auto-joining content_items. Added both the FK and a migration
-- note so the Supabase type generator picks it up next run.

ALTER TABLE storage
  ADD CONSTRAINT storage_item_id_fkey
  FOREIGN KEY (item_id) REFERENCES content_items(id) ON DELETE CASCADE;
