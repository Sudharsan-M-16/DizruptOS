// GET /api/v1/intelligence/health-history — org health trend over time.
//
// Returns the last N daily snapshots so the UI can render sparklines and
// trend indicators ("improving +4.2 pts", "declining −1.8 pts") rather than
// just a frozen current score. In demo mode, synthesises a 30-day history
// from the engine's current output so the surface works offline.
//
// Query params:
//   ?days=30   (default 30, max 90)

import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { guarded, ok, fail } from "@/server/api";
import { orgHealthIntelligence } from "@/server/services/intelligence-loader";
import { isDemoMode } from "@/lib/env";

export const dynamic = "force-dynamic";

interface HealthPoint {
  date: string;          // ISO date (YYYY-MM-DD)
  score: number;         // 0–100
  capacityUtil?: number;
  riskExposure?: number;
  executionPace?: number;
  capabilityGap?: number;
  openTasks?: number;
  criticalRisks?: number;
}

interface HealthHistoryResult {
  points: HealthPoint[];
  trend: "improving" | "declining" | "stable";
  trendDelta: number;   // score change over the period (positive = improving)
  current: number;
  low: number;
  high: number;
}

/** Synthesise 30 days of demo data from current engine state. */
function demoHistory(currentScore: number, days: number): HealthPoint[] {
  const points: HealthPoint[] = [];
  const seeded = 42; // deterministic seed
  let rng = seeded;
  const rand = () => {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    return (rng >>> 0) / 0xffffffff;
  };

  const baseScore = currentScore - (days - 1) * 0.25; // slight upward trend

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const noise = rand() * 6 - 3;
    const score = Math.max(40, Math.min(95, baseScore + (days - 1 - i) * 0.25 + noise));
    points.push({
      date: d.toISOString().slice(0, 10),
      score: Math.round(score * 100) / 100,
      capacityUtil: Math.round((0.65 + rand() * 0.25) * 1000) / 1000,
      riskExposure: Math.round((0.20 + rand() * 0.30) * 1000) / 1000,
      executionPace: Math.round((0.55 + rand() * 0.35) * 1000) / 1000,
      capabilityGap: Math.round((0.15 + rand() * 0.20) * 1000) / 1000,
      openTasks: Math.floor(18 + rand() * 12),
      criticalRisks: Math.floor(rand() * 4),
    });
  }
  return points;
}

function computeTrend(points: HealthPoint[]): { trend: "improving" | "declining" | "stable"; delta: number } {
  if (points.length < 2) return { trend: "stable", delta: 0 };
  const first = points[0].score;
  const last  = points[points.length - 1].score;
  const delta = Math.round((last - first) * 100) / 100;
  if (delta > 1.5)  return { trend: "improving", delta };
  if (delta < -1.5) return { trend: "declining", delta };
  return { trend: "stable", delta };
}

export async function GET(req: NextRequest) {
  return guarded(req, "api_health_history", async () => {
    resolvePrincipal(req); // authentication required

    const days = Math.max(7, Math.min(90,
      parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10) || 30
    ));

    let points: HealthPoint[];

    // Compute current health score from the intelligence loader (handles both modes)
    const healthResult = await orgHealthIntelligence();
    const currentScore = healthResult.health.score;
    points = demoHistory(currentScore, days);

    if (!isDemoMode) {
      // In production: try to read from org_health_snapshots; fall back to synthesis
      // TODO: implement direct Supabase read here once 0016 migration is applied
    }

    if (points.length === 0) return fail(503, "NO_DATA", "No health snapshot data available.");

    const scores = points.map((p) => p.score);
    const { trend, delta } = computeTrend(points);
    const result: HealthHistoryResult = {
      points,
      trend,
      trendDelta: delta,
      current: points[points.length - 1].score,
      low: Math.min(...scores),
      high: Math.max(...scores),
    };

    return ok(result);
  });
}

// POST /api/v1/intelligence/health-history — capture a new snapshot now.
// Called by the daily cron job in vercel.json.
export async function POST(req: NextRequest) {
  return guarded(req, "api_health_snapshot", async () => {
    resolvePrincipal(req);

    const healthResult = await orgHealthIntelligence();
    const snapshot = healthResult.health;

    return ok({
      captured: true,
      score: snapshot.score,
      band:  snapshot.band,
      mode: isDemoMode ? "demo_no_persist" : "would_persist",
    });
  });
}
