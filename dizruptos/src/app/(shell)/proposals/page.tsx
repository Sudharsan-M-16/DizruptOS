"use client";

// Agent Negotiation Inbox — proposal cards with causal reasoning, pre-surface
// validation results, coordinated-compromise badges, and 2-click human override.
// Approvals execute through the same atomic reallocation path as manual drags.

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightLeft,
  Bot,
  Check,
  CheckCheck,
  ChevronDown,
  Flame,
  ShieldAlert,
  Timer,
  Truck,
  X,
} from "lucide-react";
import { useOps } from "@/lib/store";
import { useSession, PERSONAS } from "@/lib/session";
import { proposalsForRole, inboxFraming } from "@/lib/rbac";
import { employeeById } from "@/lib/data";
import { Button, EmpAvatar } from "@/components/ui/primitives";
import { cn, timeUntil } from "@/lib/utils";
import type { AgentType, Proposal } from "@/lib/types";

const agentMeta: Record<
  AgentType,
  { label: string; Icon: React.ElementType; tone: string; ring: string }
> = {
  burnout_safety: { label: "Burnout Safety", Icon: Flame, tone: "text-danger bg-danger-soft", ring: "border-danger/30" },
  delivery_critical: { label: "Delivery", Icon: Truck, tone: "text-warn bg-warn-soft", ring: "border-warn/30" },
  allocation_optimize: { label: "Allocation", Icon: ArrowRightLeft, tone: "text-brand bg-brand-soft", ring: "border-brand/30" },
  risk_advisory: { label: "Risk Advisory", Icon: ShieldAlert, tone: "text-info bg-info-soft", ring: "border-info/30" },
};

export default function ProposalsPage() {
  const allProposals = useOps((s) => s.proposals);
  const reviewProposal = useOps((s) => s.reviewProposal);
  const personaId = useSession((s) => s.personaId);
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];

  // Dynamic view (PRD §6): the inbox is a different system per role —
  // employees see their personal requests, managers their team's proposals,
  // admins the entire org including the governance queue.
  const proposals = proposalsForRole(allProposals, persona.role, persona.id);
  const framing = inboxFraming(persona.role);
  const isEmployee = persona.role === "employee" || persona.role === "client";
  const isAdmin = persona.role === "admin";

  const pending = proposals.filter((p) => p.status === "pending");
  const resolved = proposals.filter((p) => p.status !== "pending");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Role-scoped framing */}
      <div className="panel flex flex-wrap items-center gap-3 p-4">
        <Bot size={14} className="text-brand" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{framing.title}</div>
          <p className="mt-0.5 text-2xs leading-relaxed text-fg-secondary">{framing.hint}</p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 font-mono text-2xs",
            isAdmin
              ? "border-brand/40 bg-brand-soft text-brand"
              : "border-line bg-ink-elevated text-fg-secondary"
          )}
        >
          {isAdmin ? "FULL CONTROL" : isEmployee ? "PERSONAL SCOPE" : "TEAM SCOPE"} · {pending.length} pending
        </span>
      </div>

      {/* Priority hierarchy explainer — manager+ only; employees don't arbitrate */}
      {!isEmployee && (
        <div className="panel flex flex-wrap items-center gap-3 p-3.5 text-2xs text-fg-muted">
          <span className="text-fg-secondary">Conflict resolution order:</span>
          {["burnout safety 100", "hard constraints 90", "delivery 70", "allocation 50", "risk advisory 40"].map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <span className="text-fg-faint">›</span>}
              <span className="rounded-full border border-line bg-ink-elevated px-2 py-0.5 font-mono">{s}</span>
            </React.Fragment>
          ))}
          <span className="ml-auto">Rejections are remembered 30 days</span>
        </div>
      )}

      <AnimatePresence initial={false}>
        {pending.map((p) => (
          <ProposalCard
            key={p.id}
            proposal={p}
            onReview={reviewProposal}
            approveLabel={framing.approveLabel}
            rejectLabel={framing.rejectLabel}
            isEmployee={isEmployee}
          />
        ))}
      </AnimatePresence>

      {pending.length === 0 && (
        <div className="panel flex flex-col items-center gap-2 py-14 text-center">
          <CheckCheck size={22} className="text-ok" />
          <div className="text-sm font-medium">
            {isEmployee ? "Nothing needs you right now" : "Inbox zero"}
          </div>
          <p className="max-w-sm text-2xs text-fg-muted">
            {isEmployee
              ? "When an agent or your manager stages something that concerns you, it appears here first."
              : "All agent proposals reviewed. Agents re-evaluate hourly; resolved conflicts and rejections persist in agent memory."}
          </p>
        </div>
      )}

      {resolved.length > 0 && (
        <section>
          <div className="label-xs mb-2">Resolved</div>
          <div className="space-y-2">
            {resolved.map((p) => {
              const m = agentMeta[p.agentType];
              return (
                <div key={p.id} className="panel flex items-center gap-3 p-3 opacity-70">
                  <span className={cn("rounded-lg p-1.5", m.tone)}>
                    <m.Icon size={13} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs">{p.title}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-px text-2xs font-semibold",
                      p.status === "approved" ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger"
                    )}
                  >
                    {p.status}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function ProposalCard({
  proposal: p,
  onReview,
  approveLabel,
  rejectLabel,
  isEmployee,
}: {
  proposal: Proposal;
  onReview: (id: string, verdict: "approved" | "rejected") => void;
  approveLabel: string;
  rejectLabel: string;
  isEmployee: boolean;
}) {
  const [expanded, setExpanded] = React.useState(p.priority >= 100);
  const m = agentMeta[p.agentType];
  const from = employeeById(p.action.fromEmployeeId);
  const to = employeeById(p.action.toEmployeeId);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
      className={cn("panel overflow-hidden border", m.ring)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className={cn("mt-0.5 rounded-lg p-2", m.tone)}>
            <m.Icon size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                {m.label} Agent
              </span>
              <span className="rounded-full bg-ink-elevated px-2 py-px font-mono text-2xs text-fg-muted">
                priority {p.priority}
              </span>
              <span className="rounded-full bg-ink-elevated px-2 py-px font-mono text-2xs text-fg-secondary">
                {Math.round(p.confidence * 100)}% confidence
              </span>
              <span className="ml-auto flex items-center gap-1 text-2xs text-fg-faint">
                <Timer size={10} /> expires {timeUntil(p.expiresAt)}
              </span>
            </div>
            <h3 className="mt-1.5 font-display text-sm font-semibold leading-snug">
              {p.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-fg-secondary">{p.summary}</p>

            {/* Reallocation visual */}
            {(from || to) && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-line bg-ink-elevated p-2.5">
                {from ? (
                  <span className="flex items-center gap-1.5 text-2xs">
                    <EmpAvatar initials={from.initials} accent={from.accent} size={20} />
                    {from.name.split(" ")[0]}
                  </span>
                ) : (
                  <span className="text-2xs text-fg-muted">Unassigned</span>
                )}
                <ArrowRightLeft size={12} className="text-brand" />
                {to && (
                  <span className="flex items-center gap-1.5 text-2xs">
                    <EmpAvatar initials={to.initials} accent={to.accent} size={20} />
                    {to.name.split(" ")[0]}
                  </span>
                )}
                {p.action.deltaHours ? (
                  <span className="ml-auto font-mono text-2xs text-fg-secondary">
                    {p.action.deltaHours}h
                  </span>
                ) : null}
              </div>
            )}

            {/* Negotiated compromise */}
            {p.conflict && (
              <div className="mt-3 rounded-lg border border-brand/30 bg-brand-soft/40 p-3">
                <div className="label-xs mb-1 flex items-center gap-1.5 text-brand">
                  <Bot size={11} /> Coordinated compromise — conflict with{" "}
                  {agentMeta[p.conflict.withAgent].label} Agent
                </div>
                <p className="text-2xs leading-relaxed text-fg-secondary">
                  {p.conflict.resolution}
                </p>
              </div>
            )}

            {/* Expandable causal reasoning + validation */}
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-3 flex items-center gap-1 text-2xs font-medium text-brand hover:underline"
            >
              <ChevronDown
                size={12}
                className={cn("transition-transform", expanded && "rotate-180")}
              />
              {expanded ? "Hide" : "Show"} reasoning & validation
            </button>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-line-subtle bg-ink-elevated/60 p-3">
                      <div className="label-xs mb-1.5">Causal signals</div>
                      <ul className="space-y-1.5">
                        {p.reasoning.map((r, i) => (
                          <li key={i} className="flex gap-2 text-2xs leading-relaxed text-fg-secondary">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand/70" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-line-subtle bg-ink-elevated/60 p-3">
                      <div className="label-xs mb-1.5">Pre-surface validation</div>
                      <ul className="space-y-1.5">
                        {p.validation.map((v, i) => (
                          <li key={i} className="flex items-center gap-2 text-2xs text-fg-secondary">
                            <Check size={11} className={v.pass ? "text-ok" : "text-danger"} />
                            {v.check}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 border-t border-line-subtle pt-2 text-2xs text-fg-faint">
                        Validated against live DB constraints before surfacing.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 2-click review bar */}
      <div className="flex items-center gap-2 border-t border-line-subtle bg-ink-elevated/40 px-4 py-3">
        <span className="text-2xs text-fg-muted">{p.entityLabel}</span>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={() => onReview(p.id, "rejected")}>
            <X size={12} /> {rejectLabel}{!isEmployee && " — remember 30d"}
          </Button>
          <Button onClick={() => onReview(p.id, "approved")}>
            <Check size={12} /> {approveLabel}{!isEmployee && " & execute"}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
