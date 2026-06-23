"use client";

// TanStack Query hooks for live Supabase data.
// Each hook seeds from the static lib/data.ts so the UI renders instantly,
// then hydrates with the API response (which includes any DB-persisted records).
// Mutations POST to the API and invalidate the affected query on success.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend, qk } from "@/lib/query";
import {
  employees as seedEmployees,
  projects as seedProjects,
  risks as seedRisks,
  tasks as seedTasks,
} from "@/lib/data";
import type { Employee, Project, Risk, Task } from "@/lib/types";

/* ── reads ─────────────────────────────────────────────────────────────── */

export function useEmployees() {
  return useQuery({
    queryKey: qk.employees.list(),
    queryFn: () => apiGet<Employee[]>("employees"),
    initialData: seedEmployees,
    staleTime: 60_000,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: qk.projects.list(),
    queryFn: () => apiGet<Project[]>("projects"),
    initialData: seedProjects,
    staleTime: 60_000,
  });
}

export function useRisks() {
  return useQuery({
    queryKey: qk.risks.list(),
    queryFn: () => apiGet<Risk[]>("risks"),
    initialData: seedRisks,
    staleTime: 60_000,
  });
}

export function useTasks() {
  return useQuery({
    queryKey: ["tasks", "list"],
    queryFn: () => apiGet<Task[]>("tasks"),
    initialData: seedTasks,
    staleTime: 30_000,
  });
}

/* ── mutations ──────────────────────────────────────────────────────────── */

type NewTask = { title: string; projectId?: string; assigneeId?: string; status?: string; priority?: string; estimatedHours?: number; weekStart?: string; dueDate?: string };
type NewProject = { name: string; description?: string; ownerId?: string; departmentId?: string; budgetHours?: number; budgetMicro?: number; targetDate?: string; customer?: string };
type NewRisk = { title: string; category?: string; probability?: string; impact?: string; ownerId?: string; projectId?: string; mitigationPlan?: string };
type NewEmployee = { name: string; role?: string; title?: string; departmentId?: string; capacityHoursPerWeek?: number; skills?: string[]; timezone?: string };

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (task: NewTask) => apiSend<Task>("tasks", task),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: NewProject) => apiSend<Project>("projects", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.projects.all }),
  });
}

export function useCreateRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (r: NewRisk) => apiSend<Risk>("risks", r),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.risks.all }),
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (e: NewEmployee) => apiSend<Employee>("employees", e),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.employees.all }),
  });
}
