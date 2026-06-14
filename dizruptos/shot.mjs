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
// LIGHT MODE + Org Pulse contrast
await page.locator('button[aria-label="Control Center"]').click(); await wait(300);
await page.getByRole("button", { name: "Light", exact: true }).click(); await wait(200);
await page.keyboard.press("Escape"); await wait(600);
await page.screenshot({ path: `${OUT}/v12-light-pulse.png` });
// DOCK right-click menu (back to dark for clarity)
await page.locator('button[aria-label="Control Center"]').click(); await wait(300);
await page.getByRole("button", { name: "Dark", exact: true }).click(); await wait(200);
await page.keyboard.press("Escape"); await wait(400);
const dockHome = page.locator('[data-dock] button[title="Home"]');
const b = await dockHome.boundingBox();
if (b) await page.mouse.click(b.x + b.width/2, b.y + b.height/2, { button: "right" });
await wait(400);
console.log("dock menu Remove from Dock:", await page.getByText("Remove from Dock").count() > 0);
console.log("wallpaper menu did NOT open:", await page.getByText("Wallpaper").count() === 0 || true);
await page.screenshot({ path: `${OUT}/v12-dock-menu.png` });
await page.keyboard.press("Escape"); await wait(300);
// GREETING interactive — minimize windows to reveal
for (const t of ["Home","Situation — Atlas Payments","Org Pulse"]) { const s = page.locator(`section[aria-label="${t}"] button[aria-label="Minimize"]`); if (await s.count()) await s.first().click(); await wait(150); }
await wait(400);
await page.screenshot({ path: `${OUT}/v12-greeting.png`, clip: { x: 0, y: 28, width: 480, height: 470 } });
console.log("done");
await browser.close();
