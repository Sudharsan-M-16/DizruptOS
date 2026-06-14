"use client";

// Keyboard-first navigation: "g" sequences jump anywhere, "?" opens the
// reference overlay. Inputs and editable surfaces are never intercepted.

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Keyboard } from "lucide-react";
import { useSession } from "@/lib/session";
import { useOps } from "@/lib/store";

const GO: Record<string, { href: string; label: string }> = {
  h: { href: "/", label: "Command Center" },
  c: { href: "/capacity", label: "Capacity Heatmap" },
  p: { href: "/projects", label: "Projects" },
  t: { href: "/people", label: "People (team)" },
  e: { href: "/executive", label: "Executive" },
  r: { href: "/risks", label: "Risk Register" },
  d: { href: "/decisions", label: "Decisions" },
  o: { href: "/goals", label: "Goals · OKRs" },
  i: { href: "/proposals", label: "Agent Inbox" },
  g: { href: "/graph", label: "Dependency Graph" },
  a: { href: "/audit", label: "Audit Log" },
};

function isEditable(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
  );
}

export function ShortcutManager() {
  const router = useRouter();
  const setShortcutsOpen = useSession((s) => s.setShortcutsOpen);
  const setPaletteOpen = useOps((s) => s.setPaletteOpen);
  const pendingG = React.useRef<number | null>(null);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (isEditable(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

      // On the DizruptOS desktop, the OS owns navigation (Spotlight / Launchpad /
      // dock) — the legacy "/" palette and "g→route" jumps would navigate away to
      // the old dashboard, so they're disabled there. They still work on the
      // standalone (embedded) routes.
      const onDesktop = typeof window !== "undefined" && window.location.pathname === "/";

      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      if (e.key === "/" && !onDesktop) {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (onDesktop) return;
      if (e.key === "g") {
        pendingG.current = window.setTimeout(() => (pendingG.current = null), 900);
        return;
      }
      if (pendingG.current !== null && GO[e.key]) {
        e.preventDefault();
        window.clearTimeout(pendingG.current);
        pendingG.current = null;
        router.push(GO[e.key].href);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [router, setPaletteOpen, setShortcutsOpen]);

  return <ShortcutOverlay />;
}

function ShortcutOverlay() {
  const open = useSession((s) => s.shortcutsOpen);
  const setOpen = useSession((s) => s.setShortcutsOpen);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 animate-riseIn rounded-card border border-line bg-ink-elevated p-6 shadow-pop">
          <Dialog.Title className="flex items-center gap-2 font-display text-sm font-semibold">
            <Keyboard size={15} className="text-brand" /> Keyboard shortcuts
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-2xs text-fg-muted">
            Two-click rule, zero-click navigation.
          </Dialog.Description>

          <div className="mt-4 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
            <Row k="⌘K / Ctrl+K" label="Command palette" />
            <Row k="/" label="Command palette" />
            <Row k="?" label="This overlay" />
            <Row k="esc" label="Close any surface" />
            {Object.entries(GO).map(([k, v]) => (
              <Row key={k} k={`g ${k}`} label={v.label} />
            ))}
          </div>

          <div className="mt-4 border-t border-line-subtle pt-3 text-2xs text-fg-muted">
            Sequences: press <span className="kbd">g</span> then a key within ~1s.
            Shortcuts never fire while typing.
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Row({ k, label }: { k: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-xs text-fg-secondary">{label}</span>
      <span className="kbd whitespace-nowrap">{k}</span>
    </div>
  );
}
