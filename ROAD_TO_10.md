# DIZRUPT — Road to 10/10

> Concrete only. Effort: S (≤1 day), M (≤1 week), L (≤1 month), XL (multi-month).
> Priority P0 (blocking legitimacy) → P3 (polish). Honest current scores from
> SUPREME_PLATFORM_AUDIT.md.

## P0 — Without these, nothing else counts
| Item | Cur→Tgt | Effort | Exact tasks | Impact |
|---|---|---|---|---|
| **Real auth** | Auth 3→9 | M | Supabase Auth (email+magic-link now; Google/MS once providers configured); `/auth/callback`; Auth Hook minting `app_metadata.role` + `org_id` into JWT; link `users.id`→`auth.users`; remove demo personas. | Unlocks RLS/tenancy *in reality* (today verified only vs fake JWTs). |
| **Data ingestion** | (new) 0→7 | XL | Connectors: Jira/Linear (tasks/projects), HRIS/CSV (people/dept), Git (activity), calendar (meetings). Map into the ontology. | Ends the "5 seed users forever" failure mode; the graph becomes real. |
| **Executive Intelligence surface** | Product 4→8 | M | One page composing org-health + top recommendations + emerging risks + "what changed" + departure/sim shortcuts; reasoning-first; per-role. | The home a leader opens weekly — the most valuable surface. |
| **Observability** | Obs 3→8 | M | OpenTelemetry traces, Sentry errors, web-vitals, health/readiness probes, structured logs already exist. | Makes production debuggable; table stakes. |

## P1 — Operationalize
| Item | Cur→Tgt | Effort | Tasks | Impact |
|---|---|---|---|---|
| **Realtime layer** | 3→8 | M | Supabase Realtime on notifications/capacity/risks/approvals (publication exists); server emits domain events → recompute affected intelligence → push; replace BroadcastChannel. | "Change→recompute→push" loop. |
| **Repository↔schema completion** | 8→10 | S–M | Reconcile employee model (add `title/location` columns OR trim TS type — pick one); add `org_id` to leaf tables (employee_capabilities, capacity_logs); finish mutation paths + optimistic updates + invalidation across verticals (read paths done). | Ends the last recurring debt item + demo/live split. |
| **Intelligence surfaces (UI)** | UI 6→9 | M–L | People / Decision-memory / Risk / Dependency / Recommendations / Simulation surfaces using the live APIs (already built). Reasoning-first, the `/capabilities` pattern. | Makes the intelligence consumable. |
| **CI/CD + deploy** | Prod 3→8 | M | GitHub Actions (typecheck/lint/test/build), preview deploys, prod deploy (Vercel), DB migration runner in CI. | Real shipping. |

## P2 — Scale & trust
| Item | Cur→Tgt | Effort | Tasks |
|---|---|---|---|
| Graph at scale | 5→9 | L | Recursive-CTE/pgRouting traversal; `entity_paths` refresher worker; betweenness/eigenvector centrality. |
| Calibration loop | (new) 0→7 | L | Record predicted vs actual; measure whether intelligence scores predicted reality; surface confidence calibration org-wide. |
| GraphRAG / Copilot | AI 3→8 | L | Populate `entity_embeddings`; retrieval over memory graph; LLM copilot answering "biggest risk?/who owns X?/what if Sarah leaves?" grounded in engine outputs. |
| Multi-tenancy completeness | 6.5→9 | M | `org_id` everywhere + platform super-admin (audited cross-tenant) + per-tenant settings. |
| Test depth | 6→9 | M | E2E (Playwright) per role over the intelligence; integration tests vs a test Supabase; RLS tests in CI; load tests on traversal. |

## P3 — Enterprise & polish
| Item | Cur→Tgt | Effort | Tasks |
|---|---|---|---|
| SSO/SAML + SCIM | 1/0→8 | L | Enterprise IdP + provisioning. |
| Compliance | 2→7 | XL | SOC2 controls map, retention, data-subject export/delete, encryption-at-rest review. |
| Accessibility | 4→9 | M | axe audit; focus order, contrast, ARIA, keyboard-only. |
| Per-page premium redesign | 6→9 | M | Extend the command-center hero-tile/reasoning language to all pages. |
| Money/temporal/ontology | — | M | (bigint done) add Assumption + Evidence + Vendor/System + Process entities; temporal/history layer. |

## Sequencing (the only order that matters)
1. **Auth** (legitimacy) → 2. **One real org's data in** (ingestion or guided import) → 3. **Executive surface + intelligence UIs** (consumption) → 4. **Observability + CI/CD** (shipping) → 5. **Realtime + calibration** (trust) → 6. **GraphRAG copilot** (the durable moat) → 7. enterprise/compliance.

Everything before #2 is theater if #2 never happens. **The single highest-leverage action is getting one real organization's data into the graph and a real manager looking at the resulting intelligence weekly.**
