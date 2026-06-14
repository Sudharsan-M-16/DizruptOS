// Computation Engine — Executive Narratives.
//
// Turns the computed intelligence into a written executive brief — the thing a
// leader reads, not a dashboard they decode. PURE: given the already-computed
// signals (health, recommendations, outcomes, learning, calibration), it
// composes a periodized narrative (weekly / monthly / quarterly) with a
// headline, the situation, what changed, what to do, and an accountability
// section ("are we getting smarter?"). No LLM — deterministic prose assembly
// over real numbers, so every sentence is grounded and reproducible.

export type Period = "weekly" | "monthly" | "quarterly";

export interface NarrativeInputs {
  period: Period;
  health: { score: number; band: string; topConcerns: string[] };
  recommendations: { title: string; impact: string; priority: number; status: string }[];
  acted: { title: string; status: string }[];          // recently accepted/completed/measured
  calibration: { avgAccuracy: number | null; avgCalibrationGap: number | null; observed: number; trend: string };
  outcomes: { measured: number; avgSuccessScore: number | null; failing: number };
  learning: { reusableCount: number; repeatedMistakes: { theme: string; count: number }[] };
  risks: { title: string; band: string }[];
}

export interface NarrativeSection {
  heading: string;
  body: string;
  bullets?: string[];
}

export interface ExecutiveNarrative {
  period: Period;
  title: string;
  headline: string;          // one-sentence state of the org
  sections: NarrativeSection[];
  confidence: string;        // self-assessment of how grounded this brief is
}

const PERIOD_LABEL: Record<Period, string> = {
  weekly: "Weekly Executive Brief",
  monthly: "Monthly Organizational Review",
  quarterly: "Quarterly Strategic Review",
};

const PERIOD_WINDOW: Record<Period, string> = {
  weekly: "this week", monthly: "this month", quarterly: "this quarter",
};

function pct(n: number | null | undefined) {
  return n == null ? "—" : `${Math.round(n * 100)}%`;
}

export function composeNarrative(i: NarrativeInputs): ExecutiveNarrative {
  const window = PERIOD_WINDOW[i.period];
  const topRec = [...i.recommendations].sort((a, b) => b.priority - a.priority)[0];
  const criticalRecs = i.recommendations.filter((r) => r.impact === "critical" || r.impact === "high");
  const openCritical = criticalRecs.filter((r) => r.status === "pending" || r.status === "acknowledged");

  // Headline — the single sentence a busy executive will actually read.
  const headline =
    i.health.score >= 80
      ? `The organization is healthy (${i.health.score}/100); the work ${window} is compounding advantage, not fighting fires.`
      : i.health.score >= 65
        ? `The organization is steady (${i.health.score}/100) but carries ${openCritical.length} unresolved high-impact exposure${openCritical.length === 1 ? "" : "s"}.`
        : i.health.score >= 50
          ? `The organization is strained (${i.health.score}/100); ${i.health.topConcerns[0] ?? "concentration risk"} is the dominant pressure.`
          : `The organization is at risk (${i.health.score}/100) — ${i.health.topConcerns.slice(0, 2).join(" and ") || "multiple signals"} need leadership attention now.`;

  const sections: NarrativeSection[] = [];

  // 1. The situation
  sections.push({
    heading: "The situation",
    body:
      `Organizational health is ${i.health.score}/100 (${i.health.band}), computed from the live graph rather than surveyed. ` +
      (i.health.topConcerns.length
        ? `The signals carrying the most weight right now are ${i.health.topConcerns.join(", ")}.`
        : `No single signal dominates — the org is broadly balanced.`),
    bullets: i.health.topConcerns.length ? i.health.topConcerns : undefined,
  });

  // 2. What changed
  sections.push({
    heading: "What changed",
    body: i.acted.length
      ? `${i.acted.length} recommendation${i.acted.length === 1 ? " was" : "s were"} acted on ${window}. The loop is moving: advice is being committed to, not just generated.`
      : `Nothing was acted on ${window} — the recommendation queue is unchanged. Intelligence without action does not compound.`,
    bullets: i.acted.slice(0, 5).map((a) => `${a.title} → ${a.status}`),
  });

  // 3. What to do next
  sections.push({
    heading: "What to do next",
    body: topRec
      ? `The highest-leverage action is "${topRec.title}" (${topRec.impact} impact). ` +
        (openCritical.length > 1 ? `${openCritical.length} high-impact recommendations remain open and unacknowledged.` : `Most high-impact exposures are already in motion.`)
      : `No active recommendations — nothing urgent competes for leadership attention ${window}.`,
    bullets: criticalRecs.slice(0, 5).map((r) => `[${r.impact}] ${r.title} — ${r.status}`),
  });

  // 4. Top risks (monthly/quarterly carry the risk register; weekly stays tight)
  if (i.period !== "weekly" && i.risks.length) {
    sections.push({
      heading: "Risk posture",
      body: `${i.risks.length} risk${i.risks.length === 1 ? "" : "s"} are tracked, dependency-adjusted. The most severe is "${i.risks[0].title}" (${i.risks[0].band}).`,
      bullets: i.risks.slice(0, 5).map((r) => `${r.title} — ${r.band}`),
    });
  }

  // 5. Are we getting smarter? — the accountability section (the differentiator)
  const smarter =
    i.calibration.observed === 0
      ? `No predictions have resolved yet, so calibration is unknown. The org is generating intelligence but has not yet proven it predicts reality.`
      : `Across ${i.calibration.observed} resolved prediction${i.calibration.observed === 1 ? "" : "s"}, recommendation accuracy is ${pct(i.calibration.avgAccuracy)} ` +
        `with a calibration gap of ${pct(i.calibration.avgCalibrationGap)} (0 = perfectly calibrated). ` +
        (i.calibration.trend === "improving" ? "The trend is improving — the organization is getting smarter." :
         i.calibration.trend === "declining" ? "The trend is declining — recent predictions are missing more often." :
         "The trend is flat.") +
        (i.outcomes.failing > 0 ? ` ${i.outcomes.failing} decision outcome${i.outcomes.failing === 1 ? "" : "s"} failed and ${i.outcomes.failing === 1 ? "is" : "are"} worth a retrospective.` : "");
  sections.push({
    heading: "Are we getting smarter?",
    body: smarter,
    bullets: i.learning.repeatedMistakes.length
      ? i.learning.repeatedMistakes.map((m) => `Repeated mistake theme: ${m.theme} (×${m.count})`)
      : undefined,
  });

  const confidence =
    i.calibration.observed >= 5
      ? `High — this brief rests on ${i.calibration.observed} resolved predictions and live graph signals.`
      : i.calibration.observed >= 1
        ? `Moderate — only ${i.calibration.observed} prediction(s) have resolved; the accuracy numbers will firm up as more outcomes land.`
        : `Provisional — no predictions have resolved yet; the situation is grounded but the "are we right?" section is not yet backed by data.`;

  return {
    period: i.period,
    title: PERIOD_LABEL[i.period],
    headline,
    sections,
    confidence,
  };
}
