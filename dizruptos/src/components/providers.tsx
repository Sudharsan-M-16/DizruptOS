"use client";

// App-wide client providers. TanStack Query cache + Supabase auth state sync.
// Mounted once in the root layout.

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query";
import { WebVitalsReporter } from "@/app/web-vitals";
import { useEffect } from "react";
import { browserClient, isAuthConfigured } from "@/lib/auth-supabase";
import { useSession } from "@/lib/session";

function SupabaseAuthSync() {
  useEffect(() => {
    if (!isAuthConfigured) return;
    const sb = browserClient();
    if (!sb) return;
    // Hydrate immediately from any existing session
    sb.auth.getSession().then(({ data }) => {
      useSession.getState().syncFromSupabase(data.session?.user ?? null);
    });
    // Stay in sync for sign-in, sign-out, token refresh
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, session) => {
      useSession.getState().syncFromSupabase(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthSync />
      <WebVitalsReporter />
      {children}
    </QueryClientProvider>
  );
}
