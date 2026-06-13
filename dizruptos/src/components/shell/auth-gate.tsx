"use client";

// Client-side route protection. In production this becomes Next middleware
// validating the httpOnly refresh cookie + silentRefresh() (PRD §14.1-14.2);
// the component boundary stays identical.

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { DizruptMark } from "@/components/ui/logo";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authenticated = useSession((s) => s.authenticated);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => setHydrated(true), []);
  React.useEffect(() => {
    if (hydrated && !authenticated) router.replace("/login");
  }, [hydrated, authenticated, router]);

  if (!hydrated || !authenticated) {
    // Branded transitional screen — shown briefly during hydration and while a
    // sign-out redirects to /login. Reads as the product, not a frozen square.
    const message = hydrated && !authenticated ? "Signing you out…" : "Restoring your session…";
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-ink">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative flex flex-col items-center gap-5">
          <span className="relative grid h-16 w-16 place-items-center rounded-2xl border border-brand/30 bg-ink-surface">
            <span className="absolute inset-0 animate-ping rounded-2xl border border-brand/30" />
            <DizruptMark size={34} />
          </span>
          <div className="h-[3px] w-40 overflow-hidden rounded-full bg-ink-elevated">
            <div className="h-full w-full animate-shimmer rounded-full bg-gradient-to-r from-ink-elevated via-brand to-ink-elevated bg-[length:400px_100%]" />
          </div>
          <p className="text-sm font-medium tracking-wide text-fg-muted">{message}</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
