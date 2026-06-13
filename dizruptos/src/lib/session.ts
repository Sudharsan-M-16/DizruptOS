"use client";

// Session & preferences — viewer identity (dynamic view architecture, PRD §6),
// theme, and UI preferences. Persisted to localStorage; swaps to Supabase Auth
// session + users.role claim without changing call sites.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PERSONAS, roleCan, type Permission } from "./personas";

export type Theme = "dark" | "light" | "system";

// Personas + matrix live in the server-safe module so API authz and the UI
// share one definition. Re-exported here so existing imports keep working.
export { PERSONAS, roleCan, type Permission } from "./personas";

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
