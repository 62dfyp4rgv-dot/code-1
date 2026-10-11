// Playwright loader: prefers a local install, falls back to the globally installed one (this sandbox).
let mod;
try { mod = await import('playwright'); } catch { mod = await import('/opt/node22/lib/node_modules/playwright/index.mjs'); }
export const { chromium } = mod;
export const DEVICES = {
  'iPhone SE (375x667)': { width: 375, height: 667, dpr: 2 }, 'iPhone 14 (390x844)': { width: 390, height: 844, dpr: 3 },
  'iPhone 16 Pro (402x874)': { width: 402, height: 874, dpr: 3 }, 'iPhone 15 Pro Max (430x932)': { width: 430, height: 932, dpr: 3 },
  'iPhone 14 landscape (844x390)': { width: 844, height: 390, dpr: 3 },
};
export async function newPage(browser, dev = DEVICES['iPhone 14 (390x844)'], opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: dev.width, height: dev.height }, deviceScaleFactor: Math.min(2, dev.dpr), isMobile: true, hasTouch: true, colorScheme: 'dark', ...opts });
  const page = await ctx.newPage(); page.errors = [];
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  page.on('pageerror', (e) => page.errors.push('PAGEERROR ' + e.message));
  return page;
}
