"use client";

// Client-side route protection. In production this becomes Next middleware
// validating the httpOnly refresh cookie + silentRefresh() (PRD §14.1-14.2);
// the component boundary stays identical.
//
// iframe shortcut: if this page is embedded inside the DizruptOS desktop shell
// (detected by window.self !== window.top), we trust the parent's auth state —
// the parent is same-origin and CSP `frame-ancestors 'self'` ensures only we
// can embed ourselves. This prevents the shell from showing a login screen
// inside its own windows.

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { DizruptMark } from "@/components/ui/logo";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authenticated = useSession((s) => s.authenticated);
  const [hydrated, setHydrated] = React.useState(false);
  const [inIframe, setInIframe] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
    // Detect if we're running inside the DizruptOS desktop iframe.
    // We catch SecurityError in case of a cross-origin context (should not happen
    // given CSP frame-ancestors 'self', but be safe).
    try {
      setInIframe(window.self !== window.top);
    } catch {
      setInIframe(true); // assume iframe if we can't tell
    }
  }, []);

  React.useEffect(() => {
    if (hydrated && !authenticated && !inIframe) router.replace("/login");
  }, [hydrated, authenticated, inIframe, router]);

  // In iframe context: pass through immediately — the parent desktop controls auth.
  if (inIframe) return <>{children}</>;

  if (!hydrated || !authenticated) {
    // Branded transitional screen — shown briefly during hydration and while a
    // sign-out redirects to /login. Reads as the product, not a frozen square.
    const message = hydrated && !authenticated ? "Signing you out…" : "Loading…";
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
