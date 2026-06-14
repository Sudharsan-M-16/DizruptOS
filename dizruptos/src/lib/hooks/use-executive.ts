"use client";

// Executive workspace data — live org-health + recommendations from the engines,
// via TanStack Query (cached). Powers the leadership operating console.

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/query";

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
export interface Recommendation {
  id: string;
  type: string;
  title: string;
  rationale: string;
  evidence: string[];
  priority: number;
  impact: Impact;
  traceTo: { kind: string; id: string; label: string };
}
export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: async () => (await apiGet<{ recommendations: Recommendation[] }>("recommendations")).recommendations,
  });
}
