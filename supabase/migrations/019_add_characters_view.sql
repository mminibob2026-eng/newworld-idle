-- Create a view so PostgREST schema cache can find 'characters'
-- This is needed because old auth triggers/policies reference it
CREATE OR REPLACE VIEW characters AS SELECT * FROM new_characters;

-- Also re-grant permissions
GRANT SELECT ON characters TO anon;
GRANT SELECT ON characters TO authenticated;
GRANT ALL ON characters TO service_role;
