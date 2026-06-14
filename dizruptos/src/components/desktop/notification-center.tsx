"use client";

// Notification Center — the frosted panel that drops from the menubar bell.
// It groups the live notification stream (useOps.notifications) into Risks /
// Proposals / Commitments / System, supports mark-all + per-item read, and
// routes a click straight to the relevant DizruptOS window. All routing is data-
// driven (entityRef → app), so wiring a real backend changes nothing here.

import { Bell, CheckCheck, Cpu, Handshake, Inbox, ShieldAlert } from "lucide-react";
import { useOps } from "@/lib/store";
import type { NotificationItem } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

type GroupId = "Risks" | "Proposals" | "Commitments" | "System";

const GROUPS: { id: GroupId; label: string; icon: React.ElementType; accent: string }[] = [
  { id: "Risks", label: "Risks", icon: ShieldAlert, accent: "#EF4444" },
  { id: "Proposals", label: "Proposals", icon: Inbox, accent: "#00ED82" },
  { id: "Commitments", label: "Commitments", icon: Handshake, accent: "#38BDF8" },
  { id: "System", label: "System", icon: Cpu, accent: "#9AA3AD" },
];

function groupOf(n: NotificationItem): GroupId {
  if (n.entityRef?.startsWith("/commitments")) return "Commitments";
  if (n.klass === "manager_review" || n.entityRef?.startsWith("/proposals")) return "Proposals";
  if (n.klass === "hard_stop" || n.klass === "critical_action") return "Risks";
  return "System";
}

// entityRef → which window to open. Known refs map to a registered app id;
// anything else opens the raw route as a window (decoupled fallback).
const ROUTE_APP: Record<string, string> = {
  "/risks": "r-risks", "/capacity": "r-capacity", "/projects": "matrix",
  "/people": "directory", "/commitments": "directory",
};
function openFrom(n: NotificationItem) {
  const ref = n.entityRef;
  if (!ref) { window.dispatchEvent(new CustomEvent("dizrupt:launch", { detail: { id: "home" } })); return; }
  const key = Object.keys(ROUTE_APP).find((k) => ref.startsWith(k));
  if (key) window.dispatchEvent(new CustomEvent("dizrupt:launch", { detail: { id: ROUTE_APP[key] } }));
  else window.dispatchEvent(new CustomEvent("dizrupt:open-route", { detail: { href: ref, title: ref.replace(/^\//, "").split("/")[0] || "DizruptOS" } }));
}

export function NotificationCenter({ onClose }: { onClose: () => void }) {
  const notifications = useOps((s) => s.notifications);
  const markAllRead = useOps((s) => s.markAllRead);
  const markRead = useOps((s) => s.markRead);
  const unread = notifications.filter((n) => !n.read).length;

  const grouped = GROUPS.map((g) => ({ ...g, items: notifications.filter((n) => groupOf(n) === g.id) })).filter((g) => g.items.length > 0);

  return (
    <div className="w-[360px] overflow-hidden rounded-2xl border border-white/15 bg-[rgb(var(--ink-elevated)/0.82)] shadow-2xl backdrop-blur-2xl">
      {/* header */}
      <div className="flex items-center gap-2 border-b border-line/60 px-4 py-3">
        <Bell size={15} style={{ color: "var(--os-accent,#00ED82)" }} />
        <span className="text-sm font-semibold">Notifications</span>
        {unread > 0 && <span className="rounded-full bg-[var(--os-accent,#00ED82)] px-1.5 text-2xs font-bold text-black">{unread}</span>}
        <button
          onClick={markAllRead}
          disabled={unread === 0}
          className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium text-fg-secondary transition-colors hover:bg-white/10 disabled:opacity-40"
        >
          <CheckCheck size={12} /> Mark all read
        </button>
      </div>

      {/* groups */}
      <div className="max-h-[64vh] overflow-y-auto p-2">
        {grouped.length === 0 && <div className="px-3 py-10 text-center text-xs text-fg-muted">You're all caught up.</div>}
        {grouped.map((g) => {
          const GIcon = g.icon;
          const groupUnread = g.items.filter((n) => !n.read).length;
          return (
            <div key={g.id} className="mb-1">
              <div className="flex items-center gap-1.5 px-2 pb-1 pt-2">
                <GIcon size={12} style={{ color: g.accent }} />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">{g.label}</span>
                {groupUnread > 0 && <span className="h-1.5 w-1.5 rounded-full" style={{ background: g.accent }} />}
                <span className="ml-auto font-mono text-2xs text-fg-faint">{g.items.length}</span>
              </div>
              <div className="space-y-1">
                {g.items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { markRead(n.id); openFrom(n); onClose(); }}
                    className={cn(
                      "flex w-full gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                      n.read ? "border-transparent hover:bg-white/[0.05]" : "border-line bg-ink-surface hover:border-line-strong"
                    )}
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: n.read ? "transparent" : g.accent }} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={cn("truncate text-xs", n.read ? "font-medium text-fg-secondary" : "font-semibold text-fg")}>{n.title}</span>
                        <span className="ml-auto shrink-0 text-2xs text-fg-faint">{timeAgo(n.at)}</span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-2xs leading-relaxed text-fg-muted">{n.body}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
