// DIZRUPT E2E smoke — auth + RBAC happy path.
//
// Proves the real user journey end to end: the Nexus login signs a persona in,
// the session cookie lets the protected shell load, and the command center
// renders the manager's role-scoped surfaces.
//
// Run (browser binaries already cached by Playwright):
//   1. start the app:  npm run dev            (defaults to :5175)
//   2. install runner: npm i -D playwright-core   (or reuse a cached install)
//   3. BASE=http://localhost:5175 node e2e/smoke.mjs
//
// Exit 0 = pass, 1 = fail. Designed to drop into CI once a headless browser is
// provisioned; until then it runs locally against the dev server.

import { chromium } from "playwright-core";

const BASE = process.env.BASE || "http://localhost:5175";
const EXE =
  process.env.PW_CHROME ||
  "C:/Users/sudha/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe";

const checks = [];
const expect = (label, cond) => {
  checks.push({ label, ok: !!cond });
  console.log(`${cond ? "✓" : "✗"} ${label}`);
};

const browser = await chromium.launch({ executablePath: EXE, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Login page renders the Nexus gateway
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
  expect("login shows the headline", await page.getByText("Take the").count());
  expect("login lists demo personas", await page.getByText("Sign in as").count());

  // 2. Sign in (default persona = Asha, a Resource Manager) → command center
  await page.getByRole("button", { name: /Enter the command center/i }).click();
  await page.waitForURL((u) => new URL(u).pathname === "/", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  // Wait for actual content, not a fixed timer — the command center mounts a
  // beat after the route resolves; a content-based wait is deterministic.
  await page.getByText(/Capacity hotlist/i).first().waitFor({ state: "attached", timeout: 12000 });

  // 3. The protected shell loaded with the manager's role-scoped surfaces.
  //    (The topbar title is split per-character by RevealText, so assert on the
  //    stable hint copy + section headings instead.)
  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  console.log("  url:", page.url());
  expect("command center hint present", /Monday morning/i.test(body));
  // RBAC: these pulse stats are manager-scoped — an employee sees "Your load" /
  // "Your requests" in their place, so their presence proves role resolution.
  expect("manager pulse: over-allocation", /Over-?allocation/i.test(body));
  expect("manager pulse: awaiting decision", /Awaiting decision/i.test(body));
  expect("situation banner rendered", /Atlas Payments Migration/i.test(body));
  // P7 regression guard: these lower-grid sections must survive the client-side
  // login navigation (they were vanishing behind the entrance-animation gating).
  expect("capacity hotlist present after login nav", /Capacity hotlist/i.test(body));
  expect("decision queue present after login nav", /Needs your decision/i.test(body));
  expect("portfolio section present after login nav", /Portfolio health/i.test(body));
  if (process.env.DEBUG_SHOT)
    await page.screenshot({ path: "C:/Users/sudha/DizruptOS/temp ss/e2e-dashboard.png" });
} finally {
  await browser.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
