// Liveness/readiness probe. Production extends `checks` with Supabase
// connectivity, Realtime channel state, and worker heartbeat (PRD §29).

import { NextResponse } from "next/server";

const startedAt = Date.now();

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "dizruptos-web",
    version: process.env.npm_package_version ?? "0.1.0",
    uptime_s: Math.round((Date.now() - startedAt) / 1000),
    checks: {
      app: "ok",
      database: "not_configured", // becomes a Supabase ping in production
      realtime: "not_configured",
      ai: "not_configured",
    },
    ts: new Date().toISOString(),
  });
}
