import { create } from 'zustand';
import {
  DataPackError, SaveCorruptedError, advanceDay, applyDataPack, clubFixtures, createWorld, dateInfo, defaultWorldConfig, parseDataPack, setHumanClub, validateWorld,
  type DataPack, type DataPackInfo, type SlotInfo, type Violation, type WorldState,
} from '@fu/engine';
import { runSimulation, yieldToUi, type SimPlan, type SimProgress } from '../core/simRunner';
import { storeKind } from '../core/saves/createStore';
import { MAX_SLOT, MIN_SLOT } from '../core/saves/types';
import type { TKey, TParams } from '../i18n/translate';
import { planCrestImport, type CrestReport, type PickedImage } from '../core/crestImport';
import { isRenderableCrest } from './lookups';
import { getPendingWorld, getWorld, requireWorld, setPendingWorld, setWorld } from './worldHost';
import { getSaveStore } from './storeHost';
import { useSettings } from './settings';

export interface Notice { id: number; tone: 'info' | 'warn' | 'error'; key: TKey; params?: TParams; detail?: string }
export interface SimSummary { plan: SimPlan; daysDone: number; matchesPlayed: number; humanMatches: number; seasonEnded: boolean; cancelled: boolean; fromDay: number; toDay: number; error?: string;
  /** Newest match of the human club played during this run (for "open the match report"), if any. */
  humanFixtureId?: string | null }
export type SaveStatus = { status: 'idle' } | { status: 'saving' } | { status: 'saved'; at: string; slot: number } | { status: 'error'; message: string };

interface GameState {
  booted: boolean;
  bootError: string | null;
  storeKind: string;
  hasWorld: boolean;
  /** Bumped after every world mutation; views are memoised on it. */
  version: number;
  dirty: boolean;
  activeSlot: number | null;
  slotName: string;
  slots: SlotInfo[];
  busy: null | 'generating' | 'loading' | 'starting';
  sim: SimProgress | null;
  lastSim: SimSummary | null;
  saveState: SaveStatus;
  notice: Notice | null;
  /** Result of the last integrity check. */
  lastValidation: { at: number; violations: Violation[] } | null;
}

export const useGame = create<GameState>(() => ({
  booted: false, bootError: null, storeKind: '', hasWorld: false, version: 0, dirty: false, activeSlot: null, slotName: '', slots: [],
  busy: null, sim: null, lastSim: null, saveState: { status: 'idle' }, notice: null, lastValidation: null,
}));

const set = useGame.setState;
const get = useGame.getState;

let noticeSeq = 0;
export function notify(tone: Notice['tone'], key: TKey, params?: TParams, detail?: string): void {
  set({ notice: { id: ++noticeSeq, tone, key, params, detail } });
}
export function dismissNotice(): void {
  set({ notice: null });
}

function bump(): void {
  set((s) => ({ version: s.version + 1, dirty: true }));
  scheduleAutosave();
}

// ---------------------------------------------------------------- boot

export async function boot(): Promise<void> {
  if (get().booted) return;
  try {
    const store = getSaveStore();
    await store.init();
    await useSettings.getState().hydrate(store);
    const slots = await store.listSlots();
    set({ booted: true, slots, storeKind });
  } catch (e) {
    set({ booted: true, bootError: (e as Error).message });
    useSettings.setState({ loaded: true });
  }
}

export async function refreshSlots(): Promise<SlotInfo[]> {
  const slots = await getSaveStore().listSlots();
  set({ slots });
  return slots;
}

// ---------------------------------------------------------------- new career

const frame = async (): Promise<void> => {
  await yieldToUi();
  await yieldToUi();
};

/** How the pending world was generated, so it can be rebuilt (identically) when a data pack is applied or removed. */
let pendingParams: { seed: string; preset: 'compact' | 'standard'; scope: 'core' | 'extended' } | null = null;

/** Generate a fresh, fully fictional pending world. Any data pack applied to the previous pending world is dropped. */
export async function generateWorldForSelection(seed: string, preset: 'compact' | 'standard', scope: 'core' | 'extended' = 'core'): Promise<void> {
  set({ busy: 'generating' });
  try {
    await frame(); // let the spinner paint before the (synchronous) engine call blocks the JS thread
    const w = createWorld(defaultWorldConfig(seed, preset, null, scope));
    pendingParams = { seed, preset, scope };
    setPendingWorld(w);
  } finally {
    set({ busy: null });
  }
}

/**
 * Apply a data pack (a parsed pack, raw JSON text, or `null` to go back to the fully generated names) to the pending world.
 *
 * Idempotent and atomic: the pending world is rebuilt from the same seed/preset (generation is deterministic), the pack is
 * applied exactly once to that fresh copy, and only then does it replace the pending world. If parsing or applying fails the
 * existing pending world is left exactly as it was and the error is rethrown. Applying the same pack twice gives the same world.
 */
export async function applyDataPackToPending(input: DataPack | string | null): Promise<DataPackInfo | null> {
  if (!getPendingWorld() || !pendingParams) throw new Error('no generated world');
  const pack = input === null ? null : parseDataPack(input); // always validated (also parsed packs/objects), before any state is touched
  const params = pendingParams;
  set({ busy: 'generating' });
  try {
    await frame();
    const fresh = createWorld(defaultWorldConfig(params.seed, params.preset, null, params.scope));
    const info = pack ? applyDataPack(fresh, pack) : null;
    if (pack) {
      const bad = validateWorld(fresh);
      if (bad.length > 0) throw new DataPackError(`the pack produced an inconsistent world (${bad[0]?.message ?? 'unknown'})`);
    }
    if (pendingParams !== params) throw new Error('the world was regenerated meanwhile'); // a newer generate wins
    setPendingWorld(fresh);
    return info;
  } finally {
    set({ busy: null });
  }
}

/**
 * Match picked image files to the pending world's clubs by file name and embed them as `club.crest` data URIs (user-supplied logos;
 * the user is responsible for having the right to use them). Changes nothing when no file matches. Crests live in the club record, so
 * they are saved and re-validated by the engine on load. Choosing a different names option rebuilds the world and drops them.
 */
export function importCrestsToPending(files: PickedImage[]): CrestReport {
  const w = getPendingWorld();
  if (!w) throw new Error('no generated world');
  const clubs = Object.values(w.clubs).map((c) => ({ id: c.id, name: c.name, shortName: c.shortName }));
  const { results, report } = planCrestImport(files, clubs);
  let added = 0;
  for (const r of results) {
    if (r.status !== 'matched' || !r.clubId || !r.uri || !isRenderableCrest(r.uri)) continue;
    const club = w.clubs[r.clubId];
    if (!club) continue;
    if (!club.crest) added++;
    club.crest = r.uri;
  }
  if (report.matched > 0) {
    const dp = w.dataPack;
    if (dp) dp.applied.crests += added;
    else w.dataPack = { id: 'user-crest-images', name: 'Your imported crest images', source: 'Image files picked on this device', licence: 'Supplied by you; you are responsible for having the right to use them', applied: { clubs: 0, players: 0, managers: 0, crests: added, competitions: 0 } };
  }
  return report;
}

export function firstFreeSlot(slots: SlotInfo[]): number | null {
  const used = new Set(slots.map((s) => s.slot));
  for (let i = MIN_SLOT; i < MAX_SLOT; i++) if (!used.has(i)) return i;
  return null;
}

export async function startCareer(clubId: string): Promise<void> {
  const w = getPendingWorld();
  if (!w) throw new Error('no generated world');
  set({ busy: 'starting' });
  try {
    const res = setHumanClub(w, clubId);
    if (!res.ok) throw new Error(res.error);
    const slots = await refreshSlots();
    const slot = firstFreeSlot(slots);
    if (slot === null) { notify('error', 'notice.noFreeSlot'); return; }
    setWorld(w);
    setPendingWorld(null);
    const clubName = w.clubs[clubId]?.name ?? 'Career';
    set({ hasWorld: true, activeSlot: slot, slotName: clubName, dirty: true, version: get().version + 1, lastSim: null, sim: null });
    useSettings.getState().update({ lastSlot: slot });
    await saveNow();
  } finally {
    set({ busy: null });
  }
}

// ---------------------------------------------------------------- load / save

export async function loadSlot(slot: number): Promise<boolean> {
  set({ busy: 'loading' });
  try {
    await frame();
    const r = await getSaveStore().load(slot);
    const info = (await refreshSlots()).find((s) => s.slot === slot);
    setWorld(r.world);
    set({ hasWorld: true, activeSlot: slot, slotName: info?.name ?? `Slot ${slot}`, dirty: false, version: get().version + 1, lastSim: null, sim: null, saveState: { status: 'idle' } });
    useSettings.getState().update({ lastSlot: slot });
    if (r.recoveredFromFallback) notify('warn', 'notice.loadedFallback', { rev: r.revision });
    return true;
  } catch (e) {
    if (e instanceof SaveCorruptedError) notify('error', 'notice.saveCorrupted', undefined, e.message);
    else notify('error', 'notice.loadFailed', undefined, (e as Error).message);
    return false;
  } finally {
    set({ busy: null });
  }
}

export async function saveNow(opts: { slot?: number; name?: string } = {}): Promise<boolean> {
  const w = getWorld();
  if (!w) return false;
  const slot = opts.slot ?? get().activeSlot;
  if (slot === null || slot === undefined) return false;
  const name = opts.name ?? get().slotName;
  set({ saveState: { status: 'saving' } });
  try {
    await yieldToUi(); // encodeWorld is synchronous: give the UI a frame to show "saving" first
    const info = await getSaveStore().save(slot, name, w);
    useSettings.getState().update({ lastSlot: slot });
    set({ saveState: { status: 'saved', at: info.updatedAt, slot }, activeSlot: slot, slotName: name, dirty: false });
    await refreshSlots();
    return true;
  } catch (e) {
    set({ saveState: { status: 'error', message: (e as Error).message } });
    notify('error', 'notice.saveFailed', undefined, (e as Error).message);
    return false;
  }
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleAutosave(): void {
  if (!useSettings.getState().autosave || get().sim) return;
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => { autosaveTimer = null; void autosaveIfNeeded(); }, 12000);
}

export async function autosaveIfNeeded(): Promise<void> {
  const s = get();
  if (!useSettings.getState().autosave || !s.hasWorld || !s.dirty || s.activeSlot === null || s.sim) return;
  if (s.saveState.status === 'saving') return;
  await saveNow();
}

export function closeCareer(): void {
  setWorld(null);
  set({ hasWorld: false, activeSlot: null, slotName: '', dirty: false, version: get().version + 1, sim: null, lastSim: null, saveState: { status: 'idle' } });
}

// ---------------------------------------------------------------- mutations

/** Run a world-mutating command (engine action) and notify views. */
export function mutate<T>(fn: (w: WorldState) => T): T {
  const out = fn(requireWorld());
  bump();
  return out;
}

// ---------------------------------------------------------------- simulation

let cancelRequested = false;

export function cancelSim(): void {
  cancelRequested = true;
}

export async function runSim(plan: SimPlan): Promise<SimSummary | null> {
  const w = getWorld();
  const cur = get().sim;
  if (!w || (cur && !cur.finished)) return null;
  cancelRequested = false;
  if (autosaveTimer) { clearTimeout(autosaveTimer); autosaveTimer = null; }
  const fromDay = w.day;
  const remaining = 364 - dateInfo(w.day).dayOfSeason;
  let error: string | undefined;
  let final: SimProgress | null = null;
  set({ sim: { plan, daysDone: 0, daysTarget: plan.kind === 'days' ? plan.days : null, matchesPlayed: 0, humanMatches: 0, season: w.season, day: w.day, seasonEnded: false, cancelled: false, finished: false, elapsedMs: 0 } });
  try {
    final = await runSimulation(plan, {
      world: w, advance: () => advanceDay(w), now: () => Date.now(), yieldToUi, isCancelled: () => cancelRequested,
      daysInSeason: remaining, onProgress: (p) => set({ sim: p }),
    });
  } catch (e) {
    error = (e as Error).message;
  }
  const summary: SimSummary = {
    plan, daysDone: final?.daysDone ?? 0, matchesPlayed: final?.matchesPlayed ?? 0, humanMatches: final?.humanMatches ?? 0, seasonEnded: final?.seasonEnded ?? false,
    cancelled: final?.cancelled ?? false, fromDay, toDay: w.day, error,
  };
  const hid = w.config.humanClubId;
  if (!error && hid && summary.humanMatches > 0) {
    const newest = clubFixtures(w, hid, { upcoming: false, limit: 1 })[0];
    summary.humanFixtureId = newest && newest.day >= fromDay ? newest.id : null;
  }
  set({ sim: null, lastSim: summary });
  set((s) => ({ version: s.version + 1, dirty: true }));
  if (error) notify('error', 'notice.simError', undefined, error);
  else if (useSettings.getState().autosave && get().activeSlot !== null) await saveNow();
  return summary;
}

// ---------------------------------------------------------------- integrity

export function runIntegrityCheck(): Violation[] {
  const v = validateWorld(requireWorld());
  set({ lastValidation: { at: Date.now(), violations: v } });
  return v;
}

export async function deleteSlot(slot: number): Promise<void> {
  await getSaveStore().deleteSlot(slot);
  if (get().activeSlot === slot) set({ activeSlot: null, dirty: true });
  const s = useSettings.getState();
  if (s.lastSlot === slot) s.update({ lastSlot: null });
  await refreshSlots();
}
