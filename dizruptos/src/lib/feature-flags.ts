// Feature flags — runtime gate for progressive feature rollout.
// Flags default to true in demo mode; in production, infra-gated flags
// depend on env vars or DB per-tenant config (future: read from tenant_settings).
//
// Usage:
//   import { isEnabled } from "@/lib/feature-flags";
//   if (isEnabled("copilot")) { /* ... */ }

export type FeatureFlag =
  | "simulation"
  | "copilot"
  | "graph"
  | "health_history"
  | "data_export"
  | "scim"
  | "sso"
  | "realtime"
  | "betweenness_centrality"
  | "follow_up_suggestions";

// Evaluate flags at module initialization so repeated calls are O(1).
// Server-side: process.env is available. Client-side: only NEXT_PUBLIC_ vars.
const FLAGS: Record<FeatureFlag, boolean> = {
  // Always-on features
  simulation:              true,
  graph:                   true,
  realtime:                true,
  betweenness_centrality:  true,

  // Env-gated features
  copilot:                 typeof process !== "undefined" && !!process.env.ANTHROPIC_API_KEY,
  health_history:          true,
  data_export:             true,
  follow_up_suggestions:   true,

  // Enterprise features — on when configured
  scim:                    typeof process !== "undefined" && !!process.env.SCIM_TOKEN,
  sso:                     typeof process !== "undefined" && Object.keys(process.env).some((k) => k.startsWith("SSO_CONFIG_")),
};

/**
 * Check whether a feature flag is enabled.
 * @param flag - The feature flag name.
 * @param overrides - Optional per-call overrides (useful for per-tenant config).
 */
export function isEnabled(flag: FeatureFlag, overrides?: Partial<Record<FeatureFlag, boolean>>): boolean {
  if (overrides && flag in overrides) return overrides[flag]!;
  return FLAGS[flag] ?? false;
}

/** Return all currently enabled flags (for debug/health endpoints). */
export function enabledFlags(): FeatureFlag[] {
  return (Object.keys(FLAGS) as FeatureFlag[]).filter((f) => FLAGS[f]);
}

/** Return the full flag map (sanitized — no sensitive values). */
export function flagMap(): Record<FeatureFlag, boolean> {
  return { ...FLAGS };
}
