// DizruptOS Desktop E2E smoke — boot → lock → desktop → app launch.
//
// Tests the macOS-style OS shell end to end.
// Run: node e2e/desktop.mjs (requires dev server at :3000)

import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:3000";

const checks = [];
const pass = (label) => { checks.push({ label, ok: true }); console.log(`✓ ${label}`); };
const fail = (label, reason) => { checks.push({ label, ok: false }); console.log(`✗ ${label}: ${reason}`); };
const check = (label, cond, reason = "") => cond ? pass(label) : fail(label, reason || "condition false");

const browser = await chromium.launch({ headless: true });
try {
  // Test 1: Boot → Login → Desktop
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();

    // Set dz_session cookie to skip login
    await ctx.addCookies([{ name: "dz_session", value: "u-asha", domain: "localhost", path: "/" }]);

    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
    // Wait for boot sequence
    await page.waitForTimeout(3500);

    // Click unlock if the lock screen is present
    const unlockBtn = page.locator('button[aria-label="Unlock"]');
    if (await unlockBtn.count() > 0) {
      await unlockBtn.click();
      await page.waitForTimeout(1000);
    }

    // Verify dock is visible
    const dockVisible = await page.locator('[role="navigation"]').count() > 0 ||
                        await page.locator('button[title="Home"]').count() > 0 ||
                        await page.locator('[aria-label="Dock"]').count() > 0;
    check("desktop: dock renders after unlock", dockVisible);

    await ctx.close();
  }

  // Test 2: Health API returns ok + requestId
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const res = await page.request.get(`${BASE}/api/health`);
    check("health: returns 200", res.status() === 200);
    const body = await res.json();
    check("health: status ok", body.status === "ok");
    check("health: has version", typeof body.version === "string");
    check("health: has uptime", typeof body.uptime_s === "number");
    check("health: has requestId", typeof body.requestId === "string");
    check("health: has capabilities", typeof body.capabilities === "object");
    await ctx.close();
  }

  // Test 3: SSO endpoint — known tenant redirects, unknown returns 404
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // Unknown tenant → 404
    const res404 = await page.request.get(`${BASE}/api/auth/sso?tenant=unknown-org`);
    check("sso: unknown tenant returns 404", res404.status() === 404);

    // Known tenant → 302/3xx redirect (don't follow)
    const resKnown = await page.request.get(`${BASE}/api/auth/sso?tenant=org-1`, { maxRedirects: 0 });
    check("sso: known tenant redirects", resKnown.status() >= 300 && resKnown.status() < 400);

    await ctx.close();
  }

  // Test 4: Graph API is resilient
  {
    const ctx = await browser.newContext();
    await ctx.addCookies([{ name: "dz_session", value: "u-asha", domain: "localhost", path: "/" }]);
    const page = await ctx.newPage();
    const res = await page.request.get(`${BASE}/api/v1/intelligence/graph`);
    check("graph api: returns 200", res.status() === 200);
    const body = await res.json();
    check("graph api: has graph.nodes", Array.isArray(body.data?.graph?.nodes));
    check("graph api: has graph.edges", Array.isArray(body.data?.graph?.edges));
    await ctx.close();
  }

  // Test 5: Copilot API responds
  {
    const ctx = await browser.newContext();
    await ctx.addCookies([{ name: "dz_session", value: "u-asha", domain: "localhost", path: "/" }]);
    const page = await ctx.newPage();
    const res = await page.request.get(`${BASE}/api/v1/copilot?q=who+is+overloaded`);
    check("copilot api: returns 200", res.status() === 200);
    const body = await res.json();
    check("copilot api: has answer", typeof body.data?.answer === "string");
    check("copilot api: answer non-empty", body.data?.answer?.length > 0);
    await ctx.close();
  }

  // Test 6: Invitations API (demo mode)
  {
    const ctx = await browser.newContext();
    await ctx.addCookies([{ name: "dz_session", value: "u-asha", domain: "localhost", path: "/" }]);
    const page = await ctx.newPage();
    const res = await page.request.post(`${BASE}/api/v1/invitations`, {
      data: { email: "newmember@test.com", role: "employee" },
    });
    // Demo mode returns 200 with mock token
    check("invitations api: returns 200 in demo mode", res.status() === 200);
    const body = await res.json();
    check("invitations api: has token", typeof body.data?.token === "string");
    check("invitations api: has email", body.data?.email === "newmember@test.com");
    await ctx.close();
  }

  // Test 7: Organizations API (demo mode)
  {
    const ctx = await browser.newContext();
    await ctx.addCookies([{ name: "dz_session", value: "u-asha", domain: "localhost", path: "/" }]);
    const page = await ctx.newPage();
    const res = await page.request.get(`${BASE}/api/v1/organizations`);
    check("organizations api: returns 200", res.status() === 200);
    const body = await res.json();
    check("organizations api: has orgs array", Array.isArray(body.data?.organizations));
    await ctx.close();
  }

  // Test 8: Readiness endpoint
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const res = await page.request.get(`${BASE}/api/ready`);
    // Ready returns 200 or 503 — either way it must respond with JSON
    check("ready endpoint: returns 200 or 503", res.status() === 200 || res.status() === 503);
    const body = await res.json();
    check("ready endpoint: has ready field", typeof body.ready === "boolean");
    check("ready endpoint: has checks", typeof body.checks === "object");
    await ctx.close();
  }

  // Test 9: HRIS bulk import (demo mode)
  {
    const ctx = await browser.newContext();
    await ctx.addCookies([{ name: "dz_session", value: "u-asha", domain: "localhost", path: "/" }]);
    const page = await ctx.newPage();
    const csv = "name,email,title,role\nJane Doe,jane@co.com,Engineer,employee";
    const res = await page.request.post(`${BASE}/api/v1/import`, {
      data: { entity: "hris_bulk", csv },
    });
    check("hris_bulk import: returns 200", res.status() === 200);
    const body = await res.json();
    check("hris_bulk import: has entity field", body.data?.entity === "hris_bulk");
    await ctx.close();
  }

  // Test 10: Delta intelligence feed
  {
    const ctx = await browser.newContext();
    await ctx.addCookies([{ name: "dz_session", value: "u-noor", domain: "localhost", path: "/" }]);
    const page = await ctx.newPage();
    const res = await page.request.get(`${BASE}/api/v1/intelligence/delta?since=24h`);
    check("delta api: returns 200", res.status() === 200);
    const body = await res.json();
    check("delta api: has events array", Array.isArray(body.data?.events));
    check("delta api: has since field", typeof body.data?.since === "string");
    await ctx.close();
  }

  // ── Per-role RBAC E2E (Tests 11–14) ────────────────────────────────────────
  // Verifies the HTTP layer enforces role boundaries, not just UI hiding.

  // Test 11: Employee sees only their own proposals — no admin governance items
  {
    const ctx = await browser.newContext();
    await ctx.addCookies([{ name: "dz_session", value: "u-ahmed", domain: "localhost", path: "/" }]);
    const page = await ctx.newPage();
    const res = await page.request.get(`${BASE}/api/v1/proposals`);
    const ok = res.status() === 200 || res.status() === 403;
    check("rbac(employee): proposals returns 200 or 403 — no 5xx", ok);
    if (res.status() === 200) {
      const body = await res.json();
      const list = body.data?.proposals ?? [];
      const leaked = list.filter(
        (p) => p.visibility?.includes("admin") && !p.visibility?.includes("employee") && p.subjectId !== "u-ahmed"
      );
      check("rbac(employee): no admin-only proposals leaked", leaked.length === 0);
    }
    await ctx.close();
  }

  // Test 12: Executive can read intelligence graph (view_executive permission)
  {
    const ctx = await browser.newContext();
    await ctx.addCookies([{ name: "dz_session", value: "u-noor", domain: "localhost", path: "/" }]);
    const page = await ctx.newPage();
    const res = await page.request.get(`${BASE}/api/v1/intelligence/graph`);
    check("rbac(executive): graph endpoint returns 200", res.status() === 200);
    if (res.status() === 200) {
      const body = await res.json();
      check("rbac(executive): graph has nodes array", Array.isArray(body.data?.graph?.nodes));
      check("rbac(executive): graph has edges array", Array.isArray(body.data?.graph?.edges));
    }
    await ctx.close();
  }

  // Test 13: Client role is denied access to internal employee list
  {
    const ctx = await browser.newContext();
    await ctx.addCookies([{ name: "dz_session", value: "c-acme", domain: "localhost", path: "/" }]);
    const page = await ctx.newPage();
    const res = await page.request.get(`${BASE}/api/v1/employees`);
    check("rbac(client): /api/v1/employees returns 403", res.status() === 403);
    await ctx.close();
  }

  // Test 14: No session cookie → 401 on authenticated route
  {
    const ctx = await browser.newContext(); // no cookies
    const page = await ctx.newPage();
    const res = await page.request.get(`${BASE}/api/v1/copilot?q=test`);
    check("rbac(no-cookie): copilot returns 401", res.status() === 401);
    await ctx.close();
  }

  // Test 15: Admin Console dead-letter API — auth-gated, returns array
  {
    const ctx = await browser.newContext();
    // u-noor is executive — has view_audit (dept_head/admin have it; exec does not, so 403 is valid too)
    await ctx.addCookies([{ name: "dz_session", value: "u-noor", domain: "localhost", path: "/" }]);
    const page = await ctx.newPage();
    const res = await page.request.get(`${BASE}/api/v1/import/dead-letter`);
    const allowed = res.status() === 200 || res.status() === 403;
    check("admin: dead-letter api returns 200 or 403 (no 5xx)", allowed);
    if (res.status() === 200) {
      const body = await res.json();
      check("admin: dead-letter response has data array", Array.isArray(body.data));
    }
    await ctx.close();
  }

  // Test 16: Admin Console audit API — u-priya (dept_head) can read audit log
  {
    const ctx = await browser.newContext();
    await ctx.addCookies([{ name: "dz_session", value: "u-priya", domain: "localhost", path: "/" }]);
    const page = await ctx.newPage();
    const res = await page.request.get(`${BASE}/api/v1/audit?limit=5`);
    check("admin: audit api accessible to dept_head", res.status() === 200);
    if (res.status() === 200) {
      const body = await res.json();
      check("admin: audit response has events array", Array.isArray(body.data?.events ?? body.data));
    }
    await ctx.close();
  }

} catch (e) {
  console.error("E2E error:", e);
  checks.push({ label: "runner", ok: false });
} finally {
  await browser.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) {
  console.log("Failed:", failed.map((c) => c.label).join(", "));
}
process.exit(failed.length ? 1 : 0);
