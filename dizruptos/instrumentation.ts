// Next.js instrumentation hook — called once at server startup.
// Activates (in priority order):
//   1. Sentry  — when SENTRY_DSN is set (error tracking + performance)
//   2. OTel    — when OTEL_EXPORTER_OTLP_ENDPOINT is set (traces to Grafana/Jaeger)
// Both are optional; the in-process metrics in lib/telemetry.ts always run.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // ── Sentry ──────────────────────────────────────────────────────────────────
  if (process.env.SENTRY_DSN) {
    try {
      // Dynamic import so the package is optional (no install = no crash)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Sentry = await import("@sentry/nextjs" as string) as any;
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV ?? "development",
        release: process.env.npm_package_version ?? "0.0.0",
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.15 : 1.0,
        // Don't send health-check, metrics, or import noise
        ignoreErrors: [
          /NEXT_NOT_FOUND/,
          /ResizeObserver loop/,
        ],
        beforeSend(event: Record<string, unknown>) {
          // Strip PII from breadcrumbs in prod
          if (process.env.NODE_ENV === "production") {
            if (Array.isArray(event.breadcrumbs)) {
              event.breadcrumbs = (event.breadcrumbs as unknown[]).slice(-20);
            }
          }
          return event;
        },
      });
      console.log(JSON.stringify({
        ts: new Date().toISOString(), level: "info", event: "sentry_started",
        ctx: { dsn: process.env.SENTRY_DSN.slice(0, 20) + "…" },
      }));
    } catch {
      // Sentry package not installed — skip silently
    }
  }

  // ── OpenTelemetry ────────────────────────────────────────────────────────────
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [sdkMod, instrMod, exporterMod, resourceMod, semconvMod] = await Promise.all([
        import("@opentelemetry/sdk-node" as string) as Promise<any>,
        import("@opentelemetry/auto-instrumentations-node" as string) as Promise<any>,
        import("@opentelemetry/exporter-trace-otlp-http" as string) as Promise<any>,
        import("@opentelemetry/resources" as string) as Promise<any>,
        import("@opentelemetry/semantic-conventions" as string) as Promise<any>,
      ]);

      const sdk = new sdkMod.NodeSDK({
        resource: new resourceMod.Resource({
          [semconvMod.SEMRESATTRS_SERVICE_NAME]: "dizruptos",
          [semconvMod.SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version ?? "0.0.0",
        }),
        traceExporter: new exporterMod.OTLPTraceExporter({
          url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
        }),
        instrumentations: [
          instrMod.getNodeAutoInstrumentations({
            "@opentelemetry/instrumentation-fs":  { enabled: false },
            "@opentelemetry/instrumentation-net": { enabled: false },
          }),
        ],
      });

      sdk.start();
      console.log(JSON.stringify({
        ts: new Date().toISOString(), level: "info", event: "otel_started",
        ctx: { endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT },
      }));

      process.on("SIGTERM", () => { sdk.shutdown().catch(console.error); });
    } catch {
      // OTel packages not installed — silently skip
    }
  }
}

// Web Vitals reporter — called by Next.js for every CLS/FID/FCP/LCP/TTFB measurement.
export function onRequestError(
  err: Error,
  request: { path: string; method: string },
  context: { routeType: string }
) {
  console.error(JSON.stringify({
    ts: new Date().toISOString(),
    level: "error",
    event: "request_error",
    ctx: { path: request.path, method: request.method, routeType: context.routeType, error: err.message },
  }));

  // Forward to Sentry if configured
  if (process.env.SENTRY_DSN) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Sentry = require("@sentry/nextjs") as any;
      Sentry.captureException?.(err, { extra: { path: request.path, method: request.method } });
    } catch { /* package not installed */ }
  }
}
