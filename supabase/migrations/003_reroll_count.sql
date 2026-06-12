-- Add reroll_count to contracts for gold sink
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS reroll_count INTEGER NOT NULL DEFAULT 0;
