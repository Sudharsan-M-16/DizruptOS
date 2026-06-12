"use client";

import Link from "next/link";
import { useOps } from "@/lib/store";
import { departmentById, employeeById, projects } from "@/lib/data";
import {
  CapacityBar,
  EmpAvatar,
  Explain,
  HealthPill,
} from "@/components/ui/primitives";
import { SparkArea } from "@/components/ui/spark";
import { fmtDate, fmtMoney } from "@/lib/utils";

export default function ProjectsPage() {
  const tasks = useOps((s) => s.tasks);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {projects.map((p) => {
          const owner = employeeById(p.ownerId);
          const open = tasks.filter(
            (t) => t.projectId === p.id && t.status !== "COMPLETED"
          ).length;
          const blocked = tasks.filter(
            (t) => t.projectId === p.id && t.status === "BLOCKED"
          ).length;
          const burn = p.consumedHours / p.budgetHours;
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="panel panel-hover p-5"
            >
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-ink-elevated px-2 py-1 font-mono text-xs font-semibold text-brand">
                  {p.code}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-display text-[15px] font-semibold">
                      {p.name}
                    </h3>
                    <HealthPill health={p.health} pulse />
                    <Explain title={`${p.name} health`} signals={p.healthReasons} />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-fg-secondary">
                    {p.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-4 border-t border-line-subtle pt-3.5 text-xs">
                <Stat label="Open tasks" value={`${open}`} sub={blocked ? `${blocked} blocked` : "0 blocked"} subTone={blocked ? "text-danger" : undefined} />
                <Stat label="Budget burn" value={`${Math.round(burn * 100)}%`} sub={`${fmtMoney(p.consumedMicro)} of ${fmtMoney(p.budgetMicro)}`} />
                <Stat label="Target" value={fmtDate(p.targetDate)} sub={departmentById(p.departmentId)?.name ?? ""} />
                <div>
                  <div className="label-xs">Velocity</div>
                  <div className="mt-1 h-8">
                    <SparkArea
                      data={p.velocityTrend}
                      color={p.health === "CRITICAL" ? "#EF4444" : p.health === "ON_TRACK" ? "#10B981" : "#F59E0B"}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <CapacityBar pct={burn * 0.8} className="flex-1" height={5} />
                {owner && (
                  <div className="flex items-center gap-1.5 text-2xs text-fg-muted">
                    <EmpAvatar initials={owner.initials} accent={owner.accent} size={18} />
                    {owner.name}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  subTone,
}: {
  label: string;
  value: string;
  sub: string;
  subTone?: string;
}) {
  return (
    <div>
      <div className="label-xs">{label}</div>
      <div className="mt-1.5 font-mono text-[15px] font-semibold text-fg">{value}</div>
      <div className={`mt-0.5 text-2xs ${subTone ?? "text-fg-secondary"}`}>{sub}</div>
    </div>
  );
}
