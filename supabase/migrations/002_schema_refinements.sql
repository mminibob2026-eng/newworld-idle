-- Migration 002: Schema refinements matching user's database structure
-- Adds character_inventory, player_discoveries, and refined activities

-- ============================================================
-- CHARACTER INVENTORY (per-character items)
-- ============================================================
CREATE TABLE character_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  quantity BIGINT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(character_id, item_id)
);

CREATE INDEX idx_char_inv_character ON character_inventory(character_id);

ALTER TABLE character_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "char_inv_own" ON character_inventory
  FOR ALL USING (
    EXISTS (SELECT 1 FROM characters WHERE characters.id = character_inventory.character_id AND characters.account_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM characters WHERE characters.id = character_inventory.character_id AND characters.account_id = auth.uid())
  );

-- ============================================================
-- PLAYER DISCOVERIES (account-wide)
-- ============================================================
CREATE TABLE player_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  discovery_id TEXT NOT NULL REFERENCES content_discoveries(id) ON DELETE CASCADE,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, discovery_id)
);

CREATE INDEX idx_player_disc_account ON player_discoveries(account_id);

ALTER TABLE player_discoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_disc_own" ON player_discoveries
  FOR ALL USING (account_id = auth.uid()) WITH CHECK (account_id = auth.uid());

-- ============================================================
-- REFINED: ADD REGION UNLOCK COST TO EXISTING TABLE
-- ============================================================
-- (content_regions already has unlock_cost_gold, this is fine)

-- ============================================================
-- FUNCTION: Transfer between character inventory and shared storage
-- ============================================================
CREATE OR REPLACE FUNCTION transfer_to_storage(
  p_character_id UUID,
  p_item_id TEXT,
  p_quantity BIGINT
)
RETURNS JSONB AS $$
DECLARE
  v_account_id UUID;
  v_inv_qty BIGINT;
BEGIN
  SELECT account_id INTO v_account_id FROM characters WHERE id = p_character_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Character not found');
  END IF;

  SELECT quantity INTO v_inv_qty FROM character_inventory
    WHERE character_id = p_character_id AND item_id = p_item_id;

  IF NOT FOUND OR v_inv_qty < p_quantity THEN
    RETURN jsonb_build_object('error', 'Not enough items');
  END IF;

  -- Deduct from character inventory
  UPDATE character_inventory SET quantity = quantity - p_quantity,
    updated_at = NOW()
    WHERE character_id = p_character_id AND item_id = p_item_id;

  -- Add to shared storage
  INSERT INTO storage (account_id, item_type, item_id, quantity)
    VALUES (v_account_id, 'item', p_item_id, p_quantity)
    ON CONFLICT (account_id, item_type, item_id)
    DO UPDATE SET quantity = storage.quantity + p_quantity, updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'transferred', p_quantity);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Add gold to character
-- ============================================================
CREATE OR REPLACE FUNCTION add_gold(
  p_character_id UUID,
  p_amount BIGINT
)
RETURNS JSONB AS $$
BEGIN
  UPDATE characters SET gold = gold + p_amount
    WHERE id = p_character_id;
  RETURN jsonb_build_object('success', true, 'gold_added', p_amount);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Add knowledge to character
-- ============================================================
CREATE OR REPLACE FUNCTION add_knowledge(
  p_character_id UUID,
  p_amount BIGINT
)
RETURNS JSONB AS $$
BEGIN
  UPDATE characters SET knowledge = knowledge + p_amount
    WHERE id = p_character_id;
  RETURN jsonb_build_object('success', true, 'knowledge_added', p_amount);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Get all active activities for offline processing
-- ============================================================
CREATE OR REPLACE FUNCTION get_active_activities(
  p_account_id UUID
)
RETURNS TABLE(
  character_id UUID,
  character_name TEXT,
  profession TEXT,
  started_at TIMESTAMPTZ,
  finish_at TIMESTAMPTZ,
  elapsed_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    p.profession,
    p.started_at,
    p.finish_at,
    EXTRACT(EPOCH FROM (NOW() - p.started_at))::INTEGER
  FROM characters c
  JOIN professions p ON p.character_id = c.id
  WHERE c.account_id = p_account_id
    AND p.is_active = TRUE
    AND p.finish_at <= NOW();
END;
$$ LANGUAGE plpgsql;
