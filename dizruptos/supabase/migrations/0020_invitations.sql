-- Invitation system + org creation self-service
-- Created: 2026-06-21

-- ── Invitations table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       text NOT NULL,
  role        text NOT NULL DEFAULT 'employee'
                CHECK (role IN ('admin','executive','dept_head','project_manager','team_lead','employee')),
  token       text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64url'),
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','declined','expired','revoked')),
  invited_by  uuid NOT NULL REFERENCES users(id),
  accepted_by uuid REFERENCES users(id),
  message     text,
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate pending invites for same email+org
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_pending_email_org
  ON invitations(org_id, lower(email)) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_invitations_token
  ON invitations(token) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_invitations_org_status
  ON invitations(org_id, status, created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_invitation_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_invitation_updated_at ON invitations;
CREATE TRIGGER trg_invitation_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_invitation_timestamp();

-- RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inv_org_read ON invitations;
CREATE POLICY inv_org_read ON invitations FOR SELECT
  USING (org_id = auth_org());

DROP POLICY IF EXISTS inv_org_insert ON invitations;
CREATE POLICY inv_org_insert ON invitations FOR INSERT
  WITH CHECK (
    org_id = auth_org()
    AND auth_role() IN ('admin','dept_head','project_manager')
  );

DROP POLICY IF EXISTS inv_org_update ON invitations;
CREATE POLICY inv_org_update ON invitations FOR UPDATE
  USING (org_id = auth_org() AND auth_role() IN ('admin','dept_head','project_manager'));

-- ── Update handle_new_auth_user trigger (0012 extension) ───────────────────
-- If new user's app_metadata contains org_id (set by invite flow), use it.
-- Otherwise, create a new org from their email domain and make them admin.
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_org_id  uuid;
  v_role    text;
  v_domain  text;
  v_slug    text;
  v_org_name text;
BEGIN
  -- Extract org_id + role from app_metadata (set by invite or JWT hook)
  v_org_id := (NEW.raw_app_meta_data->>'org_id')::uuid;
  v_role   := COALESCE(NEW.raw_app_meta_data->>'role', 'employee');

  -- If no org assigned via invite, create a new org from email domain
  IF v_org_id IS NULL THEN
    v_domain   := split_part(NEW.email, '@', 2);
    v_slug     := lower(regexp_replace(v_domain, '[^a-z0-9]', '-', 'g'));
    v_org_name := initcap(split_part(v_domain, '.', 1));
    v_role     := 'admin'; -- first user in an org is always admin

    INSERT INTO organizations (name, slug)
    VALUES (v_org_name, v_slug)
    ON CONFLICT (slug) DO UPDATE SET slug = organizations.slug || '-' || floor(random()*9000+1000)::text
    RETURNING id INTO v_org_id;
  END IF;

  -- Upsert into public.users
  INSERT INTO users (id, email, full_name, role, org_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_role,
    v_org_id
  )
  ON CONFLICT (id) DO UPDATE
    SET email    = EXCLUDED.email,
        org_id   = COALESCE(users.org_id, EXCLUDED.org_id),
        role     = COALESCE(users.role, EXCLUDED.role);

  -- Mark invitation accepted if token is in metadata
  DECLARE
    v_token text := NEW.raw_app_meta_data->>'invitation_token';
  BEGIN
    IF v_token IS NOT NULL THEN
      UPDATE invitations
        SET status      = 'accepted',
            accepted_by = NEW.id,
            updated_at  = now()
        WHERE token = v_token AND status = 'pending';
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NEW;
END;
$$;

-- Seed default tenant_settings for newly-created orgs
CREATE OR REPLACE FUNCTION seed_tenant_settings()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO tenant_settings (org_id, key, value)
  VALUES
    (NEW.id, 'sso.enabled',            'false'),
    (NEW.id, 'scim.enabled',           'false'),
    (NEW.id, 'branding.product_name',  to_json(NEW.name)),
    (NEW.id, 'onboarding.completed',   'false'),
    (NEW.id, 'onboarding.step',        '1')
  ON CONFLICT (org_id, key) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_tenant_settings ON organizations;
CREATE TRIGGER trg_seed_tenant_settings
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION seed_tenant_settings();
