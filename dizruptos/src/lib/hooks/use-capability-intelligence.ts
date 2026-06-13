"use client";

// Live capability intelligence — TanStack Query over the computed API.
// Cached (staleTime 30s) so revisiting the surface is instant.

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/query";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface CapAnalysis {
  id: string;
  name: string;
  strategicImportance: RiskLevel;
  holderCount: number;
  busFactor: number;
  expertCount: number;
  concentration: number;
  topHolderShare: number;
  hasBackup: boolean;
  successionRisk: RiskLevel;
  fragile: boolean;
}
export interface Holder { userId: string; userName?: string; proficiency: number }
export interface ExpertView {
  capabilityId: string;
  capabilityName: string;
  primary: Holder | null;
  backups: Holder[];
  learners: Holder[];
}
export interface CapabilityIntelligence {
  health: { total: number; fragile: number; noBackup: number; strategicAtRisk: number; atRiskCapabilities: string[] };
  capabilities: CapAnalysis[];
  scarcity: { name: string; busFactor: number }[];
  backupCoverage: { covered: number; uncovered: number; pct: number };
  successionExposure: { userId: string; userName?: string; capabilities: string[] }[];
  experts: ExpertView[];
}

export function useCapabilityIntelligence() {
  return useQuery({
    queryKey: ["capabilities", "intelligence"],
    queryFn: () => apiGet<CapabilityIntelligence>("capabilities/intelligence"),
  });
}
