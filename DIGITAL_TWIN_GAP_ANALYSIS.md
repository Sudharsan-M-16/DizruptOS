# DIZRUPT — Digital Twin Gap Analysis

A digital twin = a *live, continuously-synced, temporal* model of the real system.
DIZRUPT today is a **static snapshot twin** fed by hand — the foundations are right, the
"twin" properties (liveness + history + telemetry) are absent.

| Twin | Score | Have | Missing for 10/10 |
|---|---|---|---|
| Workforce | 6 | people, capabilities, capacity, expertise, succession | live HRIS sync, real headcount/PTO, time series |
| Execution | 5 | projects, tasks, dependencies | live tracker sync, velocity feeds, schedule model |
| Knowledge | 5 | decisions, learnings, docs schema | ingestion of real docs/decisions, embeddings populated |
| Operational | 4 | services, customers, vendors (schema) | monitoring/SLO feeds, incident data, vendor signals |
| Relationship | 6 | typed graph registry + traversal | populated at scale, betweenness, temporal edges |
| Capability | 7 | first-class, rated, bus-factor | proficiency decay, demand vs supply over time |

## To reach a real twin
1. **Continuous ingestion** (the missing organ) — HRIS, trackers, git, calendar, monitoring.
2. **Temporal layer** — every entity/edge versioned; query "as of" + trends (today it's frozen at "now").
3. **Telemetry-driven recompute** — change events drive intelligence refresh (realtime layer).
4. **Bidirectional** — twin suggests actions (recommendations exist) AND those actions write back.
The intelligence engines are twin-ready; the **data plumbing and time dimension are not built.**
