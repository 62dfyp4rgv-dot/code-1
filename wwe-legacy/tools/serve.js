// Tiny static dev server: serves ui/ at / and src/ at /src (so ES modules resolve as in the repo).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
export function serve(port = 5173, dir = root) {
  const server = http.createServer((req, res) => {
    let url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (url === '/') url = '/ui/index.html';
    // ui/ files are addressed relative to the ui folder: /app.js -> ui/app.js ; /src/** -> src/**
    const candidates = [path.join(dir, url.startsWith('/src/') ? url : path.join('ui', url)), path.join(dir, url)];
    for (const f of candidates) {
      if (!f.startsWith(dir)) continue;
      if (fs.existsSync(f) && fs.statSync(f).isFile()) {
        res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
        return fs.createReadStream(f).pipe(res);
      }
    }
    res.writeHead(404); res.end('not found');
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}
if (process.argv[1] && process.argv[1].endsWith('serve.js')) {
  const port = +process.env.PORT || 5173;
  serve(port).then(() => console.log(`WWE Legacy dev server: http://127.0.0.1:${port}/`));
}
