import { Rng } from '../rng';
import type { ScheduleSpec } from './types';

export interface Pairing {
  home: string;
  away: string;
}

export interface TeamInfo {
  id: string;
  country: string;
  /** Seeding strength: higher = stronger. */
  coefficient: number;
  /** Optional geographic zone (e.g. AFC 'west' / 'east') used by zoned league phases. */
  zone?: string;
}

// ---------------------------------------------------------------- calendar helpers

export const DAYS_PER_WEEK = 7;
export const WEEKS_PER_SEASON = 52;
export const DAYS_PER_SEASON = WEEKS_PER_SEASON * DAYS_PER_WEEK;

/** Week number (within the season cycle) hosting round `roundIdx` (0-based) of a schedule, skipping blocked weeks. */
export function weekOfRound(spec: ScheduleSpec, roundIdx: number): number {
  if (spec.weeks && spec.weeks.length > 0) {
    const last = spec.weeks[spec.weeks.length - 1] as number;
    return roundIdx < spec.weeks.length ? (spec.weeks[roundIdx] as number) : last + (roundIdx - spec.weeks.length + 1);
  }
  const skip = new Set(spec.skipWeeks ?? []);
  let week = spec.startWeek;
  let remaining = roundIdx;
  // First round sits at startWeek (or the next unblocked week).
  while (skip.has(week)) week++;
  while (remaining > 0) {
    week += spec.weekStep;
    while (skip.has(week)) week++;
    remaining--;
  }
  return week;
}

/** Absolute day (relative to season start) for a fixture. `fixtureIdx` spreads kick-offs via `altDow`. */
export function dayOfFixture(spec: ScheduleSpec, roundIdx: number, fixtureIdx: number, legOffsetWeeks = 0): number {
  const week = weekOfRound(spec, roundIdx) + legOffsetWeeks;
  const explicit = spec.dows?.[roundIdx];
  const dow = explicit !== undefined ? explicit : spec.altDow !== undefined && fixtureIdx % 2 === 1 ? spec.altDow : spec.dow;
  return week * DAYS_PER_WEEK + dow;
}

// ---------------------------------------------------------------- round robin

/** Circle-method round-robin. Returns rounds of pairings; second leg mirrors the first with sides swapped. */
export function roundRobin(ids: readonly string[], legs: 1 | 2, rng: Rng): Pairing[][] {
  const arr: (string | null)[] = rng.shuffle(ids);
  if (arr.length % 2 === 1) arr.push(null);
  const n = arr.length;
  const first: Pairing[][] = [];
  for (let r = 0; r < n - 1; r++) {
    const round: Pairing[] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i] as string | null;
      const b = arr[n - 1 - i] as string | null;
      if (a === null || b === null) continue;
      const flip = i === 0 ? r % 2 === 1 : (i + r) % 2 === 1;
      round.push(flip ? { home: b, away: a } : { home: a, away: b });
    }
    first.push(round);
    // rotate everything except the first element
    arr.splice(1, 0, arr.pop() as string | null);
  }
  if (legs === 1) return first;
  const second = first.map((round) => round.map((p) => ({ home: p.away, away: p.home })));
  return [...first, ...second];
}

// ---------------------------------------------------------------- league phase (Swiss-style)

interface PhaseResult {
  pairings: Pairing[];
  relaxed: 'none' | 'countryCap' | 'countryRule';
}

class Budget {
  constructor(public left: number) {}
  spend(): boolean {
    this.left--;
    return this.left >= 0;
  }
}

/**
 * Pot-based league-phase pairings: each team plays exactly one home and one away opponent from every pot
 * (including its own), giving `2 * pots` matches. Same-country matches are forbidden and the number of
 * opponents from any single other country is capped; if the constraints cannot be met after many attempts they
 * are relaxed in stages and the relaxation is reported (never silently).
 */
export function leaguePhasePairings(teams: readonly TeamInfo[], pots: number, maxSameCountry: number, rng: Rng): PhaseResult {
  const n = teams.length;
  if (n % pots !== 0) throw new Error(`leaguePhasePairings: ${n} teams not divisible into ${pots} pots`);
  const stages: { cap: number; hardCountry: boolean; label: PhaseResult['relaxed'] }[] = [
    { cap: maxSameCountry, hardCountry: true, label: 'none' },
    { cap: maxSameCountry + 1, hardCountry: true, label: 'countryCap' },
    { cap: 99, hardCountry: true, label: 'countryCap' },
    { cap: 99, hardCountry: false, label: 'countryRule' },
  ];
  for (const st of stages) {
    for (let attempt = 0; attempt < (st.label === 'none' ? 40 : 20); attempt++) {
      const out = tryPairings(teams, pots, st.cap, st.hardCountry, rng.derive(`lp:${st.label}:${st.cap}:${attempt}`));
      if (out) return { pairings: out, relaxed: st.label };
    }
  }
  throw new Error('leaguePhasePairings: could not construct pairings');
}

function tryPairings(teams: readonly TeamInfo[], pots: number, cap: number, hardCountry: boolean, rng: Rng): Pairing[] | null {
  const sorted = [...teams].sort((a, b) => b.coefficient - a.coefficient || (a.id < b.id ? -1 : 1));
  const size = teams.length / pots;
  const potArr: TeamInfo[][] = [];
  for (let p = 0; p < pots; p++) potArr.push(rng.shuffle(sorted.slice(p * size, (p + 1) * size)));
  const opp = new Map<string, Set<string>>();
  const cc = new Map<string, Map<string, number>>();
  for (const t of teams) { opp.set(t.id, new Set()); cc.set(t.id, new Map()); }
  const out: Pairing[] = [];
  const budget = new Budget(40000);

  const canPlay = (a: TeamInfo, b: TeamInfo): boolean => {
    if (a.id === b.id) return false;
    if ((opp.get(a.id) as Set<string>).has(b.id)) return false;
    if (hardCountry && a.country === b.country) return false;
    if (hardCountry && a.country !== b.country) {
      if (((cc.get(a.id) as Map<string, number>).get(b.country) ?? 0) >= cap) return false;
      if (((cc.get(b.id) as Map<string, number>).get(a.country) ?? 0) >= cap) return false;
    }
    return true;
  };
  const add = (h: TeamInfo, g: TeamInfo): void => {
    (opp.get(h.id) as Set<string>).add(g.id);
    (opp.get(g.id) as Set<string>).add(h.id);
    const bump = (x: TeamInfo, y: TeamInfo): void => {
      const m = cc.get(x.id) as Map<string, number>;
      m.set(y.country, (m.get(y.country) ?? 0) + 1);
    };
    bump(h, g); bump(g, h);
    out.push({ home: h.id, away: g.id });
  };
  const undo = (h: TeamInfo, g: TeamInfo): void => {
    (opp.get(h.id) as Set<string>).delete(g.id);
    (opp.get(g.id) as Set<string>).delete(h.id);
    const drop = (x: TeamInfo, y: TeamInfo): void => {
      const m = cc.get(x.id) as Map<string, number>;
      m.set(y.country, (m.get(y.country) ?? 1) - 1);
    };
    drop(h, g); drop(g, h);
    out.pop();
  };

  // hosts[i] hosts exactly one team from guests (a bijection)
  const assign = (hosts: TeamInfo[], guests: TeamInfo[], i: number, used: boolean[]): boolean => {
    if (i === hosts.length) return true;
    if (!budget.spend()) return false;
    const host = hosts[i] as TeamInfo;
    const order = rng.shuffle(guests.map((_, k) => k));
    if (!hardCountry) order.sort((x, y) => Number((guests[x] as TeamInfo).country === host.country) - Number((guests[y] as TeamInfo).country === host.country));
    for (const k of order) {
      if (used[k]) continue;
      const g = guests[k] as TeamInfo;
      if (!canPlay(host, g)) continue;
      add(host, g);
      used[k] = true;
      if (assign(hosts, guests, i + 1, used)) return true;
      used[k] = false;
      undo(host, g);
      if (budget.left < 0) return false;
    }
    return false;
  };

  for (let p = 0; p < pots; p++) {
    const own = potArr[p] as TeamInfo[];
    if (!assign(own, own, 0, own.map(() => false))) return null;
    for (let q = p + 1; q < pots; q++) {
      const other = potArr[q] as TeamInfo[];
      if (!assign(own, other, 0, other.map(() => false))) return null; // p hosts q
      if (!assign(other, own, 0, own.map(() => false))) return null; // q hosts p
    }
  }
  return out;
}

/**
 * Assign pairings to `rounds` matchdays so every team plays exactly once per matchday (a proper edge colouring
 * of the regular opponent graph). Uses min-conflicts local search with a tabu list and random restarts.
 * Returns null if no solution is found within the iteration budget.
 */
/**
 * Assign pairings to `rounds` matchdays so every team plays exactly once per matchday (a 1-factorisation of
 * the regular opponent graph). Exact backtracking: each matchday is a perfect matching of the remaining graph,
 * enumerated by DFS (most-constrained team first, random order), recursing over matchdays. Returns null if the
 * node budget is exhausted so callers can retry with different pairings.
 */
export function colourMatchdays(teamIds: readonly string[], pairings: readonly Pairing[], rounds: number, rng: Rng, nodeBudget = 400000): number[] | null {
  const idx = new Map<string, number>();
  teamIds.forEach((t, i) => idx.set(t, i));
  const T = teamIds.length;
  const m = pairings.length;
  const eu = pairings.map((p) => idx.get(p.home) as number);
  const ev = pairings.map((p) => idx.get(p.away) as number);
  const adj: number[][] = Array.from({ length: T }, () => []);
  for (let e = 0; e < m; e++) { (adj[eu[e] as number] as number[]).push(e); (adj[ev[e] as number] as number[]).push(e); }
  const colour = new Array<number>(m).fill(-1);
  let nodes = 0;
  const otherEnd = (e: number, v: number): number => ((eu[e] as number) === v ? (ev[e] as number) : (eu[e] as number));

  /** Enumerate perfect matchings of the uncoloured edges in random order; `visit` returns true to stop. */
  const enumerate = (visit: (matching: number[]) => boolean): boolean => {
    const matched = new Array<boolean>(T).fill(false);
    const chosen: number[] = [];
    const dfs = (): boolean => {
      if (++nodes > nodeBudget) return true; // abort everything
      // most constrained unmatched vertex
      let bestV = -1;
      let bestDeg = Infinity;
      for (let v = 0; v < T; v++) {
        if (matched[v]) continue;
        let d = 0;
        for (const e of adj[v] as number[]) if (colour[e] === -1 && !matched[otherEnd(e, v)]) d++;
        if (d < bestDeg) { bestDeg = d; bestV = v; if (d <= 1) break; }
      }
      if (bestV === -1) return visit(chosen);
      if (bestDeg === 0) return false;
      const cands = (adj[bestV] as number[]).filter((e) => colour[e] === -1 && !matched[otherEnd(e, bestV)]);
      for (const e of rng.shuffle(cands)) {
        const w = otherEnd(e, bestV);
        matched[bestV] = true; matched[w] = true; chosen.push(e);
        if (dfs()) return true;
        chosen.pop(); matched[bestV] = false; matched[w] = false;
      }
      return false;
    };
    return dfs();
  };

  const solve = (day: number): boolean => {
    if (day === rounds) return colour.every((c) => c !== -1);
    let found = false;
    let tries = 0;
    enumerate((matching) => {
      for (const e of matching) colour[e] = day;
      const ok = solve(day + 1);
      if (ok) { found = true; return true; }
      for (const e of matching) colour[e] = -1;
      tries++;
      return tries > (day >= rounds - 3 ? 400 : 12);
    });
    return found;
  };
  return solve(0) ? colour : null;
}

// ---------------------------------------------------------------- groups

/** Draw `nGroups` groups using seeded pots; avoids same-country teams in a group when feasible. */
export function drawGroups(teams: readonly TeamInfo[], nGroups: number, avoidSameCountry: boolean, rng: Rng): TeamInfo[][] {
  const sorted = [...teams].sort((a, b) => b.coefficient - a.coefficient || (a.id < b.id ? -1 : 1));
  const per = Math.ceil(sorted.length / nGroups);
  for (let attempt = 0; attempt < 200; attempt++) {
    const r = rng.derive(`groups:${attempt}`);
    const groups: TeamInfo[][] = Array.from({ length: nGroups }, () => []);
    let ok = true;
    for (let pot = 0; pot < per && ok; pot++) {
      const potTeams = r.shuffle(sorted.slice(pot * nGroups, (pot + 1) * nGroups));
      const free = groups.map((_, i) => i);
      for (const t of potTeams) {
        const cands = free.filter((g) => (groups[g] as TeamInfo[]).length === pot && (!avoidSameCountry || !(groups[g] as TeamInfo[]).some((x) => x.country === t.country)));
        if (cands.length === 0) { ok = false; break; }
        const g = r.pick(cands);
        (groups[g] as TeamInfo[]).push(t);
        free.splice(free.indexOf(g), 1);
      }
    }
    if (ok) return groups;
  }
  // Fallback: ignore country protection.
  const groups: TeamInfo[][] = Array.from({ length: nGroups }, () => []);
  sorted.forEach((t, i) => {
    const row = Math.floor(i / nGroups);
    const col = i % nGroups;
    (groups[row % 2 === 0 ? col : nGroups - 1 - col] as TeamInfo[]).push(t);
  });
  return groups;
}

// ---------------------------------------------------------------- knockout

export const nextPow2 = (n: number): number => {
  let p = 1;
  while (p < n) p *= 2;
  return p;
};

/** Standard bracket slot order for P (power of 2) seeds: pairs (1,P), (P/2+1.., ...) keeping 1 and 2 apart until the final. */
export function bracketOrder(P: number): number[] {
  let order = [1];
  while (order.length < P) {
    const size = order.length * 2;
    const next: number[] = [];
    for (const s of order) next.push(s, size + 1 - s);
    order = next;
  }
  return order;
}

export interface FirstRoundSlot {
  home: string;
  away: string | null; // null = bye for `home`
}

/**
 * Build the first knockout round for `teams` (ordered strongest first).
 * Top seeds get byes if N is not a power of two. `shuffleRest` randomises the draw of non-bye teams.
 */
export function firstRound(teams: readonly string[], shuffleRest: boolean, rng: Rng): FirstRoundSlot[] {
  const N = teams.length;
  const P = nextPow2(N);
  const nBye = P - N;
  const order = bracketOrder(P);
  const slot: (string | null)[] = new Array<string | null>(P).fill(null);
  // seeds 1..nBye receive byes (their partner seed P+1-s is empty)
  const byeTeams = teams.slice(0, nBye);
  let rest = teams.slice(nBye);
  if (shuffleRest) rest = rng.shuffle(rest);
  const restQueue = [...rest];
  for (let i = 0; i < P; i++) {
    const seed = order[i] as number;
    if (seed <= nBye) slot[i] = byeTeams[seed - 1] as string;
    else if (seed > N) slot[i] = null;
    else if (shuffleRest) slot[i] = restQueue.shift() as string;
    else slot[i] = teams[seed - 1] as string;
  }
  const out: FirstRoundSlot[] = [];
  for (let i = 0; i < P; i += 2) {
    const a = slot[i];
    const b = slot[i + 1];
    if (a !== null && b !== null) out.push({ home: a as string, away: b as string });
    else out.push({ home: (a ?? b) as string, away: null });
  }
  return out;
}
