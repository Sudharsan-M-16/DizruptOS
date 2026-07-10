# DizruptOS — Operational Activation Guide

> Everything here is **external operational work** — not code. All backend features
> are code-complete; this guide walks the steps to flip each one live in production.

---

## Table of Contents

1. [Supabase Auth (real users + email/password)](#1-supabase-auth)
2. [Supabase Auth Hook (role & org injection)](#2-auth-hook)
3. [SAML 2.0 SSO (node-saml)](#3-saml-sso)
4. [OIDC / Google Workspace SSO](#4-oidc-sso)
5. [Sentry Error Monitoring](#5-sentry)
6. [Jira Ingestion Connector](#6-jira)
7. [Linear Ingestion Connector](#7-linear)
8. [GitHub Ingestion Connector](#8-github)
9. [SCIM 2.0 User Provisioning](#9-scim)
10. [Prometheus + Grafana Metrics](#10-metrics)
11. [SOC 2 Type II Audit Process](#11-soc2)
12. [Production Deployment (Vercel)](#12-vercel)
13. [Going from Demo → Real Users](#13-real-users)

---

## 1. Supabase Auth

**What's already code-complete:** `lib/auth-supabase.ts`, `components/auth/real-auth-form.tsx`,
`app/auth/callback/route.ts`, middleware that accepts either Supabase sessions OR `dz_session`
cookie (so demo always works), and migration `0012_auth_hook.sql`.

### Steps

1. **Create a Supabase project** at [supabase.com](https://supabase.com) → New Project.

2. **Set your environment variables** in `dizruptos/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
   SUPABASE_SERVICE_ROLE_KEY=eyJh...
   DATABASE_URL=postgresql://postgres.your-ref:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
   > **Critical:** `DATABASE_URL` must be the **Session Pooler** URI (port 5432,
   > `pooler.supabase.com`). The direct `db.*.supabase.co:5432` is IPv6-only and
   > won't work on most hosting environments.

3. **Apply all migrations** in order:
   ```sh
   cd dizruptos
   npx supabase db push
   # or manually via supabase dashboard > SQL editor, run files in order:
   # supabase/migrations/0001_*.sql through 0014_*.sql
   ```

4. **Enable Email Auth** in Supabase Dashboard → Authentication → Providers → Email.
   - Enable "Confirm email" if you want verified emails.
   - Set "Site URL" to your production domain.
   - Add `http://localhost:3000` to "Redirect URLs" for local dev.

5. **Test:** visit `/auth` — the `real-auth-form.tsx` will show when
   `NEXT_PUBLIC_SUPABASE_URL` is set. Sign up creates a user in `auth.users`.

---

## 2. Auth Hook

The auth hook (`supabase/migrations/0012_auth_hook.sql`) mints custom JWT claims
(`role`, `org_id`) and auto-provisions new users into the `users` table.

### Steps

1. **Apply migration 0012** (included in `db push` above, but double-check it ran):
   ```sql
   -- In Supabase SQL editor, verify:
   SELECT routine_name FROM information_schema.routines
   WHERE routine_name = 'custom_access_token_hook';
   ```

2. **Enable the hook** in Supabase Dashboard:
   - Go to **Authentication → Hooks**
   - Under "Custom Access Token Hook", select `public.custom_access_token_hook`
   - Save.

3. **Grant permissions** (should be in the migration, but verify):
   ```sql
   GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
   GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
   ```

4. **Test:** after sign-in, decode the JWT at [jwt.io](https://jwt.io) — you should
   see `app_metadata.role` and `app_metadata.org_id` in the payload.

---

## 3. SAML 2.0 SSO

**What's code-complete:** `app/api/auth/sso/route.ts` (IdP redirect) and
`app/api/auth/sso/acs/route.ts` (SAML ACS handler). Both use `node-saml`.

### Steps

1. **Install node-saml** (it's listed in dependencies, so `npm install` covers it):
   ```sh
   npm install node-saml
   ```

2. **Get your SP metadata** from your IdP admin panel (Okta, Azure AD, etc.).
   Each IdP will give you:
   - IdP SSO URL (the redirect target)
   - IdP Entity ID (issuer)
   - X.509 certificate

3. **Set environment variables** in `.env.local`:
   ```
   SSO_CONFIG_ACME={"entryPoint":"https://acme.okta.com/app/xxx/sso/saml","issuer":"https://acme.okta.com","cert":"MIIC..."}
   ```
   The key after `SSO_CONFIG_` is the **org slug** (lowercase). Multiple orgs =
   multiple `SSO_CONFIG_<slug>` vars.

4. **Register the ACS URL** with your IdP:
   ```
   https://your-domain.com/api/auth/sso/acs
   ```
   The SP Entity ID to register: `https://your-domain.com`

5. **Test:** navigate to `/api/auth/sso?org=acme` — you should be redirected to
   the Okta/Azure login page. After login, you'll be posted back to `/api/auth/sso/acs`.

6. **Wire to Supabase session** (post-MVP): the ACS handler currently creates a
   `dz_session` cookie. To fully integrate with Supabase Auth, exchange the SAML
   assertion for a Supabase Admin API `createUser` + `createSession` call.

---

## 4. OIDC / Google Workspace SSO

Simpler than SAML; use Supabase's built-in OIDC support.

### Steps

1. In Supabase Dashboard → Authentication → Providers → Google:
   - Enable Google provider
   - Add OAuth 2.0 Client ID + Secret (from Google Cloud Console)

2. In Google Cloud Console → APIs & Services → Credentials:
   - Create OAuth 2.0 Client ID (Web Application)
   - Authorized redirect URI: `https://your-ref.supabase.co/auth/v1/callback`

3. The existing `real-auth-form.tsx` includes a "Sign in with Google" button.
   Just add `NEXT_PUBLIC_SUPABASE_URL` and the button activates.

---

## 5. Sentry

**What's code-complete:** error boundaries and `withSpan` telemetry stubs are in
`lib/telemetry.ts`. Sentry just needs a DSN to start receiving events.

### Steps

1. Create a project at [sentry.io](https://sentry.io) → New Project → Next.js.

2. Install the SDK (already in `package.json`, just needs the DSN):
   ```sh
   npm install @sentry/nextjs
   ```

3. Run the Sentry wizard (creates `sentry.client.config.ts` etc.):
   ```sh
   npx @sentry/wizard@latest -i nextjs
   ```
   Or manually set:
   ```
   SENTRY_DSN=https://xxx@o123.ingest.sentry.io/456
   SENTRY_ORG=your-org
   SENTRY_PROJECT=dizruptos
   ```

4. The Next.js instrumentation hook in `instrumentation.ts` is already wired.
   Sentry will auto-initialize when `SENTRY_DSN` is present.

5. Test: throw an error in dev and check the Sentry dashboard.

---

## 6. Jira Ingestion Connector

**What's code-complete:** `app/api/v1/import/jira/route.ts` — accepts webhook POST
with `project_key`, `issue_type`, and `credentials` in the body.

### Steps

1. **Create a Jira API token**: [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

2. **Set env vars**:
   ```
   JIRA_WEBHOOK_SECRET=your-secret-here
   ```

3. **Register webhook in Jira**: Jira Settings → System → WebHooks → Create webhook.
   - URL: `https://your-domain.com/api/v1/import/jira`
   - Events: Issue Created, Issue Updated
   - Add a secret header `X-Jira-Secret: your-secret-here`

4. **First sync** — call the GET endpoint to fetch initial state:
   ```sh
   curl -X GET "https://your-domain.com/api/v1/import/jira?project=PROJ" \
     -H "Authorization: Bearer $API_KEY"
   ```

5. Incoming webhooks auto-upsert into `tasks` via the repository pattern.
   Enable "Jira Sync" in the import panel once real credentials are in place.

---

## 7. Linear Ingestion Connector

**What's code-complete:** `app/api/v1/import/linear/route.ts` — HMAC-SHA256
signature verification, maps Linear issues to DizruptOS tasks.

### Steps

1. **Get Linear API key**: Linear → Settings → API → Personal API keys.

2. **Set env var**:
   ```
   LINEAR_WEBHOOK_SECRET=your-linear-signing-secret
   ```

3. **Create webhook in Linear**: Settings → API → Webhooks → New webhook.
   - URL: `https://your-domain.com/api/v1/import/linear`
   - Events: Issue create, Issue update, Cycle start/end
   - Copy the signing secret Linear gives you → `LINEAR_WEBHOOK_SECRET`

4. Test by creating an issue in Linear and checking the server logs.

---

## 8. GitHub Ingestion Connector

**What's code-complete:** `app/api/v1/import/github/route.ts` — `timingSafeEqual`
signature verification, maps issues + PR events to tasks + activity.

### Steps

1. **Create GitHub App** or use a personal webhook:
   - GitHub → Settings → Developer settings → GitHub Apps → New
   - Or: Repo → Settings → Webhooks → Add webhook

2. **Set env var**:
   ```
   GITHUB_WEBHOOK_SECRET=your-github-secret
   ```

3. **Webhook URL**: `https://your-domain.com/api/v1/import/github`
   Content type: `application/json`
   Events: Issues, Pull requests, Push

4. The connector maps GitHub issues to `tasks`, PRs to `commitments`, and
   push events to the activity feed.

---

## 9. SCIM 2.0 User Provisioning

**What's code-complete:** Full SCIM 2.0 endpoints:
- `GET/POST /api/v1/scim/Users`
- `GET/PATCH/PUT/DELETE /api/v1/scim/Users/{id}`
- `GET/POST /api/v1/scim/Groups`
- `GET /api/v1/scim` (ServiceProviderConfig)

### Steps

1. **Set the SCIM bearer token**:
   ```
   SCIM_TOKEN=your-long-random-secret-token
   ```

2. **Configure in your IdP** (Okta, Azure AD, JumpCloud):

   **Okta:**
   - App → Provisioning → Configure API Integration
   - Base URL: `https://your-domain.com/api/v1/scim`
   - API Token: `your-long-random-secret-token`
   - Enable: Push New Users, Push Profile Updates, Push Groups

   **Azure AD:**
   - Enterprise Application → Provisioning → Admin credentials
   - Tenant URL: `https://your-domain.com/api/v1/scim`
   - Secret Token: `your-long-random-secret-token`

3. **Map attributes**:
   | SCIM attribute | DizruptOS field |
   |---|---|
   | `userName` | `email` |
   | `displayName` | `name` |
   | `title` | `title` |
   | `externalId` | `sso_sub` |
   | Group displayName | mapped via `GROUP_ROLE_MAP` in the route |

4. **Group → Role mapping** — edit `GROUP_ROLE_MAP` in `app/api/v1/scim/Groups/route.ts`
   to match your IdP group names.

---

## 10. Prometheus + Grafana Metrics

**What's code-complete:** `lib/telemetry.ts` (in-process Prometheus exposition),
`app/api/v1/metrics/route.ts` (protected scrape endpoint), `infra/prometheus.yml`,
`docker-compose.yml`.

### Steps

1. **Set the metrics scrape token**:
   ```
   METRICS_TOKEN=your-secret-metrics-token
   ```

2. **Local Prometheus + Grafana**:
   ```sh
   cd dizruptos
   docker compose up prometheus grafana
   ```
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (admin/admin)

3. **Production (Grafana Cloud)**:
   - Sign up at [grafana.com](https://grafana.com) → Free plan covers this workload
   - Create a Prometheus datasource pointing at your Vercel deployment:
     `https://your-domain.com/api/v1/metrics`
   - Add bearer auth header: `Authorization: Bearer $METRICS_TOKEN`
   - Import a Next.js dashboard (Grafana ID 15983)

4. **Key metrics exposed**:
   - `dizrupt_http_requests_total` — request rate by route/status
   - `dizrupt_http_duration_seconds` — latency histogram
   - `dizrupt_api_errors_total` — error rate
   - `dizrupt_copilot_queries_total` — AI query volume
   - `dizrupt_import_rows_total` — ingestion throughput

---

## 11. SOC 2 Type II Audit

The `SOC2_CONTROLS.md` file documents the full Trust Services Criteria map.
This section explains the *process* to get the actual audit done.

### Timeline (typical 9-month path)

| Month | Milestone |
|---|---|
| 0–1 | Choose a CPA firm (Vanta-partnered: Johanson Group, Prescient, etc.) |
| 1–2 | Readiness assessment — gap analysis against TSC CC1–CC9 |
| 2–3 | Remediation: fill gaps (see SOC2_CONTROLS.md for code-ready items) |
| 3–12 | Observation period (Type II requires 6-12 months of evidence) |
| 12+ | Audit fieldwork + report issuance |

### Immediately actionable (no code required)

1. **Vanta** — connect your cloud accounts (Supabase, Vercel, GitHub).
   Vanta auto-collects evidence continuously. Cost: ~$15k/yr.
   Alternatives: Drata, Secureframe, Sprinto (cheaper).

2. **Access reviews** — export user list from SCIM monthly, review in a doc.
   Auditors need evidence of quarterly access reviews.

3. **Vendor risk assessments** — document Supabase, Vercel, Anthropic as vendors.
   Each needs a risk assessment form (template in `SOC2_CONTROLS.md` appendix).

4. **Penetration test** — hire a firm (Bishop Fox, NCC Group, or Cobalt.io platform).
   Expect $10–25k for a web app pentest. Run before audit fieldwork starts.

5. **Security policies** — draft:
   - Information Security Policy
   - Acceptable Use Policy
   - Incident Response Plan
   - Business Continuity Plan
   These don't exist as code — they're Word/Google Docs. Vanta has templates.

6. **Background checks** — run on all employees with prod access.

---

## 12. Production Deployment (Vercel)

**What's code-complete:** `vercel.json` (OWASP headers, CSP, HSTS, rewrites, cron),
`Dockerfile` (multi-stage), `docker-compose.yml`.

### Vercel (recommended — zero-config)

1. Connect repo to Vercel: [vercel.com/new](https://vercel.com/new)
2. Set root directory: `dizruptos`
3. Add all environment variables from `.env.example`
4. Deploy. Preview deploys happen on every PR automatically.

### Environment variables for production

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=           # Session Pooler URI
ANTHROPIC_API_KEY=      # Claude copilot
SCIM_TOKEN=
METRICS_TOKEN=
SENTRY_DSN=
LINEAR_WEBHOOK_SECRET=
GITHUB_WEBHOOK_SECRET=
JIRA_WEBHOOK_SECRET=
SSO_CONFIG_<orgslug>=   # JSON per org
```

### Docker (self-hosted)

```sh
cd dizruptos
docker build -t dizruptos .
docker run -p 3000:3000 --env-file .env.local dizruptos
```

Or full stack with `docker compose up`.

---

## 13. Going from Demo → Real Users

This is the final step — switching the live product to real authentication.

### Checklist

- [ ] Supabase project created and all migrations applied
- [ ] Auth hook enabled in Supabase dashboard
- [ ] At least one test user signed up via `/auth` successfully
- [ ] JWT contains `app_metadata.role` and `app_metadata.org_id`
- [ ] Middleware correctly reads Supabase session (not just `dz_session`)
- [ ] SCIM provisioning tested with at least one IdP group push
- [ ] Invite-only launch: set Supabase "Disable Signups" and use SCIM only
- [ ] Error monitoring (Sentry) confirming zero critical errors for 48h
- [ ] Metrics showing healthy request latency (<200ms p95)

### User invitation flow (no SCIM)

Until SCIM is configured, invite users manually:
```sh
# Supabase CLI
supabase auth admin invite --email user@company.com
```
Or via the Supabase dashboard → Authentication → Users → Invite user.

### Rollback plan

The middleware always accepts `dz_session` as a fallback. If Supabase goes down
or auth breaks, add `dz_session=1` cookie to restore demo mode instantly.
No code change required.

---

*Last updated: 2026-06-15 — all code items listed here are complete in the codebase.*
