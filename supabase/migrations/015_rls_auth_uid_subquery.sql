-- Migration 015: Fix auth_rls_initplan performance warnings
-- Wrap auth.uid() in subquery to prevent per-row re-evaluation
-- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- profiles (uses 'id' not 'account_id')
DROP POLICY IF EXISTS "profiles_own" ON profiles;
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (id = (select auth.uid()));

-- characters
DROP POLICY IF EXISTS "characters_own" ON characters;
CREATE POLICY "characters_own" ON characters FOR ALL USING (account_id = (select auth.uid()));

-- storage
DROP POLICY IF EXISTS "storage_own" ON storage;
CREATE POLICY "storage_own" ON storage FOR ALL USING (account_id = (select auth.uid()));

-- professions
DROP POLICY IF EXISTS "professions_own" ON professions;
CREATE POLICY "professions_own" ON professions FOR ALL USING (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));

-- exploration
DROP POLICY IF EXISTS "exploration_own" ON exploration;
CREATE POLICY "exploration_own" ON exploration FOR ALL USING (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));

-- contracts
DROP POLICY IF EXISTS "contracts_own" ON contracts;
CREATE POLICY "contracts_own" ON contracts FOR ALL USING (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));

-- achievement_counters
DROP POLICY IF EXISTS "counter_own" ON achievement_counters;
CREATE POLICY "counter_own" ON achievement_counters FOR ALL USING (account_id = (select auth.uid()));

-- research
DROP POLICY IF EXISTS "research_own" ON research;
CREATE POLICY "research_own" ON research FOR ALL USING (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));

-- game_logs
DROP POLICY IF EXISTS "logs_own" ON game_logs;
DROP POLICY IF EXISTS "logs_read" ON game_logs;
CREATE POLICY "logs_own" ON game_logs FOR ALL USING (account_id = (select auth.uid()));
CREATE POLICY "logs_read" ON game_logs FOR SELECT USING (account_id = (select auth.uid()));

-- character_inventory
DROP POLICY IF EXISTS "char_inv_own" ON character_inventory;
CREATE POLICY "char_inv_own" ON character_inventory FOR ALL USING (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));

-- player_discoveries
DROP POLICY IF EXISTS "player_disc_own" ON player_discoveries;
CREATE POLICY "player_disc_own" ON player_discoveries FOR ALL USING (account_id = (select auth.uid()));

-- player_achievements
DROP POLICY IF EXISTS "player_ach_own" ON player_achievements;
CREATE POLICY "player_ach_own" ON player_achievements FOR ALL USING (account_id = (select auth.uid()));