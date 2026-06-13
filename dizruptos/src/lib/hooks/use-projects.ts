"use client";

// Live projects read — the first vertical wired schema-authoritative end to end:
//   UI hook → /api/v1/projects → service → Supabase repository → projects table
//
// `LiveProject` mirrors the `projects` table 1:1 in camelCase (no synthesized
// fields — the DB is the source of truth). As the schema-authoritative
// migration proceeds, each entity gets a sibling hook on the same pattern.

import { useQuery } from "@tanstack/react-query";
import { apiGet, qk } from "@/lib/query";

/** snake_case row exactly as the `projects` table / PostgREST returns it. */
interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  department_id: string | null;
  owner_id: string | null;
  status: string;
  health_status: string;
  health_reasons: string[];
  budget_hours: number;
  consumed_hours: number;
  customer_id: string | null;
  created_at: string;
}

export interface LiveProject {
  id: string;
  name: string;
  description: string | null;
  departmentId: string | null;
  ownerId: string | null;
  status: string;
  healthStatus: string;
  healthReasons: string[];
  budgetHours: number;
  consumedHours: number;
  customerId: string | null;
  createdAt: string;
}

// 1:1 column → camelCase view. Not a second model: the shape, names, and types
// track the schema; this only restyles casing for the JS layer.
function toLiveProject(r: ProjectRow): LiveProject {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    departmentId: r.department_id,
    ownerId: r.owner_id,
    status: r.status,
    healthStatus: r.health_status,
    healthReasons: r.health_reasons ?? [],
    budgetHours: r.budget_hours,
    consumedHours: r.consumed_hours,
    customerId: r.customer_id,
    createdAt: r.created_at,
  };
}

export function useProjects() {
  return useQuery({
    queryKey: qk.projects.list(),
    queryFn: async () => (await apiGet<ProjectRow[]>("projects")).map(toLiveProject),
  });
}
