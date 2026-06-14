"use client";

// Command Center — reimagined as a macOS-style DESKTOP. The same live
// intelligence (capacity, portfolio, agent inbox, situation, audit) now lives in
// frosted, draggable windows on an atmospheric desktop, with a vibrancy menubar
// and a magnifying Dock that doubles as navigation. Behaviour cues: MacScape
// (shell), the macOS Clone (motion/vibrancy), react-mosaic (window mechanics).
// All data is the real store/session data — only the surface changed.

import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Activity, AlertOctagon, ArrowRight, BrainCircuit, Boxes, Clock, Crosshair, FileClock,
  Flame, GitBranch, Inbox, KanbanSquare, Lightbulb, ListChecks, Newspaper, OctagonAlert,
  MessageSquare, ScrollText, Settings, ShieldAlert, Sparkles, Target, TrendingUp, Upload, Users, Zap,
} from "lucide-react";
import { NumberTicker } from "@/components/ui/ascension";
import { useOps } from "@/lib/store";
import { PERSONAS, useSession } from "@/lib/session";
import { proposalsForRole } from "@/lib/rbac";
import { commitments, employeeById, employees, projects, WEEKS } from "@/lib/data";
import { Button, CapacityBar, EmpAvatar, Explain, HealthPill } from "@/components/ui/primitives";
import { SparkArea } from "@/components/ui/spark";
import { cn, fmtPct, timeAgo, utilizationTone } from "@/lib/utils";
import { Wallpaper } from "@/components/desktop/wallpaper";
import { Menubar } from "@/components/desktop/menubar";
import { Dock, type DockApp } from "@/components/desktop/dock";
import { DesktopWindow } from "@/components/desktop/window";
import { useDesktop, type WinDef } from "@/components/desktop/use-desktop";
import { OSFrame } from "@/components/desktop/os-frame";
import { SettingsBody } from "@/components/desktop/settings-app";
import { DesktopContextMenu } from "@/components/desktop/context-menu";
import { ProjectMatrix } from "@/components/desktop/apps/project-matrix";
import { OperativeDirectory } from "@/components/desktop/apps/operative-directory";
import { ChatApp } from "@/components/desktop/apps/chat";
import { HomeApp } from "@/components/desktop/apps/home";
import { TasksApp } from "@/components/desktop/apps/tasks-app";
import { KnowledgeVault } from "@/components/desktop/apps/knowledge-vault";
import { Spotlight } from "@/components/desktop/spotlight";
import { MissionControl } from "@/components/desktop/mission-control";
import { Launchpad } from "@/components/desktop/launchpad";
import { WindowSwitcher } from "@/components/desktop/window-switcher";
import { Toaster, toast } from "@/components/desktop/toaster";
import { useOS } from "@/lib/os";
import { APPS, DEFAULT_DOCK, appById, iconFor } from "@/lib/desktop-apps";

const PULSE_HREF: Record<string, string> = {
  "Over-allocation": "/capacity", "Projects at risk": "/projects", "Awaiting decision": "/proposals",
  "Commitments overdue": "/people", "Your load": "/capacity", "Open tasks": "/projects",
  "Your requests": "/proposals", "Projects you're on": "/projects",
};
const PULSE_META: Record<string, { icon: React.ElementType; accent: string }> = {
  "Over-allocation": { icon: Flame, accent: "#F59E0B" }, "Projects at risk": { icon: ShieldAlert, accent: "#EF4444" },
  "Awaiting decision": { icon: Inbox, accent: "#00ED82" }, "Commitments overdue": { icon: Clock, accent: "#38BDF8" },
  "Your load": { icon: Flame, accent: "#F59E0B" }, "Open tasks": { icon: ListChecks, accent: "#2BD9FF" },
  "Your requests": { icon: Inbox, accent: "#00ED82" }, "Projects you're on": { icon: Crosshair, accent: "#38BDF8" },
};

// Window identity: icon + accent per window (used in the title bar + dock).
const WIN_META: Record<string, { icon: React.ElementType; accent: string }> = {
  home: { icon: Activity, accent: "#00ED82" },
  tasks: { icon: ListChecks, accent: "#2BD9FF" },
  settings: { icon: Settings, accent: "#9AA3AD" },
  situation: { icon: AlertOctagon, accent: "#EF4444" },
  pulse: { icon: Activity, accent: "#00ED82" },
  capacity: { icon: Flame, accent: "#F59E0B" },
  inbox: { icon: Inbox, accent: "#2BD9FF" },
  portfolio: { icon: KanbanSquare, accent: "#7C6CFF" },
  activity: { icon: FileClock, accent: "#38BDF8" },
  matrix: { icon: KanbanSquare, accent: "#7C6CFF" },
  directory: { icon: Users, accent: "#38BDF8" },
  chat: { icon: MessageSquare, accent: "#2BD9FF" },
  vault: { icon: Boxes, accent: "#FEBC2E" },
};

export default function CommandCenterDesktop() {
  const surfaceRef = useRef<HTMLDivElement>(null);

  const utilization = useOps((s) => s.utilization);
  const allProposals = useOps((s) => s.proposals);
  const tasks = useOps((s) => s.tasks);
  const audit = useOps((s) => s.audit);
  const canSeeBurnout = useSession((s) => s.can("view_burnout"));
  const canReview = useSession((s) => s.can("review_proposals"));
  const canSeeCapacity = useSession((s) => s.can("view_capacity"));
  const canSeeAudit = useSession((s) => s.can("view_audit"));
  const can = useSession((s) => s.can);
  const personaId = useSession((s) => s.personaId);
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];
  const isEmployee = persona.role === "employee" || persona.role === "client";
  const dockHidden = useOS((s) => s.dockHidden);
  const dockExtra = useOS((s) => s.dockExtra);
  const week = WEEKS[0];

  const active = employees.filter((e) => e.role !== "client");
  const overloaded = active.filter((e) => utilization(e.id, week) >= 1);
  const available = active.filter((e) => utilization(e.id, week) < 0.8).sort((a, b) => utilization(a.id, week) - utilization(b.id, week));
  const overRate = active.length ? overloaded.length / active.length : 0;
  const meanUtil = active.length ? active.reduce((s, e) => s + utilization(e.id, week), 0) / active.length : 0;
  const critical = projects.filter((p) => p.health === "CRITICAL" || p.health === "AT_RISK" || p.health === "DELAYED");
  const proposals = proposalsForRole(allProposals, persona.role, persona.id);
  const pending = proposals.filter((p) => p.status === "pending");
  const overdueCommitments = commitments.filter((c) => c.status === "overdue");

  const myUtil = utilization(persona.id, week);
  const myTasks = tasks.filter((t) => t.assigneeId === persona.id && t.status !== "COMPLETED");
  const myDueThisWeek = myTasks.filter((t) => t.weekStart === week);

  // A lightweight "org pulse" for the menubar (the rigorous score lives on
  // /executive). Computed from live load + portfolio + queue pressure.
  const pulseScore = Math.max(0, Math.min(100, Math.round(
    100 - overRate * 38 - (projects.length ? (critical.length / projects.length) * 28 : 0)
      - (overdueCommitments.length ? 8 : 0) - (pending.length > 2 ? 8 : 0)
  )));

  const pulseStats = isEmployee
    ? [
        { label: "Your load", value: <NumberTicker value={Math.round(myUtil * 100)} suffix="%" />, delta: myUtil >= 1 ? "over capacity" : myUtil >= 0.8 ? "near limit" : "healthy", good: myUtil < 0.8, signals: [`${Math.round(myUtil * 100)}% of your ${employeeById(persona.id)?.capacityHoursPerWeek ?? 40}h week is allocated`] },
        { label: "Open tasks", value: <NumberTicker value={myTasks.length} />, delta: `${myDueThisWeek.length} due this week`, good: myDueThisWeek.length <= 2, signals: myTasks.map((t) => `${t.title} (${t.estimatedHours}h)`) },
        { label: "Your requests", value: <NumberTicker value={pending.length} />, delta: pending.length ? "needs your reply" : "all clear", good: pending.length === 0, signals: pending.map((p) => p.title) },
        { label: "Projects you're on", value: <NumberTicker value={new Set(myTasks.map((t) => t.projectId)).size} />, delta: "portfolio", good: true, signals: Array.from(new Set(myTasks.map((t) => t.projectId))).map((id) => projects.find((p) => p.id === id)?.name ?? id) },
      ]
    : [
        { label: "Over-allocation", value: <NumberTicker value={Math.round(overRate * 100)} suffix="%" />, delta: "−9 pts wk/wk", good: true, signals: overloaded.map((e) => `${e.name} at ${fmtPct(utilization(e.id, week))}`) },
        { label: "Projects at risk", value: (<><NumberTicker value={critical.length} /><span className="text-sm font-normal text-fg-muted"> / {projects.length}</span></>), delta: "Atlas → Critical", good: false, signals: critical.map((p) => `${p.name}: ${p.healthReasons[0]}`) },
        { label: "Awaiting decision", value: <NumberTicker value={pending.length} />, delta: "1 staged", good: true, signals: pending.map((p) => `${p.title} (${Math.round(p.confidence * 100)}%)`) },
        { label: "Commitments overdue", value: <NumberTicker value={overdueCommitments.length} />, delta: "oldest Jun 9", good: false, signals: commitments.map((c) => `${employeeById(c.ownerId)?.name} → ${employeeById(c.toId)?.name}: ${c.title}`) },
      ];

  const compromise = pending.find((p) => p.conflict);
  const worstOverload = [...overloaded].sort((a, b) => utilization(b.id, week) - utilization(a.id, week))[0];

  // ---- window definitions (initial desktop tiling; free-drag after) ----
  // Order matters: later = higher z (frontmost). Home is listed LAST among the
  // open windows so it opens on top — it's the most important "what's my day" view.
  const defs: WinDef[] = [
    { id: "situation", title: "Situation — Atlas Payments", x: 812, y: 14, w: 588, h: 188 },
    { id: "pulse", title: isEmployee ? "Your Pulse" : "Org Pulse", x: 812, y: 214, w: 588, h: 300 },
    { id: "home", title: "Home", x: 24, y: 14, w: 772, h: 588 },
    { id: "capacity", title: canSeeCapacity ? "Capacity — week of Jun 8" : `Your week — ${persona.name.split(" ")[0]}`, x: 812, y: 478, w: 600, h: 280, closed: true },
    { id: "inbox", title: isEmployee ? "Your Requests" : "Agent Inbox", x: 644, y: 288, w: 392, h: 300, closed: true },
    { id: "portfolio", title: "Portfolio Health", x: 1052, y: 288, w: 364, h: 300, closed: true },
    { id: "activity", title: "Activity — audit trail", x: 22, y: 562, w: 600, h: 196, closed: true },
    { id: "tasks", title: "Tasks", x: 90, y: 60, w: 900, h: 560, closed: true },
    { id: "matrix", title: "Project Matrix", x: 120, y: 70, w: 960, h: 560, closed: true },
    { id: "directory", title: "Operative Directory", x: 220, y: 120, w: 780, h: 500, closed: true },
    { id: "chat", title: "Messages", x: 200, y: 100, w: 860, h: 560, closed: true },
    { id: "vault", title: "Knowledge Vault", x: 180, y: 90, w: 900, h: 560, closed: true },
    { id: "settings", title: "System Settings", x: 300, y: 80, w: 760, h: 560, closed: true },
  ];

  const dm = useDesktop(defs, surfaceRef, persona.id);
  const winById = (id: string) => dm.wins.find((w) => w.id === id)!;
  // frontmost = visible window with the highest z-index.
  const frontId = dm.wins
    .filter((w) => !w.closed && !w.minimized)
    .reduce<string | undefined>((top, w) => (top && winById(top).z > w.z ? top : w.id), undefined);

  // ---- the one place an app gets launched (dock, Spotlight, Launchpad, Home) ----
  const launchApp = useCallback((id: string) => {
    const app = appById(id);
    if (!app) { dm.open(id); return; }                              // org panel window
    if (app.perm && !can(app.perm)) {                               // RBAC: deny + audit + notify
      useOps.getState().recordAccessDenied(app.label);
      toast("Access denied", `Your role can’t open ${app.label}.`, "danger");
      return;
    }
    if (app.kind === "special") { window.dispatchEvent(new CustomEvent("dizrupt:open-settings")); return; }
    if (app.kind === "panel") { dm.open(app.id); return; }          // Home / Matrix / Directory
    dm.openApp({                                                    // route → iframe window
      id: app.id, title: app.label, kind: "iframe",
      url: `${app.href}?embed=1`, iconKey: app.iconKey, accent: app.accent,
      x: app.x ?? 150, y: app.y ?? 70, w: app.w ?? 1040, h: app.h ?? 600,
    });
  }, [dm]);

  // Home / other surfaces fire `dizrupt:launch` — route it through launchApp.
  useEffect(() => {
    const onLaunch = (e: Event) => { const id = (e as CustomEvent).detail?.id; if (id) launchApp(id); };
    window.addEventListener("dizrupt:launch", onLaunch);
    return () => window.removeEventListener("dizrupt:launch", onLaunch);
  }, [launchApp]);

  // RBAC gate shared by dock / spotlight / launchpad.
  const appAllowed = useCallback((id: string) => { const a = appById(id); return !a?.perm || can(a.perm); }, [can]);


  // Notifications can open any product route as a window (when no registered app
  // matches the entityRef).
  useEffect(() => {
    const onRoute = (e: Event) => {
      const d = (e as CustomEvent).detail as { href?: string; title?: string } | undefined;
      if (!d?.href) return;
      dm.openApp({
        id: `route:${d.href}`, title: d.title ? d.title[0].toUpperCase() + d.title.slice(1) : "DizruptOS",
        kind: "iframe", url: `${d.href}${d.href.includes("?") ? "&" : "?"}embed=1`,
        iconKey: "launchpad", accent: "#9AA3AD", x: 170, y: 80, w: 1000, h: 580,
      });
    };
    window.addEventListener("dizrupt:open-route", onRoute);
    return () => window.removeEventListener("dizrupt:open-route", onRoute);
  }, [dm]);

  // System Settings is now a managed window — open/focus it on the event.
  useEffect(() => {
    const onSettings = () => dm.open("settings");
    window.addEventListener("dizrupt:open-settings", onSettings);
    return () => window.removeEventListener("dizrupt:open-settings", onSettings);
  }, [dm]);

  const resolveWinIcon = (w: typeof dm.wins[number]) => w.iconKey ? iconFor(w.iconKey) : (WIN_META[w.id]?.icon ?? iconFor());
  const resolveWinAccent = (w: typeof dm.wins[number]) => w.accent ?? WIN_META[w.id]?.accent ?? "#9AA3AD";

  // ---- dock: pinned apps (customizable) + open-window tiles ----
  const pinnedIds = [
    ...DEFAULT_DOCK.filter((id) => !dockHidden.includes(id)),
    ...dockExtra.filter((id) => !DEFAULT_DOCK.includes(id) && !dockHidden.includes(id)),
  ].filter(appAllowed);
  const pinnedDock: DockApp[] = pinnedIds.map((id) => {
    const a = appById(id)!;
    const running = dm.wins.some((w) => w.id === id && !w.closed && !w.minimized);
    return { id, appId: id, label: a.label, icon: iconFor(a.iconKey), accent: a.accent, running, onClick: () => launchApp(id) };
  });
  const launchpadApp: DockApp = { id: "launchpad", label: "Launchpad", icon: iconFor("launchpad"), accent: "#2BD9FF", onClick: () => window.dispatchEvent(new CustomEvent("dizrupt:launchpad")) };
  // open windows that aren't already pinned → restore tiles on the right
  const openTiles: DockApp[] = dm.wins
    .filter((w) => !w.closed && !pinnedIds.includes(w.id) && (canSeeAudit || w.id !== "activity"))
    .map((w) => ({ id: `win-${w.id}`, label: w.title, icon: resolveWinIcon(w), accent: resolveWinAccent(w), running: !w.minimized, onClick: () => dm.open(w.id) }));
  const dockApps: (DockApp | "sep")[] = [launchpadApp, ...pinnedDock, ...(openTiles.length ? ["sep" as const, ...openTiles] : [])];

  // ---- Spotlight + Mission Control feeds ----
  const orgPanels = dm.wins.filter((w) => !["home", "matrix", "directory"].includes(w.id) && (canSeeAudit || w.id !== "activity"));
  const spotApps = [
    ...APPS.filter((a) => a.kind !== "special" && appAllowed(a.id)).map((a) => ({ id: a.id, label: a.label, icon: iconFor(a.iconKey), accent: a.accent })),
    ...orgPanels.map((w) => ({ id: w.id, label: w.title, icon: resolveWinIcon(w), accent: resolveWinAccent(w) })),
  ];
  const spotRoutes: { label: string; href: string; icon: React.ElementType; accent?: string }[] = [];
  const mcItems = dm.wins
    .filter((w) => canSeeAudit || w.id !== "activity")
    .map((w) => ({ id: w.id, title: w.title, icon: resolveWinIcon(w), accent: resolveWinAccent(w), minimized: w.minimized, closed: w.closed }));
  // most-recently-used order (focus z desc) for the ⌘/Ctrl+` window switcher
  const switchItems = dm.wins
    .filter((w) => !w.closed)
    .sort((a, b) => b.z - a.z)
    .map((w) => ({ id: w.id, title: w.title, icon: resolveWinIcon(w), accent: resolveWinAccent(w) }));

  // helper to render a window shell — wrapped in AnimatePresence so minimize/
  // close can play the genie-into-dock exit before unmounting.
  const renderWin = (id: string, body: React.ReactNode, bare?: boolean) => {
    const w = winById(id);
    const meta = WIN_META[id];
    const visible = !w.closed && !w.minimized;
    return (
      <AnimatePresence key={id}>
        {visible && (
          <DesktopWindow
            win={w} frontmost={frontId === id} icon={meta.icon} accent={meta.accent}
            onFocus={() => dm.focus(id)} onStartDrag={(e) => dm.startDrag(id, e)}
            onStartResize={(dir, e) => dm.startResize(id, dir, e)}
            onClose={() => dm.close(id)} onMinimize={() => dm.toggleMin(id)} onMaximize={() => dm.toggleMax(id)}
            bare={bare}
          >
            {body}
          </DesktopWindow>
        )}
      </AnimatePresence>
    );
  };

  return (
    <OSFrame>
    <div className="flex h-screen flex-col">
      <Menubar healthScore={pulseScore} capacityPct={meanUtil} />

      {/* desktop surface */}
      <DesktopContextMenu>
      <div ref={surfaceRef} className="relative flex-1 overflow-hidden">
        <Wallpaper />

        {/* greeting watermark */}
        <div className="pointer-events-none absolute left-8 top-7 select-none" style={{ textShadow: "0 1px 18px rgba(0,0,0,0.35)" }}>
          <div className="font-display text-2xl font-bold tracking-tight text-fg">
            {greeting()}, {persona.name.split(" ")[0]}.
          </div>
          <div className="mt-0.5 text-sm text-fg-muted">
            {isEmployee ? "Your week, on one desktop." : "Your organization, on one desktop."}
          </div>
        </div>

        {/* snap preview */}
        {dm.snapZone && <SnapPreview zone={dm.snapZone} />}

        {/* windows */}
        {renderWin("home", <HomeApp />)}
        {renderWin("situation", <SituationBody canReview={canReview} canSeeCapacity={canSeeCapacity} compromise={compromise} worstOverload={worstOverload} utilization={utilization} week={week} />)}
        {renderWin("pulse", <PulseBody stats={pulseStats} />)}
        {renderWin("capacity", canSeeCapacity
          ? <CapacityBody overloaded={overloaded} active={active} available={available} utilization={utilization} week={week} canSeeBurnout={canSeeBurnout} />
          : <YourWeekBody myUtil={myUtil} myTasks={myTasks} />)}
        {renderWin("inbox", <InboxBody pending={pending} isEmployee={isEmployee} />)}
        {renderWin("portfolio", <PortfolioBody />)}
        {canSeeAudit && renderWin("activity", <ActivityBody audit={audit} />)}
        {renderWin("tasks", <TasksApp />, true)}
        {renderWin("matrix", <ProjectMatrix />)}
        {renderWin("directory", <OperativeDirectory />)}
        {renderWin("chat", <ChatApp />, true)}
        {renderWin("vault", <KnowledgeVault />, true)}
        {renderWin("settings", <SettingsBody />, true)}

        {/* dynamic route-as-window apps (iframes) */}
        {dm.wins.filter((w) => w.kind === "iframe").map((w) => (
          <AnimatePresence key={w.id}>
            {!w.closed && !w.minimized && (
              <DesktopWindow
                win={w} frontmost={frontId === w.id} icon={resolveWinIcon(w)} accent={resolveWinAccent(w)}
                onFocus={() => dm.focus(w.id)} onStartDrag={(e) => dm.startDrag(w.id, e)}
                onStartResize={(dir, e) => dm.startResize(w.id, dir, e)}
                onClose={() => dm.close(w.id)} onMinimize={() => dm.toggleMin(w.id)} onMaximize={() => dm.toggleMax(w.id)}
                bare
              >
                <iframe src={w.url} title={w.title} loading="lazy" className="h-full w-full border-0 bg-ink" />
              </DesktopWindow>
            )}
          </AnimatePresence>
        ))}

        <Toaster />
        <Launchpad />
        <Spotlight apps={spotApps} routes={spotRoutes} onOpenWindow={launchApp} />
        <MissionControl items={mcItems} onSelect={(id) => dm.open(id)} onLaunch={(id) => dm.open(id)} />
        <WindowSwitcher windows={switchItems} onSelect={(id) => dm.open(id)} />
        <Dock apps={dockApps} />
      </div>
      </DesktopContextMenu>
    </div>
    </OSFrame>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

// Translucent accent zone shown while dragging a window toward an edge.
function SnapPreview({ zone }: { zone: "left" | "right" | "max" }) {
  const base = "pointer-events-none absolute z-[5] rounded-2xl border-2 transition-all duration-100";
  const style = { borderColor: "var(--os-accent,#00ED82)", background: "var(--os-accent-soft, rgba(0,237,130,0.13))" };
  if (zone === "max") return <div className={cn(base, "inset-3")} style={style} />;
  if (zone === "left") return <div className={cn(base, "left-3 top-3 bottom-3 w-[calc(50%-12px)]")} style={style} />;
  return <div className={cn(base, "right-3 top-3 bottom-3 w-[calc(50%-12px)]")} style={style} />;
}

/* ------------------------------- window bodies ----------------------------- */

function SituationBody({ canReview, canSeeCapacity, compromise, worstOverload, utilization, week }: any) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-danger opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
        </span>
        <span className="label-xs text-danger">Situation · right now</span>
      </div>
      <h2 className="mt-1.5 font-display text-lg font-bold leading-snug tracking-tight">
        Atlas Payments Migration is CRITICAL — <span className="text-danger">$4.2M ARR exposed</span>
      </h2>
      <p className="mt-1.5 text-xs leading-relaxed text-fg-secondary">
        7 tasks overdue · QA at 112% · velocity −38% vs 3-sprint average · vendor settlement 8 days late.
      </p>
      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        {canReview && compromise && (
          <Link href="/proposals"><Button className="h-8"><Zap size={12} /> Review compromise</Button></Link>
        )}
        {canSeeCapacity && worstOverload && (
          <Link href="/capacity"><Button variant="secondary" className="h-8"><Flame size={12} /> Relieve {worstOverload.name.split(" ")[0]} · {fmtPct(utilization(worstOverload.id, week))}</Button></Link>
        )}
        <Link href="/projects/p-atlas"><Button variant={canReview ? "secondary" : "primary"} className="h-8"><Crosshair size={12} /> Open Atlas</Button></Link>
      </div>
    </div>
  );
}

function PulseBody({ stats }: { stats: any[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s) => {
        const meta = PULSE_META[s.label] ?? { icon: Zap, accent: "#00ED82" };
        const Icon = meta.icon;
        return (
          <div key={s.label} className="group relative overflow-hidden rounded-xl border border-line bg-ink-surface/60 p-4"
            style={{ background: `radial-gradient(120% 120% at 0% 0%, ${meta.accent}1f, transparent 55%), rgba(13,14,17,0.5)` }}>
            <Link href={PULSE_HREF[s.label] ?? "/"} aria-label={`Open ${s.label}`} className="absolute inset-0 z-0" />
            <div className="pointer-events-none relative z-10">
              <div className="flex items-start justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-lg border" style={{ borderColor: `${meta.accent}40`, background: `${meta.accent}14`, color: meta.accent }}>
                  <Icon size={17} />
                </span>
                <span className="pointer-events-auto relative z-20"><Explain title={s.label} signals={s.signals} /></span>
              </div>
              <div className="mt-3 font-display text-3xl font-bold leading-none tracking-tight">{s.value}</div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-fg-muted">{s.label}</span>
                <span className={cn("shrink-0 text-2xs font-semibold", s.good ? "text-ok" : "text-warn")}>{s.delta}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CapacityBody({ overloaded, active, available, utilization, week, canSeeBurnout }: any) {
  const list = [...overloaded, ...active.filter((e: any) => { const u = utilization(e.id, week); return u >= 0.8 && u < 1; })].slice(0, 5);
  return (
    <div className="space-y-1">
      {list.map((e: any) => {
        const pct = utilization(e.id, week);
        return (
          <Link key={e.id} href="/capacity" className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-ink-elevated">
            <EmpAvatar initials={e.initials} accent={e.accent} size={28} />
            <div className="w-36 min-w-0">
              <div className="truncate text-xs font-semibold">{e.name}</div>
              <div className="truncate text-2xs text-fg-muted">{e.title}</div>
            </div>
            <CapacityBar pct={pct} className="flex-1" />
            <span className={cn("w-12 text-right font-mono text-xs font-semibold", utilizationTone(pct) === "danger" ? "text-danger" : utilizationTone(pct) === "warn" ? "text-warn" : "text-ok")}>{fmtPct(pct)}</span>
            {e.burnoutFlag && canSeeBurnout && (
              <Explain title="Burnout signals (manager-private)" signals={e.burnoutSignals ?? []}>
                <button className="rounded-full border border-danger/40 bg-danger-soft px-2 py-px text-2xs font-semibold text-danger">burnout</button>
              </Explain>
            )}
          </Link>
        );
      })}
      <div className="flex items-center gap-2 px-2 pt-2 text-2xs text-fg-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-ok" />
        Most available: {available.slice(0, 3).map((e: any) => `${e.name.split(" ")[0]} (${fmtPct(utilization(e.id, week))})`).join(" · ")}
      </div>
    </div>
  );
}

function YourWeekBody({ myUtil, myTasks }: any) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-4 px-2 py-2">
        <span className="label-xs w-20 shrink-0">Your load</span>
        <CapacityBar pct={myUtil} className="flex-1" />
        <span className="w-12 text-right font-mono text-xs font-semibold text-ok">{fmtPct(myUtil)}</span>
      </div>
      {myTasks.slice(0, 6).map((t: any) => (
        <button key={t.id} onClick={() => useOps.getState().openTaskDrawer(t.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-ink-elevated">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold">{t.title}</span>
            <span className="text-2xs text-fg-muted">{projects.find((pr) => pr.id === t.projectId)?.name}</span>
          </span>
          <span className="font-mono text-2xs text-fg-secondary">{t.estimatedHours}h</span>
          <span className="rounded-full border border-line bg-ink-elevated px-2 py-px text-2xs capitalize text-fg-secondary">{t.status.replace("_", " ").toLowerCase()}</span>
        </button>
      ))}
    </div>
  );
}

function InboxBody({ pending, isEmployee }: any) {
  return (
    <div className="space-y-2">
      <Link href="/proposals" className="flex items-center gap-1.5 text-2xs font-medium text-brand hover:underline">
        <Inbox size={11} /> {isEmployee ? "Your requests" : "Needs your decision"} <ArrowRight size={11} />
      </Link>
      {pending.slice(0, 4).map((p: any) => (
        <Link key={p.id} href="/proposals" className="block rounded-xl border border-line bg-ink-surface p-3 transition-colors hover:bg-ink-elevated">
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2 py-px text-2xs font-semibold", p.priority >= 100 ? "bg-danger-soft text-danger" : p.priority >= 70 ? "bg-warn-soft text-warn" : "bg-brand-soft text-brand")}>{p.agentType.replace("_", " ")}</span>
            {p.conflict && <span className="rounded-full border border-line bg-ink-elevated px-2 py-px text-2xs text-fg-secondary">compromise</span>}
            <span className="ml-auto font-mono text-2xs text-fg-muted">{Math.round(p.confidence * 100)}%</span>
          </div>
          <div className="mt-2 text-xs font-semibold leading-snug">{p.title}</div>
          <p className="mt-1 line-clamp-2 text-2xs leading-relaxed text-fg-secondary">{p.summary}</p>
        </Link>
      ))}
      {pending.length === 0 && <div className="rounded-xl border border-line bg-ink-surface p-4 text-2xs text-fg-muted">Nothing awaiting you — all clear.</div>}
    </div>
  );
}

function PortfolioBody() {
  return (
    <div className="space-y-2">
      {projects.map((p) => (
        <Link key={p.id} href={`/projects/${p.id}`} className="block rounded-xl border border-line bg-ink-surface p-3 transition-colors hover:bg-ink-elevated">
          <div className="flex items-center gap-2">
            <span className="rounded bg-ink-elevated px-1.5 py-px font-mono text-2xs text-fg-muted">{p.code}</span>
            <span className="truncate text-xs font-semibold">{p.name}</span>
            <HealthPill health={p.health} pulse className="ml-auto" />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-8 flex-1"><SparkArea data={p.velocityTrend} color={p.health === "CRITICAL" ? "#EF4444" : p.health === "ON_TRACK" ? "#10B981" : "#F59E0B"} /></div>
            <div className="text-right text-2xs">
              <div className="font-mono text-fg-secondary">{Math.round((p.consumedHours / p.budgetHours) * 100)}%</div>
              <div className="text-fg-muted">budget</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ActivityBody({ audit }: any) {
  return (
    <div className="space-y-1">
      {audit.slice(0, 6).map((a: any) => {
        const actor = employeeById(a.actorId);
        return (
          <div key={a.id} className="flex gap-3 rounded-lg px-2 py-2">
            {actor && <EmpAvatar initials={actor.initials} accent={actor.accent} size={22} />}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xs text-brand">{a.actionType}</span>
                <span className="ml-auto shrink-0 text-2xs text-fg-faint">{timeAgo(a.at)}</span>
              </div>
              <p className="mt-0.5 truncate text-2xs text-fg-secondary"><span className="text-fg">{a.entityLabel}</span> — {a.detail}</p>
              {a.overrideReason && <p className="mt-1 flex items-center gap-1 text-2xs text-warn"><OctagonAlert size={10} /> override: “{a.overrideReason}”</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
