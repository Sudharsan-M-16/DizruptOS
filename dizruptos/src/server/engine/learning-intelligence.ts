// Computation Engine — Learning Intelligence.
//
// Aggregates learnings + retrospectives into reusable organizational knowledge:
// repeated successes/mistakes, and lessons grouped by capability / project /
// governance. Pure; shared contract.

export interface LearningNode {
  id: string;
  title: string;
  insight: string;
  decisionId?: string | null;
  capabilityId?: string | null;
  capabilityName?: string | null;
  projectId?: string | null;
  /** hindsight of the decision this learning came from */
  hindsight?: "validated" | "mixed" | "misjudged" | "too_early";
}

export interface LearningIntelligence {
  total: number;
  reusable: { title: string; insight: string }[]; // from validated decisions
  repeatedMistakes: { theme: string; count: number }[]; // misjudged learnings sharing a capability
  repeatedSuccesses: { theme: string; count: number }[];
  capabilityLessons: Record<string, string[]>; // capability → learning titles
  explanation: string;
}

export function analyzeLearnings(learnings: LearningNode[]): LearningIntelligence {
  const reusable = learnings
    .filter((l) => l.hindsight === "validated")
    .map((l) => ({ title: l.title, insight: l.insight }));

  const byCapability: Record<string, string[]> = {};
  for (const l of learnings) {
    const key = l.capabilityName ?? l.capabilityId;
    if (key) (byCapability[key] ??= []).push(l.title);
  }

  const themeCount = (hindsight: LearningNode["hindsight"]) => {
    const m = new Map<string, number>();
    for (const l of learnings.filter((x) => x.hindsight === hindsight)) {
      const k = l.capabilityName ?? "general";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].filter(([, c]) => c >= 1).map(([theme, count]) => ({ theme, count })).sort((a, b) => b.count - a.count);
  };

  return {
    total: learnings.length,
    reusable,
    repeatedMistakes: themeCount("misjudged"),
    repeatedSuccesses: themeCount("validated"),
    capabilityLessons: byCapability,
    explanation:
      learnings.length === 0
        ? "No learnings recorded yet — the organization has not closed any decision loops."
        : `${learnings.length} learning(s) captured; ${reusable.length} are reusable (from validated decisions). ` +
          (Object.keys(byCapability).length ? `Lessons concentrate around: ${Object.keys(byCapability).join(", ")}.` : ""),
  };
}
