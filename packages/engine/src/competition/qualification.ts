/**
 * Qualification: converts last season's results into next season's entrants for every non-league competition.
 * Slot counts are configured defaults (see registry honesty note). Mechanics implemented generically:
 *  - ranks from a league table, cup winners with fall-back places (cup winner already qualified => next in line),
 *  - title holders and winners over a look-back window,
 *  - exclusivity cascade between competitions (a club qualifies for at most one of an exclusive group),
 *  - fill from reputation when slots are vacant (stands in for qualifying rounds, which are not simulated).
 */
import { LEAGUE_BY_ID, COMPETITIONS } from './registry';

export type QualSlot =
  | { kind: 'league'; league: string; from: number; to: number }
  | { kind: 'cupWinner'; cup: string; fallback?: { league: string; from: number; to: number } }
  | { kind: 'winnerOf'; comp: string; lookback?: number }
  | { kind: 'runnerUpOf'; comp: string };

export interface Quota {
  size: number;
  slots: QualSlot[];
  fillLeagues: string[];
}

export interface QualSpec {
  comp: string;
  quotas: Quota[];
  /** Competitions whose entrants cannot also enter this one this season. */
  exclude: string[];
}

export interface HistoryEntry {
  winner: string | null;
  runnerUp: string | null;
}

export interface QualInput {
  season: number; // the season being prepared
  /** Final league table order (club ids) from last season per league id. */
  tables: Record<string, string[]>;
  /** history[compId][season] */
  history: Record<string, Record<number, HistoryEntry>>;
  /** Clubs currently registered in each league for the upcoming season. */
  leagueMembers: Record<string, string[]>;
  reputation(clubId: string): number;
}

const UEFA_SLOTS: Record<string, [number, number, number]> = {
  ENG1: [4, 1, 1], ESP1: [4, 1, 1], ITA1: [4, 1, 1], GER1: [4, 1, 1], FRA1: [3, 1, 1],
  POR1: [2, 1, 1], NED1: [2, 1, 1], BEL1: [1, 1, 1], SCO1: [1, 0, 1], TUR1: [1, 1, 1],
};

const range = (league: string, from: number, to: number): QualSlot => ({ kind: 'league', league, from, to });

function present(ids: string[], available: ReadonlySet<string>): string[] {
  return ids.filter((i) => available.has(i));
}

/** Build qualification specs for the selected leagues. Missing leagues simply contribute no slots. */
export function buildQualSpecs(activeLeagues: readonly string[]): QualSpec[] {
  const active = new Set(activeLeagues);
  const specs: QualSpec[] = [];
  const uefa = Object.keys(UEFA_SLOTS).filter((l) => active.has(l));
  const uefaAll = [...activeLeagues].filter((l) => LEAGUE_BY_ID[l]?.confederation === 'UEFA' && LEAGUE_BY_ID[l]?.tier === 1);

  // UEFA
  const ucl: QualSlot[] = [{ kind: 'winnerOf', comp: 'UCL' }, { kind: 'winnerOf', comp: 'UEL' }];
  const uel: QualSlot[] = [{ kind: 'winnerOf', comp: 'UECL' }];
  const uecl: QualSlot[] = [];
  for (const l of uefa) {
    const [a, b, c] = UEFA_SLOTS[l] as [number, number, number];
    ucl.push(range(l, 1, a));
    if (b > 0) uel.push(range(l, a + 1, a + b));
    if (c > 0) uecl.push(range(l, a + b + 1, a + b + c));
    const country = LEAGUE_BY_ID[l]?.country as string;
    if (COMPETITIONS[`${country}-CUP`]) uel.push({ kind: 'cupWinner', cup: `${country}-CUP`, fallback: { league: l, from: a + b + c + 1, to: a + b + c + 3 } });
  }
  if (uefa.length > 0) {
    specs.push({ comp: 'UCL', exclude: [], quotas: [{ size: 36, slots: ucl, fillLeagues: uefaAll }] });
    specs.push({ comp: 'UEL', exclude: ['UCL'], quotas: [{ size: 36, slots: uel, fillLeagues: uefaAll }] });
    specs.push({ comp: 'UECL', exclude: ['UCL', 'UEL'], quotas: [{ size: 36, slots: uecl, fillLeagues: uefaAll }] });
    specs.push({
      comp: 'USC', exclude: [], quotas: [{ size: 2, slots: [{ kind: 'winnerOf', comp: 'UCL' }, { kind: 'winnerOf', comp: 'UEL' }, { kind: 'runnerUpOf', comp: 'UCL' }], fillLeagues: [] }],
    });
  }

  // AFC
  const afcWest = ['SAU1', 'UAE1', 'QAT1'].filter((l) => active.has(l));
  const afcEast = ['JPN1', 'KOR1', 'CHN1', 'AUS1'].filter((l) => active.has(l));
  if (afcWest.length + afcEast.length > 0) {
    const w: Record<string, number> = { SAU1: 5, UAE1: 4, QAT1: 3 };
    const e: Record<string, number> = { JPN1: 4, KOR1: 3, CHN1: 3, AUS1: 2 };
    specs.push({
      comp: 'ACLE', exclude: [],
      quotas: [
        { size: 12, slots: afcWest.map((l) => range(l, 1, w[l] as number)), fillLeagues: afcWest },
        { size: 12, slots: afcEast.map((l) => range(l, 1, e[l] as number)), fillLeagues: afcEast },
      ],
    });
    const afcAll = [...afcWest, ...afcEast];
    specs.push({ comp: 'ACL2', exclude: ['ACLE'], quotas: [{ size: 32, slots: afcAll.map((l) => range(l, (l === 'SAU1' ? 6 : 4), (l === 'SAU1' ? 8 : 6))), fillLeagues: afcAll }] });
  }

  // CAF
  const caf = ['EGY1', 'MAR1', 'RSA1', 'TUN1', 'ALG1'].filter((l) => active.has(l));
  if (caf.length > 0) {
    const n: Record<string, number> = { EGY1: 3, MAR1: 3, RSA1: 2, TUN1: 2, ALG1: 2 };
    specs.push({ comp: 'CAFCL', exclude: [], quotas: [{ size: 16, slots: caf.map((l) => range(l, 1, n[l] as number)), fillLeagues: caf }] });
    specs.push({ comp: 'CAFCC', exclude: ['CAFCL'], quotas: [{ size: 16, slots: caf.map((l) => range(l, (n[l] as number) + 1, (n[l] as number) + 2)), fillLeagues: caf }] });
  }

  // CONCACAF
  const cc = ['USA1', 'MEX1', 'CRC1', 'CAM1'].filter((l) => active.has(l));
  if (cc.length > 0) {
    const n: Record<string, number> = { USA1: 6, MEX1: 6, CRC1: 2, CAM1: 2 };
    specs.push({ comp: 'CCC', exclude: [], quotas: [{ size: 27, slots: cc.map((l) => range(l, 1, n[l] as number)), fillLeagues: cc }] });
  }

  // CONMEBOL
  const cm = ['BRA1', 'ARG1', 'COL1', 'CHI1', 'URU1'].filter((l) => active.has(l));
  if (cm.length > 0) {
    const n: Record<string, number> = { BRA1: 7, ARG1: 6, COL1: 3, CHI1: 3, URU1: 3 };
    const s: Record<string, [number, number]> = { BRA1: [8, 11], ARG1: [7, 10], COL1: [4, 6], CHI1: [4, 6], URU1: [4, 6] };
    specs.push({ comp: 'COPA', exclude: [], quotas: [{ size: 32, slots: [{ kind: 'winnerOf', comp: 'COPA' }, ...cm.map((l) => range(l, 1, n[l] as number))], fillLeagues: cm }] });
    specs.push({ comp: 'SUDA', exclude: ['COPA'], quotas: [{ size: 32, slots: cm.map((l) => range(l, (s[l] as [number, number])[0], (s[l] as [number, number])[1])), fillLeagues: cm }] });
  }

  // OFC
  const ofc = ['NZL1', 'FIJ1'].filter((l) => active.has(l));
  if (ofc.length > 0) {
    specs.push({ comp: 'OCL', exclude: [], quotas: [{ size: 8, slots: [{ kind: 'winnerOf', comp: 'OCL' }, ...ofc.map((l) => range(l, 1, l === 'NZL1' ? 3 : 2))], fillLeagues: ofc }] });
  }

  // FIFA Club World Cup (quotas by confederation + one wildcard)
  const confLeagues = (c: string): string[] => activeLeagues.filter((l) => LEAGUE_BY_ID[l]?.confederation === c && LEAGUE_BY_ID[l]?.tier === 1);
  specs.push({
    comp: 'CWC', exclude: [],
    quotas: [
      { size: 12, slots: [{ kind: 'winnerOf', comp: 'UCL', lookback: 4 }], fillLeagues: confLeagues('UEFA') },
      { size: 6, slots: [{ kind: 'winnerOf', comp: 'COPA', lookback: 4 }], fillLeagues: confLeagues('CONMEBOL') },
      { size: 4, slots: [{ kind: 'winnerOf', comp: 'ACLE', lookback: 4 }], fillLeagues: confLeagues('AFC') },
      { size: 4, slots: [{ kind: 'winnerOf', comp: 'CAFCL', lookback: 4 }], fillLeagues: confLeagues('CAF') },
      { size: 4, slots: [{ kind: 'winnerOf', comp: 'CCC', lookback: 4 }], fillLeagues: confLeagues('CONCACAF') },
      { size: 1, slots: [{ kind: 'winnerOf', comp: 'OCL', lookback: 4 }], fillLeagues: confLeagues('OFC') },
      { size: 1, slots: [], fillLeagues: [...activeLeagues].filter((l) => LEAGUE_BY_ID[l]?.tier === 1) },
    ],
  });

  // Domestic super cups (previous champion vs cup winner)
  for (const l of activeLeagues) {
    const prof = LEAGUE_BY_ID[l];
    if (!prof || prof.tier !== 1 || !COMPETITIONS[`${prof.country}-SC`]) continue;
    const cup = `${prof.country}-CUP`;
    specs.push({
      comp: `${prof.country}-SC`, exclude: [],
      quotas: [{
        size: 2, fillLeagues: [],
        slots: [{ kind: 'winnerOf', comp: l }, ...(COMPETITIONS[cup] ? [{ kind: 'cupWinner', cup, fallback: { league: l, from: 2, to: 4 } } as QualSlot] : [])],
      }],
    });
  }
  void present;
  return specs;
}

/** Candidate clubs (best first) for one slot. */
function candidates(slot: QualSlot, input: QualInput): string[] {
  switch (slot.kind) {
    case 'league': {
      const t = input.tables[slot.league] ?? [];
      return t.slice(slot.from - 1, slot.to);
    }
    case 'cupWinner': {
      const h = input.history[slot.cup]?.[input.season - 1];
      const out: string[] = [];
      if (h?.winner) out.push(h.winner);
      if (slot.fallback) out.push(...(input.tables[slot.fallback.league] ?? []).slice(slot.fallback.from - 1, slot.fallback.to));
      return out;
    }
    case 'winnerOf': {
      const out: string[] = [];
      const look = slot.lookback ?? 1;
      for (let s = input.season - 1; s >= input.season - look && s >= 1; s--) {
        const w = input.history[slot.comp]?.[s]?.winner;
        if (w) out.push(w);
      }
      return out;
    }
    case 'runnerUpOf': {
      const r = input.history[slot.comp]?.[input.season - 1]?.runnerUp;
      return r ? [r] : [];
    }
  }
}

/**
 * Allocate entrants for every spec, in the order given (callers pass UCL before UEL before UECL etc.).
 * Returns competition id -> entrants (club ids, deduplicated, never exceeding quota sizes).
 */
export function allocateEntrants(specs: readonly QualSpec[], input: QualInput): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const memberOf = new Set<string>();
  for (const ms of Object.values(input.leagueMembers)) for (const m of ms) memberOf.add(m);
  for (const spec of specs) {
    const taken = new Set<string>();
    for (const ex of spec.exclude) for (const c of result[ex] ?? []) taken.add(c);
    const entrants: string[] = [];
    for (const q of spec.quotas) {
      const mine: string[] = [];
      const take = (c: string): void => {
        if (mine.length >= q.size || taken.has(c) || !memberOf.has(c)) return;
        taken.add(c);
        mine.push(c);
      };
      for (const slot of q.slots) {
        const multiSeat = slot.kind === 'league' || (slot.kind === 'winnerOf' && (slot.lookback ?? 1) > 1);
        if (!multiSeat) {
          // single-seat slots: first available candidate
          for (const c of candidates(slot, input)) {
            if (mine.length >= q.size) break;
            if (!taken.has(c) && memberOf.has(c)) { take(c); break; }
          }
        } else {
          for (const c of candidates(slot, input)) take(c);
        }
      }
      if (mine.length < q.size) {
        const pool: string[] = [];
        for (const l of q.fillLeagues) for (const c of input.leagueMembers[l] ?? []) if (!taken.has(c)) pool.push(c);
        pool.sort((a, b) => input.reputation(b) - input.reputation(a) || (a < b ? -1 : 1));
        for (const c of pool) {
          if (mine.length >= q.size) break;
          take(c);
        }
      }
      entrants.push(...mine);
    }
    result[spec.comp] = entrants;
  }
  return result;
}
