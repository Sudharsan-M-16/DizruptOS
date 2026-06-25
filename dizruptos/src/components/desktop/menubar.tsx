"use client";

// macOS-style menubar — a thin frosted vibrancy strip pinned to the top of the
// desktop. Left: the DizruptOS () menu (About / Lock / Sign Out) plus a few
// real app menus that route to the most-used surfaces. Right: a live control-
// center cluster (org pulse, capacity battery, Wi-Fi, Spotlight) and a ticking
// clock; the battery/sliders icon opens the full Control Center popover where
// theme, accent, wallpaper and brightness all live.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Activity, BatteryCharging, BatteryFull, BatteryLow, BatteryMedium, Bell, Cpu, Info, Lock, LogOut, MapPin, Moon, Power, Search, SlidersHorizontal, Wifi, WifiOff } from "lucide-react";
import { useSession, PERSONAS } from "@/lib/session";
import { departments, employeeById } from "@/lib/data";
import { EmpAvatar } from "@/components/ui/primitives";
import { useOS } from "@/lib/os";
import { useOps } from "@/lib/store";
import { appById } from "@/lib/desktop-apps";
import { cn } from "@/lib/utils";
import { DizruptMark } from "@/components/ui/logo";
import { ControlCenter } from "./control-center";
import { NotificationCenter } from "./notification-center";

// Menu items launch DizruptOS app windows (via `dizrupt:launch`) — they never
// navigate away from the desktop. `app` is a registry id; "home" is the Home app.
const APP_MENUS: { label: string; items: { label: string; app: string }[] }[] = [
  { label: "Overview", items: [{ label: "Home", app: "home" }, { label: "Executive", app: "r-executive" }, { label: "Exec Briefing", app: "r-briefing" }] },
  { label: "Capacity", items: [{ label: "Capacity board", app: "r-capacity" }, { label: "Project Matrix", app: "matrix" }] },
  { label: "Intelligence", items: [{ label: "Recommendations", app: "r-recommendations" }, { label: "Org Memory", app: "r-memory" }, { label: "Risks", app: "r-risks" }] },
];

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function Menubar({ healthScore, capacityPct }: { healthScore: number; capacityPct: number }) {
  const now = useClock();
  const personaId = useSession((s) => s.personaId);
  const signOut = useSession((s) => s.signOut);
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];
  const lock = useOS((s) => s.lock);
  const accentHex = useOS((s) => s.accent().hex);
  const unread = useOps((s) => s.notifications.reduce((acc, n) => acc + (n.read ? 0 : 1), 0));
  const dnd = useOS((s) => s.dnd);
  const toggleDnd = useOS((s) => s.toggleDnd);
  const can = useSession((s) => s.can);
  // hide menu items the viewer's role can't open (no dead clicks)
  const visibleMenus = APP_MENUS
    .map((m) => ({ ...m, items: m.items.filter((it) => { const a = appById(it.app); return !a?.hidden && (!a?.perm || can(a.perm)); }) }))
    .filter((m) => m.items.length > 0);

  const [open, setOpen] = useState<string | null>(null); // which menu/popover is open
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey); };
  }, [open]);

  const healthTone = healthScore >= 75 ? "#10B981" : healthScore >= 55 ? "#F59E0B" : "#EF4444";
  const battTone = capacityPct < 0.8 ? "#10B981" : capacityPct < 1 ? "#F59E0B" : "#EF4444";
  const launch = (id: string) => { setOpen(null); window.dispatchEvent(new CustomEvent("dizrupt:launch", { detail: { id } })); };

  return (
    <div
      ref={barRef}
      className="relative z-[120] flex h-7 shrink-0 items-center gap-0.5 border-b border-white/[0.06] bg-black/45 px-2.5 text-xs text-fg backdrop-blur-2xl"
    >
      {/* DizruptOS () menu */}
      <MenuTrigger
        active={open === "__os"}
        onClick={() => setOpen(open === "__os" ? null : "__os")}
        className="flex items-center gap-1.5 font-semibold"
      >
        <DizruptMark size={15} />
        <span>DizruptOS</span>
      </MenuTrigger>
      {open === "__os" && (
        <Dropdown x={4}>
          <DItem icon={Info} label="About DizruptOS" onClick={() => { setOpen(null); window.dispatchEvent(new CustomEvent("dizrupt:open-settings", { detail: { pane: "guide" } })); }} />
          <DSep />
          <DItem icon={SlidersHorizontal} label="System Settings…" onClick={() => { setOpen(null); window.dispatchEvent(new CustomEvent("dizrupt:open-settings")); }} />
          <DSep />
          <DItem icon={Lock} label="Lock Screen" hint="⌃⌘Q" onClick={() => { setOpen(null); lock(); }} />
          <DItem icon={LogOut} label="Sign Out…" onClick={() => { setOpen(null); signOut(); }} />
          <DItem icon={Power} label="Restart DizruptOS" onClick={() => { setOpen(null); useOS.getState().powerOn(); }} />
        </Dropdown>
      )}

      {/* app menus */}
      <nav className="hidden items-center sm:flex">
        {visibleMenus.map((m) => (
          <div key={m.label} className="relative">
            <MenuTrigger active={open === m.label} onClick={() => setOpen(open === m.label ? null : m.label)} className="font-medium">
              {m.label}
            </MenuTrigger>
            {open === m.label && (
              <Dropdown x={0}>
                {m.items.map((it) => <DItem key={it.app} label={it.label} onClick={() => launch(it.app)} />)}
              </Dropdown>
            )}
          </div>
        ))}
      </nav>

      {/* right cluster — control center */}
      <div className="ml-auto flex items-center gap-0.5 text-fg-secondary">
        <button onClick={() => window.dispatchEvent(new CustomEvent("dizrupt:mission-control"))} title="Launcher — apps, windows & search (F3 / ⌘Space)" aria-label="Open launcher" className="grid h-5 w-5 place-items-center rounded transition-colors hover:bg-white/10 hover:text-fg">
          <Search size={13} />
        </button>
        <Stat icon={Activity} tone={healthTone} label={`${healthScore}`} title={`Org health ${healthScore}/100`} />
        <Stat icon={Cpu} tone={battTone} label={`${Math.round(capacityPct * 100)}%`} title="Org capacity load" />
        {/* Do Not Disturb quick toggle */}
        <button
          onClick={toggleDnd}
          title={dnd ? "Do Not Disturb — on" : "Do Not Disturb — off"}
          aria-label="Do Not Disturb"
          className="grid h-5 w-5 place-items-center rounded transition-colors hover:bg-white/10 hover:text-fg"
          style={dnd ? { color: accentHex } : undefined}
        >
          <Moon size={13} />
        </button>
        <Battery />
        {/* live network status */}
        <div className="relative">
          <MenuTrigger active={open === "__net"} onClick={() => setOpen(open === "__net" ? null : "__net")} className="px-1" ariaLabel="Network">
            <NetworkIcon />
          </MenuTrigger>
          {open === "__net" && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-[130]">
              <NetworkPopover accent={accentHex} />
            </div>
          )}
        </div>

        {/* notifications */}
        <div className="relative">
          <MenuTrigger active={open === "__notif"} onClick={() => setOpen(open === "__notif" ? null : "__notif")} className="relative px-1.5" ariaLabel="Notifications">
            <Bell size={13} />
            {unread > 0 && (
              <span
                aria-live="polite"
                aria-atomic="true"
                aria-label={`${unread} unread notification${unread !== 1 ? "s" : ""}`}
                className="absolute -right-0.5 -top-0.5 grid h-3.5 min-w-[14px] place-items-center rounded-full px-0.5 text-[9px] font-bold leading-none text-black"
                style={{ background: accentHex }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </MenuTrigger>
          {open === "__notif" && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-[130]">
              <NotificationCenter onClose={() => setOpen(null)} />
            </div>
          )}
        </div>

        {/* control center toggle */}
        <div className="relative">
          <MenuTrigger active={open === "__cc"} onClick={() => setOpen(open === "__cc" ? null : "__cc")} className="px-1.5" ariaLabel="Control Center">
            <SlidersHorizontal size={13} />
          </MenuTrigger>
          {open === "__cc" && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-[130]">
              <ControlCenter onClose={() => setOpen(null)} />
            </div>
          )}
        </div>

        {/* profile — click to open your card + quick actions + switch account */}
        <div className="relative mx-1 hidden md:block">
          <MenuTrigger active={open === "__profile"} onClick={() => setOpen(open === "__profile" ? null : "__profile")} className="gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: persona.accent }} />
            <span>{persona.name.split(" ")[0]}</span>
          </MenuTrigger>
          {open === "__profile" && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-[130]">
              <ProfilePopover persona={persona} accent={accentHex} onLock={() => { setOpen(null); lock(); }} onSignOut={() => { setOpen(null); signOut(); }} onClose={() => setOpen(null)} />
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setOpen(open === "__cal" ? null : "__cal")}
            className={cn("ml-1 min-w-[112px] rounded px-1.5 py-0.5 text-right font-medium tabular-nums transition-colors hover:bg-white/10", open === "__cal" ? "bg-white/15 text-fg" : "text-fg")}
          >
            {now ? (
              <>
                {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                <span className="ml-2">{now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
              </>
            ) : (
              <span className="text-fg-faint">—</span>
            )}
          </button>
          {open === "__cal" && now && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-[130]">
              <CalendarPopover now={now} accent={accentHex} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- pieces --------------------------------- */
function MenuTrigger({ active, onClick, className, ariaLabel, children }: { active: boolean; onClick: () => void; className?: string; ariaLabel?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "flex h-5 items-center gap-1 rounded px-2 py-0.5 transition-colors",
        active ? "bg-white/15 text-fg" : "text-fg-secondary hover:bg-white/10 hover:text-fg",
        className
      )}
    >
      {children}
    </button>
  );
}

function Dropdown({ x, children }: { x: number; children: React.ReactNode }) {
  return (
    <div
      className="absolute top-[calc(100%+6px)] z-[130] min-w-[230px] rounded-xl border border-white/12 bg-[rgb(var(--ink-elevated)/0.82)] p-1.5 shadow-2xl backdrop-blur-2xl"
      style={{ left: x }}
    >
      {children}
    </div>
  );
}

function DItem({ icon: Icon, label, hint, onClick }: { icon?: React.ElementType; label: string; hint?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs text-fg-secondary transition-colors hover:bg-[var(--os-accent,#00ED82)] hover:text-black">
      {Icon ? <Icon size={14} /> : <span className="w-[14px]" />}
      <span className="flex-1">{label}</span>
      {hint && <span className="text-2xs opacity-60">{hint}</span>}
    </button>
  );
}

function DSep() {
  return <div className="my-1 h-px bg-white/10" />;
}

function CalendarPopover({ now, accent }: { now: Date; accent: string }) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="w-[248px] rounded-2xl border border-white/15 bg-[rgb(var(--ink-elevated)/0.82)] p-3 shadow-2xl backdrop-blur-2xl">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <span className="text-sm font-semibold">{now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
        <span className="text-2xs text-fg-muted">{now.toLocaleDateString(undefined, { weekday: "long" })}</span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="py-1 text-[10px] font-semibold text-fg-faint">{d}</span>
        ))}
        {cells.map((c, i) => {
          const isToday = c === now.getDate();
          return (
            <span key={i} className={cn("grid h-7 place-items-center rounded-md text-2xs", c == null ? "" : isToday ? "font-bold text-black" : "text-fg-secondary hover:bg-white/10")} style={isToday ? { background: accent } : undefined}>
              {c ?? ""}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ------------------------------- network ----------------------------------
// Live online/offline + connection details from the Network Information API.
// NOTE: browsers deliberately do NOT expose the Wi-Fi network *name* (SSID) for
// privacy, so we show connection kind + quality + live online state instead.
function useNetwork() {
  const [state, setState] = useState<{ online: boolean; kind?: string; quality?: string; downlink?: number }>({ online: true });
  useEffect(() => {
    const c = (navigator as Navigator & { connection?: any }).connection;
    const sync = () => setState({ online: navigator.onLine, kind: c?.type, quality: c?.effectiveType, downlink: c?.downlink });
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    c?.addEventListener?.("change", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); c?.removeEventListener?.("change", sync); };
  }, []);
  return state;
}

function NetworkIcon() {
  const { online } = useNetwork();
  return online ? <Wifi size={13} /> : <WifiOff size={13} className="text-danger" />;
}

function NetworkPopover({ accent }: { accent: string }) {
  const { online, kind, quality, downlink } = useNetwork();
  const kindLabel = kind && kind !== "none" ? kind[0].toUpperCase() + kind.slice(1) : online ? "Network" : "—";
  return (
    <div className="w-[252px] rounded-2xl border border-white/15 bg-[rgb(var(--ink-elevated)/0.82)] p-3 shadow-2xl backdrop-blur-2xl dz-solidify">
      <div className="mb-2 flex items-center gap-2 px-0.5">
        {online ? <Wifi size={15} style={{ color: accent }} /> : <WifiOff size={15} className="text-danger" />}
        <span className="text-sm font-semibold">{online ? "Connected" : "Offline"}</span>
        <span className={cn("ml-auto h-2 w-2 rounded-full", online ? "bg-ok" : "bg-danger")} />
      </div>
      <div className="divide-y divide-line/50 rounded-xl border border-line bg-[rgb(var(--ink-surface)/0.5)] text-xs">
        <Row label="Status" value={online ? "Online" : "No connection"} />
        <Row label="Connection" value={kindLabel} />
        {quality && <Row label="Quality" value={quality.toUpperCase()} />}
        {typeof downlink === "number" && downlink > 0 && <Row label="Est. speed" value={`${downlink} Mbps`} />}
      </div>
      <p className="mt-2 px-0.5 text-[10px] leading-relaxed text-fg-faint">The network name (SSID) isn&rsquo;t shown — browsers hide it for privacy. Status updates live.</p>
    </div>
  );
}

function ProfilePopover({ persona, accent, onLock, onSignOut, onClose }: { persona: (typeof PERSONAS)[number]; accent: string; onLock: () => void; onSignOut: () => void; onClose: () => void }) {
  const setPersona = useSession((s) => s.setPersona);
  const emp = employeeById(persona.id);
  const dept = departments.find((d) => d.id === emp?.departmentId);
  return (
    <div className="w-[280px] overflow-hidden rounded-2xl border border-white/15 bg-[rgb(var(--ink-elevated)/0.82)] shadow-2xl backdrop-blur-2xl dz-solidify">
      <div className="flex items-center gap-3 border-b border-line/60 p-3.5">
        <EmpAvatar initials={persona.initials} accent={persona.accent} size={42} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{persona.name}</div>
          <div className="truncate text-2xs text-fg-muted">{persona.title}{dept ? ` · ${dept.name}` : ""}</div>
          {emp?.location && <div className="mt-0.5 flex items-center gap-1 text-2xs text-fg-faint"><MapPin size={10} /> {emp.location} · {emp.timezone}</div>}
        </div>
      </div>
      <div className="p-1.5">
        <PItem icon={Lock} label="Lock Screen" onClick={onLock} />
        <PItem icon={LogOut} label="Sign Out" onClick={onSignOut} />
      </div>
      <div className="border-t border-line/60 p-2">
        <div className="px-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">Switch account (demo)</div>
        <div className="flex flex-wrap gap-1.5 px-1 pb-1">
          {PERSONAS.map((p) => (
            <button key={p.id} onClick={() => { setPersona(p.id); onClose(); }} title={`${p.name} · ${p.title}`}
              className={cn("flex items-center gap-1.5 rounded-full border px-1.5 py-0.5 text-2xs transition-colors", p.id === persona.id ? "border-transparent text-black" : "border-line text-fg-secondary hover:bg-white/10")}
              style={p.id === persona.id ? { background: accent } : undefined}>
              <span className="grid h-4 w-4 place-items-center rounded-full text-[8px] font-bold" style={{ background: p.accent, color: "#04281A" }}>{p.initials}</span>
              {p.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between px-3 py-1.5"><span className="text-fg-muted">{label}</span><span className="font-medium">{value}</span></div>;
}
function PItem({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs text-fg-secondary transition-colors hover:bg-[var(--os-accent,#00ED82)] hover:text-black">
      <Icon size={14} /> {label}
    </button>
  );
}

// Battery indicator — reads the real Battery Status API when the browser exposes
// it (Chrome/Edge), otherwise shows a sensible full/charging default.
function Battery() {
  const [level, setLevel] = useState(1);
  const [charging, setCharging] = useState(true);
  useEffect(() => {
    let batt: any;
    const nav = navigator as Navigator & { getBattery?: () => Promise<any> };
    if (!nav.getBattery) return;
    nav.getBattery().then((b) => {
      batt = b;
      const sync = () => { setLevel(b.level); setCharging(b.charging); };
      sync();
      b.addEventListener("levelchange", sync);
      b.addEventListener("chargingchange", sync);
    }).catch(() => {});
    return () => { if (batt) { /* listeners GC with battery object */ } };
  }, []);
  const pct = Math.round(level * 100);
  const Icon = charging ? BatteryCharging : pct > 66 ? BatteryFull : pct > 25 ? BatteryMedium : BatteryLow;
  const tone = pct <= 15 && !charging ? "#EF4444" : undefined;
  return (
    <span title={`Battery ${pct}%${charging ? " · charging" : ""}`} className="flex items-center gap-0.5 px-1">
      <Icon size={15} style={{ color: tone }} className={tone ? "" : "text-fg-secondary"} />
      <span className="hidden text-2xs tabular-nums text-fg-muted lg:inline">{pct}%</span>
    </span>
  );
}

function Stat({ icon: Icon, tone, label, title }: { icon: React.ElementType; tone: string; label: string; title: string }) {
  return (
    <span title={title} className="flex items-center gap-1 rounded px-1.5 py-0.5">
      <Icon size={12} style={{ color: tone }} />
      <span className="font-medium tabular-nums" style={{ color: tone }}>{label}</span>
    </span>
  );
}
