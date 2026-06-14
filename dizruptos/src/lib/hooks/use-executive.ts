"use client";

// Executive workspace data — live org-health + recommendations from the engines,
// via TanStack Query (cached). Powers the leadership operating console.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend } from "@/lib/query";

export interface OrgHealth {
  health: {
    score: number;
    band: "healthy" | "watch" | "strained" | "critical";
    drivers: { signal: string; value: number; weight: number; hurts: boolean }[];
    topConcerns: string[];
  };
  inputs: Record<string, number>;
}
export function useOrgHealth() {
  return useQuery({ queryKey: ["org-health"], queryFn: () => apiGet<OrgHealth>("org-health") });
}

export type Impact = "low" | "medium" | "high" | "critical";
export type RecStatus =
  | "pending" | "acknowledged" | "accepted" | "rejected" | "deferred" | "completed" | "measured";

export interface Recommendation {
  id: string;
  type: string;
  title: string;
  rationale: string;
  evidence: string[];
  priority: number;
  impact: Impact;
  traceTo: { kind: string; id: string; label: string };
  // lifecycle + closed-loop fields (migration 0010)
  status: RecStatus;
  confidence: number | null;
  baselineValue: number | null;
  expectedDelta: number | null;
  actualValue: number | null;
  accuracy: number | null;
  acceptedAt: string | null;
  measuredAt: string | null;
  nextStates: RecStatus[];
}
export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: async () => (await apiGet<{ recommendations: Recommendation[] }>("recommendations")).recommendations,
  });
}

/** Drive a recommendation through its lifecycle (accept/measure write back the
 *  prediction/outcome server-side). Invalidates the rec + learning surfaces. */
export function useRecommendationTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; to: RecStatus; confidence?: number; expectedDelta?: number; actualValue?: number; rationale?: string }) =>
      apiSend(`recommendations/${args.id}`, {
        to: args.to, confidence: args.confidence, expectedDelta: args.expectedDelta,
        actualValue: args.actualValue, rationale: args.rationale,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recommendations"] });
      qc.invalidateQueries({ queryKey: ["learning"] });
    },
  });
}

export interface LearningIntel {
  calibration: {
    total: number; observed: number;
    avgAccuracy: number | null; avgCalibrationGap: number | null;
    trend: "improving" | "declining" | "flat" | "insufficient_data";
    verdict: string;
    byKind: Record<string, { observed: number; avgAccuracy: number | null }>;
  };
  recommendationAccuracy: number | null;
  outcomes: { total: number; measured: number; avgSuccessScore: number | null; failing: number };
  learning: {
    total: number;
    reusable: { title: string; insight: string }[];
    repeatedMistakes: { theme: string; count: number }[];
    repeatedSuccesses: { theme: string; count: number }[];
    explanation: string;
  };
  lifecycle: { total: number; counts: Record<string, number>; accepted: number; measured: number };
  velocity: { measuredOfAccepted: number | null };
}
export function useLearning() {
  return useQuery({
    queryKey: ["learning"],
    queryFn: () => apiGet<LearningIntel>("intelligence/learning"),
  });
}

export type NarrativePeriod = "weekly" | "monthly" | "quarterly";
export interface ExecutiveNarrative {
  period: NarrativePeriod;
  title: string;
  headline: string;
  sections: { heading: string; body: string; bullets?: string[] }[];
  confidence: string;
}
export function useNarrative(period: NarrativePeriod) {
  return useQuery({
    queryKey: ["narrative", period],
    queryFn: () => apiGet<ExecutiveNarrative>(`intelligence/narrative?period=${period}`),
  });
}

export type AssumptionStatus = "holds" | "violated" | "unknown";
export type HypothesisStatus = "open" | "confirmed" | "refuted";
export interface MemoryDecision {
  analysis: {
    id: string; title: string; importance: number; confidence: number; blastRadius: number;
    evidenceQuality: number; risk: "low" | "medium" | "high" | "critical"; evidence: string[]; explanation: string;
  };
  memory: {
    decisionId: string; title: string; why: string;
    who: { ownerId?: string | null; approvers: string[] };
    evidence: string[];
    assumptions: { statement: string; status: AssumptionStatus; criticality: "low" | "medium" | "high" | "critical" }[];
    hypotheses: { statement: string; status: HypothesisStatus; confidence?: number | null }[];
    violatedAssumptions: string[];
    whatHappened: { status: string; detail: string }[];
    learned: string[];
    repeatRecommendation: "yes" | "yes_with_changes" | "no" | "too_early";
    lineage: string[];
    explanation: string;
  };
}
export interface MemoryIntel {
  decisions: MemoryDecision[];
  governance: { pending: number; approved: number; declined: number; ownershipConcentration: number; busiestApprover: string | null };
}
export function useMemory() {
  return useQuery({
    queryKey: ["memory"],
    queryFn: () => apiGet<MemoryIntel>("decisions/memory"),
  });
}
