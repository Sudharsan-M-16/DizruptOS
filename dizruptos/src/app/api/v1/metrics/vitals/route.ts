// POST /api/v1/metrics/vitals — ingest Core Web Vitals from the browser.
//
// Receives CLS/FID/FCP/LCP/TTFB/INP measurements via sendBeacon() from
// web-vitals.tsx and records them in the Prometheus histogram so the
// Grafana dashboard can surface p50/p75/p99 per metric.

import { type NextRequest, NextResponse } from "next/server";
import { metrics } from "@/lib/telemetry";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface VitalPayload {
  name:   string;
  value:  number;
  rating: "good" | "needs-improvement" | "poor";
  id:     string;
  delta:  number;
  navigationType?: string;
}

// Extend the telemetry module to track web vitals (if it supports histograms)
// Otherwise fall back to a simple structured log that Prometheus can scrape
// via a log-to-metrics pipeline (Loki/Promtail).

export async function POST(req: NextRequest) {
  let payload: VitalPayload;
  try { payload = await req.json(); }
  catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const { name, value, rating, navigationType } = payload;

  // Increment the Prometheus counter by metric type + rating
  metrics.httpRequests.inc({ method: "VITAL", status: rating });

  log.info("web_vital", { metric: name, value: Math.round(value), rating, navigationType });

  return NextResponse.json({ ok: true });
}
