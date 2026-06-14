// ============================================================================
// DIZRUPT Intelligence Engine — generalized.
//
// Each domain of organizational intelligence is a PURE module (no DB, no React)
// of computations over the live graph. Callers import from this one engine so
// future intelligence plugs in here rather than spawning parallel systems.
//
//   import { capability } from "@/server/engine";
//   capability.capabilityHealth(nodes)
//
// Roadmap modules (CTO_REVIEW Tier 2/4) — same shape, same engine:
//   ✅ capability   — concentration, bus factor, succession, expertise, health
//   ⬜ dependency   — blast radius, cascading failure (over entity_relationships)
//   ⬜ decision     — lineage, impact, confidence drift (over decisions/approvals)
//   ⬜ risk         — propagation, concentration (over risks + relationships)
//   ⬜ orgHealth    — rollup of the above into one computed health signal
//   ⬜ simulation   — what-if over the graph (staffing/delay/loss/vendor)
//
// A module is just a namespace exporting pure functions; add `export * as x`
// below as each lands. The loaders (server/services) feed them live data.
// ============================================================================

export * as capability from "./capability-intelligence";
export * as people from "./people-intelligence";
export * as decision from "./decision-intelligence";
export * as orgMemory from "./org-memory";
export * as dependency from "./dependency-intelligence";
export * as risk from "./risk-intelligence";
export * as orgHealth from "./org-health";
export * as simulation from "./simulation";
export * as outcome from "./outcome-intelligence";
export * as learning from "./learning-intelligence";
export * as recommendations from "./recommendations";
export * as lifecycle from "./recommendation-lifecycle";
export * as calibration from "./calibration";
export * as narratives from "./narratives";
export * as copilot from "./copilot";
