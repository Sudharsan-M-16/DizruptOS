// OpenTelemetry instrumentation — single entry point so the production swap
// (Honeycomb / Grafana / Datadog exporter) is a one-line config change.
//
// Usage: import { tracer, meter, withSpan } from "@/lib/telemetry"
//
// In Next.js we rely on the `instrumentation.ts` hook to register the SDK once
// at process start (see instrumentation.ts in the project root).

export interface Span {
  setAttributes(attrs: Record<string, string | number | boolean>): void;
  setStatus(status: "ok" | "error", message?: string): void;
  end(): void;
}

// ---------------------------------------------------------------------------
// Lightweight shim — the real OTel SDK is registered server-side in
// instrumentation.ts. This module provides a typesafe facade that:
//   • calls the real SDK when available (production)
//   • falls back to console + noop spans in demo/test mode
// ---------------------------------------------------------------------------

type OTelSpan = { setAttribute(k: string, v: unknown): void; setStatus(s: { code: number; message?: string }): void; end(): void };
type OTelTracer = { startActiveSpan<T>(name: string, fn: (span: OTelSpan) => T): T };

function getOTelTracer(): OTelTracer | null {
  try {
    // eslint-disable-next-line
    const { trace } = require("@opentelemetry/api");
    return trace.getTracer("dizruptos", process.env.npm_package_version ?? "0.0.0");
  } catch {
    return null;
  }
}

// Singleton — resolved once per process.
let _tracer: OTelTracer | null | undefined = undefined;
function tracer(): OTelTracer | null {
  if (_tracer === undefined) _tracer = getOTelTracer();
  return _tracer;
}

/** Wrap a block in a named span. Attributes can be set via the returned setter. */
export async function withSpan<T>(
  name: string,
  attrs: Record<string, string | number | boolean>,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const t = tracer();
  if (!t) {
    // Noop path — demo / test.
    const noop: Span = {
      setAttributes() {},
      setStatus() {},
      end() {},
    };
    return fn(noop);
  }

  return t.startActiveSpan(name, async (otelSpan) => {
    for (const [k, v] of Object.entries(attrs)) {
      otelSpan.setAttribute(k, v);
    }
    const span: Span = {
      setAttributes(a) { Object.entries(a).forEach(([k, v]) => otelSpan.setAttribute(k, v)); },
      setStatus(s, msg) { otelSpan.setStatus({ code: s === "ok" ? 1 : 2, message: msg }); },
      end() { otelSpan.end(); },
    };
    try {
      const result = await fn(span);
      span.setStatus("ok");
      return result;
    } catch (err) {
      span.setStatus("error", String(err));
      throw err;
    } finally {
      span.end();
    }
  });
}

// ---------------------------------------------------------------------------
// In-process metrics store — lightweight Prometheus-compatible counters/histograms.
// Flushable to /api/v1/metrics in text/plain format.
// ---------------------------------------------------------------------------

interface Counter { name: string; help: string; labels: Record<string, Record<string, number>> }
interface Histogram { name: string; help: string; buckets: number[]; counts: number[]; sum: number; total: number }

const _counters = new Map<string, Counter>();
const _histograms = new Map<string, Histogram>();

export function counter(name: string, help: string) {
  if (!_counters.has(name)) _counters.set(name, { name, help, labels: {} });
  return {
    inc(labels: Record<string, string> = {}, by = 1) {
      const c = _counters.get(name)!;
      const key = JSON.stringify(labels);
      if (!c.labels[key]) c.labels[key] = { ...labels as unknown as Record<string, number>, __value: 0 };
      (c.labels[key] as Record<string, number>).__value += by;
    },
  };
}

export function histogram(name: string, help: string, buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]) {
  if (!_histograms.has(name)) {
    _histograms.set(name, { name, help, buckets, counts: new Array(buckets.length + 1).fill(0), sum: 0, total: 0 });
  }
  return {
    observe(value: number) {
      const h = _histograms.get(name)!;
      h.sum += value;
      h.total++;
      for (let i = 0; i < h.buckets.length; i++) {
        if (value <= h.buckets[i]) { h.counts[i]++; }
      }
      h.counts[h.buckets.length]++; // +Inf
    },
  };
}

/** Serialize all metrics in Prometheus text exposition format. */
export function prometheusText(): string {
  const lines: string[] = [];

  for (const c of _counters.values()) {
    lines.push(`# HELP ${c.name} ${c.help}`);
    lines.push(`# TYPE ${c.name} counter`);
    for (const [labelJson, vals] of Object.entries(c.labels)) {
      const labels = JSON.parse(labelJson) as Record<string, string>;
      const labelStr = Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(",");
      const value = (vals as Record<string, number>).__value;
      lines.push(`${c.name}{${labelStr}} ${value}`);
    }
  }

  for (const h of _histograms.values()) {
    lines.push(`# HELP ${h.name} ${h.help}`);
    lines.push(`# TYPE ${h.name} histogram`);
    let cumulative = 0;
    for (let i = 0; i < h.buckets.length; i++) {
      cumulative += h.counts[i];
      lines.push(`${h.name}_bucket{le="${h.buckets[i]}"} ${cumulative}`);
    }
    lines.push(`${h.name}_bucket{le="+Inf"} ${h.total}`);
    lines.push(`${h.name}_sum ${h.sum}`);
    lines.push(`${h.name}_count ${h.total}`);
  }

  return lines.join("\n") + "\n";
}

// Pre-defined app metrics.
export const metrics = {
  httpRequests: counter("http_requests_total", "Total HTTP requests"),
  httpDuration: histogram("http_request_duration_seconds", "HTTP request latency"),
  apiErrors: counter("api_errors_total", "Total API errors by route and code"),
  copilotQueries: counter("copilot_queries_total", "Copilot questions answered"),
  copilotLatency: histogram("copilot_latency_seconds", "Copilot response latency"),
  llmTokens: counter("llm_tokens_total", "LLM tokens consumed"),
  recommendationTransitions: counter("recommendation_transitions_total", "Recommendation lifecycle transitions"),
  authEvents: counter("auth_events_total", "Auth events (login/logout/error)"),
  importRows: counter("import_rows_total", "Rows ingested via import connectors"),
};
