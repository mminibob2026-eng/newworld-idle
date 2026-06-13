-- Migration 007: Activity limit race condition fix + daily contract limits

-- 1. Professions: Add denormalized category + DB-level unique partial index
-- This eliminates race conditions by letting PostgreSQL enforce 1 active per category.
ALTER TABLE professions ADD COLUMN IF NOT EXISTS category TEXT;

UPDATE professions p
SET category = cp.category
FROM content_professions cp
WHERE p.profession = cp.id AND p.category IS NULL;

ALTER TABLE professions ALTER COLUMN category SET NOT NULL;

-- Clean up existing duplicates (e.g. multiple active gathering profs on same char)
-- Keep only the most recently started active row per (character_id, category)
WITH dupes AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY character_id, category ORDER BY started_at DESC NULLS LAST
  ) AS rn
  FROM professions
  WHERE is_active = true
)
DELETE FROM professions
WHERE id IN (SELECT id FROM dupes WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS idx_professions_one_active_per_cat
ON professions (character_id, category)
WHERE is_active = true;

-- 2. Characters: Add daily contract tracking
ALTER TABLE characters ADD COLUMN IF NOT EXISTS contracts_completed_today INTEGER NOT NULL DEFAULT 0;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS contracts_reset_date DATE NOT NULL DEFAULT CURRENT_DATE;
