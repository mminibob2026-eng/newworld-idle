-- ============================================================
-- NEW WORLD — Complete Schema Rewrite v2.0
-- Based on Canonical Game Design Data v1.1
-- ============================================================
-- This migration drops ALL old game tables and creates the new
-- persistent life simulation schema.
-- ============================================================

-- ========== CLEANUP: Drop old game tables ==========
-- Keep profiles, game_logs (will be altered), storage (will be dropped)
-- Drop in dependency order

DROP TABLE IF EXISTS content_achievements CASCADE;
DROP TABLE IF EXISTS player_achievements CASCADE;
DROP TABLE IF EXISTS achievement_counters CASCADE;
DROP TABLE IF EXISTS content_specializations CASCADE;
DROP TABLE IF EXISTS content_profession_rewards CASCADE;
DROP TABLE IF EXISTS content_professions CASCADE;
DROP TABLE IF EXISTS content_region_discoveries CASCADE;
DROP TABLE IF EXISTS content_regions CASCADE;
DROP TABLE IF EXISTS content_discoveries CASCADE;
DROP TABLE IF EXISTS content_contracts CASCADE;
DROP TABLE IF EXISTS content_items CASCADE;
DROP TABLE IF EXISTS player_discoveries CASCADE;
DROP TABLE IF EXISTS character_inventory CASCADE;
DROP TABLE IF EXISTS professions CASCADE;
DROP TABLE IF EXISTS exploration CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS storage CASCADE;
DROP TABLE IF EXISTS research CASCADE;

-- ========== EXTEND PROFILES ==========

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'zh'));

-- ========== RECREATE CHARACTERS ==========

DROP TABLE IF EXISTS characters CASCADE;

CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  origin_id TEXT NOT NULL DEFAULT 'middle',
  current_world TEXT NOT NULL DEFAULT 'modern' CHECK (current_world IN ('modern', 'ancient', 'mythic')),
  level INT NOT NULL DEFAULT 1,
  xp BIGINT NOT NULL DEFAULT 0,
  days_lived INT NOT NULL DEFAULT 0,
  life_stage TEXT NOT NULL DEFAULT 'child' CHECK (life_stage IN ('baby','child','teen','young_adult','adult','senior')),

  -- Personal Stats
  strength INT NOT NULL DEFAULT 1,
  dexterity INT NOT NULL DEFAULT 1,
  intelligence INT NOT NULL DEFAULT 1,
  endurance INT NOT NULL DEFAULT 1,
  luck INT NOT NULL DEFAULT 1,
  charisma INT NOT NULL DEFAULT 1,
  stat_points INT NOT NULL DEFAULT 5,

  -- Energy & Vitals
  energy INT NOT NULL DEFAULT 100,
  energy_max INT NOT NULL DEFAULT 100,
  energy_last_recovery_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  stress INT NOT NULL DEFAULT 0,
  fatigue INT NOT NULL DEFAULT 0,
  wellbeing INT NOT NULL DEFAULT 50,

  -- Economy
  gold BIGINT NOT NULL DEFAULT 0,
  knowledge BIGINT NOT NULL DEFAULT 0,

  -- Education
  highest_education TEXT NOT NULL DEFAULT 'none',
  active_education TEXT,
  active_education_started_at TIMESTAMPTZ,
  passive_education TEXT,
  passive_education_started_at TIMESTAMPTZ,

  -- Work
  active_job TEXT,
  work_xp BIGINT NOT NULL DEFAULT 0,
  contracts_completed_today INT NOT NULL DEFAULT 0,
  contracts_reset_date DATE,

  -- Talent
  talent_1 TEXT,
  talent_1_revealed_at TIMESTAMPTZ,
  talent_2 TEXT,
  talent_2_revealed_at TIMESTAMPTZ,
  permanent_talent TEXT,
  talent_grace_until TIMESTAMPTZ,

  -- Specialization (kept for future)
  specialization TEXT,
  specialization_level INT NOT NULL DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(account_id, name)
);

CREATE INDEX idx_characters_account ON characters(account_id);

-- ========== CHARACTER SKILLS (15 per character) ==========

CREATE TABLE character_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  level INT NOT NULL DEFAULT 0,
  xp BIGINT NOT NULL DEFAULT 0,
  mastery_completed BOOLEAN NOT NULL DEFAULT FALSE,
  -- Daily efficiency tracking
  daily_study_count INT NOT NULL DEFAULT 0,
  daily_reset_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(character_id, skill_id)
);

CREATE INDEX idx_character_skills_char ON character_skills(character_id);

-- ========== EDUCATION PROGRAMS ==========

CREATE TABLE content_education_programs (
  id TEXT PRIMARY KEY,
  stage TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_zh TEXT,
  description_en TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('active', 'passive')),
  duration_days INT,
  prerequisite_program TEXT,
  required_skill TEXT,
  required_skill_level INT,
  assessment_type TEXT,
  qualification_reward TEXT,
  learning_buff_value INT,
  learning_buff_days INT
);

-- ========== CHARACTER EDUCATION ENROLLMENTS ==========

CREATE TABLE character_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finish_at TIMESTAMPTZ,
  assessment_score INT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  qualification_earned TEXT,
  UNIQUE(character_id, program_id)
);

-- ========== JOBS ==========

CREATE TABLE content_jobs (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_zh TEXT,
  description_en TEXT,
  minimum_education TEXT,
  skill_requirement TEXT,
  energy_per_shift INT NOT NULL DEFAULT 20,
  income_base INT NOT NULL DEFAULT 100,
  income_tier TEXT NOT NULL DEFAULT 'low',
  main_skill TEXT,
  secondary_stat TEXT,
  promotion_1_title TEXT,
  promotion_1_req_work_xp INT,
  promotion_2_title TEXT,
  promotion_2_req_work_xp INT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ========== CHARACTER JOB HISTORY ==========

CREATE TABLE character_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  work_xp BIGINT NOT NULL DEFAULT 0,
  job_level INT NOT NULL DEFAULT 1,
  hired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(character_id, job_id)
);

CREATE INDEX idx_character_jobs_char ON character_jobs(character_id);

-- ========== TALENTS ==========

CREATE TABLE content_talents (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL,
  description_zh TEXT,
  description_en TEXT,
  buff_type TEXT,
  buff_value NUMERIC,
  buff_description TEXT
);

-- ========== ADVENTURES ==========

CREATE TABLE content_adventures (
  id TEXT PRIMARY KEY,
  outcome TEXT NOT NULL,
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_zh TEXT,
  description_en TEXT,
  energy_cost INT NOT NULL DEFAULT 10,
  skill_check_skill TEXT,
  skill_check_min_level INT,
  reward_type TEXT,
  reward_amount INT,
  life_event_flag BOOLEAN DEFAULT FALSE,
  weight INT NOT NULL DEFAULT 100,
  min_level INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ========== CHARACTER ADVENTURE LOG ==========

CREATE TABLE character_adventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  adventure_id TEXT NOT NULL,
  outcome TEXT NOT NULL,
  rewards JSONB DEFAULT '{}',
  skill_check_passed BOOLEAN,
  energy_spent INT NOT NULL DEFAULT 10,
  adventure_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_character_adventures_char ON character_adventures(character_id);

-- ========== RELATIONSHIPS (NPC) ==========

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
  relationship_preference TEXT,
  initial_age INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE npc_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  npc_id TEXT NOT NULL REFERENCES npc_definitions(id),
  stage TEXT NOT NULL DEFAULT 'stranger',
  bond INT NOT NULL DEFAULT 0,
  trust INT NOT NULL DEFAULT 0,
  strain INT NOT NULL DEFAULT 0,
  commitment INT NOT NULL DEFAULT 0,
  memories JSONB DEFAULT '[]',
  first_met_at TIMESTAMPTZ,
  first_met_location TEXT,
  is_close_friend BOOLEAN NOT NULL DEFAULT FALSE,
  close_friend_slot INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, npc_id)
);

CREATE INDEX idx_npc_rel_account ON npc_relationships(account_id);

-- ========== RELATIONSHIPS (Player-to-Player) ==========

CREATE TABLE player_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES profiles(id),
  stage TEXT NOT NULL DEFAULT 'stranger',
  bond INT NOT NULL DEFAULT 0,
  trust INT NOT NULL DEFAULT 0,
  strain INT NOT NULL DEFAULT 0,
  commitment INT NOT NULL DEFAULT 0,
  memories JSONB DEFAULT '[]',
  invitation_pending BOOLEAN DEFAULT FALSE,
  invited_by UUID,
  invited_at TIMESTAMPTZ,
  is_close_friend BOOLEAN NOT NULL DEFAULT FALSE,
  close_friend_slot INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, partner_id)
);

-- ========== PETS ==========

CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  personality TEXT,
  age_stage TEXT NOT NULL DEFAULT 'young',
  age_days INT NOT NULL DEFAULT 0,
  health INT NOT NULL DEFAULT 100,
  bond INT NOT NULL DEFAULT 50,
  adopted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  passed_at TIMESTAMPTZ,
  memories JSONB DEFAULT '[]'
);

CREATE INDEX idx_pets_account ON pets(account_id);

-- ========== FAMILY / CHILDREN ==========

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_type TEXT NOT NULL CHECK (member_type IN ('parent', 'child')),
  npc_id TEXT,
  player_id UUID REFERENCES profiles(id),
  name TEXT,
  age_stage TEXT,
  birth_date DATE,
  milestones JSONB DEFAULT '[]',
  is_alive BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== CLOSE FRIENDS ==========

CREATE TABLE close_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_type TEXT NOT NULL CHECK (friend_type IN ('npc', 'player')),
  npc_id TEXT,
  player_id UUID REFERENCES profiles(id),
  slot_number INT NOT NULL CHECK (slot_number BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, friend_type, slot_number)
);

-- ========== DAILY ACTIONS LOG ==========

CREATE TABLE daily_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  action_type TEXT NOT NULL,
  action_detail TEXT,
  energy_spent INT NOT NULL DEFAULT 0,
  xp_earned BIGINT DEFAULT 0,
  gold_earned BIGINT DEFAULT 0,
  skill_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(character_id, action_date, action_type, action_detail)
);

CREATE INDEX idx_daily_actions_char_date ON daily_actions(character_id, action_date);

-- ========== TRAINING SESSIONS ==========

CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  training_type TEXT NOT NULL CHECK (training_type IN ('fitness', 'striking', 'grappling')),
  energy_spent INT NOT NULL DEFAULT 0,
  stat_gains JSONB DEFAULT '{}',
  skill_xp_gained INT DEFAULT 0,
  trained_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== GAME LOGS (extend existing) ==========

-- game_logs table already exists from migration 001, keep it

-- ========== CONTENT SEED DATA ==========

-- Education Programs
INSERT INTO content_education_programs (id, stage, name_zh, name_en, mode, duration_days, description_zh, description_en) VALUES
  ('primary',           'primary',          '小学',     'Primary School',     'active',  3,  '基础教育，可以专注精力完成',   'Basic education, finishable Day 1 with focus'),
  ('junior_secondary',  'junior_secondary', '初中',     'Junior Secondary',   'active',  5,  '中级教育，学习开始变得重要',   'Intermediate education, subjects begin to matter'),
  ('senior_secondary',  'senior_secondary', '高中',     'Senior Secondary',   'active',  7,  '高级中等教育，解锁工作',       'Unlocks work; one passive education slot'),
  ('diploma',           'diploma',          '大专',     'Diploma',            'passive', 30, '大专学历，灵活无限制',         'Flexible/unlimited; skill-gated'),
  ('bachelor',          'bachelor',         '学士学位', 'Bachelor Degree',    'passive', 90, '本科学历，终身最多5个',       'Lifetime max 3; requires relevant skill'),
  ('master',            'master',           '硕士学位', 'Master Degree',      'passive', 180,'硕士学历，终身最多2个',       'Lifetime max 2; requires high skill'),
  ('phd',               'phd',              '博士学位', 'PhD',                'passive', 365,'博士学历，最高学术成就',       'Highest academic achievement');

-- Jobs
INSERT INTO content_jobs (id, name_zh, name_en, minimum_education, energy_per_shift, income_base, income_tier, main_skill, secondary_stat, description_zh, description_en) VALUES
  ('cleaner',           '清洁工',     'Cleaner',           'junior_secondary', 20, 100, 'low',        'fitness',   'END', '最低门槛，简单可靠的工作',       'Lowest barrier to entry; simple reliable work'),
  ('waiter',            '服务员',     'Waiter',            'junior_secondary', 20, 150, 'low_medium', 'sales',     'CHA', '强大的社交邂逅来源',             'Strong social encounter source'),
  ('kitchen_assistant', '厨房助手',   'Kitchen Assistant',  'junior_secondary', 20, 150, 'low_medium', 'cooking',   'DEX', '通向餐饮职业的自然路线',         'Natural route toward food careers'),
  ('retail_assistant',  '零售助理',   'Retail Assistant',   'junior_secondary', 20, 150, 'low_medium', 'sales',     'CHA', '销售技能的良好入门',             'Good entry point for Sales'),
  ('warehouse_worker',  '仓库工人',   'Warehouse Worker',   'junior_secondary', 25, 200, 'medium',     'fitness',   'STR', '精力消耗较高，收入稳定',         'Higher Energy use; steady income'),
  ('factory_operator',  '工厂操作员', 'Factory Operator',   'junior_secondary', 25, 200, 'medium',     'engineering','DEX', '可以接触工程技能检查',          'Can reveal Engineering checks'),
  ('admin_assistant',   '行政助理',   'Admin Assistant',    'senior_secondary', 20, 200, 'medium',     'management','INT', '办公室职业的良好起点',           'Simple office-career entry point'),
  ('customer_service',  '客户服务',   'Customer Service',   'senior_secondary', 20, 200, 'medium',     'sales',     'CHA', '社交暴露和压力潜力较高',         'Higher social exposure and Stress potential'),
  ('delivery_driver',   '快递司机',   'Delivery Driver',    'senior_secondary', 25, 250, 'medium_high','driving',   'DEX', '需要驾驶技能',                   'Driving threshold to be defined later'),
  ('junior_it_support', '初级IT支持', 'Junior IT Support',  'senior_secondary', 25, 250, 'medium_high','programming','INT', '技术职业的入门点',               'Entry point into technical careers');

-- Talents
INSERT INTO content_talents (id, name_zh, name_en, category, description_zh, description_en, buff_type, buff_value, buff_description) VALUES
  ('fast_learner',     '快速学习者', 'Fast Learner',     'growth',   '学习技能经验+8%',       'Learning Skill XP +8%',              'skill_xp_mult',     0.08,  '+8% skill XP from study'),
  ('quick_study',      '快速研究',   'Quick Study',      'growth',   '学习精力消耗-6%',       'Study Energy cost -6%',              'study_energy_mult', -0.06, '-6% study energy cost'),
  ('deep_focus',       '深度专注',   'Deep Focus',       'growth',   '学习压力增长-12%',      'Study Stress gain -12%',             'stress_mult',       -0.12, '-12% study stress gain'),
  ('money_sense',      '金钱嗅觉',   'Money Sense',      'wealth',   '工作/商业现金效率+5%',  'Work/business cash efficiency +5%',   'cash_mult',         0.05,  '+5% cash from work/business'),
  ('opportunity_eye',  '机会之眼',   'Opportunity Eye',  'wealth',   '机遇邂逅权重+15%',      'Opportunity encounter weight +15%',   'encounter_weight',  0.15,  '+15% chance of opportunity encounters'),
  ('negotiator',       '谈判专家',   'Negotiator',       'wealth',   '谈判结果质量+10%',      'Negotiation outcome quality +10%',    'negotiate_mult',    0.10,  '+10% negotiation quality'),
  ('people_person',    '社交达人',   'People Person',    'social',   '正面关系增长+10%',      'Positive relationship gain +10%',     'relationship_mult', 0.10,  '+10% positive relationship gain'),
  ('natural_leader',   '天生领导者', 'Natural Leader',    'social',   '团队/员工行动效果+8%',  'Team/employee action effectiveness +8%','team_mult',        0.08,  '+8% team/employee effectiveness'),
  ('well_connected',   '人脉广泛',   'Well Connected',    'social',   '人脉邂逅权重+15%',      'Network encounter weight +15%',       'encounter_weight',  0.15,  '+15% network encounters'),
  ('energetic',        '精力充沛',   'Energetic',        'physical', '每日精力上限+5',        'Daily Energy cap +5',                 'energy_max_add',    5,     '+5 max energy'),
  ('fast_recovery',    '快速恢复',   'Fast Recovery',    'physical', '疲劳恢复+12%',          'Fatigue recovery +12%',              'fatigue_mult',      0.12,  '+12% fatigue recovery'),
  ('martial_instinct', '武术直觉',   'Martial Instinct', 'physical', '武术学习+10%',          'Combat learning +10%',                'combat_xp_mult',    0.10,  '+10% combat skill XP'),
  ('lucky_break',      '幸运突破',   'Lucky Break',      'life',     '正面稀有邂逅权重+10%',  'Positive rare encounter weight +10%', 'rare_encounter',    0.10,  '+10% rare positive encounters'),
  ('resilient',        '坚韧不拔',   'Resilient',        'life',     '负面状态恢复+10%',      'Negative-state recovery +10%',        'recovery_mult',     0.10,  '+10% recovery from negative states'),
  ('explorer',         '探索者',     'Explorer',         'life',     '发现邂逅权重+15%',      'Discovery encounter weight +15%',     'encounter_weight',  0.15,  '+15% discovery encounters');

-- Adventures (sample pool)
INSERT INTO content_adventures (id, outcome, title_zh, title_en, description_zh, description_en, energy_cost, weight) VALUES
  ('adv_nothing_1',     'nothing',     '平淡的一天',     'Ordinary Day',        '今天没有什么特别的事情发生。',          'Nothing remarkable happened today.',              10, 200),
  ('adv_lucky_money',   'lucky',       '捡到钱',         'Found Money',         '你在路上捡到了一些零钱。',              'You found some loose change on the ground.',       10, 80),
  ('adv_lucky_item',    'lucky',       '意外收获',       'Lucky Find',          '你发现了一个被遗落的物品。',            'You discovered a forgotten item.',                 10, 50),
  ('adv_lucky_energy',  'lucky',       '精力充沛',       'Energized',           '你感到精力充沛。',                      'You feel surprisingly energized.',                 10, 40),
  ('adv_discover_skill','discovery',   '技能领悟',       'Skill Insight',       '你对一项技能有了新的领悟。',            'You gained insight into a skill.',                 10, 60),
  ('adv_discover_hist', 'discovery',   '历史发现',       'Historical Discovery', '你发现了一些有趣的历史知识。',          'You discovered interesting historical knowledge.', 10, 40),
  ('adv_encounter_npc', 'encounter',   '邂逅陌生人',     'Meeting a Stranger',  '你遇到了一个有趣的人。',                'You met an interesting person.',                   10, 50),
  ('adv_encounter_mentor','encounter', '遇见导师',       'Meeting a Mentor',    '你遇到了一位愿意教导你的人。',          'You met someone willing to teach you.',            10, 20),
  ('adv_mishap_stress', 'mishap',      '遭遇麻烦',       'Bad Luck',            '今天遇到了一些不顺心的事。',            'Things did not go your way today.',                10, 60),
  ('adv_mishap_fall',   'mishap',      '小事故',         'Minor Accident',      '你不小心摔了一跤。',                    'You had a minor accident.',                        10, 40),
  ('adv_life_event_friend','life_event','结识挚友',       'New Close Friend',    '你与某人建立了深厚的友谊。',            'You formed a deep friendship.',                    10, 15),
  ('adv_rare_crossworld','rare',       '神秘预兆',       'Mysterious Omen',     '你感受到了来自另一个世界的线索。',      'You sense a clue from another world.',             10, 5);

-- NPC Definitions (sample pool for relationships)
-- NPC Definitions will be seeded in migration 017

-- ========== RPC FUNCTIONS ==========

-- Atomic energy spend
CREATE OR REPLACE FUNCTION spend_energy(p_character_id UUID, p_amount INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_energy INT;
  v_result JSONB;
BEGIN
  SELECT energy INTO v_current_energy
  FROM characters WHERE id = p_character_id FOR UPDATE;

  IF v_current_energy IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Character not found');
  END IF;

  IF v_current_energy < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough energy', 'current', v_current_energy, 'needed', p_amount);
  END IF;

  UPDATE characters SET
    energy = energy - p_amount,
    last_active_at = now()
  WHERE id = p_character_id;

  SELECT energy INTO v_current_energy
  FROM characters WHERE id = p_character_id;

  RETURN jsonb_build_object('success', true, 'energy_remaining', v_current_energy);
END;
$$;

-- Energy recovery (called on each request)
CREATE OR REPLACE FUNCTION recover_energy(p_character_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_recovery TIMESTAMPTZ;
  v_current_energy INT;
  v_energy_max INT;
  v_elapsed_seconds NUMERIC;
  v_recovered INT;
BEGIN
  SELECT energy_last_recovery_at, energy, energy_max
  INTO v_last_recovery, v_current_energy, v_energy_max
  FROM characters WHERE id = p_character_id FOR UPDATE;

  IF v_last_recovery IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Character not found');
  END IF;

  v_elapsed_seconds := EXTRACT(EPOCH FROM (now() - v_last_recovery));
  v_recovered := FLOOR(v_elapsed_seconds / 300); -- 300 seconds = 5 minutes

  IF v_recovered > 0 THEN
    v_recovered := LEAST(v_recovered, v_energy_max - v_current_energy);
    IF v_recovered > 0 THEN
      UPDATE characters SET
        energy = energy + v_recovered,
        energy_last_recovery_at = energy_last_recovery_at + (v_recovered * INTERVAL '5 minutes'),
        last_active_at = now()
      WHERE id = p_character_id;
    END IF;
  END IF;

  SELECT energy INTO v_current_energy
  FROM characters WHERE id = p_character_id;

  RETURN jsonb_build_object('success', true, 'energy', v_current_energy, 'recovered', COALESCE(v_recovered, 0));
END;
$$;

-- Add skill XP with daily efficiency
CREATE OR REPLACE FUNCTION add_skill_xp(p_character_id UUID, p_skill_id TEXT, p_amount INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_level INT;
  v_current_xp BIGINT;
  v_daily_count INT;
  v_daily_reset DATE;
  v_efficiency NUMERIC;
  v_actual_xp INT;
  v_new_xp BIGINT;
  v_new_level INT;
BEGIN
  -- Get or create skill row
  INSERT INTO character_skills (character_id, skill_id)
  VALUES (p_character_id, p_skill_id)
  ON CONFLICT (character_id, skill_id) DO NOTHING;

  -- Reset daily count if new day
  UPDATE character_skills
  SET daily_study_count = 0, daily_reset_date = CURRENT_DATE
  WHERE character_id = p_character_id AND skill_id = p_skill_id
    AND daily_reset_date IS DISTINCT FROM CURRENT_DATE;

  SELECT level, xp, daily_study_count
  INTO v_current_level, v_current_xp, v_daily_count
  FROM character_skills
  WHERE character_id = p_character_id AND skill_id = p_skill_id;

  -- Efficiency: 1st=1.0, 2nd=0.9, 3rd=0.75, 4th=0.6, 5th+=0.4
  v_efficiency := CASE
    WHEN v_daily_count = 0 THEN 1.0
    WHEN v_daily_count = 1 THEN 0.9
    WHEN v_daily_count = 2 THEN 0.75
    WHEN v_daily_count = 3 THEN 0.6
    ELSE 0.4
  END;

  v_actual_xp := FLOOR(p_amount * v_efficiency);
  v_new_xp := v_current_xp + v_actual_xp;

  -- Level up check
  v_new_level := v_current_level;
  WHILE v_new_xp >= (100 * POWER(v_new_level + 1, 1.5)) AND v_new_level < 100 LOOP
    v_new_xp := v_new_xp - (100 * POWER(v_new_level + 1, 1.5));
    v_new_level := v_new_level + 1;
  END LOOP;

  UPDATE character_skills SET
    xp = v_new_xp,
    level = v_new_level,
    daily_study_count = daily_study_count + 1
  WHERE character_id = p_character_id AND skill_id = p_skill_id;

  RETURN jsonb_build_object(
    'success', true,
    'xp_gained', v_actual_xp,
    'efficiency', v_efficiency,
    'new_level', v_new_level,
    'new_xp', v_new_xp,
    'daily_count', v_daily_count + 1
  );
END;
$$;

-- Daily reset
CREATE OR REPLACE FUNCTION daily_reset(p_character_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_days_lived INT;
BEGIN
  UPDATE characters SET
    days_lived = days_lived + 1,
    contracts_completed_today = 0,
    stress = GREATEST(stress - 5, 0),
    fatigue = GREATEST(fatigue - 10, 0),
    last_active_at = now()
  WHERE id = p_character_id
  RETURNING days_lived INTO v_days_lived;

  -- Reset daily skill study counts
  UPDATE character_skills SET
    daily_study_count = 0,
    daily_reset_date = CURRENT_DATE
  WHERE character_id = p_character_id;

  -- Reset daily actions
  DELETE FROM daily_actions
  WHERE character_id = p_character_id
    AND action_date < CURRENT_DATE;

  RETURN jsonb_build_object('success', true, 'days_lived', v_days_lived);
END;
$$;

-- ========== RLS POLICIES ==========

-- Characters
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own characters" ON characters
  FOR SELECT USING ((select auth.uid()) = account_id);
CREATE POLICY "Users can insert own characters" ON characters
  FOR INSERT WITH CHECK ((select auth.uid()) = account_id);
CREATE POLICY "Users can update own characters" ON characters
  FOR UPDATE USING ((select auth.uid()) = account_id);
CREATE POLICY "Users can delete own characters" ON characters
  FOR DELETE USING ((select auth.uid()) = account_id);

-- Character Skills
ALTER TABLE character_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own skills" ON character_skills
  FOR SELECT USING (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));
CREATE POLICY "Users can insert own skills" ON character_skills
  FOR INSERT WITH CHECK (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));
CREATE POLICY "Users can update own skills" ON character_skills
  FOR UPDATE USING (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));

-- Character Education
ALTER TABLE character_education ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own education" ON character_education
  FOR SELECT USING (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));
CREATE POLICY "Users can insert own education" ON character_education
  FOR INSERT WITH CHECK (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));
CREATE POLICY "Users can update own education" ON character_education
  FOR UPDATE USING (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));

-- Character Jobs
ALTER TABLE character_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own jobs" ON character_jobs
  FOR SELECT USING (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));
CREATE POLICY "Users can insert own jobs" ON character_jobs
  FOR INSERT WITH CHECK (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));
CREATE POLICY "Users can update own jobs" ON character_jobs
  FOR UPDATE USING (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));

-- Character Adventures
ALTER TABLE character_adventures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own adventures" ON character_adventures
  FOR SELECT USING (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));
CREATE POLICY "Users can insert own adventures" ON character_adventures
  FOR INSERT WITH CHECK (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));

-- NPC Relationships
ALTER TABLE npc_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own npc relationships" ON npc_relationships
  FOR SELECT USING ((select auth.uid()) = account_id);
CREATE POLICY "Users can insert own npc relationships" ON npc_relationships
  FOR INSERT WITH CHECK ((select auth.uid()) = account_id);
CREATE POLICY "Users can update own npc relationships" ON npc_relationships
  FOR UPDATE USING ((select auth.uid()) = account_id);

-- Player Relationships
ALTER TABLE player_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own player relationships" ON player_relationships
  FOR SELECT USING ((select auth.uid()) = account_id OR (select auth.uid()) = partner_id);
CREATE POLICY "Users can insert own player relationships" ON player_relationships
  FOR INSERT WITH CHECK ((select auth.uid()) = account_id);
CREATE POLICY "Users can update own player relationships" ON player_relationships
  FOR UPDATE USING ((select auth.uid()) = account_id);

-- Pets
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own pets" ON pets
  FOR SELECT USING ((select auth.uid()) = account_id);
CREATE POLICY "Users can insert own pets" ON pets
  FOR INSERT WITH CHECK ((select auth.uid()) = account_id);
CREATE POLICY "Users can update own pets" ON pets
  FOR UPDATE USING ((select auth.uid()) = account_id);

-- Family Members
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own family" ON family_members
  FOR SELECT USING ((select auth.uid()) = account_id);
CREATE POLICY "Users can insert own family" ON family_members
  FOR INSERT WITH CHECK ((select auth.uid()) = account_id);
CREATE POLICY "Users can update own family" ON family_members
  FOR UPDATE USING ((select auth.uid()) = account_id);

-- Close Friends
ALTER TABLE close_friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own close friends" ON close_friends
  FOR SELECT USING ((select auth.uid()) = account_id);
CREATE POLICY "Users can insert own close friends" ON close_friends
  FOR INSERT WITH CHECK ((select auth.uid()) = account_id);
CREATE POLICY "Users can delete own close friends" ON close_friends
  FOR DELETE USING ((select auth.uid()) = account_id);

-- Daily Actions
ALTER TABLE daily_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own daily actions" ON daily_actions
  FOR SELECT USING (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));
CREATE POLICY "Users can insert own daily actions" ON daily_actions
  FOR INSERT WITH CHECK (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));

-- Training Sessions
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own training" ON training_sessions
  FOR SELECT USING (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));
CREATE POLICY "Users can insert own training" ON training_sessions
  FOR INSERT WITH CHECK (character_id IN (SELECT id FROM characters WHERE account_id = (select auth.uid())));

-- Content tables: public read
ALTER TABLE content_education_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read education" ON content_education_programs FOR SELECT USING (true);

ALTER TABLE content_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read jobs" ON content_jobs FOR SELECT USING (true);

ALTER TABLE content_talents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read talents" ON content_talents FOR SELECT USING (true);

ALTER TABLE content_adventures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read adventures" ON content_adventures FOR SELECT USING (true);

ALTER TABLE npc_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read npcs" ON npc_definitions FOR SELECT USING (true);
