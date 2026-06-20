import { describe, it, expect, beforeEach } from "vitest";
import { useSession } from "@/lib/session";
import { roleCan } from "@/lib/personas";

describe("syncFromSupabase", () => {
  beforeEach(() => {
    // Reset session store to known state
    useSession.setState({ authenticated: false, personaId: "", role: null, orgId: null });
  });

  it("null user clears session state", () => {
    useSession.getState().syncFromSupabase(null);
    const state = useSession.getState();
    expect(state.authenticated).toBe(false);
    expect(state.role).toBeNull();
    expect(state.orgId).toBeNull();
  });

  it("user without app_metadata defaults role to employee", () => {
    useSession.getState().syncFromSupabase({ id: "user-1", email: "a@b.com" });
    const state = useSession.getState();
    expect(state.authenticated).toBe(true);
    expect(state.personaId).toBe("user-1");
    expect(state.role).toBe("employee");
    expect(state.orgId).toBeNull();
  });

  it("extracts role and org_id from app_metadata", () => {
    useSession.getState().syncFromSupabase({
      id: "user-2",
      email: "exec@co.com",
      app_metadata: { role: "executive", org_id: "org-42" },
    });
    const state = useSession.getState();
    expect(state.authenticated).toBe(true);
    expect(state.role).toBe("executive");
    expect(state.orgId).toBe("org-42");
  });

  it("can() uses JWT role when no demo persona matches", () => {
    useSession.setState({ authenticated: true, personaId: "live-user-uuid", role: "project_manager", orgId: "org-1" });
    const state = useSession.getState();
    expect(state.can("view_capacity")).toBe(true);
    expect(state.can("reallocate")).toBe(true);
    expect(state.can("view_executive")).toBe(false);
    expect(state.can("view_audit")).toBe(false);
  });

  it("employee role from JWT denies privileged permissions", () => {
    useSession.setState({ authenticated: true, personaId: "live-employee", role: "employee", orgId: "org-1" });
    const state = useSession.getState();
    expect(state.can("view_burnout")).toBe(false);
    expect(state.can("view_financials")).toBe(false);
    expect(state.can("reallocate")).toBe(false);
  });

  it("admin role from JWT allows all permissions", () => {
    useSession.setState({ authenticated: true, personaId: "live-admin", role: "admin", orgId: "org-1" });
    const state = useSession.getState();
    expect(state.can("view_audit")).toBe(true);
    expect(state.can("view_executive")).toBe(true);
    expect(state.can("reallocate")).toBe(true);
  });
});

describe("roleCan sanity", () => {
  it("executive can view_executive", () => {
    expect(roleCan("executive", "view_executive")).toBe(true);
  });
  it("employee cannot review_proposals", () => {
    expect(roleCan("employee", "review_proposals")).toBe(false);
  });
});
