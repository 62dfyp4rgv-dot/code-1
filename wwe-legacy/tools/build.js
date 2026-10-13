// Build: bundles the ES-module app with esbuild (build-time only; the game has zero runtime deps).
//   dist/web/        static PWA (index.html + app.js + styles.css + manifest + sw.js + icon) - host anywhere
//   dist/artifact.html   single-file fragment (title + style + markup + script) for the Artifact viewer
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
fs.mkdirSync(path.join(dist, 'web'), { recursive: true });

const result = await build({
  entryPoints: [path.join(root, 'ui/app.js')], bundle: true, format: 'iife', minify: true, target: ['es2020', 'safari14'],
  write: false, charset: 'utf8', legalComments: 'none', logLevel: 'warning',
});
const js = result.outputFiles[0].text;
const css = fs.readFileSync(path.join(root, 'ui/styles.css'), 'utf8');

// static PWA
fs.writeFileSync(path.join(dist, 'web/app.js'), js);
fs.writeFileSync(path.join(dist, 'web/styles.css'), css);
let html = fs.readFileSync(path.join(root, 'ui/index.html'), 'utf8').replace('<script type="module" src="app.js"></script>', '<script src="app.js" defer></script>');
fs.writeFileSync(path.join(dist, 'web/index.html'), html);
for (const f of ['manifest.webmanifest', 'sw.js', 'icon.svg']) fs.copyFileSync(path.join(root, 'ui', f), path.join(dist, 'web', f));

// single-file artifact fragment (the viewer wraps it in a document skeleton)
const safeJs = js.replace(/<\/script/gi, '<\\/script');
const fragment = `<title>WWE Legacy</title>
<style>
${css}
</style>
<div id="app"></div>
<script>
${safeJs}
</script>
`;
fs.writeFileSync(path.join(dist, 'artifact.html'), fragment);
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`built: bundle ${kb(js.length)}, artifact.html ${kb(fragment.length)}`);
