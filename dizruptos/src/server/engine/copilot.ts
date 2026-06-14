// Executive Copilot — a GRAPH-GROUNDED advisor, not a chatbot. It maps a natural
// question to the right engine output and answers from real computed data with
// evidence + source. Deterministic (no LLM, no hallucination); an LLM can later
// phrase these answers, but the substance always comes from the graph/engines.

export interface CopilotContext {
  capabilities: { name: string; successionRisk: string; busFactor: number; fragile: boolean; strategicImportance: string }[];
  health: { score: number; band: string; topConcerns: string[] };
  recommendations: { title: string; rationale: string; impact: string; priority: number; evidence: string[] }[];
  succession: { userName?: string; capabilities: string[] }[];
  people: { name: string; orgDependencyScore: number; irreplaceable: boolean; successionRisk: string }[];
  risks: { title: string; band: string }[];
  /** Resolved on demand by the loader for "what if X leaves?" */
  departure?: { name: string; lost: string[]; weakened: string[]; explanation: string } | null;
}

export interface CopilotAnswer {
  question: string;
  intent: string;
  answer: string;
  evidence: string[];
  source: string; // which engine grounded it
}

const INTENTS: { intent: string; test: RegExp; run: (ctx: CopilotContext) => Omit<CopilotAnswer, "question" | "intent"> | null }[] = [
  {
    intent: "departure_impact",
    test: /what if .+ (leav|depart|quit|resign)|if .+ leaves/i,
    run: (c) => c.departure
      ? { answer: c.departure.explanation, evidence: [
          c.departure.lost.length ? `Lost: ${c.departure.lost.join(", ")}` : "No capability fully lost",
          c.departure.weakened.length ? `Weakened: ${c.departure.weakened.join(", ")}` : "None weakened",
        ], source: "simulation.simulateDeparture" }
      : { answer: "Name a person in the organization, e.g. \"what happens if Noor leaves?\".", evidence: [], source: "copilot" },
  },
  {
    intent: "highest_roi",
    test: /highest.*roi|what should i do|do next|priorit|recommend/i,
    run: (c) => {
      const r = c.recommendations[0];
      return r ? { answer: `Highest-ROI action: ${r.title}. ${r.rationale}`, evidence: r.evidence, source: "recommendations" }
        : { answer: "No active recommendations — nothing urgent.", evidence: [], source: "recommendations" };
    },
  },
  {
    intent: "fragile_capability",
    test: /fragile|weakest|most at risk capabilit|bus factor/i,
    run: (c) => {
      const f = c.capabilities.find((x) => x.fragile) ?? c.capabilities[0];
      return f ? { answer: `Most fragile capability: ${f.name} — bus factor ${f.busFactor}, ${f.successionRisk} succession risk, ${f.strategicImportance} importance.`,
        evidence: [`bus factor ${f.busFactor}`, `succession risk ${f.successionRisk}`], source: "capability-intelligence" } : null;
    },
  },
  {
    intent: "irreplaceable_person",
    test: /irreplaceable|single point of failure|most critical person|who.*can.?t lose/i,
    run: (c) => {
      const p = c.succession[0];
      return p ? { answer: `${p.userName} is the org's single point of failure — sole competent holder of ${p.capabilities.join(", ")}.`,
        evidence: [`sole holder of ${p.capabilities.length} strategic capabilit${p.capabilities.length === 1 ? "y" : "ies"}`], source: "people-intelligence" }
        : { answer: "No single points of failure detected — strategic capabilities have backups.", evidence: [], source: "people-intelligence" };
    },
  },
  {
    intent: "top_risk",
    test: /biggest risk|top risk|riskiest|what.*risk/i,
    run: (c) => {
      const r = c.risks[0];
      return r ? { answer: `Top risk: ${r.title} (${r.band}, dependency-adjusted).`, evidence: [`band ${r.band}`], source: "risk-intelligence" } : null;
    },
  },
  {
    intent: "focus_health",
    test: /focus|worry|worried|health|how are we|overall/i,
    run: (c) => ({
      answer: `Organizational health is ${c.health.score}/100 (${c.health.band}).` +
        (c.health.topConcerns.length ? ` Focus on: ${c.health.topConcerns.join(", ")}.` : " No single signal dominates."),
      evidence: c.health.topConcerns, source: "org-health",
    }),
  },
];

export function answer(question: string, ctx: CopilotContext): CopilotAnswer {
  for (const i of INTENTS) {
    if (i.test.test(question)) {
      const r = i.run(ctx);
      if (r) return { question, intent: i.intent, ...r };
    }
  }
  // default: lead with the worry list
  const h = INTENTS.find((x) => x.intent === "focus_health")!.run(ctx)!;
  return { question, intent: "focus_health", ...h };
}

/** Extract a candidate person name from a "what if X leaves" question. */
export function personFromQuestion(question: string, names: string[]): string | null {
  const q = question.toLowerCase();
  return names.find((n) => q.includes(n.toLowerCase()) || q.includes(n.split(" ")[0].toLowerCase())) ?? null;
}
