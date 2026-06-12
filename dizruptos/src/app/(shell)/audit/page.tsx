"use client";

// Audit Log — insert-only, tamper-proof, complete. Live-updates as you act
// elsewhere in the app (reallocations, overrides, proposal reviews land here).

import * as React from "react";
import { FileClock, OctagonAlert, Search } from "lucide-react";
import { useOps } from "@/lib/store";
import { employeeById } from "@/lib/data";
import { EmpAvatar } from "@/components/ui/primitives";
import { cn, fmtDateTime } from "@/lib/utils";

const ACTION_TONES: Record<string, string> = {
  task_reallocated: "text-brand bg-brand-soft",
  capacity_override: "text-warn bg-warn-soft",
  session_revoked: "text-danger bg-danger-soft",
  risk_escalated: "text-danger bg-danger-soft",
  proposal_approved: "text-ok bg-ok-soft",
  proposal_rejected: "text-fg-muted bg-ink-elevated",
  decision_recorded: "text-brand-secondary bg-brand-soft",
  project_status_changed: "text-info bg-info-soft",
  role_changed: "text-info bg-info-soft",
};

export default function AuditPage() {
  const audit = useOps((s) => s.audit);
  const [q, setQ] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");

  const types = Array.from(new Set(audit.map((a) => a.actionType)));
  const rows = audit.filter(
    (a) =>
      (typeFilter === "all" || a.actionType === typeFilter) &&
      (q === "" ||
        `${a.entityLabel} ${a.detail} ${a.actionType}`.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter events…"
            className="h-9 w-full rounded-lg border border-line bg-ink-surface pl-9 pr-3 text-xs outline-none placeholder:text-fg-faint focus:border-brand/50"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-lg border border-line bg-ink-surface px-3 text-xs text-fg-secondary outline-none focus:border-brand/50"
        >
          <option value="all">All action types</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="ml-auto flex items-center gap-1.5 text-2xs text-fg-muted">
          <FileClock size={12} />
          {rows.length} events · INSERT-only · UPDATE/DELETE revoked at the database
        </span>
      </div>

      <div className="panel table-scroll">
        <table className="table-sticky w-full text-left">
          <thead>
            <tr>
              {["Time", "Actor", "Action", "Entity", "Detail"].map((h) => (
                <th key={h} className="label-xs px-4 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const actor = employeeById(a.actorId);
              return (
                <tr key={a.id} className="border-b border-line-subtle align-top last:border-0 hover:bg-ink-elevated/40">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-2xs text-fg-muted">
                    {fmtDateTime(a.at)}
                  </td>
                  <td className="px-4 py-3">
                    {actor && (
                      <span className="flex items-center gap-2 text-2xs text-fg-secondary">
                        <EmpAvatar initials={actor.initials} accent={actor.accent} size={20} />
                        <span>
                          {actor.name}
                          <span className="block text-fg-faint">{a.actorRole}</span>
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-mono text-2xs font-medium",
                        ACTION_TONES[a.actionType] ?? "text-fg-secondary bg-ink-elevated"
                      )}
                    >
                      {a.actionType}
                    </span>
                  </td>
                  <td className="max-w-48 px-4 py-3 text-2xs text-fg">
                    <span className="line-clamp-2">{a.entityLabel}</span>
                    <span className="text-fg-faint">{a.entityType}</span>
                  </td>
                  <td className="max-w-md px-4 py-3 text-2xs leading-relaxed text-fg-secondary">
                    {a.detail}
                    {a.overrideReason && (
                      <span className="mt-1 flex items-center gap-1 text-warn">
                        <OctagonAlert size={10} />
                        override: “{a.overrideReason}”
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
