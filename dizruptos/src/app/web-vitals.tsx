"use client";

// Web Vitals reporter — wires Next.js web-vitals reporting to the telemetry
// pipeline. Numbers are forwarded to:
//   1. /api/v1/metrics (Prometheus — if in production)
//   2. Sentry (if SENTRY_DSN is configured in the browser bundle)
//   3. console.debug (always, in development)
//
// Mounted in the root layout's <Providers> so it covers every page.

import { useReportWebVitals } from "next/web-vitals";

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Always log in development for DX
    if (process.env.NODE_ENV !== "production") {
      console.debug(
        `[WebVitals] ${metric.name}: ${metric.value.toFixed(1)}ms (${metric.rating})`
      );
    }

    // In production, POST to the analytics beacon
    if (process.env.NODE_ENV === "production") {
      const body = JSON.stringify({
        name:   metric.name,
        value:  metric.value,
        rating: metric.rating,
        id:     metric.id,
        delta:  metric.delta,
        navigationType: metric.navigationType,
      });
      // Use sendBeacon when available (non-blocking, survives page unload)
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/v1/metrics/vitals", body);
      } else {
        fetch("/api/v1/metrics/vitals", {
          method: "POST",
          body,
          keepalive: true,
          headers: { "Content-Type": "application/json" },
        }).catch(() => { /* non-critical */ });
      }
    }
  });

  return null;
}
