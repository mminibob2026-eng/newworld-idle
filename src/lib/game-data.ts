export interface Item {
  id: string
  name: string
  description: string
  category: ItemCategory
  subcategory: string
  rarity: Rarity
  icon_path: string
  base_value: number
  tier: number
  is_tradeable: boolean
}

export type ItemCategory = 'gathering' | 'production' | 'discovery' | 'consumable' | 'equipment'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'

export interface Profession {
  id: string
  name: string
  description: string
  category: ProfessionCategory
  icon_path: string
  base_xp_per_action: number
  base_time_seconds: number
  unlocks_at_level: number
}

export type ProfessionCategory = 'gathering' | 'production' | 'knowledge'

export interface Region {
  id: string
  name: string
  description: string
  icon_path: string
  required_level: number
  unlock_cost_gold: number
  exploration_base_time: number
}

export interface Discovery {
  id: string
  name: string
  description: string
  rarity: Rarity
  icon_path: string
  category: string
  base_value: number
}

export interface Contract {
  id: string
  contract_type: string
  title: string
  description: string
  requirement_item: string
  min_qty: number
  max_qty: number
  gold_reward_per_unit: number
  knowledge_reward: number
  faction: string
  min_level: number
}

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#888',
  uncommon: '#0f0',
  rare: '#0ff',
  epic: '#f0f',
  legendary: '#ff0',
  mythic: '#f44',
}

export const XP_FOR_LEVEL = (level: number): number => {
  return Math.floor(100 * Math.pow(level, 1.5))
}

export const ATTRIBUTE_LABELS: Record<string, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  intelligence: 'INT',
  endurance: 'END',
  luck: 'LCK',
  charisma: 'CHA',
}

export const FACTIONS: Record<string, string> = {
  merchants_guild: 'Merchants Guild',
  explorers_league: 'Explorers League',
  beast_keepers: 'Beast Keepers',
  scholars_society: 'Scholars Society',
  frontier_council: 'Frontier Council',
}
