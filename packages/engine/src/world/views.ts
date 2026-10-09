/**
 * Read-only view-models for the UI. They never expose hidden attributes of players the viewer's club does not
 * control (exact ability and potential are replaced by scouting estimates), and they contain only plain data.
 */
import { clamp } from '../math';
import { ageOf, overall, positionalOverall } from '../players';
import { COMPETITIONS, LEAGUE_BY_ID } from '../competition/registry';
import { activeRules, currentTable } from '../competition/engine';
import type { CompetitionDef, Fixture, TableRow } from '../competition/types';
import { ATTR_KEYS, GK_ATTRS, MENTAL_ATTRS, PHYSICAL_ATTRS, TECHNICAL_ATTRS, type Club, type Player, type Position } from '../types';
import { engineContext } from './matchday';
import { squadOf, freeAgents, allPlayers } from './runtime';
import { clubRecord, seasonStartDay } from './calendar';
import { scoutedEstimate } from './transfers';
import { marketValue } from './valuation';
import type { StoredMatch, WorldState } from './types';
import { reviewClubFinance } from './finance';

// ---------------------------------------------------------------- dates

const MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

export interface DateInfo {
  day: number;
  season: number;
  dayOfSeason: number;
  week: number;
  /** ISO date; season 1 starts on 1 Aug 2026. The 364-day cycle drifts one day per year (documented simplification). */
  iso: string;
  label: string;
  seasonLabel: string;
}

export function dateInfo(day: number): DateInfo {
  const season = Math.floor(day / 364) + 1;
  const dayOfSeason = day - (season - 1) * 364;
  const ms = Date.UTC(2025 + season, 7, 1) + dayOfSeason * 86400000;
  const d = new Date(ms);
  const iso = d.toISOString().slice(0, 10);
  const month = MONTHS[d.getUTCMonth() >= 7 ? d.getUTCMonth() - 7 : d.getUTCMonth() + 5] ?? '';
  return {
    day, season, dayOfSeason, week: Math.floor(dayOfSeason / 7), iso, label: `${d.getUTCDate()} ${month} ${d.getUTCFullYear()}`,
    seasonLabel: `${2025 + season}/${String((2026 + season) % 100).padStart(2, '0')}`,
  };
}

// ---------------------------------------------------------------- tables

export interface TableRowView extends TableRow {
  clubName: string;
  shortName: string;
  isHuman: boolean;
  form: ('W' | 'D' | 'L')[];
}

export function leagueTableView(world: WorldState, compId: string, group = 'main', stageIndex = 0): TableRowView[] {
  const comp = world.competitions[compId];
  const def = COMPETITIONS[compId];
  if (!comp || !def) return [];
  const ctx = engineContext(world);
  const rows = currentTable(comp, def, ctx, stageIndex, group);
  const stageId = activeRules(def, comp.season).stages[stageIndex]?.id;
  return rows.map((r) => {
    const club = world.clubs[r.clubId] as Club;
    const recent = comp.fixtures
      .filter((f) => f.stageId === stageId && f.status === 'played' && (f.home === r.clubId || f.away === r.clubId) && (f.group === group || group === 'main' || f.group === null))
      .sort((a, b) => a.day - b.day)
      .slice(-5)
      .map((f): 'W' | 'D' | 'L' => {
        const res = f.result as NonNullable<Fixture['result']>;
        const gf = f.home === r.clubId ? res.homeGoals : res.awayGoals;
        const ga = f.home === r.clubId ? res.awayGoals : res.homeGoals;
        return gf > ga ? 'W' : gf === ga ? 'D' : 'L';
      });
    return { ...r, clubName: club.name, shortName: club.shortName, isHuman: club.id === world.config.humanClubId, form: recent };
  });
}

// ---------------------------------------------------------------- fixtures & matches

export interface FixtureView {
  id: string;
  competitionId: string;
  competition: string;
  stage: string;
  round: number;
  leg: number;
  day: number;
  date: string;
  home: { id: string; name: string };
  away: { id: string; name: string };
  status: Fixture['status'];
  score: string | null;
  pens: string | null;
  neutral: boolean;
}

function fixtureView(world: WorldState, f: Fixture): FixtureView {
  const def = COMPETITIONS[f.competitionId] as CompetitionDef;
  const stage = activeRules(def, f.season).stages.find((s) => s.id === f.stageId);
  const r = f.result;
  return {
    id: f.id, competitionId: f.competitionId, competition: def.shortName, stage: stage?.name ?? f.stageId, round: f.round, leg: f.leg, day: f.day, date: dateInfo(f.day).label,
    home: { id: f.home, name: (world.clubs[f.home] as Club).name }, away: { id: f.away, name: (world.clubs[f.away] as Club).name }, status: f.status,
    score: r ? `${r.homeGoals}-${r.awayGoals}${r.extraTime ? ' aet' : ''}` : null, pens: r?.pens ? `${r.pens.home}-${r.pens.away} pens` : null, neutral: f.neutral,
  };
}

export function clubFixtures(world: WorldState, clubId: string, opts: { upcoming?: boolean; limit?: number } = {}): FixtureView[] {
  const out: Fixture[] = [];
  for (const comp of Object.values(world.competitions)) for (const f of comp.fixtures) if (f.home === clubId || f.away === clubId) out.push(f);
  out.sort((a, b) => a.day - b.day);
  const filtered = opts.upcoming === undefined ? out : out.filter((f) => (f.status === 'scheduled') === opts.upcoming);
  const sliced = opts.upcoming === false ? filtered.slice(-(opts.limit ?? 20)) : filtered.slice(0, opts.limit ?? 20);
  return sliced.map((f) => fixtureView(world, f));
}

export function fixturesOnDayView(world: WorldState, day: number): FixtureView[] {
  const out: FixtureView[] = [];
  for (const comp of Object.values(world.competitions)) for (const f of comp.fixtures) if (f.day === day) out.push(fixtureView(world, f));
  return out;
}

export interface MatchEventView { minute: number; period: number; side: 'home' | 'away'; type: string; text: string }
export interface MatchView {
  fixture: FixtureView;
  stats: StoredMatch['stats'];
  goals: { minute: number; side: 'home' | 'away'; scorer: string; kind: string }[];
  motm: string | null;
  events: MatchEventView[] | null;
  lineups: { home: { name: string; position: string; rating: number; goals: number; minutes: number }[]; away: { name: string; position: string; rating: number; goals: number; minutes: number }[] } | null;
  replayAvailable: boolean;
}

export function matchView(world: WorldState, fixtureId: string): MatchView | null {
  const m = world.matches[fixtureId];
  const comp = world.competitions[fixtureId.split(':')[0] ?? ''];
  const f = comp?.fixtures.find((x) => x.id === fixtureId);
  if (!m || !f) return null;
  const nm = (id: string): string => world.players[id]?.name ?? id;
  const events: MatchEventView[] | null = m.events
    ? m.events.map((e) => ({ minute: e.minute, period: e.period, side: e.side, type: e.type, text: describeEvent(e, nm) }))
    : null;
  return {
    fixture: fixtureView(world, f), stats: m.stats,
    goals: m.goals.map(([minute, side, pid, kind]) => ({ minute, side, scorer: nm(pid), kind })), motm: m.motm ? nm(m.motm) : null, events,
    lineups: m.players ? {
      home: m.players.filter((p) => p.side === 'home').map((p) => ({ name: p.name, position: p.position, rating: p.rating, goals: p.goals, minutes: p.minutes })),
      away: m.players.filter((p) => p.side === 'away').map((p) => ({ name: p.name, position: p.position, rating: p.rating, goals: p.goals, minutes: p.minutes })),
    } : null,
    replayAvailable: m.replay !== null,
  };
}

function describeEvent(e: import('../match').MatchEvent, nm: (id: string) => string): string {
  switch (e.type) {
    case 'goal': return `GOAL ${nm(e.scorerId)}${e.assistId ? ` (assist ${nm(e.assistId)})` : ''} — ${e.kind}, xG ${e.xg.toFixed(2)} [${e.home}-${e.away}]`;
    case 'shot': return `${nm(e.playerId)} ${e.outcome === 'saved' ? 'shot saved' : e.outcome === 'blocked' ? 'shot blocked' : e.outcome === 'post' ? 'hits the post' : 'shoots wide'} (xG ${e.xg.toFixed(2)})`;
    case 'card': return `${e.card === 'yellow' ? 'Yellow card' : e.card === 'red' ? 'Red card' : 'Second yellow'} for ${nm(e.playerId)}`;
    case 'sub': return `Substitution: ${nm(e.onId)} replaces ${nm(e.offId)} (${e.reason})`;
    case 'injury': return `${nm(e.playerId)} is injured`;
    case 'foul': return `Foul by ${nm(e.playerId)}${e.inBox ? ' in the box' : ''}`;
    case 'corner': return 'Corner';
    case 'offside': return `${nm(e.playerId)} caught offside`;
    case 'tactical': return `Tactical change: ${e.change}`;
    case 'shootout': return `Penalty ${e.scored ? 'scored' : 'missed'} by ${nm(e.playerId)}`;
    case 'kickoff': return 'Kick-off';
    case 'halftime': return 'Half-time';
    case 'fulltime': return 'Full-time';
    case 'extraTimeStart': return 'Extra time begins';
  }
}

// ---------------------------------------------------------------- players

export interface PlayerRow {
  id: string;
  name: string;
  nationality: string;
  age: number;
  position: Position;
  /** Exact for own players, otherwise a scouting estimate (rounded). */
  ability: number;
  potential: number;
  exact: boolean;
  fatigue: number;
  form: number;
  morale: number;
  injury: { kind: string; returnDay: number } | null;
  suspended: boolean;
  wageWeekly: number | null;
  contractEnd: string | null;
  value: number;
  clubId: string | null;
  loanFrom: string | null;
  apps: number;
  goals: number;
  assists: number;
  avgRating: number | null;
}

export function playerRow(world: WorldState, p: Player, viewerClubId: string | null = world.config.humanClubId): PlayerRow {
  const viewer = viewerClubId ? world.clubs[viewerClubId] : undefined;
  const exact = !viewer || p.clubId === viewer.id;
  const est = exact || !viewer ? { ability: overall(p), potential: p.pot } : scoutedEstimate(world, viewer, p);
  const line = p.history.filter((l) => l.season === world.season).reduce((a, l) => ({ apps: a.apps + l.apps, goals: a.goals + l.goals, assists: a.assists + l.assists, rs: a.rs + l.ratingSum }), { apps: 0, goals: 0, assists: 0, rs: 0 });
  const wageVisible = exact || p.clubId === null;
  return {
    id: p.id, name: p.name, nationality: p.nationality, age: Math.floor(ageOf(p, world.day)), position: p.primary,
    ability: Math.round(est.ability), potential: Math.round(est.potential), exact, fatigue: Math.round(p.fatigue), form: Math.round(p.form * 10) / 10, morale: Math.round(p.morale),
    injury: p.injury ? { kind: p.injury.kind, returnDay: p.injury.returnDay } : null,
    suspended: Object.values(p.suspensions).some((n) => n > 0),
    wageWeekly: wageVisible ? (p.contract?.wageWeekly ?? null) : null,
    contractEnd: p.contract ? dateInfo(p.contract.endDay).label : null,
    value: marketValue(p, world.day, exact ? undefined : est), clubId: p.clubId, loanFrom: p.loan?.parentClubId ?? null,
    apps: line.apps, goals: line.goals, assists: line.assists, avgRating: line.apps > 0 ? Math.round((line.rs / line.apps) * 100) / 100 : null,
  };
}

export function squadView(world: WorldState, clubId: string): PlayerRow[] {
  const order: Record<string, number> = { GK: 0, CB: 1, LB: 2, RB: 3, DM: 4, CM: 5, AM: 6, LW: 7, RW: 8, ST: 9 };
  return [...squadOf(world, clubId)].sort((a, b) => (order[a.primary] ?? 9) - (order[b.primary] ?? 9) || overall(b) - overall(a)).map((p) => playerRow(world, p));
}

export interface PlayerProfile {
  row: PlayerRow;
  traits: string[];
  foot: string;
  weakFoot: number;
  positions: { position: Position; familiarity: number; rating: number }[];
  attributes: Record<'technical' | 'mental' | 'physical' | 'goalkeeping', { name: string; value: number }[]>;
  history: Player['history'];
  career: { apps: number; goals: number; assists: number };
  contract: { wageWeekly: number; end: string; role: string } | null;
  transfers: { day: string; from: string | null; to: string | null; fee: number; kind: string }[];
}

export function playerProfile(world: WorldState, playerId: string): PlayerProfile | null {
  const p = world.players[playerId];
  if (!p) return null;
  const row = playerRow(world, p);
  const exact = row.exact;
  const noise = (v: number): number => (exact ? Math.round(v) : Math.round(v / 3) * 3); // coarser view for unscouted players
  const group = (keys: readonly string[]): { name: string; value: number }[] => keys.map((k) => ({ name: k, value: noise(p.attrs[k as keyof typeof p.attrs]) }));
  const positions = (Object.keys({ GK: 0, CB: 0, LB: 0, RB: 0, DM: 0, CM: 0, AM: 0, LW: 0, RW: 0, ST: 0 }) as Position[])
    .map((pos) => ({ position: pos, familiarity: pos === p.primary ? 1 : (p.positions[pos] ?? 0), rating: Math.round(positionalOverall(p, pos)) }))
    .filter((x) => x.familiarity >= 0.6);
  void ATTR_KEYS;
  return {
    row, traits: p.traits, foot: p.foot, weakFoot: p.weakFoot, positions,
    attributes: { technical: group(TECHNICAL_ATTRS), mental: group(MENTAL_ATTRS), physical: group(PHYSICAL_ATTRS), goalkeeping: group(GK_ATTRS) },
    history: p.history, career: p.history.reduce((a, l) => ({ apps: a.apps + l.apps, goals: a.goals + l.goals, assists: a.assists + l.assists }), { apps: 0, goals: 0, assists: 0 }),
    contract: p.contract && (exact || p.clubId === null) ? { wageWeekly: p.contract.wageWeekly, end: dateInfo(p.contract.endDay).label, role: p.contract.squadRole } : null,
    transfers: world.transfers.filter((t) => t.playerId === playerId).map((t) => ({
      day: dateInfo(t.day).label, from: t.fromClubId ? (world.clubs[t.fromClubId]?.name ?? t.fromClubId) : null, to: t.toClubId ? (world.clubs[t.toClubId]?.name ?? t.toClubId) : null, fee: t.fee, kind: t.kind,
    })),
  };
}

// ---------------------------------------------------------------- clubs & finance

export interface ClubView {
  id: string; name: string; country: string; city: string; leagueId: string; league: string; reputation: number; stadium: { name: string; capacity: number };
  facilities: Club['facilities']; manager: { id: string; name: string; style: string; reputation: number } | null; philosophy: string; ownership: Club['ownership'];
  position: number | null; honours: { competition: string; seasons: number[] }[]; rivals: string[]; squadSize: number; tactics: Club['tactics'];
}

export function clubView(world: WorldState, clubId: string): ClubView | null {
  const c = world.clubs[clubId];
  if (!c) return null;
  const mgr = c.managerId ? world.managers[c.managerId] : undefined;
  const table = leagueTableView(world, c.leagueId);
  const pos = table.find((r) => r.clubId === clubId)?.position ?? null;
  const rec = clubRecord(world, clubId);
  return {
    id: c.id, name: c.name, country: c.country, city: c.city, leagueId: c.leagueId, league: COMPETITIONS[c.leagueId]?.name ?? c.leagueId, reputation: c.reputation,
    stadium: c.stadium, facilities: c.facilities, manager: mgr ? { id: mgr.id, name: mgr.name, style: mgr.style, reputation: mgr.reputation } : null, philosophy: c.philosophy,
    ownership: c.ownership, position: pos, honours: Object.entries(rec.trophies).map(([competition, seasons]) => ({ competition: COMPETITIONS[competition]?.name ?? competition, seasons })),
    rivals: c.rivals.map((r) => world.clubs[r]?.name ?? r), squadSize: squadOf(world, clubId).length, tactics: c.tactics,
  };
}

export interface FinanceView {
  cash: number; debt: number; transferBudget: number; wageBudgetWeekly: number; wageBillWeekly: number; embargoed: boolean;
  income: Record<string, number>; expenses: Record<string, number>; netThisSeason: number;
  squadCostRatio: number | null; ratioLimit: number | null; overLimit: boolean; upcomingInstallments: { dueIn: number; amount: number; memo: string }[];
}

export function financeView(world: WorldState, clubId: string): FinanceView | null {
  const c = world.clubs[clubId];
  if (!c) return null;
  const led = c.finance.seasonLedger;
  const income: Record<string, number> = {}; const expenses: Record<string, number> = {};
  for (const [k, v] of Object.entries(led)) (v >= 0 ? income : expenses)[k] = Math.abs(v);
  const review = reviewClubFinance(world, c);
  const wageBill = squadOf(world, clubId).reduce((a, p) => a + (p.contract ? (p.loan ? p.contract.wageWeekly * (1 - p.loan.parentWageShare) : p.contract.wageWeekly) : 0), 0);
  return {
    cash: c.finance.cash, debt: c.finance.debt, transferBudget: c.finance.transferBudget, wageBudgetWeekly: c.finance.wageBudgetWeekly, wageBillWeekly: wageBill,
    embargoed: world.day < c.finance.embargoUntilDay, income, expenses, netThisSeason: Object.values(led).reduce((a, b) => a + b, 0),
    squadCostRatio: review.revenue > 0 ? review.ratio : null, ratioLimit: review.limit, overLimit: review.overLimit,
    upcomingInstallments: c.finance.installments.map((i) => ({ dueIn: i.dueDay - world.day, amount: i.amount, memo: i.memo })),
  };
}

// ---------------------------------------------------------------- competitions

export interface CompetitionOverview {
  id: string; name: string; kind: string; confederation: string | null; status: string; season: number; entrants: number;
  verification: { status: string; note: string };
  stages: { id: string; name: string; type: string; status: string; groups: { id: string; table: TableRowView[] }[]; rounds: { round: number; ties: { home: string; away: string; winner: string | null; aggregate: string }[] }[] }[];
  winner: string | null; runnerUp: string | null;
}

export function competitionOverview(world: WorldState, compId: string): CompetitionOverview | null {
  const comp = world.competitions[compId];
  const def = COMPETITIONS[compId];
  if (!comp || !def) return null;
  const rules = activeRules(def, comp.season);
  const nm = (id: string): string => (id ? (world.clubs[id]?.name ?? id) : 'BYE');
  const stages = rules.stages.map((s, si) => {
    const st = comp.stages[si];
    const groups = st && s.type !== 'knockout' ? Object.keys(st.groups).map((g) => ({ id: g, table: leagueTableView(world, compId, g, si) })) : [];
    const rounds = st
      ? st.ties.map((ties, ri) => ({
          round: ri + 1,
          ties: ties.map((t) => {
            const fx = t.fixtureIds.map((id) => comp.fixtures.find((f) => f.id === id)).filter((f): f is Fixture => !!f && f.status === 'played');
            const agg = fx.length ? fx.map((f) => `${f.result?.homeGoals}-${f.result?.awayGoals}`).join(', ') : t.decidedBy === 'bye' ? 'bye' : 'to be played';
            return { home: nm(t.home), away: nm(t.away), winner: t.winner ? nm(t.winner) : null, aggregate: agg };
          }),
        }))
      : [];
    return { id: s.id, name: s.name, type: s.type, status: st?.status ?? 'pending', groups, rounds };
  });
  return {
    id: def.id, name: def.name, kind: def.kind, confederation: def.confederation, status: comp.status, season: comp.season, entrants: comp.entrants.length,
    verification: def.verification, stages, winner: comp.winner ? nm(comp.winner) : null, runnerUp: comp.runnerUp ? nm(comp.runnerUp) : null,
  };
}

export function competitionList(world: WorldState): { id: string; name: string; kind: string; confederation: string | null; country: string | null; status: string }[] {
  return Object.values(world.competitions).map((c) => {
    const d = COMPETITIONS[c.id] as CompetitionDef;
    return { id: c.id, name: d.name, kind: d.kind, confederation: d.confederation, country: d.country, status: c.status };
  }).sort((a, b) => (a.kind === 'league' ? 0 : 1) - (b.kind === 'league' ? 0 : 1) || a.name.localeCompare(b.name));
}

export function statLeaders(world: WorldState, compId: string, kind: 'goals' | 'assists' | 'rating', limit = 10): { player: string; playerId: string; club: string; value: number; apps: number }[] {
  const stats = world.seasonStats[compId] ?? {};
  const rows = Object.entries(stats).map(([pid, s]) => ({
    player: world.players[pid]?.name ?? pid, playerId: pid, club: world.clubs[s.clubId]?.shortName ?? '', apps: s.apps,
    value: kind === 'goals' ? s.goals : kind === 'assists' ? s.assists : s.apps >= 5 ? Math.round((s.ratingSum / s.apps) * 100) / 100 : 0,
  }));
  return rows.sort((a, b) => b.value - a.value || b.apps - a.apps).slice(0, limit);
}

// ---------------------------------------------------------------- market, news, records

export interface MarketFilter { position?: Position; minAge?: number; maxAge?: number; maxValue?: number; minAbility?: number; listedOnly?: boolean; freeAgentsOnly?: boolean; limit?: number }

export function transferMarketView(world: WorldState, f: MarketFilter = {}): PlayerRow[] {
  const humanId = world.config.humanClubId;
  const pool: Player[] = f.freeAgentsOnly ? freeAgents(world) : f.listedOnly ? Object.keys(world.transferList).map((id) => world.players[id]).filter((p): p is Player => !!p) : allPlayers(world).filter((p) => !p.retired && p.clubId !== humanId);
  const rows = pool.filter((p) => !p.retired && (!f.position || p.primary === f.position)).map((p) => playerRow(world, p));
  return rows
    .filter((r) => (f.minAge === undefined || r.age >= f.minAge) && (f.maxAge === undefined || r.age <= f.maxAge) && (f.maxValue === undefined || r.value <= f.maxValue) && (f.minAbility === undefined || r.ability >= f.minAbility))
    .sort((a, b) => b.ability - a.ability)
    .slice(0, f.limit ?? 50);
}

export function newsView(world: WorldState, opts: { clubId?: string; limit?: number } = {}): { day: string; kind: string; text: string; ref: string | null }[] {
  const items = world.news.filter((n) => !opts.clubId || n.clubIds.includes(opts.clubId)).slice(-(opts.limit ?? 30)).reverse();
  return items.map((n) => ({ day: dateInfo(n.day).label, kind: n.kind, text: n.text, ref: n.ref }));
}

export interface RecordsView {
  seasons: { season: number; label: string; champions: { competition: string; winner: string; runnerUp: string | null }[]; topScorer: { player: string; club: string; goals: number } | null }[];
  clubHonours: { club: string; titles: number }[];
  legends: { name: string; apps: number; goals: number; retiredSeason: number }[];
}

export function recordsView(world: WorldState): RecordsView {
  const honours = new Map<string, number>();
  const seasons = world.history.seasons.map((s) => {
    const champions: RecordsView['seasons'][number]['champions'] = [];
    for (const [cid, h] of Object.entries(s.champions)) {
      const d = COMPETITIONS[cid];
      if (!d || !h.winner) continue;
      if (d.kind === 'league' || d.kind === 'continental' || d.kind === 'intercontinental') honours.set(h.winner, (honours.get(h.winner) ?? 0) + 1);
      if (d.kind === 'league' && d.tier !== 1) continue;
      champions.push({ competition: d.shortName, winner: world.clubs[h.winner]?.name ?? h.winner, runnerUp: h.runnerUp ? (world.clubs[h.runnerUp]?.name ?? null) : null });
    }
    const best = Object.values(s.topScorers).flat().sort((a, b) => b.goals - a.goals)[0];
    return {
      season: s.season, label: dateInfo(seasonStartDay(s.season)).seasonLabel, champions,
      topScorer: best ? { player: world.players[best.playerId]?.name ?? best.playerId, club: world.clubs[best.clubId]?.name ?? '', goals: best.goals } : null,
    };
  });
  return {
    seasons,
    clubHonours: [...honours.entries()].map(([id, titles]) => ({ club: world.clubs[id]?.name ?? id, titles })).sort((a, b) => b.titles - a.titles).slice(0, 20),
    legends: world.history.legends.slice(-30).map((l) => ({ name: l.name, apps: l.apps, goals: l.goals, retiredSeason: l.retiredSeason })).sort((a, b) => b.goals - a.goals),
  };
}

export function leagueIdsByCountry(world: WorldState): { id: string; name: string; country: string; tier: number }[] {
  return Object.keys(world.leagueMembers).map((id) => ({ id, name: LEAGUE_BY_ID[id]?.name ?? id, country: LEAGUE_BY_ID[id]?.countryName ?? '', tier: LEAGUE_BY_ID[id]?.tier ?? 1 }));
}

export { clamp };
