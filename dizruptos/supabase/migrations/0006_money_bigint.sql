-- ============================================================================
-- Migration 0006 — Database hardening: widen money columns to bigint.
-- The *_micro_units / *_amount columns were int4 (max ~2.1B) but documented as
-- micro-units ($1 = 1,000,000) → overflow above ~$2.1K (CTO_REVIEW finding).
-- bigint holds ~9.2e18 micro-units (~$9.2 trillion). No data loss (widening).
-- ============================================================================

alter table customers       alter column arr_micro_units   type bigint;
alter table revenue_streams alter column amount_micro_units type bigint;
alter table users           alter column cost_per_hour      type bigint;
alter table projects        alter column budget_amount      type bigint;
alter table projects        alter column consumed_amount    type bigint;
