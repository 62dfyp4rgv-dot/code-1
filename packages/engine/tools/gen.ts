import { generateWorld, defaultWorldConfig } from '../src/world/generate';
import { overall } from '../src/players';
import { squadOf } from '../src/world/runtime';
const preset = (process.argv[2] ?? 'standard') as 'standard' | 'compact';
const t0 = performance.now();
const w = generateWorld(defaultWorldConfig('gen-test', preset));
console.log(preset, 'clubs', Object.keys(w.clubs).length, 'players', Object.keys(w.players).length, 'ms', Math.round(performance.now() - t0));
for (const lid of ['ENG1', 'SAU1', 'USA1', 'SCO1']) {
  const m = w.leagueMembers[lid]; if (!m) continue;
  const rows = m.map((c) => { const cl = w.clubs[c]!; const sq = squadOf(w, c); const top = [...sq].map(overall).sort((a, b) => b - a).slice(0, 11); const wages = sq.reduce((a, p) => a + p.contract!.wageWeekly, 0) * 52; const rev = cl.finance.broadcastingAnnual + cl.finance.sponsorshipAnnual; return `${cl.name.padEnd(22)} rep ${cl.reputation} XI ${(top.reduce((a, b) => a + b, 0) / 11).toFixed(1)} wages ${(wages / 1e6).toFixed(0)}m tv+spons ${(rev / 1e6).toFixed(0)}m cash ${(cl.finance.cash / 1e6).toFixed(0)}m cap ${cl.stadium.capacity} ${cl.tactics.formation}`; });
  console.log(lid); console.log(rows.slice(0, 3).join('\n')); console.log('...'); console.log(rows.slice(-2).join('\n'));
}
console.log('json MB', (JSON.stringify(w).length / 1e6).toFixed(1));
