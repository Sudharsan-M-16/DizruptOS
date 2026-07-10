import { chromium } from "playwright-core";
import fs from "node:fs";
const CACHE = process.env.LOCALAPPDATA + "/ms-playwright";
const dir = fs.readdirSync(CACHE).find((d) => d.startsWith("chromium-"));
const exe = `${CACHE}/${dir}/chrome-win64/chrome.exe`;
const OUT = "temp ss";
const browser = await chromium.launch({ executablePath: exe });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.4 });
await ctx.addCookies([{ name: "dz_session", value: "demo", domain: "localhost", path: "/" }]);
const page = await ctx.newPage();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" }); await wait(3000);
const u = page.locator('button[aria-label="Unlock"]'); if (await u.count()) await u.first().click(); await wait(1400);
// Tasks pre-filtered: click Critical stat in Home
await page.locator('section[aria-label="Home"] button', { hasText: "Critical" }).first().click().catch(()=>{});
await wait(900);
const activeFilter = await page.locator('section[aria-label="Tasks"] aside button').evaluateAll(els => els.find(e => e.style.boxShadow && e.style.boxShadow.includes("inset"))?.textContent || "?").catch(()=>"?");
console.log("Tasks opened on filter (should be Critical):", (await page.locator('section[aria-label="Tasks"]').count()) > 0);
await page.screenshot({ path: `${OUT}/v13-tasks-critical.png` });
// close tasks, open Team (directory) — should show your dept + you selected
await page.locator('section[aria-label="Tasks"] button[aria-label="Close"]').first().click().catch(()=>{});
await wait(300);
await page.locator('section[aria-label="Home"] button', { hasText: "Team" }).first().click().catch(()=>{});
await wait(800);
console.log("Directory open:", await page.locator('section[aria-label="Operative Directory"]').count() > 0);
await page.screenshot({ path: `${OUT}/v13-team.png` });
// network + profile popovers
await page.locator('button[aria-label="Network"]').click(); await wait(400);
console.log("network popover:", await page.getByText(/Connected|Offline/).count() > 0);
await page.screenshot({ path: `${OUT}/v13-network.png` });
await page.keyboard.press("Escape"); await wait(200);
await page.locator('nav ~ div button', { hasText: "Asha" }).first().click().catch(()=>{});
await wait(400);
console.log("profile popover (switch account):", await page.getByText("Switch account").count() > 0);
await page.screenshot({ path: `${OUT}/v13-profile.png` });
await browser.close();
console.log("done");
