import fs from 'node:fs';
const dir = process.argv[2];
const f = fs.readdirSync(dir).filter((x) => x.endsWith('.cpuprofile')).sort().pop();
const p = JSON.parse(fs.readFileSync(dir + '/' + f));
const self = new Map(); const dt = p.timeDeltas; const idx = new Map(p.nodes.map((n) => [n.id, n]));
p.samples.forEach((id, i) => { const n = idx.get(id); const k = n.callFrame.functionName + ' ' + n.callFrame.url.split('/').slice(-2).join('/') + ':' + n.callFrame.lineNumber; self.set(k, (self.get(k) || 0) + (dt[i] || 0)); });
const tot = [...self.values()].reduce((a, b) => a + b, 0);
console.log([...self].sort((a, b) => b[1] - a[1]).slice(0, +process.argv[3] || 16).map(([k, v]) => (v / tot * 100).toFixed(1) + '% ' + k).join('\n'));
