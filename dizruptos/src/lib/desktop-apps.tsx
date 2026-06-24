"use client";

// The DizruptOS application registry — one source of truth shared by the dock,
// Spotlight, Launchpad, the window manager and layout persistence. Two kinds:
//   • "iframe" apps  — existing product routes shown inside a window (no nav away)
//   • "panel" apps   — first-class desktop windows (Home, Project Matrix, …) and
//                       the special Settings surface
// Icons are referenced by string `iconKey` so app identity survives JSON
// persistence; ICONS resolves the key back to a lucide component at render time.

import {
  Activity, AppWindow, Bell, BrainCircuit, Download, FolderOpen, Flame, FileClock, GitBranch, Home,
  Inbox, KanbanSquare, Lightbulb, ListChecks, MessageSquare, Newspaper, Scale, Settings, Shield, ShieldAlert, Sparkles,
  AlertOctagon, Target, TrendingUp, Users, FlaskConical, Bot, Zap,
} from "lucide-react";

export const ICONS: Record<string, React.ElementType> = {
  home: Home, tasks: ListChecks, matrix: KanbanSquare, directory: Users, settings: Settings, vault: FolderOpen, chat: MessageSquare,
  alerts: Bell,
  executive: Activity, briefing: Sparkles, narratives: Newspaper,
  recommendations: Lightbulb, learning: TrendingUp, capacity: Flame,
  people: Users, projects: KanbanSquare, graph: GitBranch, memory: BrainCircuit,
  risks: ShieldAlert, situation: AlertOctagon, pulse: Activity, inbox: Inbox,
  portfolio: KanbanSquare, activity: FileClock, launchpad: AppWindow,
  simulation: FlaskConical, copilot: Bot,
  goals: Target, proposals: Inbox, decisions: Scale, capabilities: Zap, audit: FileClock, import: Download,
  admin: Shield,
};
export const iconFor = (key?: string) => ICONS[key ?? ""] ?? AppWindow;

import type { Permission } from "./personas";

export interface AppEntry {
  id: string;
  label: string;
  iconKey: string;
  accent: string;
  kind: "iframe" | "panel" | "special";
  href?: string;            // iframe route (without ?embed)
  w?: number; h?: number; x?: number; y?: number; // default window rect
  dock?: boolean;           // appears in the default dock
  /** RBAC gate — app is hidden/blocked unless the viewer's role holds this. */
  perm?: Permission;
}

// Default window rect for spawned iframe apps.
const IFRAME_RECT = { x: 150, y: 70, w: 1040, h: 600 };

export const APPS: AppEntry[] = [
  // first-class panels
  { id: "home", label: "Home", iconKey: "home", accent: "#00ED82", kind: "panel", dock: true },
  { id: "tasks", label: "Tasks", iconKey: "tasks", accent: "#2BD9FF", kind: "panel", dock: true },
  { id: "matrix", label: "Project Matrix", iconKey: "matrix", accent: "#7C6CFF", kind: "panel", dock: true },
  // Folded into the Capacity matrix (click a person → sidebar). Kept launchable
  // for deep links, but no longer a separate dock app.
  { id: "directory", label: "Operative Directory", iconKey: "directory", accent: "#38BDF8", kind: "panel", dock: false },
  { id: "chat", label: "Messages", iconKey: "chat", accent: "#2BD9FF", kind: "panel", dock: true },
  { id: "vault", label: "Knowledge Vault", iconKey: "vault", accent: "#FEBC2E", kind: "panel", dock: true },

  // product routes, shown as windows (RBAC-gated where the surface is sensitive)
  { id: "r-executive", label: "Executive", iconKey: "executive", accent: "#00ED82", kind: "iframe", href: "/executive", dock: true, perm: "view_executive", ...IFRAME_RECT },
  { id: "r-briefing", label: "Exec Briefing", iconKey: "briefing", accent: "#3DF59E", kind: "iframe", href: "/briefing", dock: false, perm: "view_executive", ...IFRAME_RECT },
  { id: "r-narratives", label: "Narratives", iconKey: "narratives", accent: "#2BD9FF", kind: "iframe", href: "/narratives", dock: true, perm: "view_executive", ...IFRAME_RECT },
  { id: "r-recommendations", label: "Recommendations", iconKey: "recommendations", accent: "#FEBC2E", kind: "iframe", href: "/recommendations", dock: true, perm: "review_proposals", ...IFRAME_RECT },
  { id: "r-learning", label: "Learning Loop", iconKey: "learning", accent: "#10B981", kind: "iframe", href: "/learning", dock: false, ...IFRAME_RECT },
  { id: "r-capacity", label: "Capacity", iconKey: "capacity", accent: "#F59E0B", kind: "iframe", href: "/capacity", dock: true, perm: "view_capacity", ...IFRAME_RECT },
  { id: "r-people", label: "People", iconKey: "people", accent: "#38BDF8", kind: "iframe", href: "/people", dock: false, perm: "view_capacity", ...IFRAME_RECT },
  { id: "r-projects", label: "Projects", iconKey: "projects", accent: "#7C6CFF", kind: "iframe", href: "/projects", dock: false, ...IFRAME_RECT },
  { id: "r-graph", label: "Dependency Graph", iconKey: "graph", accent: "#A78BFA", kind: "iframe", href: "/graph", dock: true, ...IFRAME_RECT },
  { id: "r-memory", label: "Org Memory", iconKey: "memory", accent: "#C084FC", kind: "iframe", href: "/memory", dock: false, ...IFRAME_RECT },
  { id: "r-risks", label: "Risks", iconKey: "risks", accent: "#EF4444", kind: "iframe", href: "/risks", dock: true, perm: "review_proposals", ...IFRAME_RECT },

  // Monte Carlo simulation — native panel (no iframe needed)
  { id: "simulation", label: "What-If Simulation", iconKey: "simulation", accent: "#FEBC2E", kind: "panel", dock: false, perm: "view_executive", x: 120, y: 60, w: 920, h: 640 },

  // AI Copilot — native panel with follow-up chips, grounded on live org data
  { id: "copilot", label: "AI Copilot", iconKey: "copilot", accent: "#00ED82", kind: "panel", dock: true, x: 200, y: 60, w: 860, h: 560 },

  // Previously orphaned routes — now first-class OS apps
  { id: "r-goals", label: "Goals & OKRs", iconKey: "goals", accent: "#10B981", kind: "iframe", href: "/goals", dock: true, ...IFRAME_RECT },
  { id: "r-proposals", label: "Agent Inbox", iconKey: "proposals", accent: "#FEBC2E", kind: "iframe", href: "/proposals", dock: true, perm: "review_proposals", ...IFRAME_RECT },
  { id: "r-decisions", label: "Decisions", iconKey: "decisions", accent: "#C084FC", kind: "iframe", href: "/decisions", dock: false, ...IFRAME_RECT },
  { id: "r-capabilities", label: "Capabilities", iconKey: "capabilities", accent: "#38BDF8", kind: "iframe", href: "/capabilities", dock: false, ...IFRAME_RECT },
  { id: "r-audit", label: "Audit Trail", iconKey: "audit", accent: "#9AA3AD", kind: "iframe", href: "/audit", dock: false, perm: "view_audit", ...IFRAME_RECT },
  { id: "r-import", label: "Data Import", iconKey: "import", accent: "#F59E0B", kind: "iframe", href: "/import", dock: false, ...IFRAME_RECT },

  // Alert Center — executive alerts, escalations, digests
  { id: "alerts", label: "Alert Center", iconKey: "alerts", accent: "#FF5F57", kind: "panel", dock: false, perm: "view_executive", x: 100, y: 50, w: 920, h: 640 },

  // Admin Console — multi-tenant management (RBAC: view_audit)
  { id: "admin", label: "Admin Console", iconKey: "admin", accent: "#F59E0B", kind: "panel", dock: false, perm: "view_audit", x: 80, y: 50, w: 1100, h: 680 },

  // settings (special surface, opened via event)
  { id: "settings", label: "System Settings", iconKey: "settings", accent: "#9AA3AD", kind: "special", dock: true },
];

export const appById = (id: string) => APPS.find((a) => a.id === id);
export const DEFAULT_DOCK = APPS.filter((a) => a.dock).map((a) => a.id);
