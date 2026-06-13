-- Migration 006: Discovery System Enhancement
-- Adds lore text to discoveries, region info tracking for discovery timeline

-- Add lore column to content_discoveries
ALTER TABLE content_discoveries ADD COLUMN IF NOT EXISTS lore TEXT NOT NULL DEFAULT '';

-- Add region_id to player_discoveries for timeline
ALTER TABLE player_discoveries ADD COLUMN IF NOT EXISTS region_id TEXT REFERENCES content_regions(id) ON DELETE SET NULL;
ALTER TABLE player_discoveries ADD COLUMN IF NOT EXISTS lore TEXT NOT NULL DEFAULT '';

-- Seed lore text for all discoveries
UPDATE content_discoveries SET lore = 'A perfectly smooth pebble worn down by countless years of wind and water. It feels warm in your hand, as if it carries the memory of the sun.' WHERE id = 'smooth_pebble';
UPDATE content_discoveries SET lore = 'This leaf fell from no ordinary tree. Its veins trace patterns that look like ancient runes when held up to the light.' WHERE id = 'dried_leaf';
UPDATE content_discoveries SET lore = 'Despite its appearance, this nail shows no signs of rust when examined closely. The metal is unlike any known alloy.' WHERE id = 'rusty_nail';
UPDATE content_discoveries SET lore = 'The colors shift and dance across this shell like a living aurora. No two angles show the same hue.' WHERE id = 'colorful_shell';
UPDATE content_discoveries SET lore = 'A worn coin bearing the face of a ruler no history book remembers. The date is worn away, but the metal is unmistakably ancient.' WHERE id = 'old_coin';
UPDATE content_discoveries SET lore = 'This coin bears the mark of a civilization that fell before recorded history. The metal alloy is unlike anything in use today.' WHERE id = 'ancient_coin_disc';
UPDATE content_discoveries SET lore = 'Though it appears to be a simple rock, there is something undeniably pleasing about its symmetry. You feel calmer just holding it.' WHERE id = 'pretty_rock';
UPDATE content_discoveries SET lore = 'The button seems to be made of a material that neither rusts nor tarnishes. Tiny symbols are etched on its underside.' WHERE id = 'shiny_button';
UPDATE content_discoveries SET lore = 'The egg pulses with a gentle warmth, and occasionally you can hear a faint rhythmic sound from within. Whatever is inside, it is alive.' WHERE id = 'mysterious_egg_disc';
UPDATE content_discoveries SET lore = 'The crystal resonates at a frequency that feels more musical than physical. When you hold it, your thoughts seem clearer.' WHERE id = 'strange_crystal_disc';
UPDATE content_discoveries SET lore = 'The feather is impossibly light and seems to shimmer with an inner light. It is warm to the touch.' WHERE id = 'golden_feather';
UPDATE content_discoveries SET lore = 'This relic hums with a power that feels older than the world itself. Writing on its surface shifts and rearranges as you watch.' WHERE id = 'ancient_relic';
UPDATE content_discoveries SET lore = 'Inside the orb, entire galaxies are born and die in endless cycles. You could watch it for hours and never see the same pattern twice.' WHERE id = 'primordial_orb';
UPDATE content_discoveries SET lore = 'This bone fragment shows signs of being worked by intelligent hands, but the creature it came from has no known modern counterpart.' WHERE id = 'fossil_bone';
UPDATE content_discoveries SET lore = 'The dust sparkles even in complete darkness. It seems to respond to your presence, swirling gently when you breathe on it.' WHERE id = 'glimmer_dust';
UPDATE content_discoveries SET lore = 'The carvings tell a story of a great migration, but the language is unlike any known to the scholars. The figures move when you are not looking directly at them.' WHERE id = 'carved_stone';
UPDATE content_discoveries SET lore = 'Under moonlight, the stone glows with a soft blue light and reveals star patterns that do not match any known constellation.' WHERE id = 'moonstone';
UPDATE content_discoveries SET lore = 'The map shows a night sky that has never been seen from any known world. Someone or something mapped the stars from a place beyond the void.' WHERE id = 'star_map';
UPDATE content_discoveries SET lore = 'The watch is frozen at exactly midnight, but its gears continue to move in reverse. It counts down to something.' WHERE id = 'time_piece';
UPDATE content_discoveries SET lore = 'The feather is still warm, as if it was just shed. Ancient texts speak of phoenixes as myth, yet here is proof.' WHERE id = 'phoenix_feather';
UPDATE content_discoveries SET lore = 'This shard absorbs all light that touches it, creating a perfect void in the air around it. It is unnervingly cold.' WHERE id = 'void_shard';
UPDATE content_discoveries SET lore = 'The seed is impossibly heavy for its size. Within it, you sense the potential for an entire world to grow.' WHERE id = 'world_seed';
UPDATE content_discoveries SET lore = 'The scale still carries the residual power of its ancient owner. It is warm and seems to resonate with a deep, primal authority.' WHERE id = 'dragon_scale';
UPDATE content_discoveries SET lore = 'The orb contains a miniature universe. Stars are born and die within it, and some say they can see their own fate reflected in its depths.' WHERE id = 'cosmic_orb';
