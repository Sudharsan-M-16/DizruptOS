// Structured logging — one chokepoint for every diagnostic event so the
// production swap (Sentry/OTel exporter) is a single-file change.

type Level = "debug" | "info" | "warn" | "error";

interface LogEvent {
  ts: string;
  level: Level;
  event: string;
  ctx?: Record<string, unknown>;
}

const emit = (level: Level, event: string, ctx?: Record<string, unknown>) => {
  const entry: LogEvent = { ts: new Date().toISOString(), level, event, ctx };
  // Single emission point. Production: also forward to telemetry transport.
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
};

export const log = {
  debug: (event: string, ctx?: Record<string, unknown>) => emit("debug", event, ctx),
  info: (event: string, ctx?: Record<string, unknown>) => emit("info", event, ctx),
  warn: (event: string, ctx?: Record<string, unknown>) => emit("warn", event, ctx),
  error: (event: string, ctx?: Record<string, unknown>) => emit("error", event, ctx),
};
