import { createWorld, advanceDays, advanceDay } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { encodeWorld, decodeWorld } from '../src/persistence/codec';
import { simulateMatch } from '../src/match';
const cfg = defaultWorldConfig('critic-p', 'compact');
const w0 = createWorld(cfg);
const a = createWorld({ ...cfg, humanClubId: Object.keys(w0.clubs)[2]! });
advanceDays(a, 120);
const b = decodeWorld(encodeWorld(a));
advanceDays(a, 30); advanceDays(b, 30);
const fields: Record<string, number> = {};
let n = 0;
for (const [id, ma] of Object.entries(a.matches)) {
  const mb = b.matches[id]; if (!mb) { fields['<missing in b>'] = (fields['<missing in b>'] ?? 0) + 1; continue; }
  for (const k of Object.keys(ma) as (keyof typeof ma)[]) if (JSON.stringify(ma[k]) !== JSON.stringify(mb[k])) { fields[k] = (fields[k] ?? 0) + 1; }
  n++;
}
console.log('[matches archive a vs b after 30 days] fields that differ (count of matches):', JSON.stringify(fields), 'of', n, 'matches; ids only in b:', Object.keys(b.matches).filter((id) => !a.matches[id]).length);
// replay fidelity
const w = a;
const withReplay = Object.values(w.matches).filter((m) => m.replay && m.events);
const m = withReplay[0]!;
const stored = JSON.stringify(m.goals);
const re = simulateMatch(m.replay as any);
console.log('[replay fidelity, 30d old match, live world] stored score', `${m.score.home}-${m.score.away}`, 'replayed', `${re.score.home}-${re.score.away}`);
let same = 0, tot = 0;
for (const mm of withReplay.slice(0, 200)) { const r = simulateMatch(mm.replay as any); tot++; if (r.score.home === mm.score.home && r.score.away === mm.score.away && JSON.stringify(r.events) === JSON.stringify(mm.events)) same++; }
console.log(`[replay fidelity] ${same}/${tot} archived replays reproduce their stored event log exactly (live world, up to 150 days after the match)`);
