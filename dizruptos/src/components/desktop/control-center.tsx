"use client";

// Control Center — the frosted popover that drops from the menubar. This is
// where the desktop becomes *yours*: flip light/dark, retint the whole OS with
// an accent, swap the wallpaper, dim the brightness, toggle transparency. Every
// control writes straight to the OS store, so the change is instant and live
// across the menubar, dock and every window. macOS-grade tile layout.

import { useEffect, useState } from "react";
import { Lock, Moon, Sun, SunMoon, Volume2, VolumeX, Wifi, Sparkles, LayoutDashboard } from "lucide-react";
import { ACCENTS, WALLPAPERS, useOS } from "@/lib/os";
import { useSession, type Theme } from "@/lib/session";
import { cn } from "@/lib/utils";

interface HealthStatus {
  status: "ok" | "degraded" | "error";
  checks: Record<string, { status: string }>;
}

function useSystemHealth() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setHealth(d))
      .catch(() => setHealth({ status: "degraded", checks: {} }));
  }, []);
  return health;
}

function StatusDot({ ok }: { ok?: boolean }) {
  if (ok === undefined) return <span className="inline-block h-2 w-2 rounded-full bg-white/20 animate-pulse" />;
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ background: ok ? "#00ED82" : "#FEBC2E" }}
    />
  );
}

export function ControlCenter({ onClose }: { onClose: () => void }) {
  const health = useSystemHealth();
  const theme = useSession((s) => s.theme);
  const setTheme = useOS((s) => s.setTheme);
  const accentId = useOS((s) => s.accentId);
  const setAccent = useOS((s) => s.setAccent);
  const wallpaperId = useOS((s) => s.wallpaperId);
  const setWallpaper = useOS((s) => s.setWallpaper);
  const brightness = useOS((s) => s.brightness);
  const setBrightness = useOS((s) => s.setBrightness);
  const volume = useOS((s) => s.volume);
  const setVolume = useOS((s) => s.setVolume);
  const reduceTransparency = useOS((s) => s.reduceTransparency);
  const toggleTransparency = useOS((s) => s.toggleTransparency);
  const dnd = useOS((s) => s.dnd);
  const toggleDnd = useOS((s) => s.toggleDnd);
  const stageManager = useOS((s) => s.stageManager);
  const toggleStageManager = useOS((s) => s.toggleStageManager);
  const lock = useOS((s) => s.lock);
  const accentHex = useOS((s) => s.accent().hex);

  const themes: { id: Theme; label: string; icon: React.ElementType }[] = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "Auto", icon: SunMoon },
  ];

  return (
    <div
      className="w-[330px] rounded-2xl border border-white/15 bg-[rgb(var(--ink-elevated)/0.78)] p-3 text-fg shadow-2xl backdrop-blur-2xl"
      style={{ boxShadow: "0 24px 60px -12px rgba(0,0,0,0.6)" }}
    >
      {/* quick tiles row */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Wifi size={15} style={{ color: accentHex }} /> Network
          </div>
          <div className="mt-1 text-2xs text-fg-muted">DIZRUPT-CORP</div>
        </div>
        <button
          onClick={() => { lock(); onClose(); }}
          className="flex flex-col items-start rounded-xl border border-white/[0.06] bg-white/[0.04] p-3 text-left transition-colors hover:bg-white/[0.08]"
        >
          <div className="flex items-center gap-2 text-xs font-semibold"><Lock size={15} style={{ color: accentHex }} /> Lock</div>
          <div className="mt-1 text-2xs text-fg-muted">Lock the desktop</div>
        </button>
      </div>

      {/* appearance */}
      <Section label="Appearance">
        <div className="grid grid-cols-3 gap-1.5">
          {themes.map((t) => {
            const Icon = t.icon;
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-2xs font-medium transition-colors",
                  active ? "text-fg" : "border-transparent text-fg-muted hover:bg-white/[0.06]"
                )}
                style={active ? { borderColor: accentHex + "88", background: accentHex + "1f" } : { borderColor: "transparent" }}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* accent */}
      <Section label="Accent Color">
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((a) => {
            const active = accentId === a.id;
            return (
              <button
                key={a.id}
                title={a.label}
                aria-label={a.label}
                onClick={() => setAccent(a.id)}
                className="grid h-7 w-7 place-items-center rounded-full transition-transform hover:scale-110"
                style={{ background: a.hex, boxShadow: active ? `0 0 0 2px rgb(var(--ink-elevated)), 0 0 0 4px ${a.hex}` : "inset 0 0 0 0.5px rgba(0,0,0,0.3)" }}
              >
                {active && <span className="h-2 w-2 rounded-full bg-black/70" />}
              </button>
            );
          })}
        </div>
      </Section>

      {/* wallpaper */}
      <Section label="Wallpaper">
        <div className="grid grid-cols-3 gap-2">
          {WALLPAPERS.map((w) => {
            const active = wallpaperId === w.id;
            return (
              <button
                key={w.id}
                onClick={() => setWallpaper(w.id)}
                title={w.label}
                className="group relative aspect-[16/10] overflow-hidden rounded-lg border transition-transform hover:scale-[1.03]"
                style={{ borderColor: active ? accentHex : "rgba(255,255,255,0.10)", borderWidth: active ? 2 : 1 }}
              >
                <span className="absolute inset-0" style={{ background: w.swatch }} />
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/40 px-1 py-0.5 text-[9px] font-medium text-white/90 opacity-0 transition-opacity group-hover:opacity-100">
                  {w.label}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* brightness */}
      <Section label="Brightness">
        <div className="flex items-center gap-2">
          <Sun size={14} className="text-fg-muted" />
          <input
            type="range"
            min={0.45}
            max={1}
            step={0.01}
            value={brightness}
            onChange={(e) => setBrightness(parseFloat(e.target.value))}
            aria-label="Screen brightness"
            className="dz-range h-1.5 flex-1 cursor-pointer appearance-none rounded-full"
            style={{ background: `linear-gradient(90deg, ${accentHex} ${((brightness - 0.45) / 0.55) * 100}%, rgb(var(--line)) ${((brightness - 0.45) / 0.55) * 100}%)` }}
          />
          <Sun size={18} className="text-fg-secondary" />
        </div>
      </Section>

      {/* volume */}
      <Section label="Sound">
        <div className="flex items-center gap-2">
          <VolumeX size={14} className="text-fg-muted" />
          <input
            type="range" min={0} max={1} step={0.01} value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            aria-label="Volume"
            className="dz-range h-1.5 flex-1 cursor-pointer appearance-none rounded-full"
            style={{ background: `linear-gradient(90deg, ${accentHex} ${volume * 100}%, rgb(var(--line)) ${volume * 100}%)` }}
          />
          <Volume2 size={18} className="text-fg-secondary" />
        </div>
      </Section>

      {/* transparency */}
      <button
        onClick={toggleTransparency}
        className="mt-2 flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.08]"
      >
        <span className="flex items-center gap-2 text-xs font-medium"><Sparkles size={15} style={{ color: accentHex }} /> Performance mode<span className="text-2xs font-normal text-fg-muted">· faster, less GPU</span></span>
        <span className={cn("relative h-5 w-9 rounded-full transition-colors", reduceTransparency ? "" : "bg-white/15")} style={reduceTransparency ? { background: accentHex } : undefined}>
          <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", reduceTransparency ? "left-[18px]" : "left-0.5")} />
        </span>
      </button>

      <button
        onClick={toggleDnd}
        className="mt-2 flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.08]"
      >
        <span className="flex items-center gap-2 text-xs font-medium"><Moon size={15} style={{ color: accentHex }} /> Do Not Disturb<span className="text-2xs font-normal text-fg-muted">· silences alerts</span></span>
        <span className={cn("relative h-5 w-9 rounded-full transition-colors", dnd ? "" : "bg-white/15")} style={dnd ? { background: accentHex } : undefined}>
          <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", dnd ? "left-[18px]" : "left-0.5")} />
        </span>
      </button>

      <button
        onClick={toggleStageManager}
        className="mt-2 flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.08]"
      >
        <span className="flex items-center gap-2 text-xs font-medium"><LayoutDashboard size={15} style={{ color: accentHex }} /> Stage Manager<span className="text-2xs font-normal text-fg-muted">· window groups</span></span>
        <span className={cn("relative h-5 w-9 rounded-full transition-colors", stageManager ? "" : "bg-white/15")} style={stageManager ? { background: accentHex } : undefined}>
          <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", stageManager ? "left-[18px]" : "left-0.5")} />
        </span>
      </button>

      {/* system status */}
      <Section label="System">
        <div className="space-y-1.5 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5">
          {[
            { label: "Database", key: "database" },
            { label: "AI Copilot", key: "openai" },
            { label: "Realtime", key: "realtime" },
          ].map(({ label, key }) => {
            const check = health?.checks?.[key];
            const isOk = check ? check.status === "ok" || check.status === "connected" : undefined;
            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-fg-muted">{label}</span>
                <div className="flex items-center gap-1.5">
                  <StatusDot ok={isOk} />
                  <span className="text-[10px] text-fg-faint">
                    {isOk === undefined ? "checking" : isOk ? "ok" : "degraded"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <style jsx>{`
        .dz-range::-webkit-slider-thumb { appearance: none; width: 15px; height: 15px; border-radius: 9999px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.4); cursor: pointer; }
        .dz-range::-moz-range-thumb { width: 15px; height: 15px; border: none; border-radius: 9999px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.4); cursor: pointer; }
      `}</style>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <div className="mb-1.5 px-0.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">{label}</div>
      {children}
    </div>
  );
}
