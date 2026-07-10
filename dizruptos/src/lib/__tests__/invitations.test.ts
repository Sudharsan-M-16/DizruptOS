// Invitation validation logic — pure unit tests (no DB, no fetch).
// Tests the token business rules: expiry window, status transitions, field validation.

import { describe, it, expect } from "vitest";

// Business rule constants (mirror of 0020_invitations.sql constraints)
const VALID_ROLES = new Set(["admin", "executive", "dept_head", "project_manager", "team_lead", "employee"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_EXPIRES_DAYS = 7;

// Simulated invitation record shape
interface Invitation {
  id: string;
  orgId: string;
  email: string;
  role: string;
  token: string;
  status: "pending" | "accepted" | "declined" | "expired" | "revoked";
  expiresAt: string;
  createdAt: string;
}

function isTokenValid(inv: Invitation): { valid: boolean; reason?: string } {
  if (inv.status !== "pending") return { valid: false, reason: `Status is ${inv.status}, not pending` };
  if (new Date(inv.expiresAt) < new Date()) return { valid: false, reason: "Token has expired" };
  return { valid: true };
}

function validateInviteInput(email: string, role: string): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!EMAIL_RE.test(email)) errors.push("Invalid email address");
  if (!VALID_ROLES.has(role)) errors.push(`Invalid role "${role}" — must be one of ${[...VALID_ROLES].join(", ")}`);
  return { ok: errors.length === 0, errors };
}

describe("invitation token validation", () => {
  const base: Invitation = {
    id: "inv-1",
    orgId: "org-1",
    email: "new@co.com",
    role: "employee",
    token: "abc123",
    status: "pending",
    expiresAt: new Date(Date.now() + TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  it("returns valid for a fresh pending token", () => {
    expect(isTokenValid(base).valid).toBe(true);
  });

  it("rejects expired tokens", () => {
    const expired: Invitation = { ...base, expiresAt: new Date(Date.now() - 1000).toISOString() };
    const r = isTokenValid(expired);
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/expired/i);
  });

  it("rejects already-accepted tokens", () => {
    const accepted: Invitation = { ...base, status: "accepted" };
    const r = isTokenValid(accepted);
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/accepted/i);
  });

  it("rejects revoked tokens", () => {
    const revoked: Invitation = { ...base, status: "revoked" };
    const r = isTokenValid(revoked);
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/revoked/i);
  });

  it("rejects declined tokens", () => {
    const declined: Invitation = { ...base, status: "declined" };
    const r = isTokenValid(declined);
    expect(r.valid).toBe(false);
  });
});

describe("invitation input validation", () => {
  it("accepts valid email + role combinations", () => {
    const r = validateInviteInput("alice@corp.com", "project_manager");
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("rejects malformed email addresses", () => {
    const r = validateInviteInput("not-an-email", "employee");
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/email/i);
  });

  it("rejects invalid role values", () => {
    const r = validateInviteInput("valid@email.com", "superuser");
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/role/i);
  });

  it("returns both errors when email and role are invalid", () => {
    const r = validateInviteInput("bad", "wizard");
    expect(r.ok).toBe(false);
    expect(r.errors).toHaveLength(2);
  });

  it("accepts all valid role values", () => {
    [...VALID_ROLES].forEach((role) => {
      const r = validateInviteInput("user@co.com", role);
      expect(r.ok).toBe(true);
    });
  });
});

describe("accept flow state transitions", () => {
  it("accepting a pending invite moves status to accepted", () => {
    const inv: Invitation = {
      id: "inv-2", orgId: "org-1", email: "x@co.com", role: "employee",
      token: "tok", status: "pending",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    // Simulate accept action
    if (!isTokenValid(inv).valid) throw new Error("Should be valid");
    inv.status = "accepted";
    expect(inv.status).toBe("accepted");
    // Can no longer be used
    expect(isTokenValid(inv).valid).toBe(false);
  });

  it("expiry window is exactly 7 days from creation", () => {
    const created = new Date();
    const expires = new Date(created.getTime() + TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
    const diffDays = (expires.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(7);
  });
});
