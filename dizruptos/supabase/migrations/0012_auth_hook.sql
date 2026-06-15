-- 0012 — Auth Hook + first-user provisioning (the "real auth, end-to-end" piece).
--
-- This is the one server-side step that makes real authentication enforce the
-- SAME RBAC + RLS the app already relies on. Two things:
--   1. custom_access_token_hook — mints `app_metadata.role` and `app_metadata.org_id`
--      into every issued JWT, read from public.users. `auth_role()` (0001) and the
--      org RLS (0007) already read these claims, so once this runs, real users are
--      governed exactly like the demo personas were.
--   2. handle_new_auth_user — when someone signs up (magic-link / OAuth), auto-create
--      their public.users profile (role 'employee', attached to the seeded org) so
--      the very first real user works end-to-end with no manual SQL.
--
-- ONE dashboard step after applying this migration:
--   Supabase → Authentication → Hooks → "Customize Access Token (JWT) Claims"
--   → select  public.custom_access_token_hook  → Enable.

-- ---------------------------------------------------------------- JWT claims hook
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  v_role text;
  v_org  uuid;
begin
  select role, org_id
    into v_role, v_org
  from public.users
  where id = (event->>'user_id')::uuid
    and deleted_at is null;

  claims := coalesce(event->'claims', '{}'::jsonb);
  if claims->'app_metadata' is null then
    claims := jsonb_set(claims, '{app_metadata}', '{}'::jsonb);
  end if;

  -- default role 'employee' so a brand-new account is least-privilege, never null
  claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(coalesce(v_role, 'employee')));
  if v_org is not null then
    claims := jsonb_set(claims, '{app_metadata, org_id}', to_jsonb(v_org));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- the auth server runs the hook; nobody else may call it
grant usage  on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
-- the hook needs to read the role/org off the profile row
grant select (id, role, org_id, deleted_at) on table public.users to supabase_auth_admin;

-- ----------------------------------------------------- first-user auto-provision
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select id into v_org from public.organizations order by created_at asc limit 1;

  insert into public.users (id, email, full_name, role, org_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'employee',
    v_org
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- org-scope claim helper (mirrors auth_role() in 0001) for RLS that needs the org.
create or replace function public.auth_org()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', '')::uuid;
$$;
