// Liveness probe — responds in <200ms. Never hits the database.
// /api/health    → liveness (container orchestrator: is the process alive?)
// /api/ready     → readiness (load balancer: is the app ready to serve traffic?)
//
// See RFC 7807 for error details, and /api/v1/metrics for time-series.

import { type NextRequest, NextResponse } from "next/server";
import { env, isDemoMode } from "@/lib/env";
import { metrics } from "@/lib/telemetry";

const startedAt = Date.now();
let _buildInfo: { commit?: string; deployedAt?: string } | null = null;

function buildInfo() {
  if (!_buildInfo) {
    _buildInfo = {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? process.env.GIT_SHA?.slice(0, 8),
      deployedAt: process.env.VERCEL_GIT_COMMIT_SHA ? undefined : undefined,
    };
  }
  return _buildInfo;
}

export async function GET(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const uptimeSeconds = Math.round((Date.now() - startedAt) / 1000);
  metrics.httpRequests.inc({ route: "/api/health", method: "GET", status: "200" });

  const res = NextResponse.json({
    status: "ok",
    service: "dizruptos-web",
    mode: env.mode,
    version: process.env.npm_package_version ?? "0.1.0",
    uptime_s: uptimeSeconds,
    requestId,
    ...buildInfo(),
    checks: {
      app: "ok",
      database: isDemoMode ? "demo_in_memory" : "configured",
      realtime: isDemoMode ? "broadcast_channel" : "supabase_realtime",
      ai_copilot: process.env.GEMINI_API_KEY ? "llm_enhanced" : "deterministic",
      scim: process.env.SCIM_TOKEN ? "token_configured" : "open_demo",
      sso: Object.keys(process.env).some((k) => k.startsWith("SSO_CONFIG_")) ? "configured" : "not_configured",
      metrics: "ok",
    },
    capabilities: {
      auth: ["magic_link", "google_oauth", "microsoft_oauth", ...(process.env.GEMINI_API_KEY ? [] : []), "demo_personas"],
      enterprise: [
        "saml_sso_scaffold",
        "scim_2_0_provisioning",
        "rbac_3_layer",
        "audit_trail",
        "idle_auto_lock",
        ...(Object.keys(process.env).some((k) => k.startsWith("SSO_CONFIG_")) ? ["sso_active"] : []),
      ],
      intelligence: ["capability", "dependency", "risk", "org_health", "simulation", "monte_carlo", "learning_loop", "narratives", "copilot"],
      graph: ["bfs_traversal", "betweenness_centrality", "dependency_hubs", "blast_radius"],
    },
    ts: new Date().toISOString(),
  });
  res.headers.set("X-Request-ID", requestId);
  return res;
}
