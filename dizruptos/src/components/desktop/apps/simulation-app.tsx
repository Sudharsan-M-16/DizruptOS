"use client";

// Monte Carlo What-If Simulation — native OS window.
// Lets any user with view_executive or manager-level access run probabilistic
// scenario modelling (budget cuts, departure waves, scope expansion, market
// shocks) against the live org data and see p5-p95 percentile outcomes.

import { memo, useState, useCallback } from "react";
import { Activity, AlertTriangle, BarChart3, CheckCircle, Clock, Loader2, Play, TrendingDown, TrendingUp, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOps } from "@/lib/store";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
type ScenarioType = "budget_cut" | "departure_wave" | "scope_expansion" | "market_shock";

interface PercentileResult {
  p5: number; p25: number; p50: number; p75: number; p95: number;
  mean: number; std: number;
}

interface SimResult {
  scenario: ScenarioType;
  iterations: number;
  outcomes: {
    healthImpact: PercentileResult;
    capacityRisk: PercentileResult;
    capabilityLoss: PercentileResult;
    timeToRecover: PercentileResult;
  };
  riskFlags: string[];
  recommendation: string;
  confidenceInterval: { lower: number; upper: number; confidence: number };
}

interface SavedRun {
  id: string;
  scenario: ScenarioType;
  scenarioLabel: string;
  params: Record<string, number>;
  iterations: number;
  result: SimResult;
  timestamp: number;
}

const SIM_HISTORY_KEY = "dz-simulation-history";
const MAX_SAVED_RUNS = 10;

function loadSavedRuns(): SavedRun[] {
  try {
    const raw = localStorage.getItem(SIM_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSavedRuns(runs: SavedRun[]) {
  try { localStorage.setItem(SIM_HISTORY_KEY, JSON.stringify(runs.slice(-MAX_SAVED_RUNS))); } catch { /* storage full */ }
}

/* ------------------------------------------------------------------ */
/* Scenario catalogue                                                   */
/* ------------------------------------------------------------------ */
interface ScenarioDef {
  type: ScenarioType;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
  paramDefs: {
    key: string;
    label: string;
    min: number; max: number; step: number; default: number;
    format: (v: number) => string;
    apiPath: string; // how it maps into params object
    isMean?: boolean; // whether this wraps into { mean, std }
    stdRatio?: number; // default std as ratio of mean
  }[];
}

const SCENARIOS: ScenarioDef[] = [
  {
    type: "budget_cut",
    label: "Budget Cut",
    icon: TrendingDown,
    color: "#EF4444",
    description: "Model the impact of a budget reduction on org health, capacity, and capabilities.",
    paramDefs: [{
      key: "severity",
      label: "Budget Reduction",
      min: 5, max: 60, step: 1, default: 20,
      format: (v) => `${v}%`,
      apiPath: "budgetCutPct",
      isMean: true, stdRatio: 0.25,
    }],
  },
  {
    type: "departure_wave",
    label: "Departure Wave",
    icon: Users,
    color: "#F97316",
    description: "Simulate a wave of voluntary departures and the downstream capacity collapse.",
    paramDefs: [{
      key: "probability",
      label: "Departure Probability",
      min: 5, max: 50, step: 1, default: 15,
      format: (v) => `${v}% per person`,
      apiPath: "departureProbability",
    }],
  },
  {
    type: "scope_expansion",
    label: "Scope Expansion",
    icon: TrendingUp,
    color: "#7C6CFF",
    description: "What-if new initiatives land — how many new FTEs are needed, and what breaks?",
    paramDefs: [{
      key: "newFte",
      label: "New FTEs Required",
      min: 1, max: 20, step: 1, default: 3,
      format: (v) => `${v} FTEs`,
      apiPath: "newFteNeeded",
      isMean: true, stdRatio: 0.4,
    }],
  },
  {
    type: "market_shock",
    label: "Market Shock",
    icon: Zap,
    color: "#FEBC2E",
    description: "Model an external market event that reduces delivery velocity across the org.",
    paramDefs: [{
      key: "velocityImpact",
      label: "Velocity Reduction",
      min: 10, max: 80, step: 5, default: 40,
      format: (v) => `${v}%`,
      apiPath: "velocityImpact",
      isMean: true, stdRatio: 0.25,
    }],
  },
];

/* ------------------------------------------------------------------ */
/* Percentile bar                                                       */
/* ------------------------------------------------------------------ */
function PercentileBar({ result, label, color, format }: {
  result: PercentileResult;
  label: string;
  color: string;
  format: (v: number) => string;
}) {
  const max = result.p95 * 1.1 || 1;
  const pct = (v: number) => `${Math.round((v / max) * 100)}%`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-muted">{label}</span>
        <span className="font-mono text-[13px] font-semibold" style={{ color }}>
          {format(result.p50)} <span className="text-[10px] font-normal text-fg-muted">median</span>
        </span>
      </div>
      {/* p5 → p95 range track */}
      <div className="relative h-5 rounded-full bg-fg-muted/10">
        {/* p25–p75 IQR band */}
        <div
          className="absolute top-0 h-full rounded-full opacity-60"
          style={{
            left: pct(result.p25),
            width: `calc(${pct(result.p75)} - ${pct(result.p25)})`,
            background: color,
          }}
        />
        {/* p5–p95 outer band */}
        <div
          className="absolute top-1.5 h-2 rounded-full opacity-25"
          style={{
            left: pct(result.p5),
            width: `calc(${pct(result.p95)} - ${pct(result.p5)})`,
            background: color,
          }}
        />
        {/* median tick */}
        <div
          className="absolute top-0.5 h-4 w-0.5 rounded-full"
          style={{ left: pct(result.p50), background: color }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-fg-muted/60 font-mono">
        <span>p5 {format(result.p5)}</span>
        <span>p50 {format(result.p50)}</span>
        <span>p95 {format(result.p95)}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */
export const SimulationApp = memo(function SimulationApp() {
  const [selectedType, setSelectedType] = useState<ScenarioType>("budget_cut");
  const [params, setParams] = useState<Record<string, number>>(() =>
    Object.fromEntries(SCENARIOS.flatMap((s) => s.paramDefs.map((p) => [s.type + "_" + p.key, p.default])))
  );
  const [iterations, setIterations] = useState(500);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>(() => loadSavedRuns());
  const [showHistory, setShowHistory] = useState(false);
  const addNotification = useOps((s) => s.addNotification);

  const scenario = SCENARIOS.find((s) => s.type === selectedType)!;
  const Icon = scenario.icon;

  // Reality check: warn if scope expansion FTE count is unrealistic
  const scopeExpFTEs = selectedType === "scope_expansion" ? (params["scope_expansion_newFTEs"] ?? 3) : 0;
  const showRealityWarning = selectedType === "scope_expansion" && scopeExpFTEs > 11; // >50% of ~22 org

  const runSim = useCallback(async () => {
    setRunning(true);
    setError(null);

    // Build params object from current slider values
    const apiParams: Record<string, unknown> = {};
    for (const def of scenario.paramDefs) {
      const val = (params[selectedType + "_" + def.key] ?? def.default) / (def.format(1).includes("%") ? 100 : 1);
      if (def.isMean) {
        apiParams[def.apiPath] = { mean: val, std: val * (def.stdRatio ?? 0.25) };
      } else {
        apiParams[def.apiPath] = val;
      }
    }

    try {
      const res = await fetch("/api/v1/simulation/monte-carlo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedType, iterations, params: apiParams }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Simulation failed");
      const simResult: SimResult = data.data ?? data;
      setResult(simResult);
      // Save to history
      const run: SavedRun = {
        id: `run-${Date.now()}`,
        scenario: selectedType,
        scenarioLabel: scenario.label,
        params: { ...params },
        iterations,
        result: simResult,
        timestamp: Date.now(),
      };
      setSavedRuns((prev) => {
        const updated = [...prev, run].slice(-MAX_SAVED_RUNS);
        saveSavedRuns(updated);
        return updated;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setRunning(false);
    }
  }, [selectedType, params, iterations, scenario]);

  const severityColor = result
    ? result.outcomes.healthImpact.p50 > 25 ? "#EF4444"
    : result.outcomes.healthImpact.p50 > 12 ? "#F97316"
    : "#10B981"
    : scenario.color;

  const createProposalFromResult = useCallback(() => {
    if (!result) return;
    const label = SCENARIOS.find((s) => s.type === result.scenario)?.label ?? result.scenario;
    addNotification({
      id: `sim-${Date.now()}`,
      klass: "intelligence",
      title: `Simulation: ${label} risk flags`,
      body: result.recommendation,
      at: new Date().toISOString(),
      read: false,
    });
    // Open the Agent Inbox to review
    const ev = new CustomEvent("dizrupt:launch", { detail: { id: "r-proposals" } });
    window.dispatchEvent(ev);
    try { window.parent?.dispatchEvent(ev); } catch { /* cross-origin */ }
  }, [result, addNotification]);

  return (
    <div className="relative flex h-full flex-col bg-ink text-fg">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-line px-5 py-3">
        <Activity size={16} style={{ color: "var(--os-accent,#00ED82)" }} />
        <span className="text-[13px] font-semibold">What-If Simulation</span>
        <span className="ml-auto font-mono text-[11px] text-fg-muted">Monte Carlo · {iterations} iterations</span>
        {savedRuns.length > 0 && (
          <button
            onClick={() => setShowHistory((v) => !v)}
            aria-pressed={showHistory}
            className={cn("flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors", showHistory ? "border-brand/40 bg-brand/10 text-brand" : "border-line text-fg-muted hover:text-fg")}
          >
            <Clock size={11} /> History ({savedRuns.length})
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ── Left: scenario selector + controls ── */}
        <aside className="flex w-72 flex-shrink-0 flex-col border-r border-line overflow-y-auto">
          {/* scenario picker */}
          <div className="border-b border-line p-4">
            <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-fg-muted">Scenario</p>
            <div className="space-y-1">
              {SCENARIOS.map((s) => {
                const SIcon = s.icon;
                const active = s.type === selectedType;
                return (
                  <button
                    key={s.type}
                    onClick={() => { setSelectedType(s.type); setResult(null); setError(null); }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-100",
                      active ? "bg-ink-surface shadow-sm" : "hover:bg-ink-surface/60"
                    )}
                    style={active ? { boxShadow: `inset 0 0 0 1px ${s.color}33` } : {}}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: s.color + "22" }}
                    >
                      <SIcon size={14} style={{ color: s.color }} />
                    </span>
                    <span className="text-[13px] font-medium" style={active ? { color: s.color } : {}}>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* parameters */}
          <div className="border-b border-line p-4">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-fg-muted">Parameters</p>
            <p className="mb-3 text-[12px] leading-relaxed text-fg-muted">{scenario.description}</p>

            {scenario.paramDefs.map((def) => {
              const key = selectedType + "_" + def.key;
              const labelId = `sim-label-${def.key}`;
              const val = params[key] ?? def.default;
              return (
                <div key={def.key} className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <label id={labelId} className="text-[12px] font-medium text-fg">{def.label}</label>
                    <span className="font-mono text-[13px] font-semibold" style={{ color: scenario.color }}>
                      {def.format(val)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={def.min} max={def.max} step={def.step}
                    value={val}
                    onChange={(e) => setParams((p) => ({ ...p, [key]: Number(e.target.value) }))}
                    aria-labelledby={labelId}
                    className="w-full accent-current"
                    style={{ accentColor: scenario.color }}
                  />
                  <div className="flex justify-between text-[10px] text-fg-muted/60">
                    <span>{def.format(def.min)}</span>
                    <span>{def.format(def.max)}</span>
                  </div>
                </div>
              );
            })}

            {/* iterations */}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-baseline justify-between">
                <label id="sim-label-iterations" className="text-[12px] font-medium text-fg">Iterations</label>
                <span className="font-mono text-[12px] text-fg-muted">{iterations.toLocaleString()}</span>
              </div>
              <input
                type="range" min={100} max={2000} step={100}
                value={iterations}
                onChange={(e) => setIterations(Number(e.target.value))}
                aria-labelledby="sim-label-iterations"
                className="w-full"
                style={{ accentColor: scenario.color }}
              />
            </div>
          </div>

          {/* reality check warning */}
          {showRealityWarning && (
            <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg border border-warn/20 bg-warn/5 px-3 py-2 text-[11px] leading-relaxed text-warn">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              Adding {scopeExpFTEs} FTEs exceeds 50% org growth — estimates may be unreliable for orgs of this size.
            </div>
          )}

          {/* run button */}
          <div className="p-4">
            <button
              onClick={runSim}
              disabled={running}
              aria-label={running ? "Simulation running…" : "Run simulation"}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
              style={{ background: scenario.color }}
            >
              <span aria-live="polite" aria-atomic="true" className="flex items-center gap-2">
                {running
                  ? <><Loader2 size={14} className="animate-spin" /> Running…</>
                  : <><Play size={14} /> Run Simulation</>}
              </span>
            </button>
          </div>
        </aside>

        {/* ── Right: results ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {!result && !running && !error && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: scenario.color + "1a" }}
              >
                <Icon size={28} style={{ color: scenario.color }} />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-fg">{scenario.label}</p>
                <p className="mt-1 max-w-xs text-[13px] text-fg-muted">{scenario.description}</p>
              </div>
              <button
                onClick={runSim}
                className="mt-2 flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-110"
                style={{ background: scenario.color }}
              >
                <Play size={13} /> Run Simulation
              </button>
            </div>
          )}

          {running && (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="animate-spin" style={{ color: scenario.color }} />
              <p className="text-[14px] text-fg-muted">Running {iterations.toLocaleString()} iterations…</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-5">
              <div className="flex items-center gap-2.5 text-danger">
                <AlertTriangle size={16} />
                <span className="font-semibold">Simulation Failed</span>
              </div>
              <p className="mt-2 text-[13px] text-fg-muted">{error}</p>
              <button
                onClick={runSim}
                className="mt-3 flex items-center gap-2 rounded-lg bg-danger/10 px-4 py-2 text-[12px] font-medium text-danger"
              >
                <Play size={12} /> Retry
              </button>
            </div>
          )}

          {result && !running && (
            <div className="space-y-6">
              {/* headline */}
              <div
                className="flex items-start gap-4 rounded-xl border p-5"
                style={{ borderColor: severityColor + "33", background: severityColor + "0a" }}
              >
                <BarChart3 size={22} style={{ color: severityColor }} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[15px] font-semibold" style={{ color: severityColor }}>
                      {SCENARIOS.find((s) => s.type === result.scenario)?.label}
                    </span>
                    <span className="text-[12px] text-fg-muted">— {result.iterations.toLocaleString()} iterations</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-fg">{result.recommendation}</p>
                  <p className="mt-1.5 font-mono text-[11px] text-fg-muted">
                    95% CI: [{result.confidenceInterval.lower.toFixed(1)}, {result.confidenceInterval.upper.toFixed(1)}] pts health impact
                  </p>
                </div>
              </div>

              {/* percentile charts */}
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">Outcome Distribution</p>
                <div className="grid gap-5">
                  <PercentileBar
                    result={result.outcomes.healthImpact}
                    label="Org Health Impact (points lost)"
                    color={severityColor}
                    format={(v) => `${v.toFixed(1)} pts`}
                  />
                  <PercentileBar
                    result={result.outcomes.capacityRisk}
                    label="Team Overload Rate"
                    color="#F97316"
                    format={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <PercentileBar
                    result={result.outcomes.capabilityLoss}
                    label="Capability Degradation"
                    color="#7C6CFF"
                    format={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <PercentileBar
                    result={result.outcomes.timeToRecover}
                    label="Time to Recover"
                    color="#2BD9FF"
                    format={(v) => `${v.toFixed(0)} wks`}
                  />
                </div>
                <p className="mt-3 text-[10px] text-fg-muted italic">
                  Estimates based on industry benchmarks (Gartner 2023, McKinsey 2022). Indicative only — validate against your org baseline.
                </p>
              </div>

              {/* risk flags */}
              {result.riskFlags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">Risk Flags</p>
                  {result.riskFlags.map((flag, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-lg border border-danger/15 bg-danger/5 px-3.5 py-2.5 text-[12px] leading-relaxed text-danger">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                      {flag}
                    </div>
                  ))}
                </div>
              )}

              {result.riskFlags.length === 0 && (
                <div className="flex items-center gap-2.5 rounded-lg border border-ok/15 bg-ok/5 px-3.5 py-2.5 text-[13px] text-ok">
                  <CheckCircle size={14} />
                  No critical risk flags triggered in this scenario.
                </div>
              )}

              {/* Create proposal CTA for flagged scenarios */}
              {result.riskFlags.length > 0 && (
                <button
                  onClick={createProposalFromResult}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand/30 bg-brand/10 px-4 py-2.5 text-[12px] font-semibold text-brand transition-all hover:bg-brand/20"
                >
                  Create Proposal from this Scenario
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* History panel */}
      {showHistory && savedRuns.length > 0 && (
        <div className="absolute inset-y-0 right-0 z-10 flex w-72 flex-col border-l border-line bg-ink-elevated shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-[12px] font-semibold text-fg">Run History</span>
            <button onClick={() => setShowHistory(false)} aria-label="Close history" className="text-fg-muted hover:text-fg">×</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {[...savedRuns].reverse().map((run) => {
              const runScenario = SCENARIOS.find((s) => s.type === run.scenario);
              const RunIcon = runScenario?.icon ?? Activity;
              const healthP50 = run.result.outcomes.healthImpact.p50;
              const severity = healthP50 > 25 ? "#EF4444" : healthP50 > 12 ? "#F97316" : "#10B981";
              return (
                <button
                  key={run.id}
                  onClick={() => { setSelectedType(run.scenario); setParams(run.params); setIterations(run.iterations); setResult(run.result); setShowHistory(false); }}
                  className="flex w-full items-start gap-3 border-b border-line-subtle px-4 py-3 text-left transition-colors hover:bg-ink-surface"
                >
                  <span className="mt-0.5 rounded-lg p-1.5" style={{ background: `${runScenario?.color ?? "#888"}1a`, color: runScenario?.color }}>
                    <RunIcon size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold text-fg">{run.scenarioLabel}</div>
                    <div className="font-mono text-[10px] text-fg-muted">{new Date(run.timestamp).toLocaleTimeString()}</div>
                  </div>
                  <span className="font-mono text-[12px] font-bold" style={{ color: severity }}>
                    {healthP50.toFixed(1)}pts
                  </span>
                </button>
              );
            })}
          </div>
          <div className="border-t border-line p-3">
            <button
              onClick={() => { setSavedRuns([]); saveSavedRuns([]); setShowHistory(false); }}
              className="w-full rounded-lg border border-line py-1.5 text-[11px] text-fg-muted hover:text-fg"
            >
              Clear history
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
