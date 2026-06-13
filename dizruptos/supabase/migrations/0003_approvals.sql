-- ============================================================================
-- Migration 0003 — Approvals as first-class governance objects (PRD §6 + §5).
-- Every graduated-authority decision becomes a durable, queryable record — the
-- substrate for decision lineage, governance intelligence, audit, and
-- organizational memory. NOT mere workflow state.
-- ============================================================================

create table approvals (
  id                uuid primary key default gen_random_uuid(),
  change_type       text not null,            -- ChangeType (task_reassign, ...)
  summary           text not null,
  payload           jsonb not null default '{}',   -- the proposed mutation
  -- who / authority
  requester_id      uuid references users(id),
  requester_role    text not null,
  approver_role     text not null,            -- tier required to decide
  authority_tier    text not null check (authority_tier in ('direct','requires_approval','denied')),
  escalation_path   text[] not null default '{}',  -- senior roles notified, ascending
  -- rationale / evidence (decision-intelligence foundation)
  rationale         text,
  evidence          jsonb not null default '{}',   -- {signals, confidence, links}
  affected_entities jsonb not null default '[]',   -- [{type, id, label}]
  -- lifecycle
  status            text not null default 'pending'
    check (status in ('pending','approved','declined','applied_direct')),
  decided_by        uuid references users(id),
  decided_at        timestamptz,
  decline_reason    text,
  created_at        timestamptz not null default now()
);
create index idx_approvals_queue on approvals(approver_role, status) where status = 'pending';
create index idx_approvals_requester on approvals(requester_id, created_at desc);
create index idx_approvals_lineage on approvals(change_type, created_at desc);

alter table approvals enable row level security;

-- Grants (RLS still governs rows).
grant select, insert, update on approvals to authenticated;
grant all on approvals to service_role;

-- Requester sees their own; the approving tier (and admin) sees the queue;
-- decisions can be made by the approver tier or admin.
create policy approvals_select on approvals for select using (
  auth_role() = 'admin'
  or requester_id = auth.uid()
  or auth_role() = approver_role
);
create policy approvals_insert on approvals for insert with check (requester_id = auth.uid());
create policy approvals_update on approvals for update using (
  auth_role() = 'admin' or auth_role() = approver_role
);
