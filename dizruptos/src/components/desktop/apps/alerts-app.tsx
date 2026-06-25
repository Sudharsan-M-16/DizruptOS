"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { Bell, RefreshCw, CheckCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrgAlert, AlertCategory } from "@/server/services/alert-engine";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#FF5F57",
  high: "#FEBC2E",
  medium: "#00ED82",
  low: "#6B7280",
  info: "#3B82F6",
};

const CATEGORY_LABELS: Record<AlertCategory, string> = {
  risk: "Risk",
  capacity: "Capacity",
  recommendation: "Recs",
  simulation: "Simulation",
  calibration_drift: "Calibration",
  project_health: "Projects",
  succession: "Succession",
  digest: "Digest",
};

function launchAction(actionId?: string) {
  if (!actionId) return;
  window.dispatchEvent(new CustomEvent("dizrupt:launch", { detail: { id: actionId } }));
}

const FILTER_TABS: (AlertCategory | "all")[] = [
  "all", "risk", "capacity", "succession", "project_health", "recommendation",
];

export const AlertsApp = memo(function AlertsApp() {
  const [alerts, setAlerts] = useState<OrgAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState<AlertCategory | "all">("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/alerts");
      if (res.ok) {
        const json = await res.json();
        setAlerts(json.data ?? []);
        return (json.data ?? []) as OrgAlert[];
      }
    } catch {
      // resilient — show empty state on error
    } finally {
      setLoading(false);
    }
    return [] as OrgAlert[];
  }, []);

  // On open: load existing alerts; if there are none yet, evaluate once so the
  // center is populated from the live org state instead of showing empty.
  useEffect(() => {
    (async () => {
      const existing = await load();
      if (existing.length === 0) {
        try {
          await fetch("/api/v1/alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
          await load();
        } catch { /* ignore */ }
      }
    })();
  }, [load]);

  const runEngine = async () => {
    setRunning(true);
    try {
      await fetch("/api/v1/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await load();
    } finally {
      setRunning(false);
    }
  };

  const dismissAll = async () => {
    await fetch("/api/v1/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "acknowledge_all" }),
    });
    await load();
  };

  const dismissOne = async (id: string) => {
    await fetch(`/api/v1/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acknowledged: true }),
    });
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const visible =
    filter === "all" ? alerts : alerts.filter((a) => a.category === filter);
  const unackedCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-[#FF5F57]" />
          <span className="text-sm font-semibold text-fg-secondary">Alert Center</span>
          {unackedCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF5F57] px-1 text-[9px] font-bold text-white">
              {unackedCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={runEngine}
            disabled={running}
            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-medium text-fg-muted transition-colors hover:bg-white/[0.06] hover:text-fg-secondary disabled:opacity-50"
          >
            <RefreshCw size={9} className={running ? "animate-spin" : ""} />
            {running ? "Running…" : "Evaluate"}
          </button>
          {unackedCount > 0 && (
            <button
              onClick={dismissAll}
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-medium text-fg-muted transition-colors hover:bg-white/[0.06] hover:text-fg-secondary"
            >
              <CheckCheck size={9} />
              Dismiss all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex shrink-0 gap-0.5 border-b border-white/[0.06] px-3 py-1.5">
        {FILTER_TABS.map((cat) => {
          const count =
            cat === "all"
              ? unackedCount
              : alerts.filter((a) => a.category === cat && !a.acknowledged).length;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-medium capitalize transition-colors",
                filter === cat
                  ? "bg-white/[0.08] text-fg-secondary"
                  : "text-fg-muted hover:text-fg-secondary"
              )}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat as AlertCategory]}
              {count > 0 && (
                <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#FF5F57]/80 px-0.5 text-[8px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <RefreshCw size={16} className="animate-spin text-fg-faint" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <Bell size={20} className="text-fg-faint" />
            <p className="text-xs text-fg-faint">
              {filter === "all"
                ? "No alerts. Click Evaluate to check org health."
                : `No ${filter.replace("_", " ")} alerts.`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "group relative rounded-xl border p-3 transition-colors",
                  alert.acknowledged
                    ? "border-white/[0.04] bg-white/[0.02] opacity-50"
                    : "border-white/[0.08] bg-[rgb(var(--ink-elevated)/0.5)]"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="mt-[3px] h-2 w-2 shrink-0 rounded-full"
                    style={{ background: SEVERITY_COLOR[alert.severity] ?? "#6B7280" }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold leading-snug text-fg-secondary">
                        {alert.title}
                      </p>
                      <span
                        className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                        style={{
                          background: `${SEVERITY_COLOR[alert.severity] ?? "#6B7280"}18`,
                          color: SEVERITY_COLOR[alert.severity] ?? "#6B7280",
                        }}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-fg-muted">
                      {alert.body}
                    </p>
                    {alert.evidence.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {alert.evidence.map((e, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-fg-faint"
                          >
                            {e.label}:{" "}
                            <strong className="text-fg-muted">{e.value}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      {alert.actionId && !alert.acknowledged && (
                        <button
                          onClick={() => launchAction(alert.actionId)}
                          className="text-[10px] font-medium transition-opacity hover:opacity-70"
                          style={{ color: SEVERITY_COLOR[alert.severity] ?? "#00ED82" }}
                        >
                          View →
                        </button>
                      )}
                      {!alert.acknowledged && (
                        <button
                          onClick={() => dismissOne(alert.id)}
                          className="text-[10px] text-fg-faint transition-colors hover:text-fg-muted"
                        >
                          Dismiss
                        </button>
                      )}
                      <span className="text-[9px] text-fg-faint">
                        {new Date(alert.generatedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="shrink-0 border-t border-white/[0.04] px-4 py-2">
        <p className="text-[10px] text-fg-faint">
          Alerts are re-evaluated on demand. Critical alerts are escalated automatically.
        </p>
      </div>
    </div>
  );
});
