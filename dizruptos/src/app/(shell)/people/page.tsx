"use client";

// Employee directory — TanStack-powered dense table with skill filtering
// and live utilization. "React AND available" answerable at a glance.

import * as React from "react";

function launchApp(id: string) {
  const ev = new CustomEvent("dizrupt:launch", { detail: { id } });
  window.dispatchEvent(ev);
  try { window.parent?.dispatchEvent(ev); } catch { /* cross-origin guard */ }
}
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Search, Users } from "lucide-react";
import { useOps } from "@/lib/store";
import { useSession } from "@/lib/session";
import { departmentById, employees, WEEKS } from "@/lib/data";
import {
  CapacityBar,
  EmpAvatar,
  Explain,
} from "@/components/ui/primitives";
import { cn, fmtPct, utilizationTone } from "@/lib/utils";
import type { Employee } from "@/lib/types";

type Row = Employee & { pct: number; headroom: number };

const col = createColumnHelper<Row>();

export default function PeoplePage() {
  const utilization = useOps((s) => s.utilization);
  const canSeeBurnout = useSession((s) => s.can("view_burnout"));
  // Colleagues' load is manager-private data: employees see who people ARE
  // (skills, expertise), never how loaded they are (dynamic view, PRD §6).
  const canSeeLoad = useSession((s) => s.can("view_capacity"));
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: canSeeLoad ? "pct" : "name", desc: canSeeLoad },
  ]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const rows: Row[] = React.useMemo(
    () =>
      employees
        .filter((e) => e.role !== "client")
        .map((e) => {
          const pct = utilization(e.id, WEEKS[0]);
          return {
            ...e,
            pct,
            headroom: Math.max(0, Math.round((1 - pct) * e.capacityHoursPerWeek)),
          };
        }),
    [utilization]
  );

  const columns = React.useMemo(
    () => [
      col.accessor("name", {
        header: "Person",
        cell: (info) => {
          const e = info.row.original;
          return (
            <button onClick={() => launchApp("directory")} className="flex items-center gap-2.5 hover:text-brand">
              <EmpAvatar initials={e.initials} accent={e.accent} size={28} />
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  {e.name}
                  {e.burnoutFlag && canSeeBurnout && (
                    <Explain title="Burnout signals (manager-private)" signals={e.burnoutSignals ?? []}>
                      <button className="h-1.5 w-1.5 rounded-full bg-danger shadow-[0_0_5px_#EF4444]" aria-label="Burnout flag" />
                    </Explain>
                  )}
                </div>
                <div className="text-2xs text-fg-muted">{e.title}</div>
              </div>
            </button>
          );
        },
      }),
      col.accessor((r) => departmentById(r.departmentId)?.name ?? "", {
        id: "dept",
        header: "Department",
        cell: (info) => <span className="text-2xs text-fg-secondary">{info.getValue()}</span>,
      }),
      ...(canSeeLoad
        ? [
      col.accessor("pct", {
        header: "Utilization · this week",
        cell: (info) => {
          const pct = info.getValue();
          return (
            <div className="flex w-44 items-center gap-2">
              <CapacityBar pct={pct} className="flex-1" height={6} />
              <span
                className={cn(
                  "w-10 text-right font-mono text-2xs font-semibold",
                  utilizationTone(pct) === "danger" ? "text-danger" : utilizationTone(pct) === "warn" ? "text-warn" : "text-ok"
                )}
              >
                {fmtPct(pct)}
              </span>
            </div>
          );
        },
      }),
      col.accessor("headroom", {
        header: "Headroom",
        cell: (info) => (
          <span className="font-mono text-2xs text-fg-secondary">
            {info.getValue()}h free
          </span>
        ),
      }),
          ]
        : []),
      col.accessor((r) => r.skills.join(" "), {
        id: "skills",
        header: "Skills",
        enableSorting: false,
        cell: (info) => (
          <div className="flex max-w-72 flex-wrap gap-1">
            {info.row.original.skills.slice(0, 4).map((s) => (
              <span key={s} className="rounded-full border border-line bg-ink-elevated px-2 py-px text-2xs text-fg-secondary">
                {s}
              </span>
            ))}
          </div>
        ),
      }),
      col.accessor((r) => r.expertise[0]?.domain ?? "", {
        id: "expertise",
        header: "Expertise · depth",
        enableSorting: false,
        cell: (info) => {
          const ex = info.row.original.expertise[0];
          if (!ex) return null;
          return (
            <div className="flex items-center gap-2">
              <span className="text-2xs text-fg-secondary">{ex.domain}</span>
              <span className="rounded bg-brand-soft px-1.5 font-mono text-2xs text-brand">
                {ex.depth.toFixed(2)}
              </span>
            </div>
          );
        },
      }),
    ],
    [canSeeBurnout, canSeeLoad]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex h-full flex-col">
      {/* OS page header */}
      <div className="flex items-center gap-3 border-b border-line bg-ink-elevated/50 px-5 py-3.5 shrink-0">
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "#818CF822", border: "1px solid #818CF844" }}>
          <Users size={15} style={{ color: "#818CF8" }} />
        </span>
        <div>
          <div className="text-sm font-semibold">Operative Directory</div>
          <div className="text-[11px] text-fg-muted">{rows.length} people · skill & capacity view</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
      <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative w-80">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder='Try "React", "Payments", a name…'
            className="h-9 w-full rounded-lg border border-line bg-ink-surface pl-9 pr-3 text-xs outline-none transition-colors placeholder:text-fg-faint focus:border-brand/50"
          />
        </div>
        <span className="text-2xs text-fg-muted">
          {table.getRowModel().rows.length} people · sorted by load — overloads surface first
        </span>
      </div>

      <div className="panel table-scroll overflow-x-auto">
        <table className="table-sticky w-full text-left">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-4 py-2.5">
                    <button
                      onClick={h.column.getToggleSortingHandler()}
                      disabled={!h.column.getCanSort()}
                      className={cn(
                        "label-xs flex items-center gap-1",
                        h.column.getCanSort() && "hover:text-fg-secondary"
                      )}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getCanSort() && <ArrowUpDown size={9} />}
                    </button>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-line-subtle transition-colors last:border-0 hover:bg-ink-elevated/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
      </div>
    </div>
  );
}
