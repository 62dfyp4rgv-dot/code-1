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
  // extended associations: champions of the stronger ones enter the Champions League directly (qualifying rounds are not
  // simulated), the rest start in the Europa/Conference League; cup winners are added to the Europa League below
  SUI1: [1, 0, 1], GRE1: [1, 0, 1], UKR1: [1, 0, 1], DEN1: [1, 0, 1], CRO1: [1, 0, 1], SRB1: [1, 0, 1],
  AUT1: [0, 1, 1], CZE1: [0, 1, 1], POL1: [0, 1, 1], SWE1: [0, 1, 1], NOR1: [0, 1, 1],
};

/** AFC Champions League Elite places per association and zone (scenario weights, scaled down when a zone has more claimants than seats). */
const ACLE_WEST: Record<string, number> = { SAU1: 5, UAE1: 4, QAT1: 3, IRN1: 3, UZB1: 2 };
const ACLE_EAST: Record<string, number> = { JPN1: 4, KOR1: 3, CHN1: 3, AUS1: 2, THA1: 2 };
/** Associations outside the two ACLE zones that still feed the AFC second-tier competition. */
const AFC_OTHER = ['IND1'];
const CAF_SLOTS: Record<string, number> = { EGY1: 3, MAR1: 3, RSA1: 2, TUN1: 2, ALG1: 2, NGA1: 2, GHA1: 1, SEN1: 1 };
const CONCACAF_SLOTS: Record<string, number> = { USA1: 6, MEX1: 6, CRC1: 2, CAM1: 2, CAN1: 2 };
const COPA_SLOTS: Record<string, number> = { BRA1: 7, ARG1: 6, COL1: 3, CHI1: 3, URU1: 3, ECU1: 3, PAR1: 3, PER1: 2 };
const SUDA_RANGES: Record<string, [number, number]> = { BRA1: [8, 11], ARG1: [7, 10], COL1: [4, 6], CHI1: [4, 6], URU1: [4, 6], ECU1: [4, 6], PAR1: [4, 6], PER1: [3, 5] };

/** Largest-remainder apportionment of `total` seats; weights that already fit are returned unchanged. */
export function apportion(weights: Record<string, number>, total: number): Record<string, number> {
  const keys = Object.keys(weights);
  const sum = keys.reduce((a, k) => a + (weights[k] as number), 0);
  if (sum <= total) return { ...weights };
  const exact = keys.map((k) => ({ k, v: ((weights[k] as number) * total) / sum }));
  const out: Record<string, number> = {};
  for (const e of exact) out[e.k] = Math.max(1, Math.floor(e.v));
  let left = total - Object.values(out).reduce((a, b) => a + b, 0);
  const byRemainder = [...exact].sort((a, b) => (b.v - Math.floor(b.v)) - (a.v - Math.floor(a.v)) || (a.k < b.k ? -1 : 1));
  for (let i = 0; left > 0 && i < byRemainder.length * 2; i++, left--) out[(byRemainder[i % byRemainder.length] as { k: string }).k]!++;
  return out;
}

const range = (league: string, from: number, to: number): QualSlot => ({ kind: 'league', league, from, to });

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
    if (a > 0) ucl.push(range(l, 1, a));
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
  const afcWest = Object.keys(ACLE_WEST).filter((l) => active.has(l));
  const afcEast = Object.keys(ACLE_EAST).filter((l) => active.has(l));
  const afcOther = AFC_OTHER.filter((l) => active.has(l));
  if (afcWest.length + afcEast.length + afcOther.length > 0) {
    const pick = (all: Record<string, number>, ids: string[]): Record<string, number> => Object.fromEntries(ids.map((l) => [l, all[l] as number]));
    const wRaw = pick(ACLE_WEST, afcWest);
    const eRaw = pick(ACLE_EAST, afcEast);
    const w = apportion(wRaw, 12);
    const e = apportion(eRaw, 12);
    const scaled = (id: string): boolean => (afcWest.includes(id) ? w[id] !== wRaw[id] : e[id] !== eRaw[id]);
    if (afcWest.length + afcEast.length > 0) {
      specs.push({
        comp: 'ACLE', exclude: [],
        quotas: [
          { size: 12, slots: afcWest.map((l) => range(l, 1, w[l] as number)), fillLeagues: afcWest },
          { size: 12, slots: afcEast.map((l) => range(l, 1, e[l] as number)), fillLeagues: afcEast },
        ],
      });
    }
    const afcAll = [...afcWest, ...afcEast, ...afcOther];
    // ACL Two: the three places below the Elite places (legacy associations keep their original fixed ranges while unscaled)
    const acl2Range = (l: string): QualSlot => {
      const elite = (w[l] ?? e[l] ?? 0) as number;
      if (['SAU1', 'UAE1', 'QAT1', 'JPN1', 'KOR1', 'CHN1', 'AUS1'].includes(l) && !scaled(l)) return range(l, l === 'SAU1' ? 6 : 4, l === 'SAU1' ? 8 : 6);
      return range(l, elite + 1, elite + 3);
    };
    specs.push({ comp: 'ACL2', exclude: ['ACLE'], quotas: [{ size: 32, slots: afcAll.map(acl2Range), fillLeagues: afcAll }] });
  }

  // CAF
  const caf = Object.keys(CAF_SLOTS).filter((l) => active.has(l));
  if (caf.length > 0) {
    const n = CAF_SLOTS;
    specs.push({ comp: 'CAFCL', exclude: [], quotas: [{ size: 16, slots: caf.map((l) => range(l, 1, n[l] as number)), fillLeagues: caf }] });
    specs.push({ comp: 'CAFCC', exclude: ['CAFCL'], quotas: [{ size: 16, slots: caf.map((l) => range(l, (n[l] as number) + 1, (n[l] as number) + 2)), fillLeagues: caf }] });
    specs.push({ comp: 'CAFSC', exclude: [], quotas: [{ size: 2, slots: [{ kind: 'winnerOf', comp: 'CAFCL' }, { kind: 'winnerOf', comp: 'CAFCC' }, { kind: 'runnerUpOf', comp: 'CAFCL' }], fillLeagues: [] }] });
  }

  // CONCACAF
  const cc = Object.keys(CONCACAF_SLOTS).filter((l) => active.has(l));
  if (cc.length > 0) {
    const n = CONCACAF_SLOTS;
    specs.push({ comp: 'CCC', exclude: [], quotas: [{ size: 27, slots: [{ kind: 'winnerOf', comp: 'CCAC' }, ...cc.map((l) => range(l, 1, n[l] as number))], fillLeagues: cc }] });
    // Central American Cup: the next places of the Central American / Caribbean associations (their winner joins the Champions Cup)
    const central = ['CRC1', 'CAM1'].filter((l) => active.has(l));
    if (central.length > 0) specs.push({ comp: 'CCAC', exclude: ['CCC'], quotas: [{ size: 16, slots: central.map((l) => range(l, (n[l] as number) + 1, (n[l] as number) + 6)), fillLeagues: central }] });
    if (active.has('USA1') && active.has('MEX1')) {
      specs.push({ comp: 'CAMP', exclude: [], quotas: [{ size: 2, slots: [{ kind: 'winnerOf', comp: 'USA1' }, { kind: 'winnerOf', comp: 'MEX1' }], fillLeagues: [] }] });
    }
  }

  // CONMEBOL
  const cm = Object.keys(COPA_SLOTS).filter((l) => active.has(l));
  if (cm.length > 0) {
    const n = COPA_SLOTS;
    const s = SUDA_RANGES;
    specs.push({ comp: 'COPA', exclude: [], quotas: [{ size: 32, slots: [{ kind: 'winnerOf', comp: 'COPA' }, ...cm.map((l) => range(l, 1, n[l] as number))], fillLeagues: cm }] });
    specs.push({ comp: 'SUDA', exclude: ['COPA'], quotas: [{ size: 32, slots: cm.map((l) => range(l, (s[l] as [number, number])[0], (s[l] as [number, number])[1])), fillLeagues: cm }] });
    specs.push({ comp: 'RECOPA', exclude: [], quotas: [{ size: 2, slots: [{ kind: 'winnerOf', comp: 'COPA' }, { kind: 'winnerOf', comp: 'SUDA' }, { kind: 'runnerUpOf', comp: 'COPA' }], fillLeagues: [] }] });
  }

  // OFC
  const ofc = ['NZL1', 'FIJ1'].filter((l) => active.has(l));
  if (ofc.length > 0) {
    specs.push({ comp: 'OCL', exclude: [], quotas: [{ size: 8, slots: [{ kind: 'winnerOf', comp: 'OCL' }, ...ofc.map((l) => range(l, 1, l === 'NZL1' ? 3 : 2))], fillLeagues: ofc }] });
  }

  // FIFA Intercontinental Cup: the previous season's champion of each confederation (best-reputed club if there is none)
  const confLeagues = (c: string): string[] => activeLeagues.filter((l) => LEAGUE_BY_ID[l]?.confederation === c && LEAGUE_BY_ID[l]?.tier === 1);
  const champion = (comp: string, conf: string): Quota => ({ size: 1, slots: [{ kind: 'winnerOf', comp }], fillLeagues: confLeagues(conf) });
  specs.push({
    comp: 'FIC', exclude: [],
    quotas: [champion('UCL', 'UEFA'), champion('COPA', 'CONMEBOL'), champion('ACLE', 'AFC'), champion('CAFCL', 'CAF'), champion('CCC', 'CONCACAF'), champion('OCL', 'OFC')],
  });

  // FIFA Club World Cup (quotas by confederation + one wildcard)
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
  return specs;
}

/**
 * Clubs ranked `from..to` in last season's table of `league` that still belong to it. A club relegated at the end of the
 * season has left the league and loses its league-based place (only matters for small fields where a qualification
 * range overlaps the relegation zone; title holders and cup winners keep their rights through their own slots).
 */
function ranked(league: string, from: number, to: number, input: QualInput): string[] {
  const members = input.leagueMembers[league];
  return (input.tables[league] ?? []).slice(from - 1, to).filter((c) => !members || members.includes(c));
}

/** Candidate clubs (best first) for one slot. */
function candidates(slot: QualSlot, input: QualInput): string[] {
  switch (slot.kind) {
    case 'league':
      return ranked(slot.league, slot.from, slot.to, input);
    case 'cupWinner': {
      const h = input.history[slot.cup]?.[input.season - 1];
      const out: string[] = [];
      if (h?.winner) out.push(h.winner);
      if (slot.fallback) out.push(...ranked(slot.fallback.league, slot.fallback.from, slot.fallback.to, input));
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
