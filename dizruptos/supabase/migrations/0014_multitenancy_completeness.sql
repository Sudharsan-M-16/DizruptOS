-- Migration 0014: Multi-tenancy completeness.
-- Corrected version — idempotent policies, VALUES alias fixes, safe DO blocks.
--
-- Adds:
--   • tenant_settings: per-tenant key/value config (SSO, SCIM, feature flags)
--   • tenant_audit: super-admin op log
--   • org_id to remaining tables (recommendations, decision_evidence, entity_embeddings)
--   • title / location / timezone columns on users (employee model split fix)
-- ---------------------------------------------------------------------------


-- 1. Per-tenant settings table.
CREATE TABLE IF NOT EXISTS tenant_settings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key          TEXT NOT NULL,
  value        TEXT,
  is_secret    BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by   UUID REFERENCES users(id),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, key)
);

ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

-- Drop policies before recreating (idempotent).
DROP POLICY IF EXISTS tenant_settings_read  ON tenant_settings;
DROP POLICY IF EXISTS tenant_settings_write ON tenant_settings;

-- Admins can read all non-secret settings for their org.
CREATE POLICY tenant_settings_read ON tenant_settings
  FOR SELECT TO authenticated
  USING (org_id = auth_org() AND (NOT is_secret OR auth_role() = 'admin'));

-- Admins can write settings for their org.
CREATE POLICY tenant_settings_write ON tenant_settings
  FOR ALL TO authenticated
  USING  (org_id = auth_org() AND auth_role() = 'admin')
  WITH CHECK (org_id = auth_org() AND auth_role() = 'admin');

COMMENT ON TABLE tenant_settings IS
  'Per-tenant key/value configuration (SSO URLs, SCIM tokens, branding, feature flags).';


-- 2. Seed default settings for every existing org.
--    Uses explicit casts to avoid type-inference issues with the VALUES clause.
INSERT INTO tenant_settings (org_id, key, value, is_secret, updated_at)
SELECT
  orgs.id,
  d.s_key,
  d.s_value,
  d.s_secret,
  NOW()
FROM organizations AS orgs
CROSS JOIN (
  VALUES
    ('sso.enabled'::text,            'false'::text,      FALSE::boolean),
    ('scim.enabled',                 'false',             FALSE),
    ('idle_lock_minutes',            '10',                FALSE),
    ('branding.product_name',        'DizruptOS',         FALSE),
    ('feature.monte_carlo',          'true',              FALSE),
    ('feature.llm_copilot',          'true',              FALSE),
    ('feature.graph_traversal',      'true',              FALSE)
) AS d(s_key, s_value, s_secret)
ON CONFLICT (org_id, key) DO NOTHING;


-- 3. Tenant provisioning audit (super-admin ops only — no RLS for authenticated).
CREATE TABLE IF NOT EXISTS tenant_audit (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id    UUID NOT NULL,
  actor_id  UUID,
  action    TEXT NOT NULL,
  detail    JSONB,
  at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tenant_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_audit_deny ON tenant_audit;
CREATE POLICY tenant_audit_deny ON tenant_audit
  FOR ALL TO authenticated USING (FALSE);

GRANT SELECT, INSERT ON tenant_audit   TO service_role;
GRANT SELECT         ON tenant_settings TO authenticated;
GRANT INSERT, UPDATE ON tenant_settings TO authenticated;


-- 4. Add org_id to tables that are missing it (all idempotent).

-- recommendations (migration 0010)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recommendations' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE recommendations ADD COLUMN org_id UUID REFERENCES organizations(id);
    UPDATE recommendations
      SET org_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
      WHERE org_id IS NULL;
  END IF;
END $$;

-- decision_evidence (migration 0011)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'decision_evidence' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE decision_evidence ADD COLUMN org_id UUID REFERENCES organizations(id);
    UPDATE decision_evidence
      SET org_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
      WHERE org_id IS NULL;
  END IF;
END $$;

-- entity_embeddings (migration 0001)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entity_embeddings' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE entity_embeddings ADD COLUMN org_id UUID REFERENCES organizations(id);
    UPDATE entity_embeddings
      SET org_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
      WHERE org_id IS NULL;
  END IF;
END $$;


-- 5. Add title / location / timezone to users (resolves employee model split).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'title'
  ) THEN
    ALTER TABLE users
      ADD COLUMN title    TEXT,
      ADD COLUMN location TEXT,
      ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;
END $$;

COMMENT ON COLUMN users.title    IS 'Job title, e.g. "Staff Engineer"';
COMMENT ON COLUMN users.location IS 'Office / remote, e.g. "NYC" or "Remote – EU"';
COMMENT ON COLUMN users.timezone IS 'IANA timezone, e.g. "America/New_York"';


-- 6. Backfill title / location / timezone from role (safe no-op if already set).
UPDATE users
SET
  title = CASE role
    WHEN 'admin'           THEN 'Engineering Manager'
    WHEN 'executive'       THEN 'Chief Executive Officer'
    WHEN 'dept_head'       THEN 'Head of Engineering'
    WHEN 'project_manager' THEN 'Senior Project Manager'
    ELSE                        'Software Engineer'
  END,
  location = 'San Francisco, CA',
  timezone = 'America/Los_Angeles'
WHERE title IS NULL;
