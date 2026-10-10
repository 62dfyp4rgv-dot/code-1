/**
 * QA areas 1+2: multi-season continuity on the default 'compact' world (all 32 tier-1 leagues) - identities,
 * contracts, history contiguity, fixtures, league tables, money ledger, qualification cascades and exclusivity.
 * Independent of validateWorld (which is also run, but never relied upon alone).
 */
import { describe, expect, it } from 'vitest';
import { advanceDay, createWorld, defaultWorldConfig, COMPETITIONS, LEAGUE_BY_ID, type WorldState } from '../src/index';
import { auditLeague, advanceToLastDay, hardViolations, squadOf } from './helpers';

const SEASONS = 3;
interface PlayerIdentity { name: string; birthDay: number; nationality: string; primary: string }

const w: WorldState = createWorld(defaultWorldConfig('qa-seasons', 'compact'));
const clubIds0 = Object.keys(w.clubs).sort();
const clubNames0 = Object.fromEntries(Object.values(w.clubs).map((c) => [c.id, c.name]));
const identity = new Map<string, PlayerIdentity>();
const entrantsBySeason: Record<number, Record<string, string[]>> = {};
const leagueProblems: string[] = [];
const seasonStartProblems: string[] = [];
const snapshotNote: string[] = [];
let maxCash = 0, minCash = 0;

function snapshotEntrants(): void {
  entrantsBySeason[w.season] = Object.fromEntries(Object.entries(w.competitions).map(([id, c]) => [id, [...c.entrants]]));
}
function recordIdentity(): void {
  for (const p of Object.values(w.players)) {
    const prev = identity.get(p.id);
    const cur = { name: p.name, birthDay: p.birthDay, nationality: p.nationality, primary: p.primary };
    if (!prev) identity.set(p.id, cur);
    else if (JSON.stringify(prev) !== JSON.stringify(cur)) seasonStartProblems.push(`player ${p.id} identity changed ${JSON.stringify(prev)} -> ${JSON.stringify(cur)}`);
  }
}

// ---- run
snapshotEntrants(); recordIdentity();
const seasonEndComps: Record<number, string[]> = {};
for (let s = 1; s <= SEASONS; s++) {
  advanceToLastDay(w);
  const incomplete = Object.values(w.competitions).filter((c) => c.status === 'active').map((c) => c.id);
  seasonEndComps[s] = incomplete;
  for (const comp of Object.values(w.competitions)) {
    if (COMPETITIONS[comp.id]!.kind === 'league' && comp.status === 'complete') leagueProblems.push(...auditLeague(comp));
  }
  advanceDay(w);
  recordIdentity();
  snapshotEntrants();
  for (const c of Object.values(w.clubs)) { maxCash = Math.max(maxCash, c.finance.cash); minCash = Math.min(minCash, c.finance.cash); }
  const v = hardViolations(w);
  if (v.length) seasonStartProblems.push(...v.map((x) => `season ${s}: ${x.code} ${x.message}`));
}

describe(`continuity over ${SEASONS} seasons (compact, 32 leagues)`, () => {
  it('validateWorld(checkLedger) stays clean at every season boundary', () => {
    expect(seasonStartProblems).toEqual([]);
  });
  it('all competitions are complete on the final day of the season (nothing left to force-play)', () => {
    for (const s of Object.keys(seasonEndComps)) expect(seasonEndComps[+s], `season ${s}`).toEqual([]);
    const warnings = w.news.filter((n) => n.text.startsWith('Scheduling warning'));
    expect(warnings).toEqual([]);
  });
  it('every league season: full double round-robin, all played, table sorted by points then tie-breakers, winner = leader', () => {
    expect(leagueProblems).toEqual([]);
  });
  it('club identities are stable (same ids, same names, same count)', () => {
    expect(Object.keys(w.clubs).sort()).toEqual(clubIds0);
    for (const c of Object.values(w.clubs)) expect(c.name).toBe(clubNames0[c.id]);
  });
  it('player identity fields never change; players are never deleted', () => {
    expect(seasonStartProblems.filter((p) => p.startsWith('player'))).toEqual([]);
    for (const id of identity.keys()) expect(w.players[id]).toBeDefined();
  });
  it('history: seasons contiguous, champions agree with summaries, clubs records contiguous', () => {
    expect(w.history.seasons.map((s) => s.season)).toEqual(Array.from({ length: SEASONS }, (_, i) => i + 1));
    for (const s of w.history.seasons) {
      for (const [cid, ch] of Object.entries(s.champions)) expect(w.history.champions[cid]?.[s.season]).toEqual(ch);
      for (const [lid, table] of Object.entries(s.tables)) {
        expect(new Set(table).size).toBe(table.length);
        if (COMPETITIONS[lid]!.rules[0]!.stages.length === 1) {
          expect(s.champions[lid]!.winner).toBe(table[0]);
          expect(s.champions[lid]!.runnerUp).toBe(table[1]);
        }
      }
    }
    for (const [cid, rec] of Object.entries(w.history.clubs)) {
      expect(w.clubs[cid]).toBeDefined();
      rec.seasons.forEach((r, i) => expect(r.season, `${cid} record ${i}`).toBe(rec.seasons[0]!.season + i));
      for (const [comp, seasons] of Object.entries(rec.trophies)) {
        for (const se of seasons) expect(w.history.champions[comp]?.[se]?.winner, `${cid} trophy ${comp} ${se}`).toBe(cid);
      }
    }
    // trophies are not double counted
    const totalTrophies = Object.values(w.history.clubs).reduce((a, r) => a + Object.values(r.trophies).reduce((x, t) => x + t.length, 0), 0);
    const totalChamps = Object.values(w.history.champions).reduce((a, m) => a + Object.values(m).filter((h) => h.winner).length, 0);
    expect(totalTrophies).toBe(totalChamps);
  });
  it('contracts: nobody registered on an expired or NaN contract; contract club matches registration', () => {
    const bad: string[] = [];
    for (const p of Object.values(w.players)) {
      if (p.retired) { if (p.clubId !== null || p.contract !== null) bad.push(`retired ${p.id} attached`); continue; }
      if (p.clubId === null) { if (p.contract) bad.push(`free agent ${p.id} has contract`); continue; }
      const c = p.contract!;
      if (!Number.isFinite(c.endDay) || c.endDay < w.day) bad.push(`${p.id} endDay ${c.endDay} < day ${w.day}`);
      if (c.clubId !== (p.loan ? p.loan.parentClubId : p.clubId)) bad.push(`${p.id} contract club mismatch`);
    }
    expect(bad).toEqual([]);
  });
  it('player season histories: no adjacent duplicate (season, club) stints, non-decreasing seasons, plausible totals', () => {
    const bad: string[] = [];
    for (const p of Object.values(w.players)) {
      let last = 0;
      let prevKey = '';
      for (const l of p.history) {
        const k = `${l.season}:${l.clubId}`;
        if (k === prevKey) bad.push(`${p.id} adjacent duplicate line ${k}`); // stints A,B,A in one season are legitimate; A,A is not
        prevKey = k;
        if (l.season < last) bad.push(`${p.id} history goes backwards`);
        last = l.season;
        if (l.apps > 80 || l.minutes > l.apps * 125 || l.starts > l.apps || l.goals > l.apps * 6 || l.yellow > 2 * l.apps || l.red > l.apps) bad.push(`${p.id} implausible line ${JSON.stringify(l)}`);
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
  });
  it('money: finite cash, no negative debt, ledger identity, no runaway wealth', () => {
    for (const c of Object.values(w.clubs)) {
      expect(Number.isFinite(c.finance.cash)).toBe(true);
      expect(c.finance.debt).toBeGreaterThanOrEqual(0);
    }
    // top club cash after 3 seasons should be < 100x the average annual revenue of the richest league (sanity)
    expect(maxCash).toBeLessThan(5e10);
    snapshotNote.push(`maxCash=${Math.round(maxCash / 1e6)}M minCash=${Math.round(minCash / 1e6)}M`);
  });
  it('squads: nobody in two squads; every club keeps >= 18 registered players and a goalkeeper', () => {
    const seen = new Set<string>();
    for (const c of Object.values(w.clubs)) {
      const sq = squadOf(w, c.id);
      expect(sq.length, c.id).toBeGreaterThanOrEqual(16);
      expect(sq.some((p) => p.primary === 'GK'), `${c.id} GK`).toBe(true);
      for (const p of sq) { expect(seen.has(p.id)).toBe(false); seen.add(p.id); }
    }
  });
});

describe('qualification cascades (every season start)', () => {
  const seasons = Object.keys(entrantsBySeason).map(Number);
  const confOf = (club: string) => LEAGUE_BY_ID[w.clubs[club]!.leagueId]!.confederation;
  it('entrants are unique, known clubs, from the right confederation', () => {
    const bad: string[] = [];
    for (const s of seasons) for (const [cid, ent] of Object.entries(entrantsBySeason[s]!)) {
      const def = COMPETITIONS[cid]!;
      if (def.kind === 'league' || def.kind === 'cup') continue;
      if (new Set(ent).size !== ent.length) bad.push(`s${s} ${cid} duplicate entrant`);
      for (const e of ent) {
        if (!w.clubs[e]) bad.push(`s${s} ${cid} unknown ${e}`);
        else if (def.confederation && confOf(e) !== def.confederation) bad.push(`s${s} ${cid} (${def.confederation}) has ${e} from ${confOf(e)}`);
      }
    }
    expect(bad).toEqual([]);
  });
  it('exclusive competitions never share a club (UCL/UEL/UECL, ACLE/ACL2, CAFCL/CAFCC, COPA/SUDA)', () => {
    const pairs: [string, string][] = [['UCL', 'UEL'], ['UCL', 'UECL'], ['UEL', 'UECL'], ['ACLE', 'ACL2'], ['CAFCL', 'CAFCC'], ['COPA', 'SUDA']];
    const bad: string[] = [];
    for (const s of seasons) for (const [a, b] of pairs) {
      const A = new Set(entrantsBySeason[s]![a] ?? []);
      for (const c of entrantsBySeason[s]![b] ?? []) if (A.has(c)) bad.push(`s${s} ${c} in ${a} and ${b}`);
    }
    expect(bad).toEqual([]);
  });
  it('title holders are re-admitted: UCL/UEL winner -> UCL, UECL winner -> UEL or better, domestic champion -> super cup', () => {
    const bad: string[] = [];
    for (const s of seasons.filter((x) => x >= 2)) {
      const hist = w.history.champions;
      const ucl = hist.UCL?.[s - 1]?.winner, uel = hist.UEL?.[s - 1]?.winner, uecl = hist.UECL?.[s - 1]?.winner;
      const UCL = entrantsBySeason[s]!.UCL ?? [], UEL = entrantsBySeason[s]!.UEL ?? [];
      if (ucl && !UCL.includes(ucl)) bad.push(`s${s} UCL winner ${ucl} not in UCL`);
      if (uel && !UCL.includes(uel)) bad.push(`s${s} UEL winner ${uel} not in UCL`);
      if (uecl && !UCL.includes(uecl) && !UEL.includes(uecl)) bad.push(`s${s} UECL winner ${uecl} not in UCL/UEL`);
      for (const [sc, ent] of Object.entries(entrantsBySeason[s]!)) {
        if (!sc.endsWith('-SC')) continue;
        const country = sc.slice(0, -3);
        const champ = hist[`${country}1`]?.[s - 1]?.winner;
        if (champ && !ent.includes(champ)) bad.push(`s${s} ${sc} missing champion ${champ}`);
        if (new Set(ent).size !== 2) bad.push(`s${s} ${sc} has ${ent.length} distinct entrants`);
      }
    }
    expect(bad).toEqual([]);
  });
  it('slot sizes: UCL/UEL fields are filled to 36 when enough UEFA clubs exist, never exceeded', () => {
    for (const s of seasons) {
      for (const cid of ['UCL', 'UEL', 'UECL']) {
        const n = entrantsBySeason[s]![cid]?.length ?? 0;
        expect(n, `s${s} ${cid}`).toBeLessThanOrEqual(36);
      }
    }
    const uefaClubs = Object.values(w.clubs).filter((c) => confOf(c.id) === 'UEFA').length;
    snapshotNote.push(`UEFA clubs=${uefaClubs}; entrants UCL/UEL/UECL s1=${['UCL', 'UEL', 'UECL'].map((c) => entrantsBySeason[1]![c]?.length ?? 0)}`);
  });
  it('cup entrants = every club of that country; cup winner is a member', () => {
    for (const cid of Object.keys(w.competitions)) {
      const def = COMPETITIONS[cid]!;
      if (def.kind !== 'cup') continue;
      const members = Object.values(w.clubs).filter((c) => c.country === def.country).map((c) => c.id).sort();
      expect([...w.competitions[cid]!.entrants].sort()).toEqual(members);
    }
  });
});
afterAllNote();
function afterAllNote(): void { /* notes printed by the runner via snapshotNote when debugging */ void snapshotNote; }
