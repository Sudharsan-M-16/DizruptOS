"use client";

// A static, lightweight miniature of the DizruptOS desktop for the landing page
// — menubar, wallpaper, two frosted windows (Home + Tasks) and a dock. No window
// manager, no iframes; just an honest snapshot of what signing in reveals. Kept
// cheap so it never drags the marketing page's scroll performance.

import { Activity, Bell, Flame, Home, KanbanSquare, ListChecks, Search, Settings, ShieldAlert, SlidersHorizontal, Users } from "lucide-react";
import { DizruptMark } from "@/components/ui/logo";

const DOCK: { icon: React.ElementType; accent: string }[] = [
  { icon: Home, accent: "#00ED82" }, { icon: ListChecks, accent: "#2BD9FF" }, { icon: KanbanSquare, accent: "#7C6CFF" },
  { icon: Users, accent: "#38BDF8" }, { icon: Flame, accent: "#F59E0B" }, { icon: ShieldAlert, accent: "#EF4444" },
  { icon: Activity, accent: "#00ED82" }, { icon: Settings, accent: "#9AA3AD" },
];

export function OSPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#06070c]">
      {/* wallpaper */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 12% 0%, rgba(0,237,130,0.16), transparent 46%), radial-gradient(120% 90% at 100% 8%, rgba(43,217,255,0.12), transparent 52%), radial-gradient(150% 120% at 50% 130%, rgba(0,237,130,0.12), transparent 55%), linear-gradient(180deg,#06070c,#05060a 60%,#030409)" }} />

      {/* menubar */}
      <div className="absolute inset-x-0 top-0 z-20 flex h-6 items-center gap-2 border-b border-white/10 bg-black/40 px-2 text-[10px] text-white/80 backdrop-blur-md">
        <DizruptMark size={11} />
        <span className="font-semibold">DizruptOS</span>
        <span className="hidden text-white/50 sm:inline">Overview</span>
        <span className="hidden text-white/50 sm:inline">Capacity</span>
        <div className="ml-auto flex items-center gap-2 text-white/60">
          <Search size={10} /><Bell size={10} /><SlidersHorizontal size={10} />
          <span className="tabular-nums text-white/80">9:41</span>
        </div>
      </div>

      {/* Home window */}
      <Win className="left-[3%] top-[14%] w-[50%]" title="Home" icon={Home} accent="#00ED82">
        <div className="mb-1.5 text-[11px] font-bold text-white">Good morning, Asha.</div>
        <div className="grid grid-cols-3 gap-1">
          {[["Load", "75%"], ["Today", "4"], ["Critical", "6"]].map(([l, v]) => (
            <div key={l} className="rounded-md border border-white/10 bg-white/[0.03] p-1.5">
              <div className="text-[7px] text-white/45">{l}</div>
              <div className="text-[12px] font-bold text-white">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-1.5 space-y-1">
          {["Ledger cutover runbook", "Settlement file ingestion", "Reconciliation engine"].map((t, i) => (
            <div key={t} className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.02] px-1.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: ["#F59E0B", "#EF4444", "#F59E0B"][i] }} />
              <span className="truncate text-[8px] text-white/80">{t}</span>
            </div>
          ))}
        </div>
      </Win>

      {/* Tasks/board window */}
      <Win className="right-[3%] top-[26%] w-[44%]" title="Project Matrix" icon={KanbanSquare} accent="#7C6CFF">
        <div className="grid grid-cols-3 gap-1">
          {[["To Do", "#38BDF8", 2], ["In Progress", "#F59E0B", 3], ["Done", "#10B981", 1]].map(([c, tone, n]) => (
            <div key={c as string}>
              <div className="mb-1 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone as string }} />
                <span className="text-[7px] font-semibold text-white/70">{c as string}</span>
              </div>
              <div className="space-y-1">
                {Array.from({ length: n as number }).map((_, i) => (
                  <div key={i} className="rounded border border-white/10 bg-white/[0.03] p-1">
                    <div className="h-1 w-3/4 rounded bg-white/20" />
                    <div className="mt-1 h-1 w-1/2 rounded bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Win>

      {/* dock */}
      <div className="absolute inset-x-0 bottom-1.5 z-20 flex justify-center">
        <div className="flex items-end gap-1 rounded-xl border border-white/10 bg-white/[0.06] px-1.5 py-1 backdrop-blur-md">
          {DOCK.map(({ icon: Icon, accent }, i) => (
            <span key={i} className="grid h-6 w-6 place-items-center rounded-md border" style={{ borderColor: `${accent}40`, background: `linear-gradient(160deg, ${accent}22, rgba(13,14,17,0.7))` }}>
              <Icon size={12} style={{ color: accent }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Win({ className, title, icon: Icon, accent, children }: { className: string; title: string; icon: React.ElementType; accent: string; children: React.ReactNode }) {
  return (
    <div className={`absolute z-10 overflow-hidden rounded-lg border border-white/15 bg-[rgb(13_14_17_/_0.82)] backdrop-blur-md ${className}`} style={{ boxShadow: `0 12px 32px -8px rgba(0,0,0,0.6), 0 0 0 1px ${accent}22` }}>
      <div className="flex h-5 items-center gap-1 border-b border-white/10 bg-white/[0.04] px-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#FF5F57]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#FEBC2E]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#28C840]" />
        <span className="ml-1 flex items-center gap-1 text-[8px] font-semibold text-white/70"><Icon size={8} style={{ color: accent }} /> {title}</span>
      </div>
      <div className="p-1.5">{children}</div>
    </div>
  );
}
