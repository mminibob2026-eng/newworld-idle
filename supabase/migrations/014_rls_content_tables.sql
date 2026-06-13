-- Migration 014: Enable RLS on all content tables that have policies but RLS disabled
-- Fixes: policy_exists_rls_disabled and rls_disabled_in_public errors

-- Enable RLS on all content tables
ALTER TABLE content_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_profession_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_professions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_region_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_regions ENABLE ROW LEVEL SECURITY;

-- Ensure all have public read policy (drop first to avoid duplicates)
DROP POLICY IF EXISTS "content_read" ON content_contracts;
DROP POLICY IF EXISTS "content_read" ON content_discoveries;
DROP POLICY IF EXISTS "content_read" ON content_items;
DROP POLICY IF EXISTS "content_read" ON content_profession_rewards;
DROP POLICY IF EXISTS "content_read" ON content_professions;
DROP POLICY IF EXISTS "content_read" ON content_region_discoveries;
DROP POLICY IF EXISTS "content_read" ON content_regions;

CREATE POLICY "content_read" ON content_contracts FOR SELECT USING (true);
CREATE POLICY "content_read" ON content_discoveries FOR SELECT USING (true);
CREATE POLICY "content_read" ON content_items FOR SELECT USING (true);
CREATE POLICY "content_read" ON content_profession_rewards FOR SELECT USING (true);
CREATE POLICY "content_read" ON content_professions FOR SELECT USING (true);
CREATE POLICY "content_read" ON content_region_discoveries FOR SELECT USING (true);
CREATE POLICY "content_read" ON content_regions FOR SELECT USING (true);