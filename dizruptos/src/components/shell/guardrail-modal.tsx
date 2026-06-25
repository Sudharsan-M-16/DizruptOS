"use client";

// Hard-stop capacity guardrail (PRD §3.3): a drop that pushes the target ≥100%
// requires a typed override reason, logged to audit_events.

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { OctagonAlert } from "lucide-react";
import { useOps } from "@/lib/store";
import { employeeById } from "@/lib/data";
import { Button, CapacityBar } from "@/components/ui/primitives";
import { fmtPct } from "@/lib/utils";

export function GuardrailModal() {
  const pendingDrop = useOps((s) => s.pendingDrop);
  const confirmReallocate = useOps((s) => s.confirmReallocate);
  const cancelReallocate = useOps((s) => s.cancelReallocate);
  const tasks = useOps((s) => s.tasks);
  const [reason, setReason] = React.useState("");

  // Only render as a modal when the guardrail actually trips (≥ 100%)
  const open = !!pendingDrop && pendingDrop.projectedPct >= 1;
  const task = tasks.find((t) => t.id === pendingDrop?.taskId);
  const target = employeeById(pendingDrop?.toEmployeeId);

  React.useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && cancelReallocate()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto animate-riseIn rounded-card border border-danger/40 bg-ink-elevated p-5 shadow-pop">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-danger-soft p-2 text-danger">
              <OctagonAlert size={18} />
            </div>
            <div>
              <Dialog.Title className="font-display text-sm font-semibold">
                Capacity guardrail tripped
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs leading-relaxed text-fg-secondary">
                Moving <span className="font-medium text-fg">{task?.title}</span>{" "}
                ({task?.estimatedHours}h) would push{" "}
                <span className="font-medium text-fg">{target?.name}</span> to{" "}
                <span className="font-mono font-semibold text-danger">
                  {pendingDrop ? fmtPct(pendingDrop.projectedPct) : ""}
                </span>{" "}
                in the week of {pendingDrop?.weekStart.slice(5)}.
              </Dialog.Description>
            </div>
          </div>

          {pendingDrop && (
            <div className="mt-4">
              <CapacityBar pct={pendingDrop.projectedPct} />
              <div className="mt-1 flex justify-between text-2xs text-fg-muted">
                <span>0%</span>
                <span className="text-danger">projected {fmtPct(pendingDrop.projectedPct)}</span>
                <span>125%</span>
              </div>
            </div>
          )}

          <label className="mt-4 block">
            <span className="label-xs">Override reason — required, written to audit log</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Release-gating test cannot slip past code freeze"
              className="mt-1.5 w-full rounded-lg border border-line bg-ink-surface px-3 py-2 text-xs text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-danger/60"
            />
          </label>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={cancelReallocate}>
              Cancel — roll back
            </Button>
            <Button
              variant="danger"
              disabled={reason.trim().length < 8}
              onClick={() => confirmReallocate(reason.trim())}
            >
              Override & assign
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
