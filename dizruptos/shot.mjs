import { chromium } from "playwright-core";
import fs from "node:fs";
const CACHE = process.env.LOCALAPPDATA + "/ms-playwright";
const dir = fs.readdirSync(CACHE).find((d) => d.startsWith("chromium-"));
const exe = `${CACHE}/${dir}/chrome-win64/chrome.exe`;
const OUT = "temp ss";
const mk = async (persona) => {
  const browser = await chromium.launch({ executablePath: exe });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.4 });
  await ctx.addCookies([{ name: "dz_session", value: "demo", domain: "localhost", path: "/" }]);
  const page = await ctx.newPage();
  if (persona) await page.addInitScript((pid) => localStorage.setItem("dizrupt-session", JSON.stringify({ state: { authenticated: true, personaId: pid, theme: "dark" }, version: 0 }), pid), persona);
  return { browser, page };
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Asha home brief
{
  const { browser, page } = await mk(null);
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" }); await wait(3000);
  const u = page.locator('button[aria-label="Unlock"]'); if (await u.count()) await u.first().click(); await wait(1500);
  await page.screenshot({ path: `${OUT}/v9-home-brief.png` });
  console.log("home brief:", await page.locator('section[aria-label="Home"] p').first().textContent());
  await browser.close();
}
// Priya admin members panel
{
  const { browser, page } = await mk("u-priya");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" }); await wait(3000);
  const u = page.locator('button[aria-label="Unlock"]'); if (await u.count()) await u.first().click(); await wait(1400);
  await page.locator('button[title="Messages"]').click(); await wait(800);
  // select Engineering group
  await page.locator('section[aria-label="Messages"] button', { hasText: "Engineering" }).first().click(); await wait(400);
  // open members
  const memBtn = page.locator('section[aria-label="Messages"] button').filter({ hasText: /^\d+$/ }).last();
  await memBtn.click().catch(()=>{});
  await wait(500);
  await page.screenshot({ path: `${OUT}/v9-chat-members.png` });
  console.log("members panel admin:", await page.locator('text=you\'re the admin').count() > 0);
  await browser.close();
}
console.log("done");
