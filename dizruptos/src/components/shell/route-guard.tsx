"use client";

// Per-route permission boundary. The OS hides launch buttons by role, but a
// route is also reachable by typing its URL directly (or an old bookmark). This
// enforces the same permission at the page level, so a low-privilege user can't
// bypass the Dock/Launchpad by navigating straight to /executive, /audit, etc.
// (Embedded windows opened by an authorised user still pass — same session perm.)

import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { useSession } from "@/lib/session";
import { requiredPerm } from "@/lib/route-perms";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const can = useSession((s) => s.can);
  const perm = requiredPerm(pathname);

  if (perm && !can(perm)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-ink-elevated text-fg-muted">
          <Lock size={20} />
        </span>
        <h1 className="font-display text-lg font-bold tracking-tight">Restricted</h1>
        <p className="max-w-sm text-sm text-fg-muted">
          Your role doesn&apos;t have access to this page. If you think this is a mistake,
          ask an administrator.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
