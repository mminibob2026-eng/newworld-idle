-- Migration 004: PRD v0.1 content expansion
-- Adds Starter Town region, 17 new discoveries (20+ target), 2 new contracts (10+ target)

-- ============================================================
-- STARTER TOWN REGION
-- ============================================================
INSERT INTO content_regions (id, name, description, required_level, unlock_cost_gold, exploration_base_time) VALUES
  ('starter_town', 'Starter Town', 'The bustling town square. Perfect for beginner explorers.', 1, 0, 15)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- NEW DISCOVERIES (target: 20+ total)
-- ============================================================
INSERT INTO content_items (id, name, description, category, subcategory, rarity, base_value, tier) VALUES
  ('smooth_pebble', 'Smooth Pebble', 'A perfectly smooth pebble. Satisfying to hold.', 'discovery', 'misc', 'common', 1, 1),
  ('dried_leaf', 'Dried Leaf', 'A crispy leaf with unusual vein patterns.', 'discovery', 'misc', 'common', 1, 1),
  ('rusty_nail', 'Rusty Nail', 'An old rusty nail. Probably not useful anymore.', 'discovery', 'misc', 'common', 1, 1),
  ('colorful_shell', 'Colorful Shell', 'A small shell with rainbow hues.', 'discovery', 'misc', 'common', 2, 1),
  ('fossil_bone', 'Fossil Bone', 'A fossilized bone from some ancient creature.', 'discovery', 'fossil', 'uncommon', 15, 1),
  ('glimmer_dust', 'Glimmer Dust', 'Magical dust that sparkles faintly in the dark.', 'discovery', 'magic', 'uncommon', 20, 1),
  ('carved_stone', 'Carved Stone', 'A stone with primitive carvings of unknown origin.', 'discovery', 'relic', 'uncommon', 25, 1),
  ('moonstone', 'Moonstone', 'A stone that glows faintly under moonlight.', 'discovery', 'magic', 'rare', 80, 1),
  ('star_map', 'Star Map', 'A map of stars that does not match any known sky.', 'discovery', 'knowledge', 'rare', 90, 1),
  ('time_piece', 'Time Piece', 'A broken pocket watch frozen at midnight.', 'discovery', 'relic', 'rare', 100, 1),
  ('phoenix_feather', 'Phoenix Feather', 'A feather said to be from a phoenix. Still warm to touch.', 'discovery', 'magic', 'epic', 250, 1),
  ('void_shard', 'Void Shard', 'A shard of pure darkness that absorbs surrounding light.', 'discovery', 'relic', 'epic', 350, 1),
  ('world_seed', 'World Seed', 'A seed that contains the essence of an entire world.', 'discovery', 'magic', 'legendary', 600, 1),
  ('dragon_scale', 'Dragon Scale', 'A scale from an ancient dragon, still imbued with immense power.', 'discovery', 'relic', 'legendary', 750, 1),
  ('cosmic_orb', 'Cosmic Orb', 'An orb showing the birth and death of stars across eons.', 'discovery', 'relic', 'mythic', 2500, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO content_discoveries (id, name, description, rarity, category, base_value) VALUES
  ('smooth_pebble', 'Smooth Pebble', 'A perfectly smooth pebble. Satisfying to hold.', 'common', 'misc', 1),
  ('dried_leaf', 'Dried Leaf', 'A crispy leaf with unusual vein patterns.', 'common', 'misc', 1),
  ('rusty_nail', 'Rusty Nail', 'An old rusty nail. Probably not useful anymore.', 'common', 'misc', 1),
  ('colorful_shell', 'Colorful Shell', 'A small shell with rainbow hues.', 'common', 'misc', 2),
  ('fossil_bone', 'Fossil Bone', 'A fossilized bone from some ancient creature.', 'uncommon', 'fossil', 15),
  ('glimmer_dust', 'Glimmer Dust', 'Magical dust that sparkles faintly in the dark.', 'uncommon', 'magic', 20),
  ('carved_stone', 'Carved Stone', 'A stone with primitive carvings of unknown origin.', 'uncommon', 'relic', 25),
  ('moonstone', 'Moonstone', 'A stone that glows faintly under moonlight.', 'rare', 'magic', 80),
  ('star_map', 'Star Map', 'A map of stars that does not match any known sky.', 'rare', 'knowledge', 90),
  ('time_piece', 'Time Piece', 'A broken pocket watch frozen at midnight.', 'rare', 'relic', 100),
  ('phoenix_feather', 'Phoenix Feather', 'A feather said to be from a phoenix. Still warm to touch.', 'epic', 'magic', 250),
  ('void_shard', 'Void Shard', 'A shard of pure darkness that absorbs surrounding light.', 'epic', 'relic', 350),
  ('world_seed', 'World Seed', 'A seed that contains the essence of an entire world.', 'legendary', 'magic', 600),
  ('dragon_scale', 'Dragon Scale', 'A scale from an ancient dragon, still imbued with immense power.', 'legendary', 'relic', 750),
  ('cosmic_orb', 'Cosmic Orb', 'An orb showing the birth and death of stars across eons.', 'mythic', 'relic', 2500)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- REGION DISCOVERIES (assigned to appropriate regions)
-- ============================================================
INSERT INTO content_region_discoveries (region_id, discovery_id, weight, min_exploration_level) VALUES
  -- Starter Town (beginners)
  ('starter_town', 'smooth_pebble', 100, 1),
  ('starter_town', 'dried_leaf', 80, 1),
  ('starter_town', 'rusty_nail', 60, 1),
  ('starter_town', 'colorful_shell', 40, 1),
  ('starter_town', 'glimmer_dust', 15, 3),
  -- Green Plains additions
  ('green_plains', 'colorful_shell', 30, 1),
  ('green_plains', 'fossil_bone', 15, 5),
  ('green_plains', 'carved_stone', 10, 8),
  -- Whisper Forest additions
  ('whisper_forest', 'glimmer_dust', 20, 3),
  ('whisper_forest', 'moonstone', 8, 8),
  ('whisper_forest', 'star_map', 3, 15),
  -- Rocky Highlands additions
  ('rocky_highlands', 'fossil_bone', 25, 3),
  ('rocky_highlands', 'carved_stone', 20, 5),
  ('rocky_highlands', 'time_piece', 5, 15),
  ('rocky_highlands', 'void_shard', 2, 20),
  -- Crystal Lake additions
  ('crystal_lake', 'moonstone', 15, 5),
  ('crystal_lake', 'phoenix_feather', 3, 10),
  ('crystal_lake', 'world_seed', 1, 25),
  -- Red Desert additions
  ('red_desert', 'star_map', 10, 5),
  ('red_desert', 'time_piece', 8, 8),
  ('red_desert', 'phoenix_feather', 3, 15),
  ('red_desert', 'dragon_scale', 1, 25),
  ('red_desert', 'cosmic_orb', 1, 35)
ON CONFLICT (region_id, discovery_id) DO NOTHING;

-- ============================================================
-- NEW CONTRACTS (target: 10+ total)
-- ============================================================
INSERT INTO content_contracts (id, contract_type, title, description, requirement_item, min_qty, max_qty, gold_reward_per_unit, knowledge_reward, faction, min_level) VALUES
  ('equipment_order_1', 'delivery', 'Equipment Request', 'The guard needs proper equipment for training.', 'equipment', 5, 30, 10, 25, 'frontier_council', 10),
  ('potion_supply_1', 'delivery', 'Potion Supply', 'The healer needs potions for the clinic.', 'potions', 10, 50, 12, 30, 'scholars_society', 15)
ON CONFLICT (id) DO NOTHING;
