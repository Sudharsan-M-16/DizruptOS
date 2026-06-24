"use client";

// Role gate — clients never see the internal desktop. Whatever (shell) route
// they land on, they get their own scoped portal instead. Everyone else gets
// the normal experience (children).

import { useSession } from "@/lib/session";
import { ClientPortal } from "@/components/client/client-portal";

export function RoleGate({ children }: { children: React.ReactNode }) {
  const role = useSession((s) => s.persona().role);
  if (role === "client") return <ClientPortal />;
  return <>{children}</>;
}
