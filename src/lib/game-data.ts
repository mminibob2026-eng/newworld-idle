// ============================================================
// NEW WORLD — Game Data Types & Constants
// Based on Canonical Game Design Data v1.1
// ============================================================

// --- Enums / Literals ---

export type LifeStage = 'baby' | 'child' | 'teen' | 'young_adult' | 'adult' | 'senior'

export type WorldType = 'modern' | 'ancient' | 'mythic'

export type SkillCategory = 'technical' | 'business' | 'life' | 'creative' | 'physical' | 'knowledge'

export type SkillTier = 'novice' | 'beginner' | 'competent' | 'skilled' | 'expert' | 'elite' | 'mastery_candidate' | 'master'

export type EducationStage =
  | 'primary'
  | 'junior_secondary'
  | 'senior_secondary'
  | 'diploma'
  | 'bachelor'
  | 'master'
  | 'phd'

export type EducationMode = 'active' | 'passive'

export type TalentCategory = 'growth' | 'wealth' | 'social' | 'physical' | 'life'

export type RelationshipStage =
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'close_friend'
  | 'dating'
  | 'serious'
  | 'engaged'
  | 'married'
  | 'former'

export type PetAgeStage = 'young' | 'adult' | 'senior' | 'elderly'

export type AdventureOutcome = 'nothing' | 'lucky' | 'discovery' | 'encounter' | 'mishap' | 'life_event' | 'rare'

export type OriginId = 'humble' | 'middle' | 'wealthy' | 'orphan'

export type WorkXPTier = 'low' | 'low_medium' | 'medium' | 'medium_high' | 'high'

// --- Interfaces ---

export interface SkillDef {
  id: string
  name_zh: string
  name_en: string
  category: SkillCategory
  primary_stat: string
  secondary_stat: string | null
  modern_relevance: number
  ancient_relevance: number
  mythic_relevance: number
}

export interface SkillTierDef {
  tier: SkillTier
  minLevel: number
  maxLevel: number
  baseXPPerLevel: number
  focusedPaceDays: number
}

export interface TalentDef {
  id: string
  name_zh: string
  name_en: string
  category: TalentCategory
  description_zh: string
  description_en: string
  buffDescription: string
}

export interface OriginDef {
  id: OriginId
  name_zh: string
  name_en: string
  description_zh: string
  description_en: string
  advantage_zh: string
  advantage_en: string
  struggle_zh: string
  struggle_en: string
  influenceEndsAtLevel: number
}

// --- Parents ---

export interface ParentDef {
  id: string
  gender: 'male' | 'female'
  relationship: 'father' | 'mother'
  occupation: string
  occupation_zh: string
  personality: string
  personality_zh: string
  ageAtBirth: number
  lifespan: number
}

export const PARENT_OCCUPATIONS = [
  { id: 'farmer',          name_zh: '农民',       name_en: 'Farmer',          wealth: 'low' },
  { id: 'factory_worker',  name_zh: '工厂工人',   name_en: 'Factory Worker',  wealth: 'low' },
  { id: 'shopkeeper',      name_zh: '店主',       name_en: 'Shopkeeper',      wealth: 'medium' },
  { id: 'teacher',         name_zh: '老师',       name_en: 'Teacher',         wealth: 'medium' },
  { id: 'doctor',          name_zh: '医生',       name_en: 'Doctor',          wealth: 'high' },
  { id: 'engineer',        name_zh: '工程师',     name_en: 'Engineer',        wealth: 'high' },
  { id: 'police',          name_zh: '警察',       name_en: 'Police Officer',  wealth: 'medium' },
  { id: 'chef',            name_zh: '厨师',       name_en: 'Chef',            wealth: 'medium' },
  { id: 'driver',          name_zh: '司机',       name_en: 'Driver',          wealth: 'low' },
  { id: 'office_worker',   name_zh: '上班族',     name_en: 'Office Worker',   wealth: 'medium' },
  { id: 'artist',          name_zh: '艺术家',     name_en: 'Artist',          wealth: 'low' },
  { id: 'merchant',        name_zh: '商人',       name_en: 'Merchant',        wealth: 'high' },
]

export const PARENT_PERSONALITIES = [
  { id: 'strict',      name_zh: '严厉',     name_en: 'Strict',      helpChance: 0.3, inheritance: 0.8 },
  { id: 'caring',      name_zh: '慈爱',     name_en: 'Caring',      helpChance: 0.7, inheritance: 1.0 },
  { id: 'distant',     name_zh: '疏远',     name_en: 'Distant',     helpChance: 0.2, inheritance: 0.5 },
  { id: 'supportive',  name_zh: '支持',     name_en: 'Supportive',  helpChance: 0.8, inheritance: 1.2 },
  { id: 'strict_love', name_zh: '严厉的爱', name_en: 'Tough Love',  helpChance: 0.5, inheritance: 1.0 },
]

export interface ParentEvent {
  id: string
  type: 'sick' | 'help' | 'gift' | 'advice' | 'inherit' | 'pass_away'
  description_zh: string
  description_en: string
  energyCost: number
  goldCost: number
  loyaltyChange: number
  happinessChange: number
}

export const PARENT_EVENTS: ParentEvent[] = [
  { id: 'parent_sick',      type: 'pass_away', description_zh: '父母生病了，需要照顾',     description_en: 'Parent is sick, needs care',     energyCost: 30, goldCost: 0,   loyaltyChange: 10, happinessChange: -15 },
  { id: 'parent_help_study', type: 'help',      description_zh: '父母帮你补习功课',         description_en: 'Parent helps with studying',      energyCost: 10, goldCost: 0,   loyaltyChange: 8,  happinessChange: 5 },
  { id: 'parent_gift',       type: 'gift',      description_zh: '父母给你零花钱',           description_en: 'Parent gives pocket money',       energyCost: 0,  goldCost: 0,   loyaltyChange: 5,  happinessChange: 8 },
  { id: 'parent_advice',     type: 'advice',    description_zh: '父母给你人生建议',         description_en: 'Parent gives life advice',        energyCost: 5,  goldCost: 0,   loyaltyChange: 6,  happinessChange: 3 },
  { id: 'parent_inherit',    type: 'inherit',   description_zh: '父母给你留下遗产',         description_en: 'Parent leaves inheritance',       energyCost: 0,  goldCost: 0,   loyaltyChange: 0,  happinessChange: -5 },
  { id: 'parent_pass_away',  type: 'pass_away', description_zh: '父母去世了',               description_en: 'Parent has passed away',          energyCost: 0,  goldCost: 0,   loyaltyChange: 0,  happinessChange: -30 },
]

export interface EducationStageDef {
  id: EducationStage
  name_zh: string
  name_en: string
  mode: EducationMode
  prerequisite: EducationStage | null
  description_zh: string
  description_en: string
}

export interface JobDef {
  id: string
  name_zh: string
  name_en: string
  minimumRequirement: EducationStage | null
  skillRequirement: string | null
  energyPerShift: number
  incomeTier: WorkXPTier
  mainSkill: string
  secondaryStat: string
  income_base: number
  shiftHours: number
  levelRequired?: number
  description_zh: string
  description_en: string
}

export interface AdventureDef {
  id: string
  outcome: AdventureOutcome
  title_zh: string
  title_en: string
  description_zh: string
  description_en: string
  energyCost: number
  levelRequired?: number
  skillChecks?: { skill: string; minLevel: number }[]
  skillBonus?: string
  rewards?: { type: string; amount: number }[]
  choices?: { text_zh: string; text_en: string; successChance: number; xp_reward: number }[]
  lifeEventFlag?: boolean
}

// --- Skill XP Progression Table ---

export const SKILL_TIER_TABLE: SkillTierDef[] = [
  { tier: 'novice',            minLevel: 0,   maxLevel: 9,   baseXPPerLevel: 500,   focusedPaceDays: 0.5 },
  { tier: 'beginner',          minLevel: 10,  maxLevel: 24,  baseXPPerLevel: 800,   focusedPaceDays: 1 },
  { tier: 'competent',         minLevel: 25,  maxLevel: 49,  baseXPPerLevel: 1500,  focusedPaceDays: 2 },
  { tier: 'skilled',           minLevel: 50,  maxLevel: 74,  baseXPPerLevel: 3000,  focusedPaceDays: 5 },
  { tier: 'expert',            minLevel: 75,  maxLevel: 89,  baseXPPerLevel: 6000,  focusedPaceDays: 8 },
  { tier: 'elite',             minLevel: 90,  maxLevel: 98,  baseXPPerLevel: 12000, focusedPaceDays: 17 },
  { tier: 'mastery_candidate', minLevel: 99,  maxLevel: 99,  baseXPPerLevel: 12000, focusedPaceDays: 999 },
  { tier: 'master',            minLevel: 100, maxLevel: 100, baseXPPerLevel: 0,     focusedPaceDays: 0 },
]

export const SKILL_DAILY_EFFICIENCY = [1.0, 0.9, 0.75, 0.6, 0.4]

// --- 15 Core Skills ---

export const SKILLS: SkillDef[] = [
  { id: 'engineering',  name_zh: '工程',   name_en: 'Engineering',  category: 'technical', primary_stat: 'INT', secondary_stat: 'DEX', modern_relevance: 5, ancient_relevance: 3, mythic_relevance: 2 },
  { id: 'programming',  name_zh: '编程',   name_en: 'Programming',  category: 'technical', primary_stat: 'INT', secondary_stat: null,  modern_relevance: 5, ancient_relevance: 1, mythic_relevance: 1 },
  { id: 'sales',        name_zh: '销售',   name_en: 'Sales',        category: 'business',  primary_stat: 'CHA', secondary_stat: null,  modern_relevance: 5, ancient_relevance: 4, mythic_relevance: 3 },
  { id: 'management',   name_zh: '管理',   name_en: 'Management',   category: 'business',  primary_stat: 'INT', secondary_stat: 'CHA', modern_relevance: 5, ancient_relevance: 3, mythic_relevance: 2 },
  { id: 'cooking',      name_zh: '烹饪',   name_en: 'Cooking',      category: 'life',      primary_stat: 'DEX', secondary_stat: 'INT', modern_relevance: 5, ancient_relevance: 3, mythic_relevance: 2 },
  { id: 'fishing',      name_zh: '钓鱼',   name_en: 'Fishing',      category: 'life',      primary_stat: 'DEX', secondary_stat: 'INT', modern_relevance: 5, ancient_relevance: 5, mythic_relevance: 5 },
  { id: 'gardening',    name_zh: '园艺',   name_en: 'Gardening',    category: 'life',      primary_stat: 'END', secondary_stat: 'INT', modern_relevance: 5, ancient_relevance: 5, mythic_relevance: 5 },
  { id: 'driving',      name_zh: '驾驶',   name_en: 'Driving',      category: 'life',      primary_stat: 'DEX', secondary_stat: null,  modern_relevance: 5, ancient_relevance: 1, mythic_relevance: 1 },
  { id: 'art',          name_zh: '艺术',   name_en: 'Art',          category: 'creative',  primary_stat: 'DEX', secondary_stat: 'INT', modern_relevance: 5, ancient_relevance: 4, mythic_relevance: 4 },
  { id: 'photography',  name_zh: '摄影',   name_en: 'Photography',  category: 'creative',  primary_stat: 'DEX', secondary_stat: 'LCK', modern_relevance: 5, ancient_relevance: 2, mythic_relevance: 3 },
  { id: 'music',        name_zh: '音乐',   name_en: 'Music',        category: 'creative',  primary_stat: 'DEX', secondary_stat: 'CHA', modern_relevance: 5, ancient_relevance: 5, mythic_relevance: 5 },
  { id: 'fitness',      name_zh: '健身',   name_en: 'Fitness',      category: 'physical',  primary_stat: 'DEX', secondary_stat: null,  modern_relevance: 5, ancient_relevance: 4, mythic_relevance: 3 },
  { id: 'striking',     name_zh: '打击',   name_en: 'Striking',     category: 'physical',  primary_stat: 'STR', secondary_stat: 'DEX', modern_relevance: 5, ancient_relevance: 5, mythic_relevance: 4 },
  { id: 'grappling',    name_zh: '摔跤',   name_en: 'Grappling',    category: 'physical',  primary_stat: 'STR', secondary_stat: 'END', modern_relevance: 5, ancient_relevance: 5, mythic_relevance: 4 },
  { id: 'history',      name_zh: '历史',   name_en: 'History',      category: 'knowledge', primary_stat: 'INT', secondary_stat: null,  modern_relevance: 3, ancient_relevance: 5, mythic_relevance: 3 },
]

// --- 15 Talents ---

export const TALENTS: TalentDef[] = [
  { id: 'fast_learner',     name_zh: '快速学习者', name_en: 'Fast Learner',     category: 'growth',   description_zh: '学习技能经验+8%',        description_en: 'Learning Skill XP +8%',                  buffDescription: '+8% skill XP from study' },
  { id: 'quick_study',      name_zh: '快速研究',   name_en: 'Quick Study',      category: 'growth',   description_zh: '学习精力消耗-6%',        description_en: 'Study Energy cost -6%',                  buffDescription: '-6% study energy cost' },
  { id: 'deep_focus',       name_zh: '深度专注',   name_en: 'Deep Focus',       category: 'growth',   description_zh: '学习压力增长-12%',       description_en: 'Study Stress gain -12%',                 buffDescription: '-12% study stress gain' },
  { id: 'money_sense',      name_zh: '金钱嗅觉',   name_en: 'Money Sense',      category: 'wealth',   description_zh: '工作/商业现金效率+5%',    description_en: 'Work/business cash efficiency +5%',       buffDescription: '+5% cash from work/business' },
  { id: 'opportunity_eye',  name_zh: '机会之眼',   name_en: 'Opportunity Eye',  category: 'wealth',   description_zh: '机遇邂逅权重+15%',       description_en: 'Opportunity encounter weight +15%',       buffDescription: '+15% chance of opportunity encounters' },
  { id: 'negotiator',       name_zh: '谈判专家',   name_en: 'Negotiator',       category: 'wealth',   description_zh: '谈判结果质量+10%',       description_en: 'Negotiation outcome quality +10%',        buffDescription: '+10% negotiation quality' },
  { id: 'people_person',    name_zh: '社交达人',   name_en: 'People Person',    category: 'social',   description_zh: '正面关系增长+10%',       description_en: 'Positive relationship gain +10%',         buffDescription: '+10% positive relationship gain' },
  { id: 'natural_leader',   name_zh: '天生领导者', name_en: 'Natural Leader',   category: 'social',   description_zh: '团队/员工行动效果+8%',   description_en: 'Team/employee action effectiveness +8%',  buffDescription: '+8% team/employee effectiveness' },
  { id: 'well_connected',   name_zh: '人脉广泛',   name_en: 'Well Connected',   category: 'social',   description_zh: '人脉邂逅权重+15%',       description_en: 'Network encounter weight +15%',           buffDescription: '+15% network encounters' },
  { id: 'energetic',        name_zh: '精力充沛',   name_en: 'Energetic',        category: 'physical', description_zh: '每日精力上限+5',         description_en: 'Daily Energy cap +5',                     buffDescription: '+5 max energy' },
  { id: 'fast_recovery',    name_zh: '快速恢复',   name_en: 'Fast Recovery',    category: 'physical', description_zh: '疲劳恢复+12%',           description_en: 'Fatigue recovery +12%',                  buffDescription: '+12% fatigue recovery' },
  { id: 'martial_instinct', name_zh: '武术直觉',   name_en: 'Martial Instinct', category: 'physical', description_zh: '武术学习+10%',           description_en: 'Combat learning +10%',                    buffDescription: '+10% combat skill XP' },
  { id: 'lucky_break',      name_zh: '幸运突破',   name_en: 'Lucky Break',      category: 'life',     description_zh: '正面稀有邂逅权重+10%',   description_en: 'Positive rare encounter weight +10%',     buffDescription: '+10% rare positive encounters' },
  { id: 'resilient',        name_zh: '坚韧不拔',   name_en: 'Resilient',        category: 'life',     description_zh: '负面状态恢复+10%',       description_en: 'Negative-state recovery +10%',            buffDescription: '+10% recovery from negative states' },
  { id: 'explorer',         name_zh: '探索者',     name_en: 'Explorer',         category: 'life',     description_zh: '发现邂逅权重+15%',       description_en: 'Discovery encounter weight +15%',         buffDescription: '+15% discovery encounters' },
]

// --- 4 Origins ---

export const ORIGINS: OriginDef[] = [
  {
    id: 'humble',
    name_zh: '贫穷人家', name_en: 'Humble Beginnings',
    description_zh: '在经济压力中获得家庭支持。自立精神早早养成。',
    description_en: 'Family support amid financial pressure. Self-reliance forged early.',
    advantage_zh: '家庭纽带 / 自立', advantage_en: 'Family bond / self-reliance',
    struggle_zh: '经济压力', struggle_en: 'Money pressure',
    influenceEndsAtLevel: 20,
  },
  {
    id: 'middle',
    name_zh: '小康之家', name_en: 'Comfortable Family',
    description_zh: '安稳的童年。没有极端的优势，也没有极端的劣势。',
    description_en: 'A stable childhood. Fewer extreme advantages, but fewer extremes.',
    advantage_zh: '稳定', advantage_en: 'Stability',
    struggle_zh: '缺少极端优势', struggle_en: 'Fewer extreme advantages',
    influenceEndsAtLevel: 20,
  },
  {
    id: 'wealthy',
    name_zh: '富豪之家', name_en: 'Wealthy Family',
    description_zh: '金钱、人脉和期望。早期商业机会。',
    description_en: 'Money, network, and expectations. Early business access.',
    advantage_zh: '早期商业机会 / 人脉', advantage_en: 'Early business access / network',
    struggle_zh: '家庭期望/纷争', struggle_en: 'Family expectations/drama',
    influenceEndsAtLevel: 20,
  },
  {
    id: 'orphan',
    name_zh: '孤儿', name_en: 'Orphan',
    description_zh: '独立和机遇。没有父母支持。',
    description_en: 'Independence and opportunity. No parental support.',
    advantage_zh: '自立 / 机遇邂逅', advantage_en: 'Self-reliance / opportunity encounters',
    struggle_zh: '没有父母支持', struggle_en: 'No parental support',
    influenceEndsAtLevel: 20,
  },
]

// --- 6 Education Stages ---

export const EDUCATION_STAGES: EducationStageDef[] = [
  { id: 'primary',          name_zh: '小学',     name_en: 'Primary School',     mode: 'active',  prerequisite: null,               description_zh: '基础教育',     description_en: 'Basic education' },
  { id: 'junior_secondary', name_zh: '初中',     name_en: 'Junior Secondary',   mode: 'active',  prerequisite: 'primary',          description_zh: '中级教育',     description_en: 'Intermediate education' },
  { id: 'senior_secondary', name_zh: '高中',     name_en: 'Senior Secondary',   mode: 'active',  prerequisite: 'junior_secondary', description_zh: '高级中等教育', description_en: 'Unlocks work' },
  { id: 'diploma',          name_zh: '大专',     name_en: 'Diploma',            mode: 'passive', prerequisite: 'senior_secondary', description_zh: '大专学历',     description_en: 'Flexible/unlimited' },
  { id: 'bachelor',         name_zh: '学士学位', name_en: 'Bachelor Degree',    mode: 'passive', prerequisite: 'senior_secondary', description_zh: '本科学历',     description_en: 'Lifetime max 3' },
  { id: 'master',           name_zh: '硕士学位', name_en: 'Master Degree',      mode: 'passive', prerequisite: 'bachelor',         description_zh: '硕士学历',     description_en: 'Lifetime max 2' },
  { id: 'phd',              name_zh: '博士学位', name_en: 'PhD',                mode: 'passive', prerequisite: 'master',           description_zh: '博士学历',     description_en: 'Highest academic' },
]

// --- 10 Starter Jobs ---

export const JOBS: JobDef[] = [
  { id: 'cleaner',           name_zh: '清洁工',     name_en: 'Cleaner',           minimumRequirement: 'junior_secondary', skillRequirement: null,            energyPerShift: 20, incomeTier: 'low',        mainSkill: 'fitness',     secondaryStat: 'END', income_base: 100, shiftHours: 8, levelRequired: 1,  description_zh: '最低门槛的工作',   description_en: 'Lowest barrier to entry' },
  { id: 'waiter',            name_zh: '服务员',     name_en: 'Waiter',            minimumRequirement: 'junior_secondary', skillRequirement: null,            energyPerShift: 20, incomeTier: 'low_medium', mainSkill: 'sales',       secondaryStat: 'CHA', income_base: 150, shiftHours: 8, levelRequired: 1,  description_zh: '社交邂逅来源',     description_en: 'Social encounter source' },
  { id: 'kitchen_assistant', name_zh: '厨房助手',   name_en: 'Kitchen Assistant',  minimumRequirement: 'junior_secondary', skillRequirement: null,            energyPerShift: 20, incomeTier: 'low_medium', mainSkill: 'cooking',     secondaryStat: 'DEX', income_base: 150, shiftHours: 8, levelRequired: 1,  description_zh: '通向餐饮职业',     description_en: 'Route toward food careers' },
  { id: 'retail_assistant',  name_zh: '零售助理',   name_en: 'Retail Assistant',   minimumRequirement: 'junior_secondary', skillRequirement: null,            energyPerShift: 20, incomeTier: 'low_medium', mainSkill: 'sales',       secondaryStat: 'CHA', income_base: 150, shiftHours: 8, levelRequired: 1,  description_zh: '销售技能入门',     description_en: 'Entry point for Sales' },
  { id: 'warehouse_worker',  name_zh: '仓库工人',   name_en: 'Warehouse Worker',   minimumRequirement: 'junior_secondary', skillRequirement: null,            energyPerShift: 25, incomeTier: 'medium',     mainSkill: 'fitness',     secondaryStat: 'STR', income_base: 200, shiftHours: 8, levelRequired: 3,  description_zh: '收入稳定',         description_en: 'Steady income' },
  { id: 'factory_operator',  name_zh: '工厂操作员', name_en: 'Factory Operator',   minimumRequirement: 'junior_secondary', skillRequirement: null,            energyPerShift: 25, incomeTier: 'medium',     mainSkill: 'engineering', secondaryStat: 'DEX', income_base: 200, shiftHours: 8, levelRequired: 3,  description_zh: '接触工程检查',     description_en: 'Engineering checks' },
  { id: 'admin_assistant',   name_zh: '行政助理',   name_en: 'Admin Assistant',    minimumRequirement: 'senior_secondary', skillRequirement: null,            energyPerShift: 20, incomeTier: 'medium',     mainSkill: 'management', secondaryStat: 'INT', income_base: 200, shiftHours: 8, levelRequired: 5,  description_zh: '办公室职业起点',   description_en: 'Office career entry' },
  { id: 'customer_service',  name_zh: '客户服务',   name_en: 'Customer Service',   minimumRequirement: 'senior_secondary', skillRequirement: null,            energyPerShift: 20, incomeTier: 'medium',     mainSkill: 'sales',       secondaryStat: 'CHA', income_base: 200, shiftHours: 8, levelRequired: 5,  description_zh: '社交暴露高',       description_en: 'High social exposure' },
  { id: 'delivery_driver',   name_zh: '快递司机',   name_en: 'Delivery Driver',    minimumRequirement: 'senior_secondary', skillRequirement: 'driving',       energyPerShift: 25, incomeTier: 'medium_high',mainSkill: 'driving',     secondaryStat: 'DEX', income_base: 250, shiftHours: 8, levelRequired: 8,  description_zh: '需要驾驶技能',     description_en: 'Requires Driving skill' },
  { id: 'junior_it_support', name_zh: '初级IT支持', name_en: 'Junior IT Support',  minimumRequirement: 'senior_secondary', skillRequirement: 'programming',   energyPerShift: 25, incomeTier: 'medium_high',mainSkill: 'programming', secondaryStat: 'INT', income_base: 250, shiftHours: 8, levelRequired: 10, description_zh: '技术职业入门',     description_en: 'Technical career entry' },
]

// --- NPC Name Generators ---

export const NPC_FIRST_NAMES_ZH = ['小明', '小红', '小华', '小李', '小王', '小张', '小陈', '小刘', '小杨', '小赵', '小周', '小吴', '小孙', '小马', '小朱', '小胡', '小林', '小何', '小高', '小罗']
export const NPC_FIRST_NAMES_EN = ['Alex', 'Jordan', 'Casey', 'Morgan', 'Taylor', 'Quinn', 'Riley', 'Avery', 'Charlie', 'Dakota', 'Emery', 'Finley', 'Hayden', 'Jamie', 'Kendall', 'Logan', 'Parker', 'Reese', 'Sage', 'Tyler']
export const NPC_LAST_NAMES_ZH = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋', '勇', '军', '杰', '涛', '明', '超', '秀兰', '霞', '平', '刚']
export const NPC_LAST_NAMES_EN = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young']

export function generateNPCName(locale: 'zh' | 'en'): string {
  const firstNames = locale === 'zh' ? NPC_FIRST_NAMES_ZH : NPC_FIRST_NAMES_EN
  const lastNames = locale === 'zh' ? NPC_LAST_NAMES_ZH : NPC_LAST_NAMES_EN
  const first = firstNames[Math.floor(Math.random() * firstNames.length)]
  const last = lastNames[Math.floor(Math.random() * lastNames.length)]
  return locale === 'zh' ? first + last : `${first} ${last}`
}

// --- Pet Breeds ---

export interface PetBreed {
  id: string
  name_zh: string
  name_en: string
  species: 'dog' | 'cat' | 'bird' | 'fish'
  baseStats: { happiness: number; loyalty: number; energy: number }
  description_zh: string
  description_en: string
}

export const PET_BREEDS: PetBreed[] = [
  { id: 'labrador',      name_zh: '拉布拉多',   name_en: 'Labrador',      species: 'dog',    baseStats: { happiness: 80, loyalty: 90, energy: 70 }, description_zh: '友好忠诚', description_en: 'Friendly and loyal' },
  { id: 'shiba_inu',     name_zh: '柴犬',       name_en: 'Shiba Inu',     species: 'dog',    baseStats: { happiness: 70, loyalty: 80, energy: 80 }, description_zh: '活泼独立', description_en: 'Lively and independent' },
  { id: 'persian_cat',   name_zh: '波斯猫',     name_en: 'Persian Cat',   species: 'cat',    baseStats: { happiness: 85, loyalty: 60, energy: 50 }, description_zh: '优雅安静', description_en: 'Elegant and quiet' },
  { id: 'siamese_cat',   name_zh: '暹罗猫',     name_en: 'Siamese Cat',   species: 'cat',    baseStats: { happiness: 75, loyalty: 70, energy: 60 }, description_zh: '聪明粘人', description_en: 'Smart and clingy' },
  { id: 'budgerigar',    name_zh: '虎皮鹦鹉',   name_en: 'Budgerigar',    species: 'bird',   baseStats: { happiness: 60, loyalty: 50, energy: 90 }, description_zh: '活泼好学', description_en: 'Lively and trainable' },
  { id: 'goldfish',      name_zh: '金鱼',       name_en: 'Goldfish',      species: 'fish',   baseStats: { happiness: 40, loyalty: 20, energy: 30 }, description_zh: '观赏性强', description_en: 'Great for viewing' },
]

// --- Relationship Events ---

export interface RelationshipEvent {
  id: string
  type: 'encounter' | 'date' | 'conflict' | 'gift' | 'help'
  description_zh: string
  description_en: string
  energyCost: number
  loyaltyChange: number
  happinessChange: number
}

export const RELATIONSHIP_EVENTS: RelationshipEvent[] = [
  { id: 'coffee',         type: 'encounter', description_zh: '一起喝咖啡',       description_en: 'Have coffee together',       energyCost: 5,  loyaltyChange: 5,  happinessChange: 3 },
  { id: 'dinner',         type: 'date',      description_zh: '共进晚餐',         description_en: 'Have dinner together',       energyCost: 10, loyaltyChange: 10, happinessChange: 8 },
  { id: 'movie',          type: 'date',      description_zh: '一起看电影',       description_en: 'Watch a movie together',     energyCost: 8,  loyaltyChange: 8,  happinessChange: 10 },
  { id: 'walk',           type: 'encounter', description_zh: '一起散步',         description_en: 'Take a walk together',       energyCost: 5,  loyaltyChange: 5,  happinessChange: 5 },
  { id: 'gift_small',     type: 'gift',      description_zh: '送小礼物',         description_en: 'Give a small gift',          energyCost: 5,  loyaltyChange: 8,  happinessChange: 6 },
  { id: 'gift_large',     type: 'gift',      description_zh: '送贵重礼物',       description_en: 'Give an expensive gift',     energyCost: 15, loyaltyChange: 15, happinessChange: 12 },
  { id: 'help_moving',    type: 'help',      description_zh: '帮忙搬家',         description_en: 'Help with moving',           energyCost: 20, loyaltyChange: 12, happinessChange: 4 },
  { id: 'help_study',     type: 'help',      description_zh: '帮忙学习',         description_en: 'Help with studying',         energyCost: 10, loyaltyChange: 10, happinessChange: 5 },
  { id: 'argue',          type: 'conflict',  description_zh: '发生争吵',         description_en: 'Have an argument',           energyCost: 5,  loyaltyChange: -10, happinessChange: -8 },
  { id: 'misunderstand',  type: 'conflict',  description_zh: '产生误会',         description_en: 'Have a misunderstanding',    energyCost: 0,  loyaltyChange: -5,  happinessChange: -5 },
]

// --- Combat Enemies ---

export interface EnemyDef {
  id: string
  name_zh: string
  name_en: string
  level: number
  hp: number
  attack: number
  defense: number
  xpReward: number
  goldReward: number
  description_zh: string
  description_en: string
}

export const ENEMIES: EnemyDef[] = [
  { id: 'stray_cat',      name_zh: '流浪猫',     name_en: 'Stray Cat',      level: 1,  hp: 30,  attack: 5,  defense: 2,  xpReward: 20,  goldReward: 10,  description_zh: '看起来很凶', description_en: 'Looks fierce' },
  { id: 'wild_dog',       name_zh: '野狗',       name_en: 'Wild Dog',       level: 3,  hp: 60,  attack: 10, defense: 5,  xpReward: 40,  goldReward: 20,  description_zh: '成群结队', description_en: 'Travels in packs' },
  { id: 'thug',           name_zh: '小混混',     name_en: 'Thug',           level: 5,  hp: 100, attack: 15, defense: 8,  xpReward: 80,  goldReward: 50,  description_zh: '拦路抢劫', description_en: 'Road robber' },
  { id: 'gang_leader',    name_zh: '帮派头目',   name_en: 'Gang Leader',    level: 10, hp: 200, attack: 25, defense: 15, xpReward: 150, goldReward: 100, description_zh: '控制街区', description_en: 'Controls the block' },
  { id: 'assassin',       name_zh: '刺客',       name_en: 'Assassin',       level: 15, hp: 150, attack: 40, defense: 10, xpReward: 250, goldReward: 200, description_zh: '致命一击', description_en: 'Lethal strike' },
  { id: 'martial_artist', name_zh: '武术家',     name_en: 'Martial Artist', level: 20, hp: 300, attack: 35, defense: 25, xpReward: 400, goldReward: 300, description_zh: '技艺精湛', description_en: 'Skilled fighter' },
]

// --- Personal Stats ---

export const PERSONAL_STATS = ['STR', 'DEX', 'INT', 'END', 'LCK', 'CHA'] as const
export type PersonalStat = typeof PERSONAL_STATS[number]

export const STAT_LABELS: Record<PersonalStat, { zh: string; en: string }> = {
  STR: { zh: '力量', en: 'Strength' },
  DEX: { zh: '敏捷', en: 'Dexterity' },
  INT: { zh: '智力', en: 'Intelligence' },
  END: { zh: '耐力', en: 'Endurance' },
  LCK: { zh: '运气', en: 'Luck' },
  CHA: { zh: '魅力', en: 'Charisma' },
}

// --- Constants ---

export const ENERGY_MAX = 100
export const ENERGY_RECOVERY_INTERVAL_MS = 5 * 60 * 1000
export const ENERGY_RECOVERY_AMOUNT = 1
export const ADVENTURE_ENERGY_COST = 10
export const TALENT_FIRST_REVEAL_LEVEL = 15
export const TALENT_SECOND_REVEAL_LEVEL = 20
export const TALENT_PERMANENT_CHOICE_LEVEL = 30
export const TALENT_GRACE_PERIOD_DAYS = 7
export const CLOSE_FRIEND_SLOTS_NPC = 5
export const CLOSE_FRIEND_SLOTS_PLAYER = 5
export const MAX_PETS = 1
export const MAX_PARTNERS = 1
export const LIFE_STAGE_COMPRESSED = true
export const CALENDAR_RATIO = 1

export const ADVENTURES: AdventureDef[] = [
  {
    id: 'forest_walk',
    outcome: 'nothing',
    title_zh: '森林散步',
    title_en: 'Forest Walk',
    description_zh: '你走进附近的森林，阳光透过树叶洒落。突然，你听到远处传来奇怪的声音...',
    description_en: 'You walk into the nearby forest, sunlight filtering through the leaves. Suddenly, you hear strange sounds in the distance...',
    energyCost: 10,
    levelRequired: 1,
    skillBonus: 'perception',
    choices: [
      { text_zh: '小心翼翼地前进', text_en: 'Proceed carefully', successChance: 70, xp_reward: 50 },
      { text_zh: '大声呼喊', text_en: 'Call out loudly', successChance: 30, xp_reward: 80 },
      { text_zh: '原路返回', text_en: 'Turn back', successChance: 95, xp_reward: 20 },
    ],
  },
  {
    id: 'abandoned_factory',
    outcome: 'discovery',
    title_zh: '废弃工厂',
    title_en: 'Abandoned Factory',
    description_zh: '你发现了一座废弃的工厂。门半开着，里面似乎有什么东西在闪烁...',
    description_en: 'You find an abandoned factory. The door is half open, and something seems to be flickering inside...',
    energyCost: 10,
    levelRequired: 3,
    skillBonus: 'perception',
    choices: [
      { text_zh: '进入探索', text_en: 'Enter and explore', successChance: 50, xp_reward: 100 },
      { text_zh: '从窗户偷看', text_en: 'Peek through windows', successChance: 80, xp_reward: 40 },
      { text_zh: '离开', text_en: 'Leave', successChance: 95, xp_reward: 10 },
    ],
  },
  {
    id: 'river_fishing',
    outcome: 'lucky',
    title_zh: '河边垂钓',
    title_en: 'River Fishing',
    description_zh: '你来到一条清澈的河边。鱼儿在水中游动，似乎是个钓鱼的好地方...',
    description_en: 'You come to a clear river. Fish swimming in the water seem to make this a good fishing spot...',
    energyCost: 10,
    levelRequired: 1,
    skillBonus: 'fitness',
    choices: [
      { text_zh: '专心钓鱼', text_en: 'Focus on fishing', successChance: 60, xp_reward: 60 },
      { text_zh: '尝试抓鱼', text_en: 'Try to catch fish by hand', successChance: 40, xp_reward: 90 },
      { text_zh: '在河边休息', text_en: 'Rest by the river', successChance: 90, xp_reward: 30 },
    ],
  },
  {
    id: 'night_patrol',
    outcome: 'encounter',
    title_zh: '夜间巡逻',
    title_en: 'Night Patrol',
    description_zh: '夜晚的城市街道空荡荡的。你决定巡逻一圈，看看有没有什么异常...',
    description_en: 'The city streets are empty at night. You decide to patrol and check for anything unusual...',
    energyCost: 10,
    levelRequired: 5,
    skillBonus: 'charisma',
    choices: [
      { text_zh: '仔细检查每个角落', text_en: 'Check every corner carefully', successChance: 55, xp_reward: 80 },
      { text_zh: '快速巡逻', text_en: 'Quick patrol', successChance: 75, xp_reward: 40 },
      { text_zh: '找个地方躲起来观察', text_en: 'Hide and observe', successChance: 65, xp_reward: 60 },
    ],
  },
  {
    id: 'mountain_climb',
    outcome: 'nothing',
    title_zh: '登山探险',
    title_en: 'Mountain Climb',
    description_zh: '你决定攀登附近的一座小山。山路崎岖，但风景优美...',
    description_en: 'You decide to climb a nearby hill. The path is rugged but the scenery is beautiful...',
    energyCost: 10,
    levelRequired: 2,
    skillBonus: 'fitness',
    choices: [
      { text_zh: '走陡峭的捷径', text_en: 'Take the steep shortcut', successChance: 45, xp_reward: 100 },
      { text_zh: '沿着小路慢慢走', text_en: 'Follow the trail slowly', successChance: 85, xp_reward: 40 },
      { text_zh: '在半山腰休息', text_en: 'Rest halfway', successChance: 95, xp_reward: 20 },
    ],
  },
]

// --- Utility Functions ---

export function xpForSkillLevel(level: number): number {
  const tier = SKILL_TIER_TABLE.find(t => level >= t.minLevel && level <= t.maxLevel)
  return tier?.baseXPPerLevel ?? 12000
}

export function skillTierForLevel(level: number): SkillTier {
  const tier = SKILL_TIER_TABLE.find(t => level >= t.minLevel && level <= t.maxLevel)
  return tier?.tier ?? 'novice'
}

export function dailyStudyEfficiency(studyCount: number): number {
  return SKILL_DAILY_EFFICIENCY[Math.min(studyCount, SKILL_DAILY_EFFICIENCY.length - 1)]
}

export function secondsUntilNextEnergy(lastRecoveryAt: string): number {
  const elapsed = (Date.now() - new Date(lastRecoveryAt).getTime()) / 1000
  const remaining = ENERGY_RECOVERY_INTERVAL_MS / 1000 - elapsed
  return Math.max(0, remaining)
}

export function energyRecoveredSince(lastRecoveryAt: string, currentEnergy: number): number {
  const elapsed = (Date.now() - new Date(lastRecoveryAt).getTime()) / 1000
  const recovered = Math.floor(elapsed / (ENERGY_RECOVERY_INTERVAL_MS / 1000))
  return Math.min(recovered, ENERGY_MAX - currentEnergy)
}

export function skillName(skillId: string, locale: 'en' | 'zh'): string {
  const skill = SKILLS.find(s => s.id === skillId)
  if (!skill) return skillId
  return locale === 'zh' ? skill.name_zh : skill.name_en
}

export function jobName(jobId: string, locale: 'en' | 'zh'): string {
  const job = JOBS.find(j => j.id === jobId)
  if (!job) return jobId
  return locale === 'zh' ? job.name_zh : job.name_en
}

export function adventureName(adventureId: string, locale: 'en' | 'zh'): string {
  const adv = ADVENTURES.find(a => a.id === adventureId)
  if (!adv) return adventureId
  return locale === 'zh' ? adv.title_zh : adv.title_en
}

export function enemyName(enemyId: string, locale: 'en' | 'zh'): string {
  const enemy = ENEMIES.find(e => e.id === enemyId)
  if (!enemy) return enemyId
  return locale === 'zh' ? enemy.name_zh : enemy.name_en
}

export function petBreedName(breedId: string, locale: 'en' | 'zh'): string {
  const breed = PET_BREEDS.find(b => b.id === breedId)
  if (!breed) return breedId
  return locale === 'zh' ? breed.name_zh : breed.name_en
}

export function petName(petId: string, locale: 'en' | 'zh'): string {
  const breed = PET_BREEDS.find(b => b.id === petId)
  if (!breed) return petId
  return locale === 'zh' ? breed.name_zh : breed.name_en
}

// --- Talent Data ---

export interface TalentDef2 {
  id: string
  name_zh: string
  name_en: string
  category: TalentCategory
  levelRequired: number
  effect: string
  description_zh: string
  description_en: string
}

export const TALENT_OPTIONS: TalentDef2[] = [
  { id: 'talent_growth_1',  name_zh: '快速成长',   name_en: 'Quick Growth',    category: 'growth',   levelRequired: 15, effect: 'skill_xp_boost_10',     description_zh: '技能经验+10%',   description_en: 'Skill XP +10%' },
  { id: 'talent_growth_2',  name_zh: '学习天才',   name_en: 'Learning Genius', category: 'growth',   levelRequired: 15, effect: 'education_speed_20',    description_zh: '教育速度+20%',   description_en: 'Education speed +20%' },
  { id: 'talent_wealth_1',  name_zh: '商业头脑',   name_en: 'Business Mind',   category: 'wealth',   levelRequired: 15, effect: 'work_income_15',        description_zh: '工作收入+15%',   description_en: 'Work income +15%' },
  { id: 'talent_wealth_2',  name_zh: '投资直觉',   name_en: 'Investment Gut',  category: 'wealth',   levelRequired: 15, effect: 'gold_find_20',          description_zh: '金币获取+20%',   description_en: 'Gold find +20%' },
  { id: 'talent_social_1',  name_zh: '社交达人',   name_en: 'Social Butterfly',category: 'social',   levelRequired: 15, effect: 'encounter_rate_25',     description_zh: '邂逅率+25%',     description_en: 'Encounter rate +25%' },
  { id: 'talent_social_2',  name_zh: '魅力非凡',   name_en: 'Charismatic',     category: 'social',   levelRequired: 15, effect: 'loyalty_gain_20',       description_zh: '好感度获取+20%', description_en: 'Loyalty gain +20%' },
  { id: 'talent_physical_1', name_zh: '铁人体质',  name_en: 'Iron Body',       category: 'physical', levelRequired: 15, effect: 'combat_hp_15',          description_zh: '战斗HP+15%',     description_en: 'Combat HP +15%' },
  { id: 'talent_physical_2', name_zh: '战斗本能',  name_en: 'Combat Instinct',category: 'physical', levelRequired: 15, effect: 'combat_damage_10',      description_zh: '战斗伤害+10%',   description_en: 'Combat damage +10%' },
  { id: 'talent_life_1',     name_zh: '幸运儿',    name_en: 'Lucky One',       category: 'life',     levelRequired: 15, effect: 'adventure_luck_15',     description_zh: '冒险运气+15%',   description_en: 'Adventure luck +15%' },
  { id: 'talent_life_2',     name_zh: '坚韧不拔',  name_en: 'Persistent',      category: 'life',     levelRequired: 15, effect: 'energy_cost_reduce_10', description_zh: '精力消耗-10%',    description_en: 'Energy cost -10%' },
  // Level 20 talents
  { id: 'talent_growth_3',  name_zh: '知识渊博',   name_en: 'Knowledgeable',   category: 'growth',   levelRequired: 20, effect: 'skill_xp_boost_25',     description_zh: '技能经验+25%',   description_en: 'Skill XP +25%' },
  { id: 'talent_wealth_3',  name_zh: '财富自由',   name_en: 'Financial Freedom',category: 'wealth',  levelRequired: 20, effect: 'passive_income_50',     description_zh: '被动收入+50',    description_en: 'Passive income +50' },
  { id: 'talent_social_3',  name_zh: '人脉广阔',   name_en: 'Well Connected',  category: 'social',   levelRequired: 20, effect: 'friend_slot_3',         description_zh: '好友上限+3',     description_en: 'Friend slots +3' },
  { id: 'talent_physical_3', name_zh: '格斗大师',  name_en: 'Fighting Master', category: 'physical', levelRequired: 20, effect: 'combat_damage_25',      description_zh: '战斗伤害+25%',   description_en: 'Combat damage +25%' },
  { id: 'talent_life_3',     name_zh: '全能战士',  name_en: 'All-Rounder',     category: 'life',     levelRequired: 20, effect: 'all_stats_5',           description_zh: '全属性+5',       description_en: 'All stats +5' },
  // Level 30 talents (permanent choice - one only)
  { id: 'talent_master_1',  name_zh: '人生导师',   name_en: 'Life Mentor',     category: 'growth',   levelRequired: 30, effect: 'children_xp_boost_50',  description_zh: '子女经验+50%',   description_en: 'Children XP +50%' },
  { id: 'talent_master_2',  name_zh: '商业帝国',   name_en: 'Business Empire', category: 'wealth',   levelRequired: 30, effect: 'all_income_double',     description_zh: '所有收入翻倍',   description_en: 'All income doubled' },
  { id: 'talent_master_3',  name_zh: '社交之王',   name_en: 'Social King',     category: 'social',   levelRequired: 30, effect: 'partner_loyalty_max',   description_zh: '伴侣忠诚度上限提升', description_en: 'Partner loyalty cap raised' },
  { id: 'talent_master_4',  name_zh: '不朽之躯',   name_en: 'Immortal Body',   category: 'physical', levelRequired: 30, effect: 'combat_invincible_10',  description_zh: '10%几率免疫伤害', description_en: '10% chance to avoid damage' },
  { id: 'talent_master_5',  name_zh: '命运之子',   name_en: 'Child of Destiny',category: 'life',     levelRequired: 30, effect: 'all_adventures_success', description_zh: '冒险必定成功',   description_en: 'All adventures succeed' },
]
