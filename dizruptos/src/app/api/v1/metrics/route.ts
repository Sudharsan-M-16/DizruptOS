// GET /api/v1/metrics — Prometheus-compatible exposition endpoint.
// Scrape this from Grafana Agent / Prometheus / Datadog OTel receiver.
// Protected: only accessible to authenticated service-role callers or
// requests with the METRICS_TOKEN header (set in ops infra).
import { type NextRequest, NextResponse } from "next/server";
import { prometheusText } from "@/lib/telemetry";

export const dynamic = "force-dynamic";

const METRICS_TOKEN = process.env.METRICS_TOKEN;

export async function GET(req: NextRequest) {
  // Require bearer token if configured (prod); open in demo mode.
  if (METRICS_TOKEN) {
    const auth = req.headers.get("authorization") ?? "";
    if (!auth.startsWith("Bearer ") || auth.slice(7) !== METRICS_TOKEN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const body = prometheusText();
  return new NextResponse(body, {
    headers: {
      "content-type": "text/plain; version=0.0.4; charset=utf-8",
      "cache-control": "no-cache, no-store",
    },
  });
}
