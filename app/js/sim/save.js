// Versioned, checksummed save format with migration support. Typed arrays are base64-encoded; everything else is plain JSON.
import { Sim, SAVE_VERSION } from './world.js';
import { RNG } from './rng.js';
import { Calendar } from './calendar.js';

export class SaveError extends Error {}
const TA = { Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Float32Array, Float64Array };
const b64 =
  typeof Buffer !== 'undefined'
    ? {
        enc: (u8) => Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength).toString('base64'),
        dec: (s) => new Uint8Array(Buffer.from(s, 'base64')),
      }
    : {
        enc: (u8) => {
          let s = '';
          for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
          return btoa(s);
        },
        dec: (s) => {
          const bin = atob(s);
          const u8 = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
          return u8;
        },
      };

function replacer(k, v) {
  if (ArrayBuffer.isView(v) && !(v instanceof DataView))
    return { __ta: v.constructor.name, b: b64.enc(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)) };
  if (typeof v === 'number' && !Number.isFinite(v)) return { __nf: String(v) };
  return v;
}
function reviver(k, v) {
  if (v && typeof v === 'object') {
    if (v.__ta) {
      const u8 = b64.dec(v.b);
      return new TA[v.__ta](u8.buffer, u8.byteOffset, u8.byteLength / TA[v.__ta].BYTES_PER_ELEMENT);
    }
    if (v.__nf) return v.__nf === 'NaN' ? NaN : v.__nf === 'Infinity' ? Infinity : -Infinity;
  }
  return v;
}
export function checksum(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16) + ':' + str.length;
}

// ---------------------------------------------------------------------------------------------- migrations
// Each entry upgrades a save of version N to N+1. Add a new function here when SAVE_VERSION is incremented.
export const MIGRATIONS = {
  // 0: (state) => { ...; state.version = 1; return state; }
};
export function migrate(state) {
  let v = state.version ?? 0;
  if (v > SAVE_VERSION) throw new SaveError(`Save is from a newer game version (${v} > ${SAVE_VERSION})`);
  while (v < SAVE_VERSION) {
    const m = MIGRATIONS[v];
    if (!m) throw new SaveError(`No migration from save version ${v}`);
    state = m(state);
    v = state.version;
  }
  return state;
}

export function serialize(sim, meta = {}) {
  if (sim.midDay) throw new SaveError('cannot save while a simulated day is half-processed (finish the generator first)');
  sim.state.rngState = sim.rng.getState();
  const stateJson = JSON.stringify(sim.state, replacer);
  const head = {
    format: 'modern-age-save',
    version: SAVE_VERSION,
    scenario: sim.state.scenario,
    seed: sim.state.seed,
    player: sim.state.countries[sim.state.playerId].id,
    day: sim.state.day,
    date: sim.calendar.format(sim.state.day),
    savedAt: meta.savedAt ?? 0,
    label: meta.label || '',
    difficulty: sim.state.settings.difficulty,
    opts: sim.opts,
  };
  const head2 = JSON.stringify(head);
  return `${head2}\n${checksum(stateJson)}\n${stateJson}`;
}
export function peek(text) {
  // read header only (cheap) for save-slot UIs
  const i = text.indexOf('\n');
  if (i < 0) throw new SaveError('Not a Modern Age save');
  try {
    const h = JSON.parse(text.slice(0, i));
    if (h.format !== 'modern-age-save') throw 0;
    return h;
  } catch {
    throw new SaveError('Not a Modern Age save');
  }
}
export function deserialize(data, text) {
  const i = text.indexOf('\n'),
    j = text.indexOf('\n', i + 1);
  if (i < 0 || j < 0) throw new SaveError('Save file is truncated or not a Modern Age save');
  const head = peek(text);
  const sum = text.slice(i + 1, j);
  const body = text.slice(j + 1);
  if (checksum(body) !== sum) throw new SaveError('Save file is corrupted (checksum mismatch)');
  let state;
  try {
    state = JSON.parse(body, reviver);
  } catch (e) {
    throw new SaveError('Save file could not be parsed: ' + e.message);
  }
  state = migrate(state);
  validateState(state);
  const sim = new Sim(data, { ...head.opts, blank: true });
  sim.state = state;
  sim.scenario = data.scenarioById[state.scenario];
  sim.diff = data.difficulty[state.settings.difficulty] || data.difficulty.normal;
  sim.rng = new RNG(1);
  sim.rng.setState(state.rngState);
  sim.calendar = new Calendar(...sim.scenario.start);
  sim.cal = state.cal;
  sim.bindRegions();
  sim.buildChokeDefs();
  sim.postLoad();
  return sim;
}
export function validateState(state) {
  const need = ['countries', 'reg', 'orgs', 'treaties', 'wars', 'prices', 'rel', 'day', 'playerId', 'rngState', 'cal'];
  for (const k of need) if (state[k] === undefined) throw new SaveError('Save is missing ' + k);
  if (!Array.isArray(state.countries) || state.countries.length < 10) throw new SaveError('Save has no countries');
  for (const c of state.countries) {
    if (!c.econ || !c.gov || !c.pop || !c.mil) throw new SaveError('Country record incomplete: ' + c.id);
    if (!Number.isFinite(c.econ.gdp) || !Number.isFinite(c.pop.total) || !Number.isFinite(c.gov.stability))
      throw new SaveError('Non-finite state in ' + c.id);
  }
  return true;
}
