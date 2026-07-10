// Structured JSON logger — compatible with Datadog / CloudWatch / Loki.
// Use this instead of raw console.error/console.log in API routes.

type Level = "info" | "warn" | "error" | "debug";

export function log(level: Level, msg: string, meta?: Record<string, unknown>): void {
  const entry = { level, msg, ts: Date.now(), ...meta };
  if (level === "error") console.error(JSON.stringify(entry));
  else if (level === "warn") console.warn(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}
