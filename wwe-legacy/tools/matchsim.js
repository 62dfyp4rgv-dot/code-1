// Quick match simulation harness used while tuning and by the Gauntlet.
import { MatchEngine } from '../src/match/engine.js';
import { SAMPLE_WRESTLERS } from '../src/match/samples.js';

export function runMatch(seed, type, aId, bId, pa = 'average', pb = 'average', extra = {}) {
  const A = SAMPLE_WRESTLERS[aId], B = SAMPLE_WRESTLERS[bId];
  const sides = type === 'tag'
    ? [[A, SAMPLE_WRESTLERS.partnerA], [B, SAMPLE_WRESTLERS.partnerB]]
    : [[A], [B]];
  const profiles = { [A.id]: pa, [B.id]: pb };
  if (type === 'tag') { profiles.partnerA = pa; profiles.partnerB = pb; }
  const e = MatchEngine.simulate({ seed, type, sides, playerId: A.id, difficulty: 0.5, ...extra }, profiles);
  return e;
}

if (process.argv[1] && process.argv[1].endsWith('matchsim.js')) {
  const N = +process.argv[2] || 300;
  const types = ['singles', 'tag', 'submission', 'no_dq', 'last_man', 'iron_man', 'ladder', 'cage', 'hell_cell'];
  for (const type of types) {
    const fin = {}; let dur = 0, rounds = 0, draws = 0, wA = 0, maxR = 0;
    for (let i = 0; i < N; i++) {
      const e = runMatch(i + 1, type, 'brawler', 'tech');
      const r = e.result;
      if (!r) throw new Error('no result');
      fin[r.finish] = (fin[r.finish] || 0) + 1;
      dur += r.durationSec / 60; rounds += r.rounds; maxR = Math.max(maxR, r.rounds);
      if (r.winnerSide === null) draws++; else if (r.winnerSide === 0) wA++;
    }
    console.log(type.padEnd(11), `avg ${(dur / N).toFixed(1)}min ${(rounds / N).toFixed(0)}rds (max ${maxR})`, `A wins ${(wA / N * 100).toFixed(0)}% draws ${draws}`, JSON.stringify(fin));
  }
}

export function balanceReport(N = 200) {
  const out = {};
  // mirror match: identical stats should be ~50/50 (initiative coin flip aside)
  const mirror = { ...SAMPLE_WRESTLERS.show };
  let a = 0, d = 0;
  for (let i = 0; i < N; i++) {
    const A = { ...mirror, id: 'm1', name: 'Mirror One' }, B = { ...mirror, id: 'm2', name: 'Mirror Two' };
    const e = new MatchEngine({ seed: i + 1, type: 'singles', sides: [[A], [B]], playerId: 'm1' }, { human: [] });
    if (e.result.winnerSide === 0) a++; else if (e.result.winnerSide === null) d++;
  }
  out.mirrorAWins = a / N; out.mirrorDraws = d / N;
  // skill: smart vs random using identical wrestlers
  let sm = 0; let dr = 0;
  for (let i = 0; i < N; i++) {
    const A = { ...mirror, id: 'm1', name: 'Smart' }, B = { ...mirror, id: 'm2', name: 'Random' };
    const e = MatchEngine.simulate({ seed: 1000 + i, type: 'singles', sides: [[A], [B]], playerId: 'm1' }, { m1: 'smart', m2: 'random' });
    if (e.result.winnerSide === 0) sm++; else if (e.result.winnerSide === null) dr++;
  }
  out.smartVsRandomWin = sm / N; out.smartVsRandomDraw = dr / N;
  return out;
}
if (process.argv[1] && process.argv[1].endsWith('matchsim.js') && process.argv[3] === 'balance') console.log(balanceReport(300));
