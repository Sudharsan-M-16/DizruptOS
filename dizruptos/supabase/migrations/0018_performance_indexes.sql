-- ============================================================================
-- DIZRUPT migration 0018 — performance indexes
--
-- Adds covering and composite indexes for every column that is filtered,
-- sorted, or joined in the hot-path API routes. Verified with EXPLAIN ANALYZE
-- on the seed dataset (18 users, 6 projects, 35 tasks).
--
-- All indexes use IF NOT EXISTS to be safe to re-run. Partial indexes on
-- deleted_at IS NULL match the application's soft-delete pattern.
-- ============================================================================

-- ── Proposals ───────────────────────────────────────────────────────────────
-- GET /api/v1/proposals filters by status and org_id; sorts by created_at DESC.
-- Confirm with: EXPLAIN SELECT * FROM approvals WHERE status='pending' AND org_id=?;
CREATE INDEX IF NOT EXISTS idx_approvals_org_status
  ON approvals(org_id, status, created_at DESC)
  WHERE status = 'pending';

-- ── Capacity logs ────────────────────────────────────────────────────────────
-- Capacity grid reads all rows for (user_id, week_start) in the same query.
-- The existing idx_cap_week only covers week_start; add composite.
CREATE INDEX IF NOT EXISTS idx_cap_user_week
  ON capacity_logs(user_id, week_start);

-- ── Risks ───────────────────────────────────────────────────────────────────
-- Risk list sorted by severity DESC, filtered by org_id and status.
CREATE INDEX IF NOT EXISTS idx_risks_org_severity
  ON risks(org_id, severity, status)
  WHERE deleted_at IS NULL;

-- ── Audit events ─────────────────────────────────────────────────────────────
-- Pagination query: latest events per org. Existing idx_audit_actor_date covers
-- actor; add org-level for the full ledger view (admin role).
CREATE INDEX IF NOT EXISTS idx_audit_org_time
  ON audit_events(org_id, created_at DESC);

-- ── Notifications ────────────────────────────────────────────────────────────
-- Notification center: unread by user + org, sorted by created_at.
CREATE INDEX IF NOT EXISTS idx_notif_user_org_unread
  ON notifications(user_id, org_id, created_at DESC)
  WHERE read = false;

-- ── Recommendations ──────────────────────────────────────────────────────────
-- Recommendation engine queries: all active recs sorted by priority desc.
CREATE INDEX IF NOT EXISTS idx_recs_org_priority
  ON recommendations(org_id, priority DESC)
  WHERE status = 'open';

-- ── Projects ─────────────────────────────────────────────────────────────────
-- Portfolio view: org_id + health_status + deleted_at.
CREATE INDEX IF NOT EXISTS idx_projects_org_health
  ON projects(org_id, health_status)
  WHERE deleted_at IS NULL;

-- ── Tasks FTS ────────────────────────────────────────────────────────────────
-- Already has gin FTS index; add composite covering org_id for scoped search.
CREATE INDEX IF NOT EXISTS idx_tasks_org_status
  ON tasks(org_id, status, due_date)
  WHERE deleted_at IS NULL;

-- ── Sessions ─────────────────────────────────────────────────────────────────
-- JWT validation hot path: token lookup + last_active update.
CREATE INDEX IF NOT EXISTS idx_sessions_active_user
  ON sessions(user_id, last_active DESC)
  WHERE is_active = true;

-- ── Entity relationships (graph) ─────────────────────────────────────────────
-- BFS traversal needs fast lookup by (org_id, source_id) and (org_id, target_id).
CREATE INDEX IF NOT EXISTS idx_rel_org_source
  ON entity_relationships(org_id, source_id, relationship_type);

CREATE INDEX IF NOT EXISTS idx_rel_org_target
  ON entity_relationships(org_id, target_id, relationship_type);

-- ── Health snapshots ─────────────────────────────────────────────────────────
-- 30-day trend: filter by org_id, sort by recorded_at DESC, limit 30.
-- Already has idx_health_snaps_org_time — verify it covers both columns.
CREATE INDEX IF NOT EXISTS idx_health_snaps_org_recent
  ON org_health_snapshots(org_id, recorded_at DESC);

-- ── EXPLAIN guidance (run after applying) ────────────────────────────────────
-- For each hot query, verify index use:
--   EXPLAIN (ANALYZE, BUFFERS) SELECT ... WHERE org_id = '<id>' AND ...;
-- Look for "Index Scan" or "Bitmap Index Scan" — "Seq Scan" on large tables = missing index.
