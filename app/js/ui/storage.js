// Persistence: settings in localStorage; saves in IndexedDB (localStorage fallback), double-buffered autosave for crash safety.
const DB = 'modern-age',
  STORE = 'saves';
const hasIDB = () => typeof indexedDB !== 'undefined';
function open() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function tx(mode, fn) {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode);
    const s = t.objectStore(STORE);
    const out = fn(s);
    t.oncomplete = () => {
      db.close();
      res(out && 'result' in out ? out.result : out);
    };
    t.onerror = () => {
      db.close();
      rej(t.error);
    };
    t.onabort = () => {
      db.close();
      rej(t.error);
    };
  });
}
export const store = {
  async put(key, text) {
    if (hasIDB()) {
      try {
        await tx('readwrite', (s) => s.put(text, key));
        return true;
      } catch (e) {
        /* fall through */
      }
    }
    try {
      localStorage.setItem('ma:' + key, text);
      return true;
    } catch (e) {
      return false;
    }
  },
  async get(key) {
    if (hasIDB()) {
      try {
        const r = await tx('readonly', (s) => s.get(key));
        if (r) return r;
      } catch (e) {
        /* fall through */
      }
    }
    try {
      return localStorage.getItem('ma:' + key);
    } catch (e) {
      return null;
    }
  },
  async del(key) {
    if (hasIDB()) {
      try {
        await tx('readwrite', (s) => s.delete(key));
      } catch (e) {
        /* ignore */
      }
    }
    try {
      localStorage.removeItem('ma:' + key);
    } catch (e) {
      /* ignore */
    }
  },
  async keys() {
    let ks = [];
    if (hasIDB()) {
      try {
        ks = await tx('readonly', (s) => s.getAllKeys());
      } catch (e) {
        /* ignore */
      }
    }
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith('ma:')) ks.push(k.slice(3));
      }
    } catch (e) {
      /* ignore */
    }
    return [...new Set(ks)];
  },
};
// Crash-safe autosave: write the inactive buffer, then flip the pointer. A torn write leaves the previous buffer intact.
export async function autosave(text) {
  const ptr = (await store.get('auto:ptr')) || 'a';
  const next = ptr === 'a' ? 'b' : 'a';
  const ok = await store.put('auto:' + next, text);
  if (ok) await store.put('auto:ptr', next);
  return ok;
}
export async function loadAutosave() {
  const ptr = (await store.get('auto:ptr')) || 'a';
  for (const k of [ptr, ptr === 'a' ? 'b' : 'a']) {
    const t = await store.get('auto:' + k);
    if (t) return { text: t, buffer: k };
  }
  return null;
}
export const defaultSettings = {
  theme: 'dark',
  textScale: 1,
  highContrast: false,
  colorBlind: false,
  reduceMotion: false,
  lowPower: false,
  sound: true,
  music: false,
  yearReview: true,
  haptics: true,
  autosaveDays: 30,
  speed: 2,
  tutorial: true,
  confirmDestructive: true,
};
export function loadSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem('ma:settings') || '{}') };
  } catch {
    return { ...defaultSettings };
  }
}
export function saveSettings(s) {
  try {
    localStorage.setItem('ma:settings', JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
}
