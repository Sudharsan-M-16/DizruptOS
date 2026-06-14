// Readiness probe — distinct from /api/health (liveness). This one actually
// exercises the live backend: it asks the repository layer for a trivial read
// and reports degraded/unavailable if the dependency is down. Load balancers
// and uptime checks gate traffic on this; /api/health only proves the process
// is up.

import { NextResponse } from "next/server";
import { env, isDemoMode } from "@/lib/env";
import { getRepositories } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = performance.now();
  const checks: Record<string, { status: "ok" | "degraded" | "down"; ms?: number; detail?: string }> = {};

  // Backend reachability — a cheap real read through the repository seam.
  try {
    const t0 = performance.now();
    await getRepositories().capabilities.list();
    checks.backend = { status: "ok", ms: Math.round(performance.now() - t0) };
  } catch (err) {
    checks.backend = { status: "down", detail: String(err).slice(0, 120) };
  }

  const ready = Object.values(checks).every((c) => c.status === "ok");
  return NextResponse.json(
    {
      ready,
      mode: env.mode,
      backend: isDemoMode ? "memory" : "supabase",
      checks,
      ms: Math.round(performance.now() - started),
      ts: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 }
  );
}
