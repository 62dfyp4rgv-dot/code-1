import fs from 'node:fs';
const f = fs.readdirSync('critic/prof').filter((x) => x.endsWith('.cpuprofile'))[0];
const p = JSON.parse(fs.readFileSync('critic/prof/' + f, 'utf8'));
const self = new Map(); const byId = new Map(p.nodes.map((n) => [n.id, n]));
const dt = p.timeDeltas; const total = dt.reduce((a, b) => a + b, 0);
p.samples.forEach((id, i) => { const n = byId.get(id); const k = `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').slice(-2).join('/')}:${n.callFrame.lineNumber + 1}`; self.set(k, (self.get(k) ?? 0) + dt[i]); });
[...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).forEach(([k, v]) => console.log((v / total * 100).toFixed(1).padStart(5) + '%  ' + k));
