# DIZRUPT — Architecture Diagrams

## System Overview

```mermaid
graph TB
    subgraph Client["Browser Client"]
        OS["DizruptOS Shell\n(Next.js App Router)"]
        WM["Window Manager\n(use-desktop.ts)"]
        Store["Zustand Store\n(lib/os.ts)"]
        TQ["TanStack Query\n(lib/query.ts)"]
    end

    subgraph Edge["Edge / Middleware"]
        MW["middleware.ts\nRate limit · Auth · SSO · X-Request-ID"]
    end

    subgraph API["API Layer (Next.js Route Handlers)"]
        COPILOT["/api/v1/copilot"]
        GRAPH["/api/v1/intelligence/graph"]
        SIM["/api/v1/simulation/monte-carlo"]
        IMPORT["/api/v1/import/{jira,linear,github}"]
        SCIM["/api/v1/scim/*"]
        EXPORT["/api/v1/export"]
        GDPR["/api/v1/gdpr"]
        HEALTH["/api/health"]
        SSO["/api/auth/sso"]
    end

    subgraph ServerLayer["Server Layer"]
        REPO["Resilient Repositories\n(makeResilient proxy)"]
        AUTHZ["Authorization\n(requirePermission)"]
        CB["Circuit Breakers\n(supabase · anthropic)"]
        LOG["Structured Logger\n(server/lib/logger)"]
        OTEL["OTel Spans\n(lib/telemetry)"]
    end

    subgraph External["External Services"]
        SB["Supabase\nPostgres + Auth + Realtime"]
        CLAUDE["Claude claude-sonnet-4-6\nAnthropic API"]
        IDP["IdP (Okta / Azure AD)\nSAML + OIDC"]
        JIRA["Jira / Linear / GitHub\nHMAC webhooks"]
    end

    OS --> MW --> API
    API --> AUTHZ --> REPO
    REPO --> CB --> SB
    COPILOT --> CB --> CLAUDE
    IMPORT --> JIRA
    SSO --> IDP
    TQ --> API
    Store --> OS
    WM --> OS
    REPO -->|fallback| MEM["In-Memory Seed\n(demo mode)"]
    API --> LOG --> OTEL
```

## Data Flow — Intelligence Pipeline

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant MW as Middleware
    participant API as API Route
    participant AUTHZ as Authorization
    participant REPO as Repository
    participant SB as Supabase
    participant FALLBACK as In-Memory Seed

    U->>MW: GET /api/v1/intelligence/graph
    MW->>MW: check dz_session cookie
    MW->>MW: rate limit check (10/min for intelligence)
    MW->>MW: attach X-Request-ID header
    MW->>API: forward request
    API->>AUTHZ: resolvePrincipal(req)
    AUTHZ->>AUTHZ: requirePermission("view_executive")
    API->>REPO: relationships.list()
    REPO->>SB: SELECT ... (with org_id RLS)
    alt Supabase available
        SB-->>REPO: rows
        REPO-->>API: typed entities
    else Supabase unreachable
        REPO->>FALLBACK: seed data
        FALLBACK-->>API: seed entities
    end
    API-->>U: { data: { nodes, edges }, backend: "memory|live" }
```

## Request Lifecycle

```mermaid
sequenceDiagram
    participant Browser
    participant Middleware
    participant Route
    participant CircuitBreaker
    participant Supabase

    Browser->>Middleware: Any /api/v1/* request
    Middleware->>Middleware: Generate requestId (UUID)
    Middleware->>Middleware: Check rate limit (Cloudflare KV / memory)
    Middleware->>Middleware: Validate dz_session cookie
    Note over Middleware: Block if no cookie (redirect /login)
    Middleware->>Route: Forward with X-Request-ID header
    Route->>CircuitBreaker: execute(supabaseQuery)
    alt Circuit CLOSED
        CircuitBreaker->>Supabase: query
        Supabase-->>CircuitBreaker: result
        CircuitBreaker-->>Route: data
    else Circuit OPEN (Supabase down)
        CircuitBreaker-->>Route: fallback() — in-memory seed
        Note over Route: Response header: X-Backend: memory
    end
    Route-->>Browser: { apiVersion, data, requestId }
```

## RBAC Enforcement Model

```mermaid
graph LR
    LOGIN["Login\n(pick persona)"] -->|sets role| COOKIE["dz_session cookie"]
    COOKIE --> MW["Middleware\n(presence check)"]
    MW --> OS["OS Layer\n(app visibility)"]
    OS --> API["API Layer\n(requirePermission)"]
    API --> STORE["Store Layer\n(useSession.can())"]

    subgraph Layers["3 Independent Enforcement Layers"]
        OS
        API
        STORE
    end
```

## Multi-Tenancy Architecture

```mermaid
graph TB
    subgraph T1["Tenant org-1"]
        U1["Users"] --> RLS1["RLS org_id = 'org-1'"]
        P1["Projects"] --> RLS1
        RLS1 --> SCHEMA["Shared Postgres Schema"]
    end
    subgraph T2["Tenant org-2"]
        U2["Users"] --> RLS2["RLS org_id = 'org-2'"]
        P2["Projects"] --> RLS2
        RLS2 --> SCHEMA
    end
    SCHEMA --> DB["Supabase Postgres\n(Row-Level Security)"]
    SSO1["org-1 IdP (Okta)"] -->|SAML| AUTH["Auth Hook\n0012_auth_hook.sql"]
    SSO2["org-2 IdP (Azure AD)"] -->|OIDC| AUTH
    AUTH --> DB
```

## Realtime Architecture

```mermaid
graph LR
    subgraph Server
        CRON["Health cron (15min)\nPOST /api/v1/intelligence/health-history"]
        WEBHOOK["Import webhooks\nJira · Linear · GitHub"]
        MUTATION["Store mutations\nmoveTask · reviewProposal"]
    end

    subgraph Transport
        SB_RT["Supabase Realtime\n(postgres_changes)"]
        BC["BroadcastChannel\n(demo mode fallback)"]
    end

    subgraph Client
        NC["Notification Center\n(CHANNELS.NOTIFICATIONS)"]
        HOME["Home App\n(CHANNELS.CAPACITY)"]
    end

    CRON --> SB_RT
    WEBHOOK --> SB_RT
    MUTATION --> SB_RT
    SB_RT -->|live| NC
    SB_RT -->|live| HOME
    SB_RT -->|unavailable| BC
    BC --> NC
    BC --> HOME
```

## Deployment Architecture

```mermaid
graph TB
    subgraph Vercel["Vercel Edge Network"]
        EDGE["Edge Middleware\n(rate limit · auth · headers)"]
        NEXT["Next.js Functions\n(API routes · SSR)"]
    end

    subgraph Supabase["Supabase Platform"]
        PG["Postgres (with pgvector)"]
        SUPA_AUTH["Supabase Auth\n(+ custom access-token hook)"]
        SUPA_RT["Supabase Realtime"]
        SUPA_EDGE["Supabase Edge Functions\n(SCIM · webhooks)"]
    end

    subgraph Observability["Observability"]
        SENTRY["Sentry\n(errors + traces)"]
        PROM["Prometheus\n(/api/v1/metrics)"]
        OTEL["OTel Collector\n(spans · traces)"]
    end

    USER["Browser"] --> EDGE --> NEXT
    NEXT --> PG
    NEXT --> SUPRA_AUTH
    NEXT --> SUPA_RT
    NEXT --> SENTRY
    NEXT --> PROM
    NEXT --> OTEL
    SUPRA_AUTH --> PG
```
