"use client";

// Operative Directory — DizruptOS people management. A master/detail directory:
// searchable + department-filtered roster on the left, a rich profile on the
// right (capacity, skills, burnout signals, location/timezone). Token surfaces
// only, so it's crisp in light and dark. Data flows through `loadRoster()` —
// swap for a backend call without touching the view.

import { useMemo, useState } from "react";
import { AlertTriangle, MapPin, Plane, Search, Sparkles } from "lucide-react";
import { departments, employeeById, employees, projects, tasks as allTasks, WEEKS } from "@/lib/data";
import { EmpAvatar, CapacityBar } from "@/components/ui/primitives";
import { useOps } from "@/lib/store";
import { useSession } from "@/lib/session";
import { cn, fmtPct, utilizationTone } from "@/lib/utils";

type Person = (typeof employees)[number];
function loadRoster(): Person[] {
  return employees;
}

const ROLE_LABEL: Record<string, string> = {
  executive: "Executive", dept_head: "Dept Head", project_manager: "Manager",
  team_lead: "Team Lead", employee: "Engineer", admin: "Admin", client: "Client",
};

export function OperativeDirectory() {
  const roster = useMemo(loadRoster, []);
  const utilization = useOps((s) => s.utilization);
  const personaId = useSession((s) => s.personaId);
  const me = employeeById(personaId);
  const week = WEEKS[0];
  const [q, setQ] = useState("");
  // Open on YOUR team: filter to the viewer's department, and select the viewer.
  // (Executives/admins have no single team → show everyone.)
  const wide = me?.role === "executive" || me?.role === "admin";
  const [dept, setDept] = useState<string | "all">(!wide && me?.departmentId ? me.departmentId : "all");
  const [selId, setSelId] = useState<string>(me?.id ?? roster[0]?.id ?? "");

  const filtered = roster.filter((e) => {
    const matchesQ = !q || e.name.toLowerCase().includes(q.toLowerCase()) || e.title.toLowerCase().includes(q.toLowerCase()) || e.skills?.some((s) => s.toLowerCase().includes(q.toLowerCase()));
    const matchesDept = dept === "all" || e.departmentId === dept;
    return matchesQ && matchesDept;
  });
  const sel = roster.find((e) => e.id === selId) ?? filtered[0];

  return (
    <div className="flex h-full min-h-0">
      {/* roster */}
      <div className="flex w-[270px] shrink-0 flex-col border-r border-line pr-3">
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-line bg-ink-elevated px-2.5">
          <Search size={13} className="text-fg-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people, skills…"
            aria-label="Search people by name or skills"
            className="h-8 flex-1 bg-transparent text-xs text-fg placeholder:text-fg-faint focus:outline-none"
          />
        </div>
        <div className="mb-2 flex flex-wrap gap-1">
          <Chip active={dept === "all"} onClick={() => setDept("all")}>All</Chip>
          {departments.map((d) => (
            <Chip key={d.id} active={dept === d.id} onClick={() => setDept(d.id)}>{d.name.split(" ")[0]}</Chip>
          ))}
        </div>
        <div className="-mr-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-1">
          {filtered.map((e) => {
            const u = utilization(e.id, week);
            const tone = utilizationTone(u);
            return (
              <button
                key={e.id}
                onClick={() => setSelId(e.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
                  selId === e.id ? "bg-ink-elevated" : "hover:bg-ink-elevated/60"
                )}
                style={selId === e.id ? { boxShadow: "inset 2px 0 0 var(--os-accent,#00ED82)" } : undefined}
              >
                <EmpAvatar initials={e.initials} accent={e.accent} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-semibold">{e.name}</span>
                    {e.burnoutFlag && <AlertTriangle size={11} className="shrink-0 text-danger" />}
                  </div>
                  <div className="truncate text-2xs text-fg-muted">{e.title}</div>
                </div>
                <span className={cn("font-mono text-2xs font-semibold", tone === "danger" ? "text-danger" : tone === "warn" ? "text-warn" : "text-ok")}>{fmtPct(u)}</span>
              </button>
            );
          })}
          {filtered.length === 0 && <div className="px-2 py-6 text-center text-2xs text-fg-faint">No matches</div>}
        </div>
      </div>

      {/* profile */}
      {sel && <Profile key={sel.id} person={sel} util={utilization(sel.id, week)} />}
    </div>
  );
}

function Profile({ person: e, util }: { person: Person; util: number }) {
  const tone = utilizationTone(util);
  const dept = departments.find((d) => d.id === e.departmentId);
  const owned = projects.filter((p) => p.ownerId === e.id);
  const taskCount = allTasks.filter((t) => t.assigneeId === e.id && t.status !== "COMPLETED").length;
  const canSeeBurnout = useSession((s) => s.can("view_burnout"));

  return (
    <div className="min-w-0 flex-1 overflow-y-auto pl-5">
      <div className="flex items-center gap-3.5">
        <EmpAvatar initials={e.initials} accent={e.accent} size={56} />
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold tracking-tight">{e.name}</h2>
          <div className="text-xs text-fg-secondary">{e.title} · {dept?.name}</div>
          <div className="mt-1 flex items-center gap-3 text-2xs text-fg-muted">
            <span className="flex items-center gap-1"><MapPin size={11} /> {e.location} · {e.timezone}</span>
            <span className="rounded-full bg-ink-elevated px-2 py-px font-medium text-fg-secondary">{ROLE_LABEL[e.role] ?? e.role}</span>
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="mt-5 grid grid-cols-3 gap-2.5">
        <Stat label="This week" value={fmtPct(util)} valueClass={tone === "danger" ? "text-danger" : tone === "warn" ? "text-warn" : "text-ok"} sub={`${e.capacityHoursPerWeek}h capacity`} />
        <Stat label="Open tasks" value={String(taskCount)} sub="assigned" />
        <Stat label="Owns" value={String(owned.length)} sub="projects" />
      </div>

      {/* capacity */}
      <Section title="Capacity">
        <div className="flex items-center gap-3">
          <CapacityBar pct={util} className="flex-1" />
          <span className={cn("font-mono text-xs font-semibold", tone === "danger" ? "text-danger" : tone === "warn" ? "text-warn" : "text-ok")}>{fmtPct(util)}</span>
        </div>
      </Section>

      {/* skills */}
      {e.skills?.length ? (
        <Section title="Skills">
          <div className="flex flex-wrap gap-1.5">
            {e.skills.map((s) => (
              <span key={s} className="rounded-full border border-line bg-ink-surface px-2.5 py-1 text-2xs font-medium text-fg-secondary">{s}</span>
            ))}
          </div>
        </Section>
      ) : null}

      {/* expertise */}
      {e.expertise?.length ? (
        <Section title="Expertise">
          <div className="space-y-1.5">
            {e.expertise.map((x) => (
              <div key={x.domain} className="flex items-center gap-2">
                <Sparkles size={12} className="shrink-0 text-fg-muted" />
                <span className="w-40 truncate text-2xs text-fg-secondary">{x.domain}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-elevated">
                  <div className="h-full rounded-full" style={{ width: `${x.depth * 100}%`, background: "var(--os-accent,#00ED82)" }} />
                </div>
                <span className="font-mono text-2xs text-fg-muted">{Math.round(x.depth * 100)}</span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* burnout — gated: only managers/dept-heads/admins can see this */}
      {e.burnoutFlag && canSeeBurnout && (
        <Section title="Burnout signals (manager-private)">
          <div className="space-y-1 rounded-xl border border-danger/30 bg-danger/[0.06] p-3">
            {e.burnoutSignals?.map((s) => (
              <div key={s} className="flex items-center gap-2 text-2xs text-danger"><AlertTriangle size={11} /> {s}</div>
            ))}
            {typeof e.flightRisk === "number" && (
              <div className="mt-1 flex items-center gap-2 border-t border-danger/20 pt-1.5 text-2xs text-danger"><Plane size={11} /> Flight risk {Math.round(e.flightRisk * 100)}%</div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn("rounded-full border px-2 py-0.5 text-2xs font-medium transition-colors", active ? "border-transparent text-black" : "border-line text-fg-secondary hover:bg-ink-elevated")}
      style={active ? { background: "var(--os-accent,#00ED82)" } : undefined}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, sub, valueClass }: { label: string; value: string; sub: string; valueClass?: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink-surface p-3">
      <div className="text-2xs text-fg-muted">{label}</div>
      <div className={cn("mt-0.5 font-display text-xl font-bold tracking-tight", valueClass)}>{value}</div>
      <div className="text-2xs text-fg-faint">{sub}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">{title}</div>
      {children}
    </div>
  );
}
