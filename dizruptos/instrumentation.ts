// Next.js instrumentation hook — called once at server startup.
// Registers OpenTelemetry SDK when the optional OTel packages are installed.
//
// To enable: npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
//            npm install @opentelemetry/exporter-trace-otlp-http
// Then set OTEL_EXPORTER_OTLP_ENDPOINT to your collector URL.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return; // only activate when configured

  try {
    // Dynamic imports so missing packages don't break the build.
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
          "@opentelemetry/instrumentation-fs": { enabled: false },
          "@opentelemetry/instrumentation-net": { enabled: false },
        }),
      ],
    });

    sdk.start();
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      level: "info",
      event: "otel_started",
      ctx: { endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT },
    }));

    process.on("SIGTERM", () => { sdk.shutdown().catch(console.error); });
  } catch {
    // OTel packages not installed — silently skip. The in-process metrics
    // in lib/telemetry.ts still collect; only the OTLP export is missing.
  }
}
