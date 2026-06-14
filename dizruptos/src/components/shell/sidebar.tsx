"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Activity,
  Check,
  ChevronsUpDown,
  FileClock,
  Flame,
  GitBranch,
  Inbox,
  Boxes,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  ScrollText,
  ShieldAlert,
  Sparkles,
  Target,
  Upload,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOps } from "@/lib/store";
import { PERSONAS, useSession, type Permission } from "@/lib/session";
import { proposalsForRole } from "@/lib/rbac";
import { EmpAvatar } from "@/components/ui/primitives";
import { DizruptWordmark } from "@/components/ui/logo";

const NAV: {
  group: string;
  items: { href: string; label: string; icon: React.ElementType; perm?: Permission }[];
}[] = [
  { group: "Operate", items: [
    { href: "/", label: "Command Center", icon: LayoutDashboard },
    { href: "/capacity", label: "Capacity", icon: Flame, perm: "view_capacity" },
    { href: "/projects", label: "Projects", icon: KanbanSquare },
    { href: "/people", label: "People", icon: Users },
  ]},
  { group: "Intelligence", items: [
    { href: "/executive", label: "Executive", icon: Activity, perm: "view_executive" },
    { href: "/briefing", label: "Exec Briefing", icon: Sparkles, perm: "view_executive" },
    { href: "/capabilities", label: "Capability Intel", icon: Boxes },
    { href: "/risks", label: "Risk Register", icon: ShieldAlert },
    { href: "/decisions", label: "Decisions", icon: ScrollText },
    { href: "/goals", label: "Goals · OKRs", icon: Target },
  ]},
  { group: "Review", items: [
    // No perm gate: the page itself scopes by role (employees see only
    // their personal requests — dynamic view, PRD §6).
    { href: "/proposals", label: "Agent Inbox", icon: Inbox },
    { href: "/graph", label: "Dependency Graph", icon: GitBranch },
    { href: "/audit", label: "Audit Log", icon: FileClock, perm: "view_audit" },
  ]},
  { group: "Data", items: [
    { href: "/import", label: "Import Data", icon: Upload, perm: "view_audit" },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const proposals = useOps((s) => s.proposals);
  const personaId = useSession((s) => s.personaId);
  const setPersona = useSession((s) => s.setPersona);
  const signOut = useSession((s) => s.signOut);
  const can = useSession((s) => s.can);
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];
  // Badge counts what THIS persona would see in the inbox, not the org total.
  const pending = proposalsForRole(proposals, persona.role, persona.id).filter(
    (p) => p.status === "pending"
  ).length;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[256px] flex-col border-r border-line-subtle bg-ink-surface/60 backdrop-blur-xl">
      {/* Wordmark */}
      <Link href="/" className="flex items-center px-5 pb-5 pt-5">
        <DizruptWordmark markSize={28} sub="Resource Intelligence" />
      </Link>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Primary">
        {NAV.map((g) => {
          const items = g.items.filter((i) => !i.perm || can(i.perm));
          if (items.length === 0) return null;
          return (
            <div key={g.group}>
              <div className="label-xs mb-1.5 px-2">{g.group}</div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors",
                        active
                          ? "bg-brand-soft text-fg"
                          : "text-fg-secondary hover:bg-ink-elevated hover:text-fg"
                      )}
                    >
                      {active && (
                        <span className="absolute -left-3 h-4 w-0.5 rounded-r bg-brand" />
                      )}
                      <item.icon
                        size={17}
                        className={cn(
                          active ? "text-brand" : "text-fg-muted group-hover:text-fg-secondary"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.href === "/proposals" && pending > 0 && (
                        <span className="rounded-full bg-brand px-1.5 py-px font-mono text-2xs font-semibold text-[#04281A]">
                          {pending}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Viewer context — dynamic view architecture (PRD §6): same URLs,
          different system, depending on who is looking. */}
      <div className="border-t border-line-subtle px-3 py-3">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-ink-elevated"
              aria-label="Switch viewing persona"
            >
              <EmpAvatar initials={persona.initials} accent={persona.accent} size={34} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-sm font-semibold">{persona.name}</div>
                <div className="text-2xs text-fg-muted">{persona.title}</div>
              </div>
              <ChevronsUpDown size={13} className="text-fg-muted" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="top"
              align="start"
              sideOffset={8}
              className="z-50 w-64 animate-riseIn rounded-card border border-line bg-ink-elevated p-1.5 shadow-pop"
            >
              <div className="label-xs px-2 py-1.5">View as — role shapes every screen</div>
              {PERSONAS.map((p) => (
                <DropdownMenu.Item
                  key={p.id}
                  onSelect={() => setPersona(p.id)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-xs text-fg-secondary outline-none data-[highlighted]:bg-brand-soft data-[highlighted]:text-fg"
                >
                  <EmpAvatar initials={p.initials} accent={p.accent} size={24} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-2xs text-fg-muted">
                      {p.role.replace("_", " ")}
                    </div>
                  </div>
                  {p.id === personaId && <Check size={13} className="text-brand" />}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator className="my-1 h-px bg-line-subtle" />
              <DropdownMenu.Item
                onSelect={async () => {
                  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
                  signOut();
                  router.push("/login");
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-xs text-fg-secondary outline-none data-[highlighted]:bg-danger-soft data-[highlighted]:text-danger"
              >
                <LogOut size={13} /> Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </aside>
  );
}
