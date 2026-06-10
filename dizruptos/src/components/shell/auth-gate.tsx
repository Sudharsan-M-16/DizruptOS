"use client";

// Client-side route protection. In production this becomes Next middleware
// validating the httpOnly refresh cookie + silentRefresh() (PRD §14.1-14.2);
// the component boundary stays identical.

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const authenticated = useSession((s) => s.authenticated);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => setHydrated(true), []);
  React.useEffect(() => {
    if (hydrated && !authenticated) router.replace("/login");
  }, [hydrated, authenticated, router]);

  if (!hydrated || !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-lg bg-gradient-to-br from-brand to-brand-secondary" />
      </div>
    );
  }
  return <>{children}</>;
}
