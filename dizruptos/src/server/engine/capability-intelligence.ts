// Computation Engine — Capability Intelligence (CTO_REVIEW: stored → computed).
//
// Pure, deterministic functions over the capability graph. No DB, no React —
// just math, so they are trivially testable and reusable by API routes, the
// intelligence surfaces, and (later) the simulation engine. A thin adapter
// loads `employee_capabilities` + `capabilities` from the repository and feeds
// these; the *intelligence* lives here, not in the UI.

export interface CapabilityHolder {
  userId: string;
  userName?: string;
  proficiency: number; // 1 novice .. 5 expert
}

export type StrategicImportance = "low" | "medium" | "high" | "critical";

export interface CapabilityNode {
  id: string;
  name: string;
  category?: string;
  strategicImportance: StrategicImportance;
  holders: CapabilityHolder[];
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface CapabilityAnalysis {
  id: string;
  name: string;
  strategicImportance: StrategicImportance;
  holderCount: number;
  /** People who can actually perform the capability (proficiency ≥ COMPETENT). */
  busFactor: number;
  /** Deep experts (proficiency ≥ EXPERT). */
  expertCount: number;
  /** Herfindahl–Hirschman index of proficiency shares (0..1; 1 = one person). */
  concentration: number;
  /** Largest single holder's share of total proficiency (0..1). */
  topHolderShare: number;
  /** ≥2 competent holders. */
  hasBackup: boolean;
  successionRisk: RiskLevel;
  fragile: boolean;
}

export const COMPETENT = 3; // can perform the capability
export const EXPERT = 4; // deep backup

/** How many people can actually do this (bus factor proxy). */
export function busFactor(holders: CapabilityHolder[], threshold = COMPETENT): number {
  return holders.filter((h) => h.proficiency >= threshold).length;
}

/** Concentration of expertise: HHI of proficiency shares + top-holder share. */
export function concentration(holders: CapabilityHolder[]): { hhi: number; topShare: number } {
  const total = holders.reduce((s, h) => s + h.proficiency, 0);
  if (total <= 0) return { hhi: 0, topShare: 0 };
  const shares = holders.map((h) => h.proficiency / total);
  return {
    hhi: round(shares.reduce((s, x) => s + x * x, 0)),
    topShare: round(Math.max(...shares)),
  };
}

/** Succession risk = fragility (bus factor) weighted by strategic importance. */
export function successionRisk(holders: CapabilityHolder[], importance: StrategicImportance): RiskLevel {
  const bf = busFactor(holders);
  const strategic = importance === "critical" || importance === "high";
  if (bf === 0) return "critical";
  if (bf === 1) return strategic ? "critical" : "high";
  if (bf === 2) return importance === "critical" ? "high" : "medium";
  return "low";
}

/** Full analysis of one capability. */
export function analyzeCapability(c: CapabilityNode): CapabilityAnalysis {
  const bf = busFactor(c.holders);
  const conc = concentration(c.holders);
  return {
    id: c.id,
    name: c.name,
    strategicImportance: c.strategicImportance,
    holderCount: c.holders.length,
    busFactor: bf,
    expertCount: busFactor(c.holders, EXPERT),
    concentration: conc.hhi,
    topHolderShare: conc.topShare,
    hasBackup: bf >= 2,
    successionRisk: successionRisk(c.holders, c.strategicImportance),
    fragile: bf <= 1,
  };
}

const RISK_ORDER: Record<RiskLevel, number> = { critical: 3, high: 2, medium: 1, low: 0 };

/** Capabilities ranked most-fragile / highest-risk first — the intelligence feed. */
export function rankByRisk(caps: CapabilityNode[]): CapabilityAnalysis[] {
  return caps
    .map(analyzeCapability)
    .sort((a, b) =>
      RISK_ORDER[b.successionRisk] - RISK_ORDER[a.successionRisk] ||
      b.concentration - a.concentration
    );
}

export interface CapabilityHealth {
  total: number;
  fragile: number; // bus factor ≤ 1
  noBackup: number; // bus factor < 2
  strategicAtRisk: number; // high/critical importance AND high/critical risk
  atRiskCapabilities: string[]; // names, worst first
}

/** Org-level rollup — a real (computed) organizational-health signal. */
export function capabilityHealth(caps: CapabilityNode[]): CapabilityHealth {
  const a = caps.map(analyzeCapability);
  const strategicAtRisk = a.filter(
    (x) =>
      (x.strategicImportance === "high" || x.strategicImportance === "critical") &&
      (x.successionRisk === "high" || x.successionRisk === "critical")
  );
  return {
    total: a.length,
    fragile: a.filter((x) => x.fragile).length,
    noBackup: a.filter((x) => !x.hasBackup).length,
    strategicAtRisk: strategicAtRisk.length,
    atRiskCapabilities: strategicAtRisk
      .sort((x, y) => RISK_ORDER[y.successionRisk] - RISK_ORDER[x.successionRisk])
      .map((x) => x.name),
  };
}

/* ----------------------------- expertise intelligence ---------------------- */
// The capability graph already answers "who knows this / who can replace them /
// how scarce / how covered / who is a single point of failure" — computed now
// while the context is fresh, not deferred.

export interface ExpertView {
  capabilityId: string;
  capabilityName: string;
  primary: CapabilityHolder | null; // top proficiency = the expert
  backups: CapabilityHolder[]; // other competent holders (≥ COMPETENT)
  learners: CapabilityHolder[]; // below competent
}

/** Expert discovery + replacement: who knows X, who can step in. */
export function experts(c: CapabilityNode): ExpertView {
  const sorted = [...c.holders].sort((a, b) => b.proficiency - a.proficiency);
  return {
    capabilityId: c.id,
    capabilityName: c.name,
    primary: sorted[0] ?? null,
    backups: sorted.slice(1).filter((h) => h.proficiency >= COMPETENT),
    learners: sorted.filter((h) => h.proficiency < COMPETENT),
  };
}

/** Capabilities ranked by scarcity (fewest competent holders first). */
export function capabilityScarcity(caps: CapabilityNode[]): { name: string; busFactor: number }[] {
  return caps
    .map((c) => ({ name: c.name, busFactor: busFactor(c.holders) }))
    .sort((a, b) => a.busFactor - b.busFactor);
}

/** Backup coverage across the org: how many capabilities have a real backup. */
export function backupCoverage(caps: CapabilityNode[]): { covered: number; uncovered: number; pct: number } {
  const covered = caps.filter((c) => busFactor(c.holders) >= 2).length;
  return { covered, uncovered: caps.length - covered, pct: caps.length ? round(covered / caps.length) : 0 };
}

/** Key-person risk: people who are the SOLE competent holder of a strategic
 *  capability — the org's single points of failure. */
export function successionExposure(caps: CapabilityNode[]): { userId: string; userName?: string; capabilities: string[] }[] {
  const byUser = new Map<string, { userName?: string; capabilities: string[] }>();
  for (const c of caps) {
    const competent = c.holders.filter((h) => h.proficiency >= COMPETENT);
    const strategic = c.strategicImportance === "high" || c.strategicImportance === "critical";
    if (competent.length === 1 && strategic) {
      const h = competent[0];
      const e = byUser.get(h.userId) ?? { userName: h.userName, capabilities: [] };
      e.capabilities.push(c.name);
      byUser.set(h.userId, e);
    }
  }
  return [...byUser.entries()]
    .map(([userId, v]) => ({ userId, userName: v.userName, capabilities: v.capabilities }))
    .sort((a, b) => b.capabilities.length - a.capabilities.length);
}

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}
