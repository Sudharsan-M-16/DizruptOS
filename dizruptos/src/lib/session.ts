"use client";

// Session & preferences — viewer identity (dynamic view architecture, PRD §6),
// theme, and UI preferences. Persisted to localStorage; swaps to Supabase Auth
// session + users.role claim without changing call sites.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "./types";

export type Theme = "dark" | "light" | "system";

/** Demo personas — one per role tier the PRD cares about. */
export const PERSONAS: {
  id: string;
  name: string;
  initials: string;
  title: string;
  role: Role;
  accent: string;
}[] = [
  { id: "u-asha", name: "Asha Venkat", initials: "AV", title: "Resource Manager", role: "project_manager", accent: "#00ED82" },
  { id: "u-noor", name: "Noor Al-Rashid", initials: "NA", title: "Chief Operating Officer", role: "executive", accent: "#C084FC" },
  { id: "u-priya", name: "Priya Sharma", initials: "PS", title: "VP Engineering", role: "dept_head", accent: "#2BD9FF" },
  { id: "u-ahmed", name: "Ahmed Hassan", initials: "AH", title: "Backend Engineer", role: "employee", accent: "#10B981" },
  { id: "u-elias", name: "Elias Brandt", initials: "EB", title: "Systems Administrator", role: "admin", accent: "#94A3B8" },
];

/* ------------------------- permission matrix (PRD §14.3) ------------------ */

export type Permission =
  | "view_capacity"
  | "reallocate"
  | "view_burnout"
  | "view_financials"
  | "view_audit"
  | "review_proposals"
  | "view_executive";

const MATRIX: Record<Permission, Role[]> = {
  view_capacity: ["admin", "executive", "dept_head", "project_manager", "team_lead"],
  reallocate: ["admin", "dept_head", "project_manager"],
  view_burnout: ["admin", "dept_head", "project_manager", "team_lead"],
  view_financials: ["admin", "executive", "dept_head"],
  view_audit: ["admin", "dept_head"],
  review_proposals: ["admin", "dept_head", "project_manager"],
  view_executive: ["admin", "executive", "dept_head"],
};

export const roleCan = (role: Role, perm: Permission) =>
  MATRIX[perm].includes(role);

/* --------------------------------- store ---------------------------------- */

interface SessionState {
  authenticated: boolean;
  personaId: string;
  theme: Theme;
  shortcutsOpen: boolean;

  signIn: (personaId: string) => void;
  signOut: () => void;
  setPersona: (id: string) => void;
  setTheme: (t: Theme) => void;
  setShortcutsOpen: (open: boolean) => void;

  persona: () => (typeof PERSONAS)[number];
  can: (perm: Permission) => boolean;
}

export const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") return;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
      : theme;
  document.documentElement.dataset.theme = resolved;
};

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      authenticated: true, // demo default; /login flips this explicitly
      personaId: "u-asha",
      theme: "dark",
      shortcutsOpen: false,

      signIn: (personaId) => set({ authenticated: true, personaId }),
      signOut: () => set({ authenticated: false }),
      setPersona: (personaId) => set({ personaId }),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),

      persona: () =>
        PERSONAS.find((p) => p.id === get().personaId) ?? PERSONAS[0],
      can: (perm) => roleCan(get().persona().role, perm),
    }),
    {
      name: "dizrupt-session",
      partialize: (s) => ({
        authenticated: s.authenticated,
        personaId: s.personaId,
        theme: s.theme,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);
