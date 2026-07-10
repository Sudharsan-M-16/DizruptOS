"use client";

// Session & preferences — viewer identity (dynamic view architecture, PRD §6),
// theme, and UI preferences. Persisted to localStorage; swaps to Supabase Auth
// session + users.role claim without changing call sites.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PERSONAS, roleCan, type Permission } from "./personas";
import type { Role } from "./types";

export type Theme = "dark" | "light" | "system";

// Personas + matrix live in the server-safe module so API authz and the UI
// share one definition. Re-exported here so existing imports keep working.
export { PERSONAS, roleCan, type Permission } from "./personas";

/* --------------------------------- store ---------------------------------- */

interface SessionState {
  authenticated: boolean;
  personaId: string;
  /** Real JWT role (null in demo mode — use persona().role instead). */
  role: Role | null;
  /** Real JWT org_id (null in demo mode). */
  orgId: string | null;
  theme: Theme;
  shortcutsOpen: boolean;

  signIn: (personaId: string) => void;
  signOut: () => void;
  setPersona: (id: string) => void;
  setTheme: (t: Theme) => void;
  setShortcutsOpen: (open: boolean) => void;
  /** Called by providers.tsx on Supabase auth state changes. */
  syncFromSupabase: (user: {
    id: string;
    email?: string;
    app_metadata?: Record<string, unknown>;
  } | null) => void;

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
      role: null,
      orgId: null,
      theme: "dark",
      shortcutsOpen: false,

      signIn: (personaId) => set({ authenticated: true, personaId, role: null, orgId: null }),
      signOut: () => set({ authenticated: false, role: null, orgId: null }),
      setPersona: (personaId) => set({ personaId }),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),

      syncFromSupabase: (user) => {
        if (!user) {
          set({ authenticated: false, personaId: "", role: null, orgId: null });
          return;
        }
        const meta = user.app_metadata ?? {};
        const role = ((meta.role as Role) ?? "employee");
        const orgId = (meta.org_id as string) ?? null;
        set({ authenticated: true, personaId: user.id, role, orgId });
      },

      persona: () =>
        PERSONAS.find((p) => p.id === get().personaId) ?? PERSONAS[0],

      can: (perm) => {
        const state = get();
        // Demo persona: look up from known personas list
        const demo = PERSONAS.find((p) => p.id === state.personaId);
        if (demo) return roleCan(demo.role, perm);
        // Real auth user: use JWT role claim
        return roleCan(state.role ?? "employee", perm);
      },
    }),
    {
      name: "dizrupt-session",
      partialize: (s) => ({
        authenticated: s.authenticated,
        personaId: s.personaId,
        role: s.role,
        orgId: s.orgId,
        theme: s.theme,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
          // Guard: if a known demo persona is loaded but authenticated is false
          // (stale from a previous SupabaseAuthSync bug), restore to true.
          // Demo personas are always authenticated — the dz_session cookie is
          // the credential; Supabase JWT absence should not evict them.
          if (PERSONAS.some((p) => p.id === state.personaId) && !state.authenticated) {
            state.authenticated = true;
          }
        }
      },
    }
  )
);
