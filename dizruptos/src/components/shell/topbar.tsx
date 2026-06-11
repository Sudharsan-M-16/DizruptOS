"use client";

import { usePathname } from "next/navigation";
import * as Popover from "@radix-ui/react-popover";
import {
  Bell,
  BellRing,
  Keyboard,
  Monitor,
  Moon,
  OctagonAlert,
  Search,
  Sparkles,
  Sun,
  Zap,
} from "lucide-react";
import { useSession, type Theme } from "@/lib/session";
import { startPresence } from "@/lib/realtime";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn, timeAgo } from "@/lib/utils";
import { useOps } from "@/lib/store";
import { Button } from "@/components/ui/primitives";
import Link from "next/link";

const TITLES: Record<string, { title: string; hint: string }> = {
  "/": { title: "Command Center", hint: "Your Monday morning, in one screen" },
  "/capacity": { title: "Capacity Heatmap", hint: "Drag work from red to green — confirmed atomically" },
  "/projects": { title: "Projects", hint: "Health is calculated, never declared" },
  "/people": { title: "People", hint: "Skills, expertise, and real headroom" },
  "/executive": { title: "Executive Intelligence", hint: "Summary first, drill-down always" },
  "/risks": { title: "Risk Register", hint: "Risks are entities, not dashboard alerts" },
  "/decisions": { title: "Decision Registry", hint: "Rationale that survives the people who wrote it" },
  "/goals": { title: "Goals & OKRs", hint: "Every hour traces to strategic intent" },
  "/proposals": { title: "Agent Negotiation Inbox", hint: "Agents propose · humans decide · memory persists" },
  "/graph": { title: "Dependency Graph", hint: "The organizational graph, made visible" },
  "/audit": { title: "Audit Log", hint: "Insert-only · tamper-proof · complete" },
};

/** Live peer-session counter, fed by the realtime presence heartbeat.
 *  Today: other tabs in this browser. Production: Supabase presence on the
 *  department channel — same component, same contract. */
function PresenceBadge() {
  const [peers, setPeers] = React.useState(0);
  React.useEffect(() => {
    const handle = startPresence("dizrupt-presence", setPeers);
    return () => handle.stop();
  }, []);
  if (peers === 0) return null;
  return (
    <span
      title={`${peers} other live session${peers > 1 ? "s" : ""} — changes sync instantly`}
      className="hidden items-center gap-1.5 rounded-full border border-ok/30 bg-ok-soft px-2.5 py-1 text-2xs font-medium text-ok lg:flex"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ok" />
      </span>
      {peers + 1} live
    </span>
  );
}

const THEME_ORDER: Theme[] = ["dark", "light", "system"];

function ThemeToggle() {
  const theme = useSession((s) => s.theme);
  const setTheme = useSession((s) => s.setTheme);
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return (
    <button
      onClick={() =>
        setTheme(THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length])
      }
      aria-label={`Theme: ${theme} — click to cycle`}
      title={`Theme: ${theme}`}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-ink-surface text-fg-secondary transition-colors hover:border-brand/40 hover:text-fg"
    >
      <Icon size={14} />
    </button>
  );
}

const klassIcon = {
  hard_stop: { Icon: OctagonAlert, tone: "text-danger" },
  critical_action: { Icon: Zap, tone: "text-warn" },
  manager_review: { Icon: Sparkles, tone: "text-brand" },
  intelligence: { Icon: BellRing, tone: "text-info" },
  informational: { Icon: Bell, tone: "text-fg-muted" },
} as const;

export function Topbar() {
  const pathname = usePathname();
  const setPaletteOpen = useOps((s) => s.setPaletteOpen);
  const notifications = useOps((s) => s.notifications);
  const markAllRead = useOps((s) => s.markAllRead);
  const lastAction = useOps((s) => s.lastAction);
  const unread = notifications.filter((n) => !n.read).length;

  const seg = "/" + (pathname.split("/")[1] ?? "");
  const meta = TITLES[seg] ?? TITLES["/"];

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-line-subtle bg-ink/75 px-6 backdrop-blur-xl">
      <div className="min-w-0">
        <h1 className="truncate font-display text-[15px] font-semibold tracking-tight">
          {meta.title}
        </h1>
        <p className="truncate text-2xs text-fg-muted">{meta.hint}</p>
      </div>

      {/* Optimistic-action toast, inline in the bar */}
      <AnimatePresence>
        {lastAction && (
          <motion.div
            key={lastAction}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="hidden items-center gap-1.5 rounded-full border border-ok/30 bg-ok-soft px-3 py-1 text-2xs font-medium text-ok md:flex"
          >
            <Zap size={11} />
            {lastAction}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="ml-auto flex items-center gap-2">
        <PresenceBadge />
        <ThemeToggle />
        <button
          onClick={() => useSession.getState().setShortcutsOpen(true)}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-ink-surface text-fg-secondary transition-colors hover:border-brand/40 hover:text-fg"
        >
          <Keyboard size={14} />
        </button>
        {/* Command palette trigger */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex h-8 w-64 items-center gap-2 rounded-lg border border-line bg-ink-surface px-3 text-xs text-fg-muted transition-colors hover:border-brand/40 hover:text-fg-secondary"
        >
          <Search size={13} />
          <span className="flex-1 text-left">Search people, tasks, risks…</span>
          <span className="kbd">⌘K</span>
        </button>

        {/* Notification inbox */}
        <Popover.Root>
          <Popover.Trigger asChild>
            <button className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-ink-surface text-fg-secondary transition-colors hover:border-brand/40 hover:text-fg">
              <Bell size={14} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 font-mono text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="end"
              sideOffset={8}
              className="z-50 w-[380px] animate-riseIn rounded-card border border-line bg-ink-elevated shadow-pop"
            >
              <div className="flex items-center justify-between border-b border-line-subtle px-4 py-3">
                <div>
                  <div className="text-xs font-semibold">Notifications</div>
                  <div className="text-2xs text-fg-muted">
                    Debounced · rolled up · classed by urgency
                  </div>
                </div>
                <Button variant="ghost" onClick={markAllRead}>
                  Mark all read
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto p-2">
                {notifications.map((n) => {
                  const k = klassIcon[n.klass];
                  const inner = (
                    <div
                      className={cn(
                        "flex gap-3 rounded-lg p-2.5 transition-colors hover:bg-ink-raised",
                        !n.read && "bg-ink-surface"
                      )}
                    >
                      <k.Icon size={15} className={cn("mt-0.5 shrink-0", k.tone)} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-semibold">{n.title}</span>
                          {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
                        </div>
                        <p className="mt-0.5 text-2xs leading-relaxed text-fg-secondary">{n.body}</p>
                        <div className="mt-1 flex items-center gap-2 text-2xs text-fg-muted">
                          <span className="rounded bg-ink-elevated px-1.5 py-px font-mono uppercase">{n.klass.replace("_", " ")}</span>
                          {timeAgo(n.at)}
                        </div>
                      </div>
                    </div>
                  );
                  return n.entityRef ? (
                    <Link key={n.id} href={n.entityRef} className="block">{inner}</Link>
                  ) : (
                    <div key={n.id}>{inner}</div>
                  );
                })}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </header>
  );
}
