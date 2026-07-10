-- Migration 0017: Per-tenant SSO configuration in DB (not env vars).
--
-- Enterprise customers each have their own IdP (Okta, Azure AD, Google Workspace,
-- Ping, etc.). Storing SSO config per-tenant in the DB means:
--   1. No redeploy needed to onboard a new enterprise customer.
--   2. Secrets can be rotated without touching env vars.
--   3. Tenant suspension instantly invalidates all SSO logins for that org.
--   4. The SCIM provisioning API can dynamically configure SSO on signup.
--
-- Architecture: this table is only readable/writable via the service-role key
-- (admin API). The SSO flow reads these rows server-side — never exposed client-side.

create table if not exists public.tenant_sso_configs (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null unique references public.organizations(id) on delete cascade,

  -- Protocol
  protocol        text not null check (protocol in ('saml', 'oidc')),

  -- SAML SP-initiated (filled when protocol = 'saml')
  saml_idp_entity_id     text,
  saml_idp_sso_url       text,
  saml_idp_certificate   text,    -- PEM, stored encrypted in production
  saml_sp_entity_id      text,
  saml_attribute_email   text default 'email',
  saml_attribute_role    text default 'role',

  -- OIDC / OAuth2 (filled when protocol = 'oidc')
  oidc_issuer         text,
  oidc_client_id      text,
  oidc_client_secret  text,   -- encrypted in production via Supabase vault
  oidc_scopes         text default 'openid email profile',

  -- Provisioning
  scim_token_hash     text,   -- bcrypt hash of the SCIM bearer token
  auto_provision      boolean default true,
  default_role        text default 'employee',

  -- Status
  enabled             boolean default true,
  verified_at         timestamptz,  -- set when IdP round-trip is confirmed
  last_login_at       timestamptz,

  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Tenant admins cannot read their own SSO secrets client-side
alter table public.tenant_sso_configs enable row level security;

-- Only service-role key can read/write (accessed via /api/v1/admin only)
create policy "tenant_sso_service_only" on public.tenant_sso_configs
  for all using (false) with check (false);

-- Tenant suspension — add suspended_at to organizations if missing
alter table public.organizations
  add column if not exists suspended_at  timestamptz,
  add column if not exists suspend_reason text;

-- View: active (non-suspended) organizations
create or replace view public.active_organizations as
  select * from public.organizations where suspended_at is null;

-- RLS is inherited; the view adds no new access paths

-- Index for SSO config lookups by org
create index if not exists idx_sso_config_org on public.tenant_sso_configs (org_id) where enabled = true;
