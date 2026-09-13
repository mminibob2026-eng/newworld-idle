-- ============================================================
-- CLEAN SLATE: Drop all old data, fresh start for everyone
-- ============================================================

-- Drop all existing tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Re-enable auth
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Profiles (required by auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'zh')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can create own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Characters
CREATE TABLE new_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  origin_id TEXT NOT NULL DEFAULT 'middle',
  level INT NOT NULL DEFAULT 1,
  xp BIGINT NOT NULL DEFAULT 0,
  energy INT NOT NULL DEFAULT 100,
  energy_max INT NOT NULL DEFAULT 100,
  gold INT NOT NULL DEFAULT 100,
  strength INT NOT NULL DEFAULT 10,
  dexterity INT NOT NULL DEFAULT 10,
  intelligence INT NOT NULL DEFAULT 10,
  endurance INT NOT NULL DEFAULT 10,
  luck INT NOT NULL DEFAULT 10,
  charisma INT NOT NULL DEFAULT 10,
  stress INT NOT NULL DEFAULT 0,
  fatigue INT NOT NULL DEFAULT 0,
  stat_points INT NOT NULL DEFAULT 0,
  highest_education TEXT DEFAULT 'none',
  days_lived INT NOT NULL DEFAULT 0,
  last_recovery_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE new_characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own characters" ON new_characters FOR SELECT USING (auth.uid() = account_id);
CREATE POLICY "Users can create characters" ON new_characters FOR INSERT WITH CHECK (auth.uid() = account_id);
CREATE POLICY "Users can update own characters" ON new_characters FOR UPDATE USING (auth.uid() = account_id);
CREATE POLICY "Users can delete own characters" ON new_characters FOR DELETE USING (auth.uid() = account_id);

-- Skills reference
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read skills" ON skills FOR SELECT USING (true);

-- Character skills
CREATE TABLE character_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES new_characters(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL REFERENCES skills(id),
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(character_id, skill_id)
);

ALTER TABLE character_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own skills" ON character_skills FOR SELECT USING (character_id IN (SELECT id FROM new_characters WHERE account_id = auth.uid()));

-- Education stages reference
CREATE TABLE education_stages (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('active', 'passive')),
  prerequisite TEXT,
  description_zh TEXT,
  description_en TEXT,
  skill_reward TEXT
);

ALTER TABLE education_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read education" ON education_stages FOR SELECT USING (true);

-- Character education
CREATE TABLE character_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES new_characters(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL REFERENCES education_stages(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  progress INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE character_education ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own education" ON character_education FOR SELECT USING (character_id IN (SELECT id FROM new_characters WHERE account_id = auth.uid()));

-- Jobs reference
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  minimum_requirement TEXT,
  skill_requirement TEXT,
  energy_per_shift INT NOT NULL DEFAULT 20,
  income_tier TEXT NOT NULL DEFAULT 'low',
  main_skill TEXT NOT NULL,
  secondary_stat TEXT,
  income_base INT NOT NULL DEFAULT 100,
  shift_hours INT NOT NULL DEFAULT 8,
  level_required INT NOT NULL DEFAULT 1,
  description_zh TEXT,
  description_en TEXT
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read jobs" ON jobs FOR SELECT USING (true);

-- Character jobs
CREATE TABLE character_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES new_characters(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'working')),
  work_xp INT NOT NULL DEFAULT 0,
  job_level INT NOT NULL DEFAULT 1,
  days_worked INT NOT NULL DEFAULT 0,
  last_worked TIMESTAMPTZ,
  shift_start TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE character_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own jobs" ON character_jobs FOR SELECT USING (character_id IN (SELECT id FROM new_characters WHERE account_id = auth.uid()));

-- Adventures reference
CREATE TABLE adventures (
  id TEXT PRIMARY KEY,
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_zh TEXT,
  description_en TEXT,
  energy_cost INT NOT NULL DEFAULT 10,
  skill_id TEXT,
  level_required INT DEFAULT 1,
  skill_bonus TEXT DEFAULT 'perception',
  choices JSONB DEFAULT '[]'
);

ALTER TABLE adventures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read adventures" ON adventures FOR SELECT USING (true);

-- Character adventures
CREATE TABLE character_adventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES new_characters(id) ON DELETE CASCADE,
  adventure_id TEXT NOT NULL REFERENCES adventures(id),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'success', 'failed')),
  outcome JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE character_adventures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own adventures" ON character_adventures FOR SELECT USING (character_id IN (SELECT id FROM new_characters WHERE account_id = auth.uid()));

-- Parents
CREATE TABLE character_parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES new_characters(id) ON DELETE CASCADE,
  npc_name TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('father', 'mother')),
  occupation TEXT,
  personality TEXT,
  age_at_birth INT DEFAULT 25,
  current_age INT DEFAULT 25,
  loyalty INT DEFAULT 60,
  happiness INT DEFAULT 70,
  alive BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE character_parents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own parents" ON character_parents FOR SELECT USING (character_id IN (SELECT id FROM new_characters WHERE account_id = auth.uid()));

-- Partners
CREATE TABLE character_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES new_characters(id) ON DELETE CASCADE,
  npc_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'dating' CHECK (status IN ('dating', 'serious', 'engaged', 'married', 'former')),
  loyalty INT NOT NULL DEFAULT 50,
  happiness INT NOT NULL DEFAULT 60,
  met_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE character_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own partners" ON character_partners FOR SELECT USING (character_id IN (SELECT id FROM new_characters WHERE account_id = auth.uid()));

-- Pets
CREATE TABLE character_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES new_characters(id) ON DELETE CASCADE,
  breed_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'young' CHECK (status IN ('young', 'adult', 'senior', 'elderly', 'alive', 'deceased')),
  happiness INT NOT NULL DEFAULT 70,
  loyalty INT NOT NULL DEFAULT 60,
  energy INT NOT NULL DEFAULT 70,
  adopted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE character_pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own pets" ON character_pets FOR SELECT USING (character_id IN (SELECT id FROM new_characters WHERE account_id = auth.uid()));

-- Children
CREATE TABLE character_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES new_characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INT NOT NULL DEFAULT 0,
  health INT NOT NULL DEFAULT 100,
  intelligence INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE character_children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own children" ON character_children FOR SELECT USING (character_id IN (SELECT id FROM new_characters WHERE account_id = auth.uid()));

-- Friends
CREATE TABLE character_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES new_characters(id) ON DELETE CASCADE,
  npc_name TEXT NOT NULL,
  loyalty INT NOT NULL DEFAULT 50,
  met_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE character_friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own friends" ON character_friends FOR SELECT USING (character_id IN (SELECT id FROM new_characters WHERE account_id = auth.uid()));

-- Combat
CREATE TABLE character_combat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES new_characters(id) ON DELETE CASCADE,
  enemy_id TEXT NOT NULL,
  player_damage INT NOT NULL DEFAULT 0,
  enemy_damage INT NOT NULL DEFAULT 0,
  result TEXT NOT NULL CHECK (result IN ('victory', 'defeat')),
  xp_earned INT NOT NULL DEFAULT 0,
  gold_earned INT NOT NULL DEFAULT 0,
  fought_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE character_combat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own combat" ON character_combat FOR SELECT USING (character_id IN (SELECT id FROM new_characters WHERE account_id = auth.uid()));

-- Talents
CREATE TABLE character_talents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES new_characters(id) ON DELETE CASCADE,
  talent_id TEXT NOT NULL,
  revealed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE character_talents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own talents" ON character_talents FOR SELECT USING (character_id IN (SELECT id FROM new_characters WHERE account_id = auth.uid()));

-- Training
CREATE TABLE character_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES new_characters(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'training' CHECK (status IN ('training', 'completed')),
  xp_earned INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE character_training ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own training" ON character_training FOR SELECT USING (character_id IN (SELECT id FROM new_characters WHERE account_id = auth.uid()));

-- NPC definitions
CREATE TABLE npc_definitions (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  gender TEXT,
  personality TEXT,
  career TEXT,
  likes TEXT[],
  dislikes TEXT[],
  values TEXT[],
  life_goals TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE npc_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read npcs" ON npc_definitions FOR SELECT USING (true);

-- ========== SEED DATA ==========

-- Skills
INSERT INTO skills (id, name_zh, name_en, category) VALUES
  ('fitness', '健身', 'Fitness', 'physical'),
  ('striking', '打击', 'Striking', 'physical'),
  ('grappling', '摔跤', 'Grappling', 'physical'),
  ('driving', '驾驶', 'Driving', 'technical'),
  ('programming', '编程', 'Programming', 'technical'),
  ('cooking', '烹饪', 'Cooking', 'life'),
  ('management', '管理', 'Management', 'business'),
  ('engineering', '工程', 'Engineering', 'technical'),
  ('sales', '销售', 'Sales', 'business'),
  ('medical', '医学', 'Medical', 'knowledge'),
  ('science', '科学', 'Science', 'knowledge'),
  ('arts', '艺术', 'Arts', 'creative'),
  ('music', '音乐', 'Music', 'creative'),
  ('writing', '写作', 'Writing', 'creative'),
  ('perception', '感知', 'Perception', 'life');

-- Education stages
INSERT INTO education_stages (id, name_zh, name_en, mode, prerequisite, description_zh, description_en) VALUES
  ('primary', '小学', 'Primary School', 'active', NULL, '基础教育', 'Basic education'),
  ('junior_secondary', '初中', 'Junior Secondary', 'active', 'primary', '中级教育', 'Intermediate education'),
  ('senior_secondary', '高中', 'Senior Secondary', 'active', 'junior_secondary', '高级中等教育', 'Unlocks work'),
  ('diploma', '大专', 'Diploma', 'passive', 'senior_secondary', '大专学历', 'Flexible/unlimited'),
  ('bachelor', '学士学位', 'Bachelor Degree', 'passive', 'senior_secondary', '本科学历', 'Lifetime max 3'),
  ('master', '硕士学位', 'Master Degree', 'passive', 'bachelor', '硕士学历', 'Lifetime max 2'),
  ('phd', '博士学位', 'PhD', 'passive', 'master', '博士学历', 'Highest academic');

-- Jobs
INSERT INTO jobs (id, name_zh, name_en, minimum_requirement, skill_requirement, energy_per_shift, income_tier, main_skill, secondary_stat, income_base, shift_hours, level_required, description_zh, description_en) VALUES
  ('cleaner', '清洁工', 'Cleaner', 'junior_secondary', NULL, 20, 'low', 'fitness', 'END', 100, 8, 1, '最低门槛的工作', 'Lowest barrier to entry'),
  ('waiter', '服务员', 'Waiter', 'junior_secondary', NULL, 20, 'low_medium', 'sales', 'CHA', 150, 8, 1, '社交邂逅来源', 'Social encounter source'),
  ('kitchen_assistant', '厨房助手', 'Kitchen Assistant', 'junior_secondary', NULL, 20, 'low_medium', 'cooking', 'DEX', 150, 8, 1, '通向餐饮职业', 'Route toward food careers'),
  ('retail_assistant', '零售助理', 'Retail Assistant', 'junior_secondary', NULL, 20, 'low_medium', 'sales', 'CHA', 150, 8, 1, '销售技能入门', 'Entry point for Sales'),
  ('warehouse_worker', '仓库工人', 'Warehouse Worker', 'junior_secondary', NULL, 25, 'medium', 'fitness', 'STR', 200, 8, 3, '收入稳定', 'Steady income'),
  ('factory_operator', '工厂操作员', 'Factory Operator', 'junior_secondary', NULL, 25, 'medium', 'engineering', 'DEX', 200, 8, 3, '接触工程检查', 'Engineering checks'),
  ('admin_assistant', '行政助理', 'Admin Assistant', 'senior_secondary', NULL, 20, 'medium', 'management', 'INT', 200, 8, 5, '办公室职业起点', 'Office career entry'),
  ('customer_service', '客户服务', 'Customer Service', 'senior_secondary', NULL, 20, 'medium', 'sales', 'CHA', 200, 8, 5, '社交暴露高', 'High social exposure'),
  ('delivery_driver', '快递司机', 'Delivery Driver', 'senior_secondary', 'driving', 25, 'medium_high', 'driving', 'DEX', 250, 8, 8, '需要驾驶技能', 'Requires Driving skill'),
  ('junior_it_support', '初级IT支持', 'Junior IT Support', 'senior_secondary', 'programming', 25, 'medium_high', 'programming', 'INT', 250, 8, 10, '技术职业入门', 'Technical career entry');

-- Adventures
INSERT INTO adventures (id, title_zh, title_en, description_zh, description_en, energy_cost, skill_id, level_required, skill_bonus, choices) VALUES
  ('forest_walk', '森林散步', 'Forest Walk', '你走进附近的森林，阳光透过树叶洒落。突然，你听到远处传来奇怪的声音...', 'You walk into the nearby forest, sunlight filtering through the leaves. Suddenly, you hear strange sounds in the distance...', 10, 'perception', 1, 'perception', '[{"text_zh":"小心翼翼地前进","text_en":"Proceed carefully","successChance":70,"xp_reward":50},{"text_zh":"大声呼喊","text_en":"Call out loudly","successChance":30,"xp_reward":80},{"text_zh":"原路返回","text_en":"Turn back","successChance":95,"xp_reward":20}]'),
  ('abandoned_factory', '废弃工厂', 'Abandoned Factory', '你发现了一座废弃的工厂。门半开着，里面似乎有什么东西在闪烁...', 'You find an abandoned factory. The door is half open, and something seems to be flickering inside...', 10, 'perception', 3, 'perception', '[{"text_zh":"进入探索","text_en":"Enter and explore","successChance":50,"xp_reward":100},{"text_zh":"从窗户偷看","text_en":"Peek through windows","successChance":80,"xp_reward":40},{"text_zh":"离开","text_en":"Leave","successChance":95,"xp_reward":10}]'),
  ('river_fishing', '河边垂钓', 'River Fishing', '你来到一条清澈的河边。鱼儿在水中游动，似乎是个钓鱼的好地方...', 'You come to a clear river. Fish swimming in the water seem to make this a good fishing spot...', 10, 'fitness', 1, 'fitness', '[{"text_zh":"专心钓鱼","text_en":"Focus on fishing","successChance":60,"xp_reward":60},{"text_zh":"尝试抓鱼","text_en":"Try to catch fish by hand","successChance":40,"xp_reward":90},{"text_zh":"在河边休息","text_en":"Rest by the river","successChance":90,"xp_reward":30}]'),
  ('night_patrol', '夜间巡逻', 'Night Patrol', '夜晚的城市街道空荡荡的。你决定巡逻一圈，看看有没有什么异常...', 'The city streets are empty at night. You decide to patrol and check for anything unusual...', 10, 'charisma', 5, 'charisma', '[{"text_zh":"仔细检查每个角落","text_en":"Check every corner carefully","successChance":55,"xp_reward":80},{"text_zh":"快速巡逻","text_en":"Quick patrol","successChance":75,"xp_reward":40},{"text_zh":"找个地方躲起来观察","text_en":"Hide and observe","successChance":65,"xp_reward":60}]'),
  ('mountain_climb', '登山探险', 'Mountain Climb', '你决定攀登附近的一座小山。山路崎岖，但风景优美...', 'You decide to climb a nearby hill. The path is rugged but the scenery is beautiful...', 10, 'fitness', 2, 'fitness', '[{"text_zh":"走陡峭的捷径","text_en":"Take the steep shortcut","successChance":45,"xp_reward":100},{"text_zh":"沿着小路慢慢走","text_en":"Follow the trail slowly","successChance":85,"xp_reward":40},{"text_zh":"在半山腰休息","text_en":"Rest halfway","successChance":95,"xp_reward":20}]');

-- ========== RPC FUNCTIONS ==========

-- Spend energy
CREATE OR REPLACE FUNCTION spend_energy(p_character_id UUID, p_amount INT)
RETURNS JSONB AS $$
DECLARE
  v_energy INT;
BEGIN
  SELECT energy INTO v_energy FROM new_characters WHERE id = p_character_id;
  IF v_energy < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough energy');
  END IF;
  UPDATE new_characters SET energy = energy - p_amount WHERE id = p_character_id;
  RETURN jsonb_build_object('success', true, 'energy', v_energy - p_amount);
END;
$$ LANGUAGE plpgsql;

-- Recover energy
CREATE OR REPLACE FUNCTION recover_energy(p_character_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_char RECORD;
  v_recovered INT;
  v_new_energy INT;
BEGIN
  SELECT energy, energy_max, last_recovery_at INTO v_char FROM new_characters WHERE id = p_character_id;
  v_recovered := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - v_char.last_recovery_at)) / 300));
  v_new_energy := LEAST(v_char.energy_max, v_char.energy + v_recovered);
  UPDATE new_characters SET energy = v_new_energy, last_recovery_at = now() WHERE id = p_character_id;
  RETURN jsonb_build_object('success', true, 'energy', v_new_energy, 'recovered', v_recovered);
END;
$$ LANGUAGE plpgsql;

-- Add skill XP
CREATE OR REPLACE FUNCTION add_skill_xp(p_character_id UUID, p_skill_id TEXT, p_amount INT)
RETURNS JSONB AS $$
DECLARE
  v_existing RECORD;
  v_new_xp INT;
  v_new_level INT;
  v_xp_needed INT;
BEGIN
  SELECT * INTO v_existing FROM character_skills WHERE character_id = p_character_id AND skill_id = p_skill_id;
  IF v_existing IS NULL THEN
    INSERT INTO character_skills (character_id, skill_id, xp, level) VALUES (p_character_id, p_skill_id, p_amount, 1);
    RETURN jsonb_build_object('success', true, 'new_level', 1, 'leveled_up', true);
  END IF;
  v_new_xp := v_existing.xp + p_amount;
  v_xp_needed := v_existing.level * 500;
  v_new_level := v_existing.level;
  WHILE v_new_xp >= v_xp_needed LOOP
    v_new_xp := v_new_xp - v_xp_needed;
    v_new_level := v_new_level + 1;
    v_xp_needed := v_new_level * 500;
  END LOOP;
  UPDATE character_skills SET xp = v_new_xp, level = v_new_level WHERE id = v_existing.id;
  RETURN jsonb_build_object('success', true, 'new_level', v_new_level, 'leveled_up', v_new_level > v_existing.level);
END;
$$ LANGUAGE plpgsql;

-- Daily reset
CREATE OR REPLACE FUNCTION daily_reset(p_character_id UUID)
RETURNS JSONB AS $$
BEGIN
  UPDATE new_characters SET energy = 100 WHERE id = p_character_id;
  UPDATE character_jobs SET status = 'idle' WHERE character_id = p_character_id AND status = 'working';
  UPDATE character_training SET status = 'completed' WHERE character_id = p_character_id AND status = 'training';
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
