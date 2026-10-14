// Versioned, checksummed, compressed saves with multiple slots, an autosave slot, and
// backup-on-write so one corrupted write never destroys a career.
import { hash53, sha256 } from '../core/util.js';
import { Career, CAREER_VERSION } from '../career/career.js';

export const SAVE_FORMAT = 'wwe-legacy-save';
export const SAVE_VERSION = 1;
export const SLOTS = ['slot1', 'slot2', 'slot3', 'auto'];

/** migrations[n] upgrades career JSON from version n to n+1 */
export const MIGRATIONS = {};

export function migrateCareerJSON(j) {
  let v = j.v ?? 0;
  if (v > CAREER_VERSION) throw new Error(`save was made by a newer game version (v${v})`);
  while (v < CAREER_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error(`no migration from save version ${v}`);
    j = step(j); v += 1; j.v = v;
  }
  return j;
}

const b64 = {
  enc(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); },
  dec(str) { const s = atob(str); const u8 = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i); return u8; },
};

async function streamBytes(stream) {
  const reader = stream.getReader(); const chunks = []; let total = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); total += value.length; }
  const out = new Uint8Array(total); let o = 0; for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

/** gzip when CompressionStream exists (Node 18+, Safari 16.4+); otherwise store plain. */
export const codec = {
  async encode(text) {
    if (typeof CompressionStream === 'undefined') return `p:${text}`;
    const cs = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
    return `z:${b64.enc(await streamBytes(cs))}`;
  },
  async decode(str) {
    if (str.startsWith('p:')) return str.slice(2);
    if (!str.startsWith('z:')) throw new Error('unknown save encoding');
    const ds = new Blob([b64.dec(str.slice(2))]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new TextDecoder().decode(await streamBytes(ds));
  },
};

export function makeEnvelope(career, meta = {}) {
  const payload = JSON.stringify(career.toJSON());
  return {
    format: SAVE_FORMAT, version: SAVE_VERSION, savedAt: meta.savedAt || new Date().toISOString(),
    meta: {
      label: meta.label || '', name: career.player.name, date: career.date, day: career.day, year: career.year, era: career.era,
      matches: career.stats.s.matches, wins: career.stats.s.wins, titles: career.stats.s.titles.won, popularity: Math.round(career.player.popularity),
      events: career.memory.ledger.size, achievements: Object.keys(career.achievements.unlocked).length,
    },
    checksum: sha256(payload).slice(0, 40), checksumAlg: 'sha256', ledgerHead: career.memory.ledger.head, ledgerSize: career.memory.ledger.size, payload,
  };
}

export function openEnvelope(env) {
  if (!env || env.format !== SAVE_FORMAT) throw new Error('not a WWE Legacy save');
  if (env.version > SAVE_VERSION) throw new Error('save file is from a newer version of the game');
  const sum = env.checksumAlg === 'sha256' ? sha256(env.payload).slice(0, 40) : hash53(env.payload);
  if (sum !== env.checksum) throw new Error('save is corrupted (checksum mismatch)');
  const json = migrateCareerJSON(JSON.parse(env.payload));
  const career = Career.fromJSON(json); // also verifies the ledger hash chain
  // the chain proves the events present are consistent; the stored head and count prove none were cut from the end
  const L = career.memory.ledger;
  if (env.ledgerHead !== undefined && (env.ledgerHead !== L.head || env.ledgerSize !== L.size)) throw new Error('save is corrupted (ledger was truncated or replaced)');
  return career;
}

export class MemoryAdapter {
  constructor() { this.m = new Map(); }
  async get(k) { return this.m.has(k) ? this.m.get(k) : null; }
  async set(k, v) { this.m.set(k, v); }
  async remove(k) { this.m.delete(k); }
  async keys() { return [...this.m.keys()]; }
}

export class LocalStorageAdapter {
  constructor(ls = globalThis.localStorage) { this.ls = ls; }
  async get(k) { return this.ls.getItem(k); }
  async set(k, v) { this.ls.setItem(k, v); }
  async remove(k) { this.ls.removeItem(k); }
  async keys() { return Object.keys(this.ls); }
}

export class IndexedDBAdapter {
  constructor(name = 'wwe-legacy') { this.name = name; this.dbp = null; }
  _db() {
    if (!this.dbp) this.dbp = new Promise((res, rej) => {
      const r = indexedDB.open(this.name, 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return this.dbp;
  }
  async _tx(mode, fn) { const db = await this._db(); return new Promise((res, rej) => { const t = db.transaction('kv', mode); const q = fn(t.objectStore('kv')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); }
  async get(k) { const v = await this._tx('readonly', (s) => s.get(k)); return v === undefined ? null : v; }
  async set(k, v) { await this._tx('readwrite', (s) => s.put(v, k)); }
  async remove(k) { await this._tx('readwrite', (s) => s.delete(k)); }
  async keys() { return (await this._tx('readonly', (s) => s.getAllKeys())) || []; }
}

export class SaveManager {
  constructor(adapter, prefix = 'wwel:') { this.a = adapter; this.p = prefix; }
  _k(slot) { return `${this.p}${slot}`; }

  async save(slot, career, meta = {}) {
    if (!SLOTS.includes(slot)) throw new Error(`unknown slot ${slot}`);
    const env = makeEnvelope(career, meta);
    const text = await codec.encode(JSON.stringify(env));
    // verify the write round-trips before replacing the previous good save
    const back = JSON.parse(await codec.decode(text));
    if (back.checksum !== env.checksum) throw new Error('save verification failed');
    const prev = await this.a.get(this._k(slot));
    if (prev) await this.a.set(`${this._k(slot)}.bak`, prev);
    await this.a.set(this._k(slot), text);
    return { slot, bytes: text.length, checksum: env.checksum };
  }

  async _read(key) {
    const text = await this.a.get(key);
    if (!text) return null;
    return openEnvelope(JSON.parse(await codec.decode(text)));
  }

  /** Load a slot. If the primary is corrupt, fall back to the previous good save. */
  async load(slot) {
    try {
      const c = await this._read(this._k(slot));
      if (c) return { career: c, recovered: false };
    } catch (e) {
      const bak = await this._read(`${this._k(slot)}.bak`).catch(() => null);
      if (bak) return { career: bak, recovered: true, error: e.message };
      throw e;
    }
    throw new Error(`slot ${slot} is empty`);
  }

  async list() {
    const out = [];
    for (const slot of SLOTS) {
      const text = await this.a.get(this._k(slot));
      if (!text) { out.push({ slot, empty: true }); continue; }
      try {
        const env = JSON.parse(await codec.decode(text));
        out.push({ slot, empty: false, savedAt: env.savedAt, ...env.meta, bytes: text.length, ok: (env.checksumAlg === 'sha256' ? sha256(env.payload).slice(0, 40) : hash53(env.payload)) === env.checksum });
      } catch { out.push({ slot, empty: false, ok: false, error: 'unreadable' }); }
    }
    return out;
  }

  async delete(slot) { await this.a.remove(this._k(slot)); await this.a.remove(`${this._k(slot)}.bak`); }
  async autosave(career) { return this.save('auto', career, { label: 'Autosave' }); }
}
