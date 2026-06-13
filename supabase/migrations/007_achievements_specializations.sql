-- Achievement System + Specialization System
-- Adds: content_achievements, player_achievements, achievement_counters
-- Adds: content_specializations, specialization fields to characters

-- ============================================
-- ACHIEVEMENT SYSTEM
-- ============================================

CREATE TABLE content_achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  reward_title TEXT,
  reward_permanent_bonus TEXT DEFAULT '{}',
  reward_bob_coins INTEGER NOT NULL DEFAULT 0,
  reward_gold INTEGER NOT NULL DEFAULT 0,
  reward_knowledge INTEGER NOT NULL DEFAULT 0,
  icon_path TEXT,
  rarity TEXT NOT NULL DEFAULT 'common',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE player_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES content_achievements(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP,
  claimed_at TIMESTAMP,
  UNIQUE(account_id, achievement_id)
);

CREATE TABLE achievement_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  counter_key TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  UNIQUE(account_id, counter_key)
);

-- ============================================
-- ATOMIC INCREMENT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION increment_counter(p_account_id UUID, p_key TEXT, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_new_value INTEGER;
BEGIN
  INSERT INTO achievement_counters (account_id, counter_key, value)
  VALUES (p_account_id, p_key, p_amount)
  ON CONFLICT (account_id, counter_key)
  DO UPDATE SET value = achievement_counters.value + p_amount
  RETURNING value INTO v_new_value;
  
  RETURN v_new_value;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SPECIALIZATION SYSTEM
-- ============================================

CREATE TABLE content_specializations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  primary_attribute TEXT NOT NULL,
  unlock_level INTEGER NOT NULL DEFAULT 10,
  icon_path TEXT,
  tier_1_bonus TEXT NOT NULL DEFAULT '{}',
  tier_2_bonus TEXT NOT NULL DEFAULT '{}',
  tier_3_bonus TEXT NOT NULL DEFAULT '{}',
  tier_4_bonus TEXT NOT NULL DEFAULT '{}',
  tier_5_bonus TEXT NOT NULL DEFAULT '{}'
);

ALTER TABLE characters ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS specialization_level INTEGER NOT NULL DEFAULT 1;

-- ============================================
-- SEED ACHIEVEMENTS
-- ============================================

INSERT INTO content_achievements (id, name, description, category, requirement_type, requirement_value, reward_title, reward_permanent_bonus, reward_bob_coins, reward_gold, rarity, sort_order) VALUES
-- GATHERING
('mine_100_stone', 'Rock Breaker', 'Mine 100 pieces of stone', 'gathering', 'mine_stone', 100, 'The Stonemason', '{"type":"mining_yield","value":0.05}', 10, 50, 'common', 1),
('mine_1000_stone', 'Stone Lord', 'Mine 1,000 pieces of stone', 'gathering', 'mine_stone', 1000, 'The Excavator', '{"type":"mining_yield","value":0.10}', 25, 200, 'rare', 2),
('catch_100_fish', 'Master Angler', 'Catch 100 fish', 'gathering', 'catch_fish', 100, 'The Fisher', '{"type":"fishing_yield","value":0.05}', 10, 50, 'common', 3),
('catch_1000_fish', 'Ocean King', 'Catch 1,000 fish', 'gathering', 'catch_fish', 1000, 'The Triton', '{"type":"fishing_yield","value":0.10}', 25, 200, 'rare', 4),
('chop_100_wood', 'Lumberjack', 'Chop 100 pieces of wood', 'gathering', 'chop_wood', 100, 'The Woodsman', '{"type":"woodcutting_yield","value":0.05}', 10, 50, 'common', 5),
('chop_1000_wood', 'Forest King', 'Chop 1,000 pieces of wood', 'gathering', 'chop_wood', 1000, 'The Druid', '{"type":"woodcutting_yield","value":0.10}', 25, 200, 'rare', 6),
('farm_100_crops', 'Green Thumb', 'Harvest 100 crops', 'gathering', 'farm_crops', 100, 'The Farmer', '{"type":"farming_yield","value":0.05}', 10, 50, 'common', 7),
('farm_1000_crops', 'Harvest Lord', 'Harvest 1,000 crops', 'gathering', 'farm_crops', 1000, 'The Harvester', '{"type":"farming_yield","value":0.10}', 25, 200, 'rare', 8),

-- EXPLORATION
('discover_10_relics', 'Relic Hunter', 'Discover 10 rare items', 'exploration', 'discover_rare', 10, 'The Archaeologist', '{"type":"discovery_chance","value":0.05}', 25, 100, 'uncommon', 9),
('discover_50_relics', 'Relic Master', 'Discover 50 rare items', 'exploration', 'discover_rare', 50, 'The Curator', '{"type":"discovery_chance","value":0.10}', 50, 500, 'epic', 10),
('find_first_mythic', 'Mythic Touch', 'Find your first mythic discovery', 'exploration', 'find_mythic', 1, 'The Chosen', '{"type":"mythic_weight","value":0.10}', 100, 1000, 'legendary', 11),
('explore_100_times', 'World Traveler', 'Complete 100 explorations', 'exploration', 'complete_exploration', 100, 'The Nomad', '{"type":"exploration_speed","value":0.05}', 30, 200, 'uncommon', 12),
('explore_500_times', 'Explorer Supreme', 'Complete 500 explorations', 'exploration', 'complete_exploration', 500, 'The Pioneer', '{"type":"exploration_speed","value":0.10}', 75, 1000, 'epic', 13),

-- CHARACTER
('create_4_chars', 'Full Roster', 'Create 4 characters', 'character', 'create_character', 4, 'The Squad', '{"type":"shared_storage_bonus","value":0.10}', 50, 0, 'epic', 14),
('reach_level_10', 'Apprentice', 'Reach character level 10', 'character', 'reach_level', 10, 'The Student', '{"type":"xp_bonus","value":0.05}', 15, 100, 'common', 15),
('reach_level_50', 'Veteran', 'Reach character level 50', 'character', 'reach_level', 50, 'The Veteran', '{"type":"xp_bonus","value":0.10}', 100, 1000, 'legendary', 16),
('spend_100_ap', 'Attribute Spender', 'Spend 100 attribute points', 'character', 'spend_attribute', 100, 'The Disciplined', '{"type":"attribute_efficiency","value":0.05}', 20, 200, 'uncommon', 17),

-- ECONOMY
('complete_10_contracts', 'First Deals', 'Complete 10 contracts', 'economy', 'complete_contract', 10, 'The Trader', '{"type":"contract_gold","value":0.05}', 10, 100, 'common', 18),
('complete_100_contracts', 'Contract King', 'Complete 100 contracts', 'economy', 'complete_contract', 100, 'The Merchant', '{"type":"contract_gold","value":0.10}', 50, 1000, 'epic', 19),
('complete_500_contracts', 'Contract Emperor', 'Complete 500 contracts', 'economy', 'complete_contract', 500, 'The Tycoon', '{"type":"contract_gold","value":0.15}', 100, 5000, 'mythic', 20),
('earn_1000_gold', 'Gold Digger', 'Earn 1,000 gold total', 'economy', 'earn_gold', 1000, 'The Prospector', '{"type":"gold_find","value":0.05}', 15, 0, 'common', 21),
('earn_10000_gold', 'Gold Baron', 'Earn 10,000 gold total', 'economy', 'earn_gold', 10000, 'The Magnate', '{"type":"gold_find","value":0.10}', 50, 0, 'epic', 22),
('spend_1000_gold', 'Big Spender', 'Spend 1,000 gold', 'economy', 'spend_gold', 1000, 'The Investor', '{"type":"vendor_discount","value":0.05}', 15, 0, 'uncommon', 23),

-- SOCIAL / LOGIN
('login_7_days', 'Dedicated', 'Login for 7 consecutive days', 'social', 'login_streak', 7, 'The Loyal', '{"type":"offline_bonus","value":0.05}', 30, 0, 'uncommon', 24),
('login_30_days', 'Committed', 'Login for 30 consecutive days', 'social', 'login_streak', 30, 'The Devoted', '{"type":"offline_bonus","value":0.10}', 100, 0, 'legendary', 25),
('collect_all_wood', 'Lumber Lord', 'Collect all wood-type items', 'gathering', 'collect_category', 5, 'The Forester', '{"type":"woodcutting_xp","value":0.10}', 15, 0, 'rare', 26),
('collect_all_mining', 'Ore Master', 'Collect all mining-type items', 'gathering', 'collect_category', 5, 'The Miner', '{"type":"mining_xp","value":0.10}', 15, 0, 'rare', 27);

-- ============================================
-- SEED SPECIALIZATIONS
-- ============================================

INSERT INTO content_specializations (id, name, description, primary_attribute, unlock_level, tier_1_bonus, tier_2_bonus, tier_3_bonus, tier_4_bonus, tier_5_bonus) VALUES
('path_strength', 'Path of the Titan', 'Crush mountains and bend steel. Your strength reshapes the world.', 'strength', 10,
  '{"type":"mining_xp","value":0.10,"label":"+10% Mining XP"}',
  '{"type":"ore_yield","value":0.05,"label":"+5% Ore Yield"}',
  '{"type":"mining_speed","value":0.10,"label":"+10% Mining Speed"}',
  '{"type":"crit_chance","value":0.05,"label":"+5% Critical Hit"}',
  '{"type":"double_ore","value":0.10,"label":"+10% Double Ore"}'),

('path_dexterity', 'Path of the Swift', 'Move faster than the wind. Your hands blur with impossible speed.', 'dexterity', 10,
  '{"type":"fishing_xp","value":0.10,"label":"+10% Fishing XP"}',
  '{"type":"action_speed","value":0.05,"label":"+5% All Action Speed"}',
  '{"type":"fishing_speed","value":0.10,"label":"+10% Fishing Speed"}',
  '{"type":"double_catch","value":0.05,"label":"+5% Double Catch"}',
  '{"type":"extra_queue","value":1,"label":"+1 Queue Slot"}'),

('path_intelligence', 'Path of the Sage', 'Knowledge is the ultimate weapon. You see patterns others miss.', 'intelligence', 10,
  '{"type":"research_xp","value":0.10,"label":"+10% Research XP"}',
  '{"type":"discovery_chance","value":0.05,"label":"+5% Discovery Chance"}',
  '{"type":"knowledge_gain","value":0.10,"label":"+10% Knowledge Gain"}',
  '{"type":"extra_roll","value":1,"label":"+1 Discovery Roll"}',
  '{"type":"rare_weight","value":0.10,"label":"+10% Rare Weight"}'),

('path_endurance', 'Path of the Mountain', 'Outlast any storm. You endure when others break.', 'endurance', 10,
  '{"type":"offline_efficiency","value":0.10,"label":"+10% Offline Efficiency"}',
  '{"type":"max_duration","value":0.05,"label":"+5% Max Duration"}',
  '{"type":"offline_speed","value":0.10,"label":"+10% Offline Speed"}',
  '{"type":"regen_bonus","value":0.05,"label":"+5% Recovery Bonus"}',
  '{"type":"extra_hours","value":2,"label":"+2 Offline Hours"}'),

('path_luck', 'Path of Fortune', 'Fortune favors you. Coins appear in your pockets, relics in your path.', 'luck', 10,
  '{"type":"discovery_chance","value":0.10,"label":"+10% Discovery Chance"}',
  '{"type":"contract_bonus","value":0.05,"label":"+5% Contract Bonus Chance"}',
  '{"type":"rare_bonus","value":0.10,"label":"+10% Rare Find Bonus"}',
  '{"type":"jackpot","value":0.02,"label":"+2% Jackpot Chance"}',
  '{"type":"daily_mult","value":0.15,"label":"+15% Daily Rewards"}'),

('path_charisma', 'Path of the Merchant King', 'Every deal favors you. Markets bend to your will.', 'charisma', 10,
  '{"type":"contract_reward","value":0.10,"label":"+10% Contract Rewards"}',
  '{"type":"market_profit","value":0.05,"label":"+5% Market Profit"}',
  '{"type":"vendor_discount","value":0.10,"label":"+10% Vendor Discount"}',
  '{"type":"extra_contract","value":1,"label":"+1 Daily Contract"}',
  '{"type":"faction_rep","value":0.10,"label":"+10% Faction Reputation"}');

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE content_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_specializations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_read" ON content_achievements FOR SELECT USING (true);
CREATE POLICY "content_read" ON content_specializations FOR SELECT USING (true);

CREATE POLICY "player_ach_own" ON player_achievements
  FOR ALL USING (account_id = auth.uid());

CREATE POLICY "counter_own" ON achievement_counters
  FOR ALL USING (account_id = auth.uid());
