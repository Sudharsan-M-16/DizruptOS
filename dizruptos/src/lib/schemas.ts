// Shared Zod v4 validation schemas for API route bodies.
// Each schema is the source of truth for what each endpoint accepts.

import { z } from "zod";

// ── Invitations ───────────────────────────────────────────────────────────────

const VALID_ROLES = [
  "admin", "executive", "dept_head", "project_manager", "team_lead", "employee",
] as const;

export const InvitationCreateSchema = z.object({
  email: z.email("A valid email address is required").max(254, "Email too long"),
  role: z.enum(VALID_ROLES).default("employee"),
  message: z.string().max(500, "message must be under 500 characters").optional(),
});

export type InvitationCreate = z.infer<typeof InvitationCreateSchema>;

// ── Organizations ─────────────────────────────────────────────────────────────

export const OrganizationCreateSchema = z.object({
  name: z
    .string()
    .min(2, "name must be at least 2 characters")
    .max(80, "name must be at most 80 characters")
    .trim(),
  slug: z
    .string()
    .regex(
      /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/,
      "slug must be 3–32 lowercase alphanumeric characters and hyphens, no leading/trailing hyphens"
    ),
});

export type OrganizationCreate = z.infer<typeof OrganizationCreateSchema>;

// ── Copilot ───────────────────────────────────────────────────────────────────

const ConversationTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000, "conversation turn too long"),
});

export const CopilotQuerySchema = z.object({
  q: z
    .string()
    .min(1, "question cannot be empty")
    .max(1000, "question must be under 1000 characters")
    .trim(),
  history: z.array(ConversationTurnSchema).max(20, "history must be at most 20 turns").optional(),
});

export type CopilotQuery = z.infer<typeof CopilotQuerySchema>;

// ── Alerts ────────────────────────────────────────────────────────────────────

export const AlertAcknowledgeSchema = z.object({
  acknowledged: z.literal(true),
  note: z.string().max(200).optional(),
});

// ── Notifications ─────────────────────────────────────────────────────────────

export const NotificationCreateSchema = z.object({
  type: z.enum(["alert", "message", "system", "info"]).default("info"),
  title: z.string().min(1).max(120),
  body: z.string().max(500).optional(),
  href: z.string().optional(),
});

// ── Helper ────────────────────────────────────────────────────────────────────

/** Parse and return a typed result, or return an error descriptor. */
export function parseBody<T>(schema: z.ZodType<T>, raw: unknown): { data: T } | { error: string; field?: string } {
  const result = schema.safeParse(raw);
  if (result.success) return { data: result.data };
  const issue = result.error.issues[0];
  return {
    error: issue.message,
    field: issue.path.join(".") || undefined,
  };
}
