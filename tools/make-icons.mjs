// Generates original app icons (PNG) by rendering an inline SVG in headless Chromium. Run: node tools/make-icons.mjs
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../app/icons'); fs.mkdirSync(out, { recursive: true });
const svg = (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 512 512"><defs><radialGradient id="g" cx="40%" cy="35%" r="80%"><stop offset="0" stop-color="#1e3a66"/><stop offset="1" stop-color="#0a1424"/></radialGradient></defs>
<rect width="512" height="512" fill="url(#g)"/><g fill="none" stroke="#f2b441" stroke-width="14" stroke-linecap="round"><circle cx="256" cy="256" r="150"/><ellipse cx="256" cy="256" rx="62" ry="150" stroke-width="9" opacity=".8"/><path d="M106 256h300M126 176h260M126 336h260" stroke-width="8" opacity=".7"/><path d="M256 70v372" stroke-width="16"/></g><circle cx="256" cy="106" r="16" fill="#4fd1c5"/></svg>`;
const b = await chromium.launch(); const p = await b.newPage();
for (const s of [180, 192, 512]) { await p.setViewportSize({ width: s, height: s }); await p.setContent(`<body style="margin:0">${svg(s)}</body>`); await p.screenshot({ path: path.join(out, `icon-${s}.png`), omitBackground: false }); }
await b.close(); console.log('icons written');
