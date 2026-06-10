"use client";

// Core UI kit — status pills, capacity bars, avatars, metric tiles,
// and the "Explain" popover that puts a WHY behind every score (PRD §2.6).

import * as React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Popover from "@radix-ui/react-popover";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  Clock,
  HelpCircle,
  OctagonAlert,
  Pause,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn, utilizationTone } from "@/lib/utils";
import type { HealthStatus, TaskPriority, TaskStatus } from "@/lib/types";

/* ---------------------------------- Avatar --------------------------------- */

export function EmpAvatar({
  initials,
  accent,
  size = 28,
  ring,
  className,
}: {
  initials: string;
  accent: string;
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-full font-display font-semibold",
        ring && "ring-2 ring-ink-surface",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, ${accent}33, ${accent}14)`,
        color: accent,
        border: `1px solid ${accent}55`,
      }}
    >
      {initials}
    </div>
  );
}

/* ------------------------------- Status pills ------------------------------- */

const healthMeta: Record<
  HealthStatus,
  { label: string; tone: string; Icon: React.ElementType }
> = {
  ON_TRACK: { label: "On Track", tone: "text-ok bg-ok-soft border-ok/30", Icon: CheckCircle2 },
  DELAYED: { label: "Delayed", tone: "text-warn bg-warn-soft border-warn/30", Icon: Clock },
  AT_RISK: { label: "At Risk", tone: "text-warn bg-warn-soft border-warn/30", Icon: AlertTriangle },
  BLOCKED: { label: "Blocked", tone: "text-danger bg-danger-soft border-danger/30", Icon: Pause },
  CRITICAL: { label: "Critical", tone: "text-danger bg-danger-soft border-danger/30", Icon: OctagonAlert },
};

export function HealthPill({
  health,
  pulse,
  className,
}: {
  health: HealthStatus;
  pulse?: boolean;
  className?: string;
}) {
  const m = healthMeta[health];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-semibold",
        m.tone,
        pulse && health === "CRITICAL" && "animate-pulseRed",
        className
      )}
    >
      <m.Icon size={11} strokeWidth={2.5} />
      {m.label}
    </span>
  );
}

const taskStatusMeta: Record<TaskStatus, { label: string; tone: string }> = {
  BACKLOG: { label: "Backlog", tone: "text-fg-muted bg-ink-elevated border-line" },
  TO_DO: { label: "To Do", tone: "text-fg-secondary bg-ink-elevated border-line" },
  IN_PROGRESS: { label: "In Progress", tone: "text-info bg-info-soft border-info/30" },
  REVIEW: { label: "Review", tone: "text-brand-secondary bg-brand-soft border-brand/30" },
  CLIENT_REVIEW: { label: "Client Review", tone: "text-brand-secondary bg-brand-soft border-brand/30" },
  BLOCKED: { label: "Blocked", tone: "text-danger bg-danger-soft border-danger/30" },
  COMPLETED: { label: "Done", tone: "text-ok bg-ok-soft border-ok/30" },
};

export function TaskStatusPill({ status }: { status: TaskStatus }) {
  const m = taskStatusMeta[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-medium",
        m.tone
      )}
    >
      {m.label}
    </span>
  );
}

const priorityMeta: Record<TaskPriority, { color: string; label: string }> = {
  URGENT: { color: "#EF4444", label: "Urgent" },
  HIGH: { color: "#F59E0B", label: "High" },
  MEDIUM: { color: "#6366F1", label: "Medium" },
  LOW: { color: "#6B7280", label: "Low" },
};

export function PriorityDot({ priority }: { priority: TaskPriority }) {
  const m = priorityMeta[priority];
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ background: m.color, boxShadow: `0 0 6px ${m.color}66` }}
          />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="z-50 rounded-md border border-line bg-ink-elevated px-2 py-1 text-2xs text-fg-secondary shadow-pop">
            {m.label} priority
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export const priorityColor = (p: TaskPriority) => priorityMeta[p].color;

/* ------------------------------ Capacity bar -------------------------------- */

export function CapacityBar({
  pct,
  className,
  height = 8,
}: {
  pct: number;
  className?: string;
  height?: number;
}) {
  const tone = utilizationTone(pct);
  const fill =
    tone === "danger"
      ? "linear-gradient(90deg,#EF4444,#DC2626)"
      : tone === "warn"
        ? "linear-gradient(90deg,#F59E0B,#D97706)"
        : "linear-gradient(90deg,#10B981,#059669)";
  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-full bg-ink-elevated", className)}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ width: `${Math.min(pct, 1.25) * 80}%`, background: fill }}
      />
      {/* 100% threshold tick */}
      <div className="absolute inset-y-0 left-[80%] w-px bg-fg-faint/60" />
    </div>
  );
}

/* --------------------------- The Explain popover ----------------------------- */
// Never show a score without showing why. Every metric carries this affordance.

export function Explain({
  title,
  signals,
  children,
  side = "bottom",
}: {
  title: string;
  signals: string[];
  children?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        {children ?? (
          <button
            aria-label={`Why: ${title}`}
            className="text-fg-muted transition-colors hover:text-brand"
          >
            <HelpCircle size={13} />
          </button>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side={side}
          sideOffset={6}
          className="z-50 w-80 animate-riseIn rounded-card border border-line bg-ink-elevated p-4 shadow-pop"
        >
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={13} className="text-brand" />
            <span className="label-xs text-fg-secondary">Why · {title}</span>
          </div>
          <ul className="space-y-2">
            {signals.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-fg-secondary">
                <CircleDot size={11} className="mt-0.5 shrink-0 text-brand/70" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-line-subtle pt-2 text-2xs text-fg-muted">
            Causal signals · stored, auditable, not regenerated
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/* -------------------------------- Metric tile -------------------------------- */

export function MetricTile({
  label,
  value,
  delta,
  deltaGood,
  explanation,
  signals,
  spark,
  className,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaGood?: boolean;
  explanation: string;
  signals?: string[];
  spark?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("panel panel-hover relative overflow-hidden p-5", className)}>
      <div className="flex items-start justify-between">
        <span className="label-xs">{label}</span>
        {signals && <Explain title={label} signals={signals} />}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <div className="font-display text-[28px] font-semibold leading-none tracking-tight">
            {value}
          </div>
          {delta && (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1 text-2xs font-medium",
                deltaGood ? "text-ok" : "text-danger"
              )}
            >
              {deltaGood ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {delta}
            </div>
          )}
        </div>
        {spark && <div className="h-10 w-24 shrink-0 opacity-90">{spark}</div>}
      </div>
      <p className="mt-3 border-t border-line-subtle pt-2.5 text-2xs leading-relaxed text-fg-muted">
        {explanation}
      </p>
    </div>
  );
}

/* --------------------------------- Buttons ----------------------------------- */

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50",
        variant === "primary" &&
          "bg-brand text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#5558E6] hover:shadow-glow",
        variant === "secondary" &&
          "border border-line bg-ink-elevated text-fg-secondary hover:border-brand/40 hover:text-fg",
        variant === "ghost" && "text-fg-secondary hover:bg-ink-elevated hover:text-fg",
        variant === "danger" &&
          "bg-danger/90 text-white hover:bg-danger",
        className
      )}
      {...props}
    />
  );
}

/* ------------------------------ Section header ------------------------------- */

export function SectionHeader({
  title,
  hint,
  right,
}: {
  title: string;
  hint?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-sm font-semibold tracking-tight text-fg">
          {title}
        </h2>
        {hint && <p className="mt-0.5 text-2xs text-fg-muted">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

/* ------------------------------- Empty state --------------------------------- */

export function EmptyState({
  icon: Icon = CircleDashed,
  title,
  body,
}: {
  icon?: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line py-12 text-center">
      <Icon size={22} className="text-fg-faint" />
      <div className="text-sm font-medium text-fg-secondary">{title}</div>
      <div className="max-w-sm text-xs text-fg-muted">{body}</div>
    </div>
  );
}

/* ------------------------------ Severity badge -------------------------------- */

export function SeverityBadge({ severity }: { severity: string }) {
  const tone =
    severity === "Critical"
      ? "text-danger bg-danger-soft border-danger/30"
      : severity === "High"
        ? "text-warn bg-warn-soft border-warn/30"
        : severity === "Medium"
          ? "text-info bg-info-soft border-info/30"
          : "text-fg-muted bg-ink-elevated border-line";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-semibold",
        tone
      )}
    >
      <ShieldAlert size={10} />
      {severity}
    </span>
  );
}
