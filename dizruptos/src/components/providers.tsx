"use client";

// App-wide client providers. TanStack Query cache + Supabase auth state sync.
// Mounted once in the root layout.

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query";
import { WebVitalsReporter } from "@/app/web-vitals";
import { useEffect } from "react";
import { browserClient, isAuthConfigured } from "@/lib/auth-supabase";
import { useSession } from "@/lib/session";

function AlertSync() {
  useEffect(() => {
    // Run alert engine on mount, then every 5 minutes.
    const run = () =>
      fetch("/api/v1/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch(() => {/* resilient — never throws */});

    run();
    const id = setInterval(run, 5 * 60_000);
    return () => clearInterval(id);
  }, []);
  return null;
}

function SupabaseAuthSync() {
  useEffect(() => {
    if (!isAuthConfigured) return;
    const sb = browserClient();
    if (!sb) return;
    // Hydrate from any existing Supabase session — but only set the store to
    // real-user mode when a real Supabase user exists. Do NOT call
    // syncFromSupabase(null) on mount: that would kick out demo personas who
    // authenticate via the dz_session cookie instead of Supabase JWT.
    sb.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        useSession.getState().syncFromSupabase(data.session.user);
      }
    });
    // Stay in sync for sign-in, explicit sign-out, and token refresh.
    // On SIGNED_OUT we do clear the real-user identity; other events only
    // update state when a Supabase user is present (preserves demo personas).
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        useSession.getState().syncFromSupabase(null);
      } else if (session?.user) {
        useSession.getState().syncFromSupabase(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthSync />
      <AlertSync />
      <WebVitalsReporter />
      {children}
    </QueryClientProvider>
  );
}
