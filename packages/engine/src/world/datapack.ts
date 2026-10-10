/**
 * Optional real-world data packs.
 *
 * The engine generates a fictional universe. A *data pack* overlays real names (clubs, stadiums, coaches, players)
 * and optional crest images on top of it, without changing how anything is simulated:
 *  - clubs of a league are matched to generated clubs by strength order (the pack lists a league's clubs
 *    strongest-first), so the strongest generated club receives the first pack club;
 *  - pack players replace generated players of the same position, matched by rating order; an optional per-player
 *    `overall` estimate rescales the generated attributes, and is always an *unofficial estimate* supplied by the pack;
 *  - everything the pack did not cover stays generated, and the counts of what was applied are stored in
 *    `world.dataPack` so the UI can say so.
 *
 * A pack is untrusted input: it is size-limited and every string/number is validated. Crest images may only be local
 * (`file://`, `asset:`) or small embedded `data:image/...` URIs; remote URLs are refused (the app is offline-first).
 * Logos, likenesses and ratings are the pack author's responsibility; nothing licensed is bundled in this repository.
 */
import { clamp } from '../math';
import { ATTR_KEYS, POSITIONS, type Club, type Manager, type Player, type Position } from '../types';
import { overall } from '../players';
import { squadOf } from './runtime';
import { leagueSquadRules } from './squad';
import type { DataPackInfo, WorldState } from './types';

export interface PackPlayer {
  name: string;
  position: Position;
  nationality?: string; // 3-letter code
  birthYear?: number;
  /** Optional unofficial rating estimate (1..99) used to rescale the generated attributes. */
  overall?: number;
}

export interface PackManager { name: string; nationality?: string; birthYear?: number }

export interface PackClub {
  name: string;
  shortName?: string;
  city?: string;
  colors?: [string, string];
  stadium?: { name: string; capacity?: number };
  /** `file://…`, `asset:…` or `data:image/(png|jpeg|webp);base64,…` (<= 300 KB). */
  crest?: string;
  manager?: PackManager;
  /** Best player first within a position (or give `overall`). */
  players?: PackPlayer[];
}

export interface DataPack {
  format: 'football-universe-data-pack';
  version: 1;
  id: string;
  name: string;
  source: string;
  licence: string;
  /** League id (e.g. `ENG1`) -> clubs, strongest first. */
  leagues: Record<string, PackClub[]>;
}

export class DataPackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataPackError';
  }
}

const LIMITS = { clubs: 600, playersPerClub: 60, text: 80, crestBytes: 300_000, json: 20_000_000 } as const;
const LEAGUE_ID = /^[A-Z]{3}[0-9]$/;
const CODE = /^[A-Z]{3}$/;
const HEX = /^#[0-9a-fA-F]{6}$/;
const POSITION_SET: ReadonlySet<string> = new Set(POSITIONS);

function clean(v: unknown, what: string, max: number = LIMITS.text): string {
  if (typeof v !== 'string') throw new DataPackError(`${what} must be text`);
  const s = v.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (s.length === 0 || s.length > max) throw new DataPackError(`${what} must be 1-${max} characters`);
  return s;
}

/** Crests may only be local or embedded images; a remote URL would make the offline app talk to the network. */
export function isSafeCrest(s: string): boolean {
  if (/^file:\/\/[^\s]+$/.test(s) || /^asset:[A-Za-z0-9_./-]+$/.test(s)) return true;
  return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s) && s.length <= LIMITS.crestBytes;
}

function safeCrest(v: unknown, what: string): string {
  const s = clean(v, what, LIMITS.crestBytes + 64);
  if (isSafeCrest(s)) return s;
  throw new DataPackError(`${what} must be a file://, asset: or small embedded image URI (remote URLs are not allowed)`);
}

function optYear(v: unknown, what: string): number | undefined {
  if (v === undefined) return undefined;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1960 || v > 2015) throw new DataPackError(`${what} must be a birth year between 1960 and 2015`);
  return v;
}

function optCode(v: unknown, what: string): string | undefined {
  if (v === undefined) return undefined;
  if (typeof v !== 'string' || !CODE.test(v)) throw new DataPackError(`${what} must be a 3-letter code`);
  return v;
}

/** Parse and validate a data pack from JSON text or an object. Throws `DataPackError` with a precise message. */
export function parseDataPack(input: string | unknown): DataPack {
  let raw: unknown = input;
  if (typeof input === 'string') {
    if (input.length > LIMITS.json) throw new DataPackError('data pack is too large');
    if (/"(?:__proto__|constructor|prototype)"\s*:/.test(input)) throw new DataPackError('data pack contains a reserved property name');
    try { raw = JSON.parse(input); } catch { throw new DataPackError('data pack is not valid JSON'); }
  }
  const o = raw as Record<string, unknown> | null;
  if (typeof o !== 'object' || o === null || o.format !== 'football-universe-data-pack' || o.version !== 1) throw new DataPackError('not a Football Universe data pack (format/version)');
  const leaguesIn = o.leagues;
  if (typeof leaguesIn !== 'object' || leaguesIn === null || Array.isArray(leaguesIn)) throw new DataPackError('leagues must be an object');
  const leagues: Record<string, PackClub[]> = Object.create(null) as Record<string, PackClub[]>;
  let clubCount = 0;
  for (const [lid, list] of Object.entries(leaguesIn)) {
    if (!LEAGUE_ID.test(lid)) throw new DataPackError(`invalid league id ${JSON.stringify(lid.slice(0, 12))}`);
    if (!Array.isArray(list)) throw new DataPackError(`${lid}: clubs must be a list`);
    leagues[lid] = list.map((c: Record<string, unknown>, i): PackClub => {
      const at = `${lid}[${i}]`;
      if (++clubCount > LIMITS.clubs) throw new DataPackError('too many clubs');
      if (typeof c !== 'object' || c === null) throw new DataPackError(`${at} must be an object`);
      const club: PackClub = { name: clean(c.name, `${at}.name`) };
      if (c.shortName !== undefined) club.shortName = clean(c.shortName, `${at}.shortName`, 12);
      if (c.city !== undefined) club.city = clean(c.city, `${at}.city`);
      if (c.colors !== undefined) {
        const col = c.colors as unknown;
        if (!Array.isArray(col) || col.length !== 2 || !col.every((x) => typeof x === 'string' && HEX.test(x))) throw new DataPackError(`${at}.colors must be two #rrggbb values`);
        club.colors = [col[0] as string, col[1] as string];
      }
      if (c.stadium !== undefined) {
        const st = c.stadium as Record<string, unknown>;
        if (typeof st !== 'object' || st === null) throw new DataPackError(`${at}.stadium must be an object`);
        const cap = st.capacity;
        if (cap !== undefined && (typeof cap !== 'number' || !Number.isInteger(cap) || cap < 1000 || cap > 150000)) throw new DataPackError(`${at}.stadium.capacity must be 1000-150000`);
        club.stadium = { name: clean(st.name, `${at}.stadium.name`), ...(cap !== undefined ? { capacity: cap } : {}) };
      }
      if (c.crest !== undefined) club.crest = safeCrest(c.crest, `${at}.crest`);
      if (c.manager !== undefined) {
        const m = c.manager as Record<string, unknown>;
        if (typeof m !== 'object' || m === null) throw new DataPackError(`${at}.manager must be an object`);
        const nationality = optCode(m.nationality, `${at}.manager.nationality`);
        const birthYear = optYear(m.birthYear, `${at}.manager.birthYear`);
        club.manager = { name: clean(m.name, `${at}.manager.name`), ...(nationality ? { nationality } : {}), ...(birthYear ? { birthYear } : {}) };
      }
      if (c.players !== undefined) {
        if (!Array.isArray(c.players) || c.players.length > LIMITS.playersPerClub) throw new DataPackError(`${at}.players must be a list of at most ${LIMITS.playersPerClub}`);
        club.players = c.players.map((p: Record<string, unknown>, j): PackPlayer => {
          const pat = `${at}.players[${j}]`;
          if (typeof p !== 'object' || p === null) throw new DataPackError(`${pat} must be an object`);
          if (typeof p.position !== 'string' || !POSITION_SET.has(p.position)) throw new DataPackError(`${pat}.position must be one of ${POSITIONS.join(', ')}`);
          const ov = p.overall;
          if (ov !== undefined && (typeof ov !== 'number' || !Number.isFinite(ov) || ov < 1 || ov > 99)) throw new DataPackError(`${pat}.overall must be 1-99`);
          const nationality = optCode(p.nationality, `${pat}.nationality`);
          const birthYear = optYear(p.birthYear, `${pat}.birthYear`);
          return { name: clean(p.name, `${pat}.name`), position: p.position as Position, ...(nationality ? { nationality } : {}), ...(birthYear ? { birthYear } : {}), ...(ov !== undefined ? { overall: ov } : {}) };
        });
      }
      return club;
    });
  }
  return {
    format: 'football-universe-data-pack', version: 1, id: clean(o.id, 'id', 40), name: clean(o.name, 'name'),
    source: clean(o.source, 'source', 200), licence: clean(o.licence, 'licence', 200), leagues,
  };
}

const dayOfBirthYear = (year: number): number => Math.round((Date.UTC(year, 5, 30) - Date.UTC(2026, 7, 1)) / 86400000);

/** Shift a generated player's attributes so their overall at the primary position approaches `target`. */
function rescale(p: Player, target: number): void {
  for (let pass = 0; pass < 3; pass++) {
    const diff = target - overall(p);
    if (Math.abs(diff) < 0.5) break;
    for (const k of ATTR_KEYS) p.attrs[k] = clamp(Math.round((p.attrs[k] + diff) * 100) / 100, 1, 100);
  }
  p.pot = Math.max(p.pot, overall(p));
}

/**
 * Apply a validated pack to a freshly generated world (call before the first simulated day). Deterministic: depends only
 * on the world and the pack. Returns the provenance record that is also stored on the world.
 */
export function applyDataPack(world: WorldState, pack: DataPack): DataPackInfo {
  const applied = { clubs: 0, players: 0, managers: 0, crests: 0 };
  const taken = new Set<string>(Object.values(world.clubs).map((c) => c.name));
  const usedPlayerIds = new Set<string>();
  for (const [leagueId, packClubs] of Object.entries(pack.leagues)) {
    const generated: Club[] = (world.leagueMembers[leagueId] ?? []).map((id) => world.clubs[id] as Club).filter(Boolean);
    generated.sort((a, b) => b.reputation - a.reputation || (a.id < b.id ? -1 : 1));
    const n = Math.min(generated.length, packClubs.length);
    for (let i = 0; i < n; i++) {
      const club = generated[i] as Club;
      const pc = packClubs[i] as PackClub;
      if (taken.has(pc.name) && club.name !== pc.name) continue; // never create two clubs with one name
      taken.delete(club.name);
      taken.add(pc.name);
      club.name = pc.name;
      club.shortName = pc.shortName ?? pc.name.replace(/[^A-Za-zÀ-ÿ0-9 ]/g, '').split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase();
      if (pc.city) club.city = pc.city;
      if (pc.colors) club.colors = pc.colors;
      if (pc.stadium) club.stadium = { name: pc.stadium.name, capacity: pc.stadium.capacity ?? club.stadium.capacity };
      if (pc.crest) { club.crest = pc.crest; applied.crests++; }
      club.fictional = false;
      applied.clubs++;
      if (pc.manager && club.managerId) {
        const m = world.managers[club.managerId] as Manager | undefined;
        if (m) {
          m.name = pc.manager.name;
          if (pc.manager.nationality) m.nationality = pc.manager.nationality;
          if (pc.manager.birthYear) m.birthDay = dayOfBirthYear(pc.manager.birthYear);
          applied.managers++;
        }
      }
      if (pc.players) applied.players += applyPlayers(world, club, pc.players, usedPlayerIds);
    }
  }
  const info: DataPackInfo = { id: pack.id, name: pack.name, source: pack.source, licence: pack.licence, applied };
  world.dataPack = info;
  return info;
}

function applyPlayers(world: WorldState, club: Club, list: PackPlayer[], used: Set<string>): number {
  const squad = [...squadOf(world, club.id)];
  const cap = leagueSquadRules(world, club).maxForeign;
  let foreign = squad.filter((p) => p.nationality !== club.country).length;
  let n = 0;
  for (const pos of POSITIONS) {
    const wanted = list.filter((p) => p.position === pos);
    if (wanted.length === 0) continue;
    // pack players rated best-first (explicit `overall` wins, else list order); generated players best-first too
    const rated = [...wanted].sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1) || wanted.indexOf(a) - wanted.indexOf(b));
    const pool = squad.filter((p) => p.primary === pos && !used.has(p.id)).sort((a, b) => overall(b) - overall(a) || (a.id < b.id ? -1 : 1));
    for (let i = 0; i < Math.min(rated.length, pool.length); i++) {
      const pp = rated[i] as PackPlayer;
      const gp = pool[i] as Player;
      used.add(gp.id);
      gp.name = pp.name;
      if (pp.birthYear) gp.birthDay = dayOfBirthYear(pp.birthYear);
      if (pp.nationality && pp.nationality !== gp.nationality) {
        const becomesForeign = pp.nationality !== club.country;
        const wasForeign = gp.nationality !== club.country;
        const delta = Number(becomesForeign) - Number(wasForeign);
        if (cap === null || foreign + delta <= cap) { gp.nationality = pp.nationality; foreign += delta; }
      }
      if (pp.overall !== undefined) rescale(gp, pp.overall);
      n++;
    }
  }
  return n;
}
