// Skill matching — connects a task's required skill to the people who can do it.
// Used by the capacity sidebar, the project-matrix task drawer, and the
// recommendation→assign flow so work is always offered to the right people
// (a UI task goes to a frontend engineer, not a database expert).

import type { Employee, Task } from "./types";

// Map a task's labels to the skills a person needs to do it well.
const SKILL_FOR_LABEL: Record<string, string[]> = {
  frontend: ["Frontend", "React", "UI"],
  ui: ["Frontend", "React", "UI", "UI Design"],
  database: ["Databases", "Backend"],
  backend: ["Backend", "APIs", "Databases"],
  api: ["Backend", "APIs"],
  ai: ["AI/ML", "Python"],
  data: ["Data Pipelines", "SQL"],
  design: ["UI Design", "Figma", "UX Research"],
  testing: ["Testing", "QA"],
  qa: ["Testing", "QA"],
  devops: ["DevOps", "Cloud", "CI/CD"],
  security: ["Security", "DevOps"],
};

/** The skills a task needs, derived from its labels. Empty = anyone can do it. */
export function taskRequiredSkills(task: Pick<Task, "labels">): string[] {
  const set = new Set<string>();
  for (const label of task.labels ?? []) {
    for (const skill of SKILL_FOR_LABEL[label.toLowerCase()] ?? []) set.add(skill);
  }
  return [...set];
}

/** Does this person have the skills the task needs? Generic tasks → true. */
export function isQualified(emp: Pick<Employee, "skills">, task: Pick<Task, "labels">): boolean {
  const required = taskRequiredSkills(task);
  if (required.length === 0) return true;
  return (emp.skills ?? []).some((s) => required.includes(s));
}

/** 0–1 fit score: higher = better skill match. Used to rank candidates. */
export function skillMatchScore(emp: Pick<Employee, "skills">, task: Pick<Task, "labels">): number {
  const required = taskRequiredSkills(task);
  if (required.length === 0) return 0.5; // neutral — generic task
  const matched = (emp.skills ?? []).filter((s) => required.includes(s)).length;
  if (matched === 0) return 0.15;
  return Math.min(1, 0.7 + 0.1 * matched);
}
