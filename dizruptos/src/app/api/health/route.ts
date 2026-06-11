// Liveness/readiness probe. Production extends `checks` with Supabase
// connectivity, Realtime channel state, and worker heartbeat (PRD §29).

import { NextResponse } from "next/server";
import { env, isDemoMode } from "@/lib/env";

const startedAt = Date.now();

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "dizruptos-web",
    mode: env.mode,
    version: process.env.npm_package_version ?? "0.1.0",
    uptime_s: Math.round((Date.now() - startedAt) / 1000),
    checks: {
      app: "ok",
      database: isDemoMode ? "demo_in_memory" : "configured", // production: live Supabase ping
      realtime: isDemoMode ? "broadcast_channel" : "configured",
      ai: process.env.ANTHROPIC_API_KEY ? "configured" : "deterministic_fallback",
    },
    ts: new Date().toISOString(),
  });
}
