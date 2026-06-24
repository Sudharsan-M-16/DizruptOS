import { type NextRequest } from "next/server";
import { resolvePrincipal, requirePermission } from "@/server/services/authz";
import { guarded, ok } from "@/server/api";

export const dynamic = "force-dynamic";

export interface EscalationRule {
  id: string;
  category: string;
  severity: string;
  escalateAfterMinutes: number;
  notifyPersonaIds: string[];
  enabled: boolean;
}

const rules: EscalationRule[] = [
  { id: "r1", category: "risk", severity: "critical", escalateAfterMinutes: 15, notifyPersonaIds: ["u-noor", "u-asha"], enabled: true },
  { id: "r2", category: "capacity", severity: "high", escalateAfterMinutes: 60, notifyPersonaIds: ["u-noor"], enabled: true },
  { id: "r3", category: "succession", severity: "high", escalateAfterMinutes: 240, notifyPersonaIds: ["u-noor"], enabled: true },
  { id: "r4", category: "calibration_drift", severity: "medium", escalateAfterMinutes: 1440, notifyPersonaIds: ["u-noor"], enabled: true },
];

export async function GET(req: NextRequest) {
  return guarded(req, "escalation_list", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_audit");
    return ok(rules);
  });
}

export async function POST(req: NextRequest) {
  return guarded(req, "escalation_upsert", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_audit");
    let body: Partial<EscalationRule> = {};
    try { body = await req.json(); } catch { /* fine */ }

    const existing = rules.find((r) => r.id === body.id);
    if (existing) {
      Object.assign(existing, body);
      return ok(existing);
    }
    const newRule: EscalationRule = {
      id: `r${Date.now()}`,
      category: body.category ?? "risk",
      severity: body.severity ?? "medium",
      escalateAfterMinutes: body.escalateAfterMinutes ?? 60,
      notifyPersonaIds: body.notifyPersonaIds ?? [],
      enabled: body.enabled ?? true,
    };
    rules.push(newRule);
    return ok(newRule);
  });
}
