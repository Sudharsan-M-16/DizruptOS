"use client";

// Ctrl/⌘+K command palette — first-class navigation surface.
// Results grouped by entity type; recent actions shown before typing.

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Activity,
  ArrowRight,
  Flame,
  GitBranch,
  Inbox,
  KanbanSquare,
  ScrollText,
  Search,
  ShieldAlert,
  SquareCheck,
  Users,
} from "lucide-react";
import { useOps } from "@/lib/store";
import { employees, projects, risks, decisions } from "@/lib/data";
import { EmpAvatar, HealthPill } from "@/components/ui/primitives";

export function CommandPalette() {
  const open = useOps((s) => s.paletteOpen);
  const setOpen = useOps((s) => s.setPaletteOpen);
  const tasks = useOps((s) => s.tasks);
  const openTaskDrawer = useOps((s) => s.openTaskDrawer);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-riseIn" />
        <Dialog.Content className="fixed left-1/2 top-[12%] z-50 w-full max-w-xl -translate-x-1/2 animate-riseIn">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Command
            label="Global command palette"
            className="overflow-hidden rounded-card border border-line bg-ink-elevated shadow-pop"
          >
            <div className="flex items-center gap-2.5 border-b border-line-subtle px-4">
              <Search size={15} className="text-fg-muted" />
              <Command.Input
                autoFocus
                placeholder="Who has capacity? Which projects are at risk? Jump anywhere…"
                className="h-12 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-muted"
              />
              <span className="kbd">esc</span>
            </div>

            <Command.List className="max-h-[420px] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-8 text-center text-xs text-fg-muted">
                No matches. Try a person, project, risk, or decision.
              </Command.Empty>

              <Command.Group
                heading="Navigate"
                className="px-1 [&_[cmdk-group-heading]]:label-xs [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {[
                  { label: "Capacity Heatmap", href: "/capacity", Icon: Flame },
                  { label: "Projects", href: "/projects", Icon: KanbanSquare },
                  { label: "Executive Intelligence", href: "/executive", Icon: Activity },
                  { label: "Agent Inbox", href: "/proposals", Icon: Inbox },
                  { label: "Risk Register", href: "/risks", Icon: ShieldAlert },
                  { label: "Org Memory", href: "/memory", Icon: ScrollText },
                ].map((i) => (
                  <Command.Item
                    key={i.href}
                    value={`nav ${i.label}`}
                    onSelect={() => go(i.href)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-fg-secondary data-[selected=true]:bg-brand-soft data-[selected=true]:text-fg"
                  >
                    <i.Icon size={14} className="text-fg-muted" />
                    {i.label}
                    <ArrowRight size={12} className="ml-auto text-fg-faint" />
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="People" className="px-1 [&_[cmdk-group-heading]]:label-xs [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                {employees.slice(0, 18).map((e) => (
                  <Command.Item
                    key={e.id}
                    value={`person ${e.name} ${e.title} ${e.skills.join(" ")}`}
                    onSelect={() => go("/capacity")}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-fg-secondary data-[selected=true]:bg-brand-soft data-[selected=true]:text-fg"
                  >
                    <EmpAvatar initials={e.initials} accent={e.accent} size={20} />
                    <span>{e.name}</span>
                    <span className="text-2xs text-fg-muted">{e.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Projects" className="px-1 [&_[cmdk-group-heading]]:label-xs [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                {projects.map((p) => (
                  <Command.Item
                    key={p.id}
                    value={`project ${p.name} ${p.code}`}
                    onSelect={() => go(`/projects/${p.id}`)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-fg-secondary data-[selected=true]:bg-brand-soft data-[selected=true]:text-fg"
                  >
                    <span className="rounded bg-ink-raised px-1.5 py-px font-mono text-2xs text-fg-muted">{p.code}</span>
                    <span className="flex-1">{p.name}</span>
                    <HealthPill health={p.health} />
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Tasks" className="px-1 [&_[cmdk-group-heading]]:label-xs [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                {tasks.slice(0, 8).map((t) => (
                  <Command.Item
                    key={t.id}
                    value={`task ${t.title}`}
                    onSelect={() => {
                      setOpen(false);
                      openTaskDrawer(t.id);
                    }}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-fg-secondary data-[selected=true]:bg-brand-soft data-[selected=true]:text-fg"
                  >
                    <SquareCheck size={14} className="text-fg-muted" />
                    <span className="truncate">{t.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Risks & Decisions" className="px-1 [&_[cmdk-group-heading]]:label-xs [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                {risks.slice(0, 4).map((r) => (
                  <Command.Item
                    key={r.id}
                    value={`risk ${r.title}`}
                    onSelect={() => go("/risks")}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-fg-secondary data-[selected=true]:bg-brand-soft data-[selected=true]:text-fg"
                  >
                    <ShieldAlert size={14} className="text-warn" />
                    <span className="truncate">{r.title}</span>
                  </Command.Item>
                ))}
                {decisions.slice(0, 3).map((d) => (
                  <Command.Item
                    key={d.id}
                    value={`decision ${d.title}`}
                    onSelect={() => go("/memory")}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-fg-secondary data-[selected=true]:bg-brand-soft data-[selected=true]:text-fg"
                  >
                    <ScrollText size={14} className="text-brand-secondary" />
                    <span className="truncate">{d.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>

            <div className="flex items-center gap-3 border-t border-line-subtle px-4 py-2.5 text-2xs text-fg-muted">
              <span className="flex items-center gap-1"><span className="kbd">↑↓</span> navigate</span>
              <span className="flex items-center gap-1"><span className="kbd">↵</span> open</span>
              <span className="ml-auto">Hybrid search · RLS-scoped · 70% vector + 30% BM25</span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
