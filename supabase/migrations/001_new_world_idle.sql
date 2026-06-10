-- New World Idle - Database Schema
-- Migration 001: Core Tables + v0.1 Content
-- Follows Rule 4 (Database First), Rule 5 (No Hardcoded Values), Rule 6 (Data Driven)

-- ============================================================
-- PROFILES (accounts)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bob_coins INTEGER NOT NULL DEFAULT 0 CHECK (bob_coins >= 0),
  bob_pass BOOLEAN NOT NULL DEFAULT FALSE,
  bob_pass_lifetime BOOLEAN NOT NULL DEFAULT FALSE,
  reputation JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON profiles(username);

-- ============================================================
-- CHARACTERS (max 4 per account — Rule 13)
-- ============================================================
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  xp BIGINT NOT NULL DEFAULT 0 CHECK (xp >= 0),
  strength INTEGER NOT NULL DEFAULT 1 CHECK (strength >= 1),
  dexterity INTEGER NOT NULL DEFAULT 1 CHECK (dexterity >= 1),
  intelligence INTEGER NOT NULL DEFAULT 1 CHECK (intelligence >= 1),
  endurance INTEGER NOT NULL DEFAULT 1 CHECK (endurance >= 1),
  luck INTEGER NOT NULL DEFAULT 1 CHECK (luck >= 1),
  charisma INTEGER NOT NULL DEFAULT 1 CHECK (charisma >= 1),
  attribute_points INTEGER NOT NULL DEFAULT 5 CHECK (attribute_points >= 0),
  region TEXT NOT NULL DEFAULT 'green_plains',
  gold BIGINT NOT NULL DEFAULT 0 CHECK (gold >= 0),
  knowledge BIGINT NOT NULL DEFAULT 0 CHECK (knowledge >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, name)
);

CREATE INDEX idx_characters_account ON characters(account_id);

-- ============================================================
-- SHARED STORAGE (account-wide — Rule 12)
-- ============================================================
CREATE TABLE storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity BIGINT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, item_type, item_id)
);

CREATE INDEX idx_storage_account ON storage(account_id);
CREATE INDEX idx_storage_item ON storage(item_type, item_id);

-- ============================================================
-- PROFESSIONS (gathering & production)
-- ============================================================
CREATE TABLE professions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  profession TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  xp BIGINT NOT NULL DEFAULT 0 CHECK (xp >= 0),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  finish_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(character_id, profession)
);

CREATE INDEX idx_professions_character ON professions(character_id);
CREATE INDEX idx_professions_active ON professions(character_id, is_active) WHERE is_active = TRUE;

-- ============================================================
-- EXPLORATION
-- ============================================================
CREATE TABLE exploration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  region TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finish_at TIMESTAMPTZ NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  discoveries JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exploration_character ON exploration(character_id);
CREATE INDEX idx_exploration_active ON exploration(character_id, completed) WHERE completed = FALSE;

-- ============================================================
-- CONTRACTS
-- ============================================================
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL,
  requirement_item TEXT NOT NULL,
  requirement_qty INTEGER NOT NULL CHECK (requirement_qty > 0),
  reward_gold INTEGER NOT NULL DEFAULT 0 CHECK (reward_gold >= 0),
  reward_knowledge INTEGER NOT NULL DEFAULT 0 CHECK (reward_knowledge >= 0),
  reward_reputation TEXT,
  faction TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_contracts_character ON contracts(character_id);
CREATE INDEX idx_contracts_available ON contracts(character_id, completed) WHERE completed = FALSE;

-- ============================================================
-- RESEARCH (v0.2 system, schema reserved)
-- ============================================================
CREATE TABLE research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  technology TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0),
  started_at TIMESTAMPTZ,
  finish_at TIMESTAMPTZ,
  UNIQUE(character_id, technology)
);

CREATE INDEX idx_research_character ON research(character_id);

-- ============================================================
-- GAME LOG (Rule 17)
-- ============================================================
CREATE TABLE game_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_logs_account ON game_logs(account_id);
CREATE INDEX idx_logs_created ON game_logs(created_at DESC);

-- ============================================================
-- DATA-DRIVEN CONTENT TABLES (Rule 6)
-- ============================================================

-- ITEMS
CREATE TABLE content_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL DEFAULT '',
  rarity TEXT NOT NULL DEFAULT 'common',
  icon_path TEXT NOT NULL DEFAULT '/assets/items/placeholder.png',
  base_value INTEGER NOT NULL DEFAULT 1 CHECK (base_value >= 0),
  tier INTEGER NOT NULL DEFAULT 1 CHECK (tier >= 1),
  is_tradeable BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_items_category ON content_items(category);
CREATE INDEX idx_items_rarity ON content_items(rarity);

-- PROFESSIONS DATA
CREATE TABLE content_professions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon_path TEXT NOT NULL DEFAULT '/assets/professions/placeholder.png',
  base_xp_per_action INTEGER NOT NULL DEFAULT 5,
  base_time_seconds INTEGER NOT NULL DEFAULT 10,
  unlocks_at_level INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_professions_category ON content_professions(category);

-- PROFESSION REWARDS (what each profession yields)
CREATE TABLE content_profession_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profession_id TEXT NOT NULL REFERENCES content_professions(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  min_qty INTEGER NOT NULL DEFAULT 1 CHECK (min_qty >= 1),
  max_qty INTEGER NOT NULL DEFAULT 1 CHECK (max_qty >= 1),
  weight INTEGER NOT NULL DEFAULT 100 CHECK (weight > 0),
  min_level INTEGER NOT NULL DEFAULT 1,
  UNIQUE(profession_id, item_id, min_level)
);

-- REGIONS
CREATE TABLE content_regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_path TEXT NOT NULL DEFAULT '/assets/regions/placeholder.png',
  required_level INTEGER NOT NULL DEFAULT 1,
  unlock_cost_gold INTEGER NOT NULL DEFAULT 0,
  exploration_base_time INTEGER NOT NULL DEFAULT 60
);

-- DISCOVERIES
CREATE TABLE content_discoveries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  icon_path TEXT NOT NULL DEFAULT '/assets/discoveries/placeholder.png',
  category TEXT NOT NULL DEFAULT 'misc',
  base_value INTEGER NOT NULL DEFAULT 0,
  effect_type TEXT,
  effect_value TEXT
);

CREATE INDEX idx_discoveries_rarity ON content_discoveries(rarity);

-- REGION DISCOVERIES (which discoveries can be found in which regions)
CREATE TABLE content_region_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id TEXT NOT NULL REFERENCES content_regions(id) ON DELETE CASCADE,
  discovery_id TEXT NOT NULL REFERENCES content_discoveries(id) ON DELETE CASCADE,
  weight INTEGER NOT NULL DEFAULT 100 CHECK (weight > 0),
  min_exploration_level INTEGER NOT NULL DEFAULT 1,
  UNIQUE(region_id, discovery_id)
);

-- CONTRACTS DATA (template-based contracts)
CREATE TABLE content_contracts (
  id TEXT PRIMARY KEY,
  contract_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirement_item TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  min_qty INTEGER NOT NULL DEFAULT 10,
  max_qty INTEGER NOT NULL DEFAULT 50,
  gold_reward_per_unit INTEGER NOT NULL DEFAULT 1,
  knowledge_reward INTEGER NOT NULL DEFAULT 0,
  faction TEXT NOT NULL,
  min_level INTEGER NOT NULL DEFAULT 1
);

-- ============================================================
-- SEED DATA: REGIONS
-- ============================================================
INSERT INTO content_regions (id, name, description, required_level, unlock_cost_gold, exploration_base_time) VALUES
  ('green_plains', 'Green Plains', 'A peaceful grassland with gentle rivers and abundant wildlife.', 1, 0, 30),
  ('whisper_forest', 'Whisper Forest', 'A dense forest where the trees seem to whisper ancient secrets.', 5, 500, 60),
  ('rocky_highlands', 'Rocky Highlands', 'Treacherous rocky terrain rich with minerals and hardy creatures.', 10, 2000, 90),
  ('crystal_lake', 'Crystal Lake', 'A serene lake with crystal-clear waters hiding mysterious depths.', 15, 5000, 120),
  ('red_desert', 'Red Desert', 'A vast desert of red sand, home to rare heat-forged resources.', 20, 10000, 150);

-- ============================================================
-- SEED DATA: ITEMS
-- ============================================================
INSERT INTO content_items (id, name, description, category, subcategory, rarity, base_value, tier) VALUES
  -- Wood
  ('wood', 'Wood', 'Basic timber from trees.', 'gathering', 'wood', 'common', 1, 1),
  ('rare_wood', 'Rare Wood', 'High-quality timber with a beautiful grain.', 'gathering', 'wood', 'uncommon', 5, 2),
  ('ancient_bark', 'Ancient Bark', 'Bark from a tree that has stood for millennia.', 'gathering', 'wood', 'rare', 25, 3),
  -- Mining
  ('stone', 'Stone', 'Common building stone.', 'gathering', 'mining', 'common', 1, 1),
  ('copper_ore', 'Copper Ore', 'Ore containing copper.', 'gathering', 'mining', 'common', 2, 1),
  ('iron_ore', 'Iron Ore', 'Ore containing iron.', 'gathering', 'mining', 'uncommon', 4, 2),
  ('rare_gems', 'Rare Gems', 'Precious gems found deep underground.', 'gathering', 'mining', 'rare', 30, 3),
  -- Fishing
  ('fish', 'Fish', 'Common freshwater fish.', 'gathering', 'fishing', 'common', 1, 1),
  ('golden_fish', 'Golden Fish', 'A rare fish with shimmering golden scales.', 'gathering', 'fishing', 'rare', 20, 2),
  ('treasure', 'Treasure', 'A waterlogged treasure chest!', 'gathering', 'fishing', 'uncommon', 15, 2),
  -- Farming
  ('food', 'Food', 'Basic provisions.', 'gathering', 'farming', 'common', 1, 1),
  ('herbs', 'Herbs', 'Aromatic herbs used in alchemy.', 'gathering', 'farming', 'common', 2, 1),
  ('special_crops', 'Special Crops', 'Rare crops with unique properties.', 'gathering', 'farming', 'uncommon', 8, 2),
  -- Crafted
  ('tools', 'Tools', 'Handy tools for various tasks.', 'production', 'crafting', 'common', 5, 1),
  ('equipment', 'Equipment', 'Sturdy gear for adventuring.', 'production', 'crafting', 'uncommon', 15, 2),
  ('components', 'Components', 'Intricate mechanical components.', 'production', 'crafting', 'rare', 40, 3),
  -- Cooked
  ('cooked_food', 'Cooked Food', 'A hearty meal that buffs your stats.', 'production', 'cooking', 'common', 8, 1),
  ('trade_goods', 'Trade Goods', 'Valuable goods sought by merchants.', 'production', 'cooking', 'uncommon', 20, 2),
  -- Alchemy
  ('potions', 'Potions', 'Restorative and enhancement potions.', 'production', 'alchemy', 'common', 10, 1),
  ('enhancement_items', 'Enhancement Items', 'Rare items that permanently enhance abilities.', 'production', 'alchemy', 'rare', 50, 3),
  -- Discoveries
  ('ancient_coin', 'Ancient Coin', 'A coin from a forgotten civilization.', 'discovery', 'relic', 'rare', 100, 1),
  ('mysterious_egg', 'Mysterious Egg', 'An egg of unknown origin. It pulses with warmth.', 'discovery', 'creature', 'epic', 200, 1),
  ('lost_journal', 'Lost Journal', 'A journal filled with cryptic writings.', 'discovery', 'knowledge', 'uncommon', 50, 1),
  ('broken_compass', 'Broken Compass', 'A compass that points somewhere unknown.', 'discovery', 'relic', 'rare', 75, 1),
  ('strange_crystal', 'Strange Crystal', 'A crystal that hums with an otherworldly energy.', 'discovery', 'relic', 'epic', 300, 1);

-- ============================================================
-- SEED DATA: PROFESSIONS
-- ============================================================
INSERT INTO content_professions (id, name, description, category, base_xp_per_action, base_time_seconds, unlocks_at_level) VALUES
  ('woodcutting', 'Woodcutting', 'Chop wood from trees in the region.', 'gathering', 5, 10, 1),
  ('mining', 'Mining', 'Mine stone and ores from the earth.', 'gathering', 5, 12, 1),
  ('fishing', 'Fishing', 'Cast your line into nearby waters.', 'gathering', 6, 15, 1),
  ('farming', 'Farming', 'Cultivate crops and tend the land.', 'gathering', 4, 8, 1),
  ('crafting', 'Crafting', 'Create tools, equipment, and components.', 'production', 8, 20, 1),
  ('cooking', 'Cooking', 'Prepare meals and trade goods.', 'production', 7, 15, 1),
  ('alchemy', 'Alchemy', 'Brew potions and enhancement items.', 'production', 10, 25, 1);

-- ============================================================
-- SEED DATA: PROFESSION REWARDS
-- ============================================================
-- Woodcutting
INSERT INTO content_profession_rewards (profession_id, item_id, min_qty, max_qty, weight, min_level) VALUES
  ('woodcutting', 'wood', 1, 3, 100, 1),
  ('woodcutting', 'rare_wood', 1, 1, 10, 10),
  ('woodcutting', 'ancient_bark', 1, 1, 2, 25);

-- Mining
INSERT INTO content_profession_rewards (profession_id, item_id, min_qty, max_qty, weight, min_level) VALUES
  ('mining', 'stone', 1, 3, 100, 1),
  ('mining', 'copper_ore', 1, 2, 70, 1),
  ('mining', 'iron_ore', 1, 1, 30, 10),
  ('mining', 'rare_gems', 1, 1, 5, 20);

-- Fishing
INSERT INTO content_profession_rewards (profession_id, item_id, min_qty, max_qty, weight, min_level) VALUES
  ('fishing', 'fish', 1, 3, 100, 1),
  ('fishing', 'treasure', 1, 1, 5, 5),
  ('fishing', 'golden_fish', 1, 1, 2, 15);

-- Farming
INSERT INTO content_profession_rewards (profession_id, item_id, min_qty, max_qty, weight, min_level) VALUES
  ('farming', 'food', 2, 5, 100, 1),
  ('farming', 'herbs', 1, 2, 40, 1),
  ('farming', 'special_crops', 1, 1, 15, 10);

-- ============================================================
-- SEED DATA: DISCOVERIES
-- ============================================================
INSERT INTO content_discoveries (id, name, description, rarity, category, base_value) VALUES
  ('pretty_rock', 'Pretty Rock', 'A smooth, polished rock. Not valuable, but pleasing.', 'common', 'misc', 1),
  ('shiny_button', 'Shiny Button', 'A small, shiny button. What could it be from?', 'common', 'misc', 1),
  ('old_coin', 'Old Coin', 'A worn coin, barely legible.', 'uncommon', 'relic', 10),
  ('ancient_coin_disc', 'Ancient Coin', 'A coin from a forgotten civilization.', 'rare', 'relic', 100),
  ('mysterious_egg_disc', 'Mysterious Egg', 'An egg of unknown origin. It pulses with warmth.', 'epic', 'creature', 200),
  ('strange_crystal_disc', 'Strange Crystal', 'A crystal that hums with otherworldly energy.', 'epic', 'relic', 300),
  ('golden_feather', 'Golden Feather', 'A feather that seems to be made of pure gold.', 'rare', 'misc', 75),
  ('ancient_relic', 'Ancient Relic', 'A relic pulsing with ancient power.', 'legendary', 'relic', 500),
  ('primordial_orb', 'Primordial Orb', 'An orb containing the essence of creation itself.', 'mythic', 'relic', 2000);

INSERT INTO content_region_discoveries (region_id, discovery_id, weight, min_exploration_level) VALUES
  ('green_plains', 'pretty_rock', 100, 1),
  ('green_plains', 'shiny_button', 80, 1),
  ('green_plains', 'old_coin', 20, 3),
  ('whisper_forest', 'pretty_rock', 60, 1),
  ('whisper_forest', 'old_coin', 40, 1),
  ('whisper_forest', 'ancient_coin_disc', 10, 5),
  ('whisper_forest', 'golden_feather', 5, 10),
  ('rocky_highlands', 'old_coin', 50, 1),
  ('rocky_highlands', 'ancient_coin_disc', 15, 3),
  ('rocky_highlands', 'strange_crystal_disc', 5, 10),
  ('crystal_lake', 'ancient_coin_disc', 25, 1),
  ('crystal_lake', 'strange_crystal_disc', 10, 5),
  ('crystal_lake', 'mysterious_egg_disc', 3, 15),
  ('red_desert', 'old_coin', 40, 1),
  ('red_desert', 'ancient_coin_disc', 20, 3),
  ('red_desert', 'golden_feather', 8, 5),
  ('red_desert', 'ancient_relic', 2, 20),
  ('red_desert', 'primordial_orb', 1, 30);

-- ============================================================
-- SEED DATA: CONTRACT TEMPLATES
-- ============================================================
INSERT INTO content_contracts (id, contract_type, title, description, requirement_item, min_qty, max_qty, gold_reward_per_unit, knowledge_reward, faction, min_level) VALUES
  ('wood_supply_1', 'delivery', 'Wood Supply', 'The carpenters need wood for construction.', 'wood', 50, 200, 2, 5, 'merchants_guild', 1),
  ('stone_supply_1', 'delivery', 'Stone Delivery', 'Builders require stone for the new road.', 'stone', 50, 200, 2, 5, 'merchants_guild', 1),
  ('fish_order_1', 'delivery', 'Fish Order', 'The innkeeper needs fresh fish.', 'fish', 30, 100, 3, 8, 'merchants_guild', 1),
  ('copper_order_1', 'delivery', 'Copper Rush', 'The smithy needs copper ore.', 'copper_ore', 20, 100, 3, 10, 'merchants_guild', 3),
  ('iron_order_1', 'delivery', 'Iron Requisition', 'Armorers require iron ore.', 'iron_ore', 20, 80, 5, 15, 'merchants_guild', 10),
  ('herb_supply_1', 'delivery', 'Herb Gathering', 'The alchemist needs fresh herbs.', 'herbs', 20, 100, 3, 8, 'scholars_society', 1),
  ('food_supply_1', 'delivery', 'Food Provisions', 'Feed the frontier outpost.', 'food', 100, 500, 1, 3, 'frontier_council', 1),
  ('tools_order_1', 'delivery', 'Tool Request', 'Miners need new tools.', 'tools', 10, 50, 8, 20, 'merchants_guild', 5);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE professions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exploration ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE research ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_logs ENABLE ROW LEVEL SECURITY;

-- Profile: user can read/update own profile
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Characters: user can manage own characters
CREATE POLICY "characters_own" ON characters
  FOR ALL USING (account_id = auth.uid()) WITH CHECK (account_id = auth.uid());

-- Storage: user can manage own storage
CREATE POLICY "storage_own" ON storage
  FOR ALL USING (account_id = auth.uid()) WITH CHECK (account_id = auth.uid());

-- Professions: through character ownership
CREATE POLICY "professions_own" ON professions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM characters WHERE characters.id = professions.character_id AND characters.account_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM characters WHERE characters.id = professions.character_id AND characters.account_id = auth.uid())
  );

-- Exploration: through character
CREATE POLICY "exploration_own" ON exploration
  FOR ALL USING (
    EXISTS (SELECT 1 FROM characters WHERE characters.id = exploration.character_id AND characters.account_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM characters WHERE characters.id = exploration.character_id AND characters.account_id = auth.uid())
  );

-- Contracts: through character
CREATE POLICY "contracts_own" ON contracts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM characters WHERE characters.id = contracts.character_id AND characters.account_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM characters WHERE characters.id = contracts.character_id AND characters.account_id = auth.uid())
  );

-- Research: through character
CREATE POLICY "research_own" ON research
  FOR ALL USING (
    EXISTS (SELECT 1 FROM characters WHERE characters.id = research.character_id AND characters.account_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM characters WHERE characters.id = research.character_id AND characters.account_id = auth.uid())
  );

-- Game logs: user can read own logs
CREATE POLICY "logs_own" ON game_logs
  FOR INSERT WITH CHECK (account_id = auth.uid());
CREATE POLICY "logs_read" ON game_logs
  FOR SELECT USING (account_id = auth.uid());

-- Content tables: public read for all authenticated users
CREATE POLICY "content_read" ON content_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "content_read" ON content_professions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "content_read" ON content_profession_rewards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "content_read" ON content_regions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "content_read" ON content_discoveries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "content_read" ON content_region_discoveries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "content_read" ON content_contracts FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- FUNCTIONS: XP CALCULATION (Rule 5 — data-driven, not hardcoded)
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_xp_for_level(level INTEGER)
RETURNS BIGINT AS $$
BEGIN
  RETURN FLOOR(100 * POWER(level, 1.5))::BIGINT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- FUNCTION: Process offline profession progress (Rule 11)
-- ============================================================
CREATE OR REPLACE FUNCTION process_offline_activity(
  p_character_id UUID,
  p_profession TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_profession_record professions%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
  v_elapsed_seconds INTEGER;
  v_base_time INTEGER;
  v_actions INTEGER;
  v_xp_gained BIGINT := 0;
  v_rewards JSONB := '[]'::jsonb;
  v_prof_data content_professions%ROWTYPE;
  v_reward_recs RECORD;
  v_item_id TEXT;
  v_qty INTEGER;
  v_total_weight INTEGER;
  v_roll INTEGER;
  v_cumulative INTEGER;
BEGIN
  SELECT * INTO v_profession_record FROM professions
    WHERE professions.character_id = p_character_id AND profession = p_profession
    FOR UPDATE;
  
  IF NOT FOUND OR NOT v_profession_record.is_active THEN
    RETURN jsonb_build_object('error', 'Not active');
  END IF;
  
  IF v_profession_record.finish_at IS NULL OR v_profession_record.finish_at > v_now THEN
    RETURN jsonb_build_object('error', 'Still in progress');
  END IF;
  
  v_elapsed_seconds := EXTRACT(EPOCH FROM (v_now - v_profession_record.started_at))::INTEGER;
  
  SELECT * INTO v_prof_data FROM content_professions WHERE id = p_profession;
  v_base_time := v_prof_data.base_time_seconds;
  v_actions := v_elapsed_seconds / v_base_time;
  
  IF v_actions <= 0 THEN
    RETURN jsonb_build_object('error', 'No time elapsed');
  END IF;
  
  -- Cap actions (Rule 11: 24h minimum offline cap)
  IF v_actions > (24 * 3600 / v_base_time) THEN
    v_actions := 24 * 3600 / v_base_time;
  END IF;
  
  -- Calculate XP
  v_xp_gained := v_actions * v_prof_data.base_xp_per_action;
  
  -- Generate rewards
  FOR i IN 1..v_actions LOOP
    SELECT SUM(weight) INTO v_total_weight 
      FROM content_profession_rewards 
      WHERE profession_id = p_profession 
        AND min_level <= v_profession_record.level;
    
    v_roll := FLOOR(RANDOM() * v_total_weight)::INTEGER;
    v_cumulative := 0;
    
    FOR v_reward_recs IN 
      SELECT * FROM content_profession_rewards 
      WHERE profession_id = p_profession 
        AND min_level <= v_profession_record.level 
      ORDER BY min_level ASC, weight DESC
    LOOP
      v_cumulative := v_cumulative + v_reward_recs.weight;
      IF v_roll < v_cumulative THEN
        v_item_id := v_reward_recs.item_id;
        v_qty := FLOOR(RANDOM() * (v_reward_recs.max_qty - v_reward_recs.min_qty + 1))::INTEGER + v_reward_recs.min_qty;
        v_rewards := v_rewards || jsonb_build_object('item', v_item_id, 'qty', v_qty);
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Update profession
  UPDATE professions SET 
    level = v_profession_record.level + FLOOR((v_profession_record.xp + v_xp_gained) / calculate_xp_for_level(v_profession_record.level))::INTEGER,
    xp = (v_profession_record.xp + v_xp_gained) % calculate_xp_for_level(v_profession_record.level),
    is_active = FALSE,
    started_at = NULL,
    finish_at = NULL
  WHERE id = v_profession_record.id;
  
  -- Store rewards in storage
  -- (Handled by application layer to aggregate)
  
  RETURN jsonb_build_object(
    'actions', v_actions,
    'xp_gained', v_xp_gained,
    'rewards', v_rewards,
    'elapsed_seconds', v_elapsed_seconds
  );
END;
$$ LANGUAGE plpgsql;
