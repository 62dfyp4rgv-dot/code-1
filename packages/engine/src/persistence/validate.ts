/**
 * Save-file hardening. A save file is untrusted input: its checksum only detects accidental damage (the file's author
 * can recompute it), so every load and import is also checked here.
 *  1. Raw text: property names that exist on `Object.prototype` are refused, so id-keyed plain objects can never alias
 *     the prototype (`__proto__`, `constructor`, `toString`, ...).
 *  2. Structure: ids are well formed and match their keys; numbers are finite; attribute vectors have the right length.
 *  3. Semantics: `validateWorld` hard violations (duplicate registrations, dangling references, ...) reject the file.
 */
import { ATTR_KEYS } from '../types';
import { isSafeCrest } from '../world/datapack';
import { validateWorld } from '../world/invariants';
import type { WorldState } from '../world/types';
import { SaveCorruptedError } from './errors';

export const LIMITS = {
  maxChunks: 20_000,
  maxChunkBytes: 8_000_000,
  maxTotalBytes: 256_000_000,
  /** Target size of one stored row; `encodeWorld` never exceeds it unless a single item is larger. */
  targetChunkBytes: 400_000,
} as const;

const ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/;
const PLAYER_ID = /^p[0-9]{1,9}$/;
const HOSTILE_KEY = /"(?:__proto__|constructor|prototype|toString|valueOf|hasOwnProperty|isPrototypeOf|propertyIsEnumerable|toLocaleString|__defineGetter__|__defineSetter__|__lookupGetter__|__lookupSetter__)"\s*:/;

/** Violations that describe legitimate (if undesirable) game states rather than corruption: they never block a load. */
const TOLERATED = new Set([
  'SQUAD_TOO_LARGE', 'SQUAD_TOO_SMALL', 'SQUAD_THIN', 'NO_GOALKEEPER', 'FOREIGN_LIMIT', 'CONTRACT_EXPIRED', 'DOUBLE_BOOKING',
  'NO_MANAGER', 'CASH_NEGATIVE', 'TRANSFER_MONEY_LEAK', 'HISTORY_GAP',
]);

/** Escaped printable ASCII (`\u005f`) is how a hostile key would dodge the pattern above; the encoder never emits it. */
const ESCAPED_ASCII = /\\u00[2-7][0-9a-fA-F]/;

export function assertSafeText(kind: string, text: string): void {
  if (text.length > LIMITS.maxChunkBytes) throw new SaveCorruptedError(`chunk ${kind} is too large (${text.length} bytes)`);
  if (ESCAPED_ASCII.test(text)) throw new SaveCorruptedError(`chunk ${kind} contains escaped ASCII text`);
  if (HOSTILE_KEY.test(text)) throw new SaveCorruptedError(`chunk ${kind} contains a reserved property name`);
}

export function isSafeId(id: unknown): id is string {
  return typeof id === 'string' && ID.test(id) && !(id in Object.prototype);
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const fin = (v: unknown): boolean => typeof v === 'number' && Number.isFinite(v);

function fail(msg: string): never {
  throw new SaveCorruptedError(msg);
}

function checkKeys(label: string, rec: unknown, idPattern: RegExp | null = null): asserts rec is Obj {
  if (!isObj(rec)) fail(`${label} is not an object`);
  for (const k of Object.keys(rec)) {
    if (!isSafeId(k) || (idPattern && !idPattern.test(k))) fail(`${label} has an invalid key ${JSON.stringify(k.slice(0, 40))}`);
  }
}

/** Structural checks on a migrated snapshot, before it is treated as a WorldState. */
export function validateSnapshotShape(s: Obj): void {
  for (const k of ['day', 'season']) if (!fin(s[k])) fail(`${k} is not a finite number`);
  const config = s.config;
  if (!isObj(config) || typeof config.seed !== 'string' || !Array.isArray(config.leagues)) fail('config is malformed');
  if (config.humanClubId !== null && !isSafeId(config.humanClubId)) fail('config.humanClubId is malformed');
  for (const k of ['players', 'clubs', 'managers', 'competitions', 'leagueMembers', 'seasonStats', 'matches', 'ai', 'transferList']) checkKeys(k, s[k], k === 'players' ? PLAYER_ID : null);
  for (const k of ['transfers', 'news', 'matchOrder', 'managerPool']) if (!Array.isArray(s[k])) fail(`${k} is not a list`);
  if (!isObj(s.history) || !Array.isArray(s.history.seasons) || !Array.isArray(s.history.legends) || !isObj(s.history.clubs)) fail('history is malformed');
  checkKeys('history.clubs', s.history.clubs);
  checkKeys('history.champions', s.history.champions);
  if (!isObj(s.counters) || !['player', 'manager', 'transfer', 'news'].every((k) => fin((s.counters as Obj)[k]))) fail('counters are malformed');
  if (!isObj(s.overrides)) fail('overrides are malformed');

  const players = s.players as Record<string, Obj>;
  for (const [id, p] of Object.entries(players)) {
    if (!isObj(p) || p.id !== id) fail(`player ${id}: id does not match its key`);
    if (!Array.isArray(p.attrs) || p.attrs.length !== ATTR_KEYS.length) fail(`player ${id}: attrs must list ${ATTR_KEYS.length} numbers`);
    for (const a of p.attrs as unknown[]) if (!fin(a) || (a as number) < 0 || (a as number) > 100) fail(`player ${id}: attribute out of range`);
    if (typeof p.name !== 'string' || typeof p.primary !== 'string' || typeof p.nationality !== 'string') fail(`player ${id}: text fields are malformed`);
    for (const k of ['birthDay', 'pot', 'devRate', 'consistency', 'injuryProneness', 'form', 'morale', 'confidence', 'fatigue', 'workload']) if (!fin(p[k])) fail(`player ${id}: ${k} is not finite`);
    if (p.clubId !== null && !isSafeId(p.clubId)) fail(`player ${id}: club id is malformed`);
    if (!isObj(p.positions) || !isObj(p.suspensions) || !isObj(p.yellows) || !Array.isArray(p.history) || !Array.isArray(p.traits)) fail(`player ${id}: collections are malformed`);
    checkKeys(`player ${id}.positions`, p.positions);
    checkKeys(`player ${id}.suspensions`, p.suspensions);
    checkKeys(`player ${id}.yellows`, p.yellows);
    const c = p.contract;
    if (c !== null && (!isObj(c) || !isSafeId(c.clubId) || !fin(c.wageWeekly) || !fin(c.startDay) || !fin(c.endDay))) fail(`player ${id}: contract is malformed`);
  }
  for (const [id, c] of Object.entries(s.clubs as Record<string, Obj>)) {
    if (!isObj(c) || c.id !== id) fail(`club ${id}: id does not match its key`);
    const f = c.finance;
    if (!isObj(f)) fail(`club ${id}: finance missing`);
    for (const k of ['cash', 'debt', 'transferBudget', 'wageBudgetWeekly', 'seasonStartCash', 'opexAnnual', 'ticketPrice', 'embargoUntilDay']) if (!fin(f[k])) fail(`club ${id}: finance.${k} is not finite`);
    checkKeys(`club ${id}.seasonLedger`, f.seasonLedger);
    for (const v of Object.values(f.seasonLedger as Obj)) if (!fin(v)) fail(`club ${id}: ledger entry is not finite`);
    if (c.crest !== undefined && (typeof c.crest !== 'string' || !isSafeCrest(c.crest))) fail(`club ${id}: crest must be a local or embedded image`);
    if (!Array.isArray(f.installments) || !isObj(c.tactics) || typeof c.name !== 'string' || typeof c.leagueId !== 'string') fail(`club ${id}: malformed`);
  }
  for (const [id, m] of Object.entries(s.managers as Record<string, Obj>)) if (!isObj(m) || m.id !== id) fail(`manager ${id}: id does not match its key`);
  for (const [id, c] of Object.entries(s.competitions as Record<string, Obj>)) {
    if (!isObj(c) || c.id !== id || !Array.isArray(c.fixtures) || !Array.isArray(c.entrants) || !Array.isArray(c.stages)) fail(`competition ${id}: malformed`);
  }
  for (const [id, m] of Object.entries(s.matches as Record<string, Obj>)) if (!isObj(m) || m.id !== id) fail(`match ${id}: id does not match its key`);
  for (const [comp, lines] of Object.entries(s.seasonStats as Record<string, unknown>)) {
    checkKeys(`seasonStats.${comp}`, lines, PLAYER_ID);
    for (const [pid, line] of Object.entries(lines as Obj)) {
      if (!isObj(line) || !['apps', 'minutes', 'goals', 'assists', 'yellow', 'red', 'ratingSum', 'cleanSheets'].every((k) => fin(line[k]))) fail(`seasonStats.${comp}.${pid} is malformed`);
    }
  }
}

/** Semantic checks on the reconstructed world. Soft game-state violations are tolerated; corruption is not. */
export function validateLoadedWorld(world: WorldState): void {
  const hard = validateWorld(world).filter((v) => !TOLERATED.has(v.code));
  if (hard.length > 0) {
    const sample = hard.slice(0, 5).map((v) => `${v.code}: ${v.message}`).join('; ');
    throw new SaveCorruptedError(`save failed integrity validation (${hard.length} problems): ${sample}`);
  }
}
