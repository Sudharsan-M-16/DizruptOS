import { beforeEach, describe, expect, it } from "vitest";
import { useOps } from "../store";
import { employeeById, WEEKS } from "../data";

// The store is the in-memory twin of the PRD's mutation laws. These tests pin:
// guardrail at ≥100%, atomic delta math, audit completeness, agent execution
// through the same path, and rejection memory semantics.

const initial = useOps.getState();

beforeEach(() => {
  useOps.setState(initial, true);
});

const util = (empId: string, week: string) => useOps.getState().utilization(empId, week);

describe("hard-stop capacity guardrail (PRD §3.3)", () => {
  it("a drop projecting ≥100% parks in pendingDrop instead of applying", () => {
    // t-1 is Sarah's 14h runbook task in WEEKS[0].
    // Jonas is at 30/40 = 75%; +14h → 110% → guardrail must trip.
    const before = util("u-jonas", WEEKS[0]);
    useOps.getState().requestReallocate("t-1", "u-jonas");
    const s = useOps.getState();
    expect(s.pendingDrop).not.toBeNull();
    expect(s.pendingDrop!.projectedPct).toBeGreaterThanOrEqual(1);
    expect(util("u-jonas", WEEKS[0])).toBe(before); // nothing applied
  });

  it("cancel rolls back cleanly", () => {
    useOps.getState().requestReallocate("t-1", "u-jonas");
    useOps.getState().cancelReallocate();
    expect(useOps.getState().pendingDrop).toBeNull();
  });


  it("override applies the move and writes the reason to audit", () => {
    const auditBefore = useOps.getState().audit.length;
    useOps.getState().requestReallocate("t-1", "u-jonas");
    useOps.getState().confirmReallocate("Release-gating: cannot slip code freeze");
    const s = useOps.getState();
    expect(s.tasks.find((t) => t.id === "t-1")!.assigneeId).toBe("u-jonas");
    expect(s.audit.length).toBe(auditBefore + 1);
    expect(s.audit[0].actionType).toBe("capacity_override");
    expect(s.audit[0].overrideReason).toContain("code freeze");
  });
});

describe("atomic capacity deltas (architecture law 6)", () => {
  it("moves hours as ±delta on both sides, never overwrites", () => {
    // t-3 is Sarah's 9h "Set up the chatbot database" task in WEEKS[0].
    // Ahmed 26/40 = 65% → 35/40 = 87.5%.
    const sarahBefore = useOps.getState().allocated("u-sarah", WEEKS[0]);
    const ahmedBefore = useOps.getState().allocated("u-ahmed", WEEKS[0]);
    useOps.getState().requestReallocate("t-3", "u-ahmed"); // 87.5% < 100% → auto-confirms
    const s = useOps.getState();
    expect(s.pendingDrop).toBeNull();
    expect(s.allocated("u-sarah", WEEKS[0])).toBe(sarahBefore - 9);
    expect(s.allocated("u-ahmed", WEEKS[0])).toBe(ahmedBefore + 9);
  });

  it("utilization derives from capacity_hours_per_week", () => {
    const ines = employeeById("u-ines")!; // 32h/week part-time
    expect(util("u-ines", WEEKS[0])).toBeCloseTo(16 / ines.capacityHoursPerWeek, 6);
  });
});

describe("agent proposal review (PRD §6.7, §24)", () => {
  it("approval executes the reallocation through the same atomic path", () => {
    // pr-1: move t-3 (9h) Sarah → Ahmed in WEEKS[0].
    const ahmedBefore = useOps.getState().allocated("u-ahmed", WEEKS[0]);
    useOps.getState().reviewProposal("pr-1", "approved");
    const s = useOps.getState();
    expect(s.proposals.find((p) => p.id === "pr-1")!.status).toBe("approved");
    expect(s.tasks.find((t) => t.id === "t-3")!.assigneeId).toBe("u-ahmed");
    expect(s.allocated("u-ahmed", WEEKS[0])).toBe(ahmedBefore + 9);
    expect(s.audit[0].actionType).toBe("proposal_approved");
  });

  it("a stale proposal expires at decision time instead of corrupting capacity", () => {
    // Adversarial scenario: between proposal creation and approval, Ahmed's
    // week fills up. Approving must refuse execution (security property:
    // approval cannot bypass the capacity guardrail).
    const week = WEEKS[0]; // t-3 lands in WEEKS[0]
    useOps.setState({
      capacity: useOps.getState().capacity.map((c) =>
        c.employeeId === "u-ahmed" && c.weekStart === week
          ? { ...c, allocatedHours: 38 } // +9h would project to 117%
          : c
      ),
    });
    const taskBefore = useOps.getState().tasks.find((t) => t.id === "t-3")!.assigneeId;

    useOps.getState().reviewProposal("pr-1", "approved");

    const s = useOps.getState();
    expect(s.proposals.find((p) => p.id === "pr-1")!.status).toBe("expired");
    expect(s.tasks.find((t) => t.id === "t-3")!.assigneeId).toBe(taskBefore); // untouched
    expect(s.allocated("u-ahmed", week)).toBe(38); // no capacity mutation
    expect(s.audit[0].actionType).toBe("proposal_stale");
  });

  it("rejection records agent memory in the audit trail without mutating work", () => {
    const taskBefore = useOps.getState().tasks.find((t) => t.id === "t-3")!.assigneeId;
    useOps.getState().reviewProposal("pr-1", "rejected");
    const s = useOps.getState();
    expect(s.proposals.find((p) => p.id === "pr-1")!.status).toBe("rejected");
    expect(s.tasks.find((t) => t.id === "t-3")!.assigneeId).toBe(taskBefore);
    expect(s.audit[0].detail).toContain("30 days");
  });
});

describe("applyDelta new-cell insertion (BUG-8 regression)", () => {
  it("reallocating to an employee with no existing cell for that week creates a new cell", () => {
    // Use a week that has no capacity record for any employee yet.
    const novelWeek = "2099-01-01";
    const stateBefore = useOps.getState();
    const existsBefore = stateBefore.capacity.some(
      (c) => c.employeeId === "u-ahmed" && c.weekStart === novelWeek
    );
    expect(existsBefore).toBe(false);

    // Find a task assigned to Sarah in a different week and manually move it.
    // We'll use requestReallocate with a task that has no prior cell for u-ahmed/novelWeek
    // by surgically patching one task's weekStart.
    const taskId = "t-10";
    const taskHours = stateBefore.tasks.find((t) => t.id === taskId)!.estimatedHours;

    useOps.setState({
      tasks: stateBefore.tasks.map((t) => t.id === taskId ? { ...t, weekStart: novelWeek } : t),
    });

    useOps.getState().requestReallocate(taskId, "u-ahmed");

    const stateAfter = useOps.getState();
    // Either it auto-confirmed (capacity < 100%) or it parked in pendingDrop.
    // Either way a cell must now exist for u-ahmed in novelWeek.
    const newCell = stateAfter.capacity.find(
      (c) => c.employeeId === "u-ahmed" && c.weekStart === novelWeek
    );
    expect(newCell).toBeDefined();
    // allocatedHours must be the task hours (delta = +hours), not negative.
    expect(newCell!.allocatedHours).toBe(taskHours);
  });
});

describe("addNotification store action", () => {
  it("pushes a notification item and increments unread count", () => {
    const before = useOps.getState().notifications.length;
    useOps.getState().addNotification({
      id: "test-notif-1",
      klass: "intelligence",
      title: "Test alert",
      body: "Store edge case test",
      at: new Date().toISOString(),
      read: false,
    });
    const after = useOps.getState();
    expect(after.notifications.length).toBe(before + 1);
    const item = after.notifications.find((n) => n.id === "test-notif-1");
    expect(item).toBeDefined();
    expect(item!.klass).toBe("intelligence");
    expect(item!.read).toBe(false);
  });

  it("does not error when klass is hard_stop", () => {
    expect(() =>
      useOps.getState().addNotification({
        id: "test-notif-2",
        klass: "hard_stop",
        title: "Capacity breach",
        body: "Jonas is at 120%",
        at: new Date().toISOString(),
        read: false,
      })
    ).not.toThrow();
  });
});
