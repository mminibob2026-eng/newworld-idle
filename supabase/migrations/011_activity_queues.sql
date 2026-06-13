-- Migration 011: Activity queue system
-- 1 active + 1 queued per category (gather/craft/explore)

-- ============================================================
-- PROFESSIONS QUEUE
-- ============================================================
ALTER TABLE professions ADD COLUMN IF NOT EXISTS is_queued BOOLEAN NOT NULL DEFAULT false;

DROP INDEX IF EXISTS idx_professions_one_active_per_cat;
CREATE UNIQUE INDEX IF NOT EXISTS idx_professions_one_active_per_cat
  ON professions (character_id, category) WHERE is_active = true AND NOT is_queued;
CREATE UNIQUE INDEX IF NOT EXISTS idx_professions_one_queued_per_cat
  ON professions (character_id, category) WHERE is_queued = true AND NOT is_active;

-- ============================================================
-- EXPLORATION QUEUE
-- ============================================================
ALTER TABLE exploration ADD COLUMN IF NOT EXISTS is_queued BOOLEAN NOT NULL DEFAULT false;

-- Allow only 1 active exploration per character
DROP INDEX IF EXISTS idx_exploration_active;
CREATE INDEX IF NOT EXISTS idx_exploration_active ON exploration(character_id) WHERE completed = false AND NOT is_queued;
CREATE UNIQUE INDEX IF NOT EXISTS idx_exploration_one_active
  ON exploration (character_id) WHERE completed = false AND NOT is_queued;
CREATE UNIQUE INDEX IF NOT EXISTS idx_exploration_one_queued
  ON exploration (character_id) WHERE is_queued = true AND NOT completed;
