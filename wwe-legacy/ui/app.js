// App controller: owns UI state, wires events to Game actions, persists settings and saves.
import { Game, BACKGROUNDS } from '../src/game.js';
import { SaveManager, IndexedDBAdapter, LocalStorageAdapter, MemoryAdapter } from '../src/save/save.js';
import * as V from './views.js';

const root = document.getElementById('app');

function pickAdapter() {
  try { if (typeof indexedDB !== 'undefined') return new IndexedDBAdapter(); } catch { /* fall through */ }
  try { if (typeof localStorage !== 'undefined') { localStorage.setItem('wwel:probe', '1'); localStorage.removeItem('wwel:probe'); return new LocalStorageAdapter(); } } catch { /* fall through */ }
  return new MemoryAdapter();
}
const saves = new SaveManager(pickAdapter());

function loadSettings() {
  try { return { size: 16, theme: 'system', autosave: true, ...JSON.parse(localStorage.getItem('wwel:settings') || '{}') }; } catch { return { size: 16, theme: 'system', autosave: true }; }
}
const defaultCreate = () => ({
  step: 0, name: 'Rising Star', alignment: 'face', background: 'prospect', style: 'allrounder', bonus: {}, signatures: [], finisher: { tpl: 'fin_ddt', name: 'Final Verdict' },
  entrance: 'classic', goal: 'Win the World Championship', startYear: 2024, gender: 'M', world: 'real',
});

const S = {
  g: new Game({ saves }), screen: 'title', tab: 'home', sub: null, ui: { group: 'Top', prep: {}, promo: { tone: 'challenge', claim: 'none', target: null } },
  feed: [], slots: [], settings: loadSettings(), create: defaultCreate(), sheet: null, toast: null, notifSeen: 0, choices: 0, busy: false,
};
window.__S = S; // exposed for the end-to-end test harness

function applySettings() {
  const el = document.documentElement;
  el.style.setProperty('--fs', `${S.settings.size}px`);
  if (S.settings.theme === 'system') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', S.settings.theme);
  try { localStorage.setItem('wwel:settings', JSON.stringify(S.settings)); } catch { /* storage unavailable */ }
}

async function refreshSlots() { try { S.slots = await saves.list(); } catch { S.slots = []; } }

function toast(text, kind = '') {
  if (S.screen === 'match' && kind === 'ach') return; // unlocks are listed on the result screen; a toast would cover the scoreboard
  S.toast = { text, kind, key: null }; // key = the screen it first appears on; it is dropped as soon as the player navigates elsewhere
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { S.toast = null; render(); }, kind === 'ach' ? 2600 : 2200);
}

async function autosave() {
  if (!S.settings.autosave || !S.g.career) return;
  try { await S.g.autosave(); await refreshSlots(); } catch (e) { console.warn('autosave failed', e); }
}

function checkAchievementToasts() {
  const c = S.g.career;
  if (!c) return;
  const n = c.notifications;
  while (S.notifSeen < n.length) { const x = n[S.notifSeen++]; toast(`Achievement unlocked: ${x.name}`, 'ach'); }
}

// ------------------------------------------------------------------ render
let lastFocus = null;
function render() {
  const active = document.activeElement;
  if (active && active.id && (active.tagName === 'INPUT' || active.tagName === 'SELECT')) lastFocus = { id: active.id, pos: active.selectionStart };
  else lastFocus = null;
  const scrollY = window.scrollY;
  const feedEl = document.getElementById('feed');
  const feedStick = !feedEl || feedEl.scrollTop + feedEl.clientHeight >= feedEl.scrollHeight - 30;
  const navKey = `${S.screen}|${S.tab}|${S.sub}`;
  if (S.toast) { if (S.toast.key == null) S.toast.key = navKey; else if (S.toast.key !== navKey) S.toast = null; }
  let html = '';
  const g = S.g;
  if (S.screen === 'title') html = V.title(S);
  else if (S.screen === 'create') html = V.create(S);
  else if (S.screen === 'scenario') html = V.scenario(S);
  else if (S.screen === 'rumble') html = V.rumble(S);
  else if (S.screen === 'rumbleResult') html = V.rumbleResult(S);
  else if (S.screen === 'match') html = V.match(S);
  else if (S.screen === 'result') html = V.result(S);
  else {
    const body = S.tab === 'home' ? V.home(S) : S.tab === 'career' ? V.career(S) : S.tab === 'calendar' ? V.calendar(S) : S.tab === 'roster' ? V.roster(S) : V.more(S);
    html = body + V.tabbar(S);
  }
  if (S.sheet) {
    let inner = '';
    try {
      inner = S.sheet.type === 'event' ? V.eventSheet(S, S.sheet.id) : S.sheet.type === 'profile' ? V.profileSheet(S, S.sheet.id) : S.sheet.type === 'ach' ? V.achievementSheet(S, S.sheet.id)
        : S.sheet.type === 'evidence' ? V.evidenceSheet(S, S.sheet.sec, S.sheet.i) : S.sheet.type === 'saves' ? `<div class="row spread"><h2>Saves</h2><button class="btn small ghost" data-action="closeSheet">Close</button></div>${V.savesCard(S)}` : S.sheet.html;
    } catch (e) { inner = `<p>${V.esc(e.message)}</p>`; }
    html += `<div class="scrim" data-action="closeSheetBg"><div class="sheet" role="dialog" aria-modal="true">${inner}</div></div>`;
  }
  if (S.toast) html += `<div class="toast ${S.toast.kind}" role="status">${V.esc(S.toast.text)}</div>`;
  root.innerHTML = html;
  window.scrollTo(0, S.screen === 'match' ? 0 : scrollY);
  const f = document.getElementById('feed');
  if (f && feedStick) f.scrollTop = f.scrollHeight;
  if (lastFocus) { const el = document.getElementById(lastFocus.id); if (el) { el.focus(); try { el.setSelectionRange(lastFocus.pos, lastFocus.pos); } catch { /* not a text input */ } } }
}

// ------------------------------------------------------------------ actions
const err = (e) => { console.error(e); toast(e.message || String(e)); render(); };

function syncCreate() {
  const c = S.create;
  const v = (id) => document.getElementById(id)?.value;
  if (v('in-name') !== undefined) c.name = v('in-name').trim() || 'Rising Star';
  for (const i of [0, 1]) {
    const tpl = v(`sig-${i}`), nm = v(`signame-${i}`);
    if (tpl !== undefined) c.signatures[i] = tpl ? { tpl, name: (nm || '').trim() || undefined } : null;
  }
  if (v('fin-tpl') !== undefined) { c.finisher.tpl = v('fin-tpl'); c.finisher.name = (v('fin-name') || '').trim() || 'Finisher'; }
}

async function afterTime() {
  checkAchievementToasts(); await autosave();
  if (S.g.pendingScenario()) { S.screen = 'scenario'; S.ui.scnResult = null; }
  render();
}

const A = {
  tab: ({ id }) => { S.tab = id; S.sub = null; S.sheet = null; render(); },
  openSub: ({ id }) => { S.sub = id; render(); },
  closeSub: () => { S.sub = S.tab === 'home' && S.sub === 'prep' ? 'booking' : null; S.ui.promoResult = null; S.ui.apResult = null; render(); },
  newCareer: () => { S.create = defaultCreate(); S.screen = 'create'; render(); },
  toTitle: async () => { await refreshSlots(); S.screen = 'title'; render(); },
  cset: ({ k, v }) => { syncCreate(); S.create[k] = k === 'startYear' ? +v : v; if (k === 'background') S.create.bonus = {}; render(); },
  bonus: ({ k, d }) => {
    syncCreate();
    const c = S.create, left = BACKGROUNDS[c.background].bonus - Object.values(c.bonus).reduce((a, b) => a + b, 0);
    const cur = c.bonus[k] || 0, n = +d;
    if (n > 0 && left <= 0) return; if (n < 0 && cur <= 0) return;
    c.bonus[k] = cur + n; render();
  },
  cstep: ({ d }) => { syncCreate(); S.create.step = Math.max(0, Math.min(4, S.create.step + +d)); render(); },
  beginCareer: async () => {
    syncCreate();
    const c = S.create;
    try {
      S.g.newCareer({ name: c.name, alignment: c.alignment, background: c.background, style: c.style, bonus: c.bonus, signatures: c.signatures.filter(Boolean), finisher: c.finisher, entrance: c.entrance, goal: c.goal, startYear: c.startYear, gender: c.gender, seed: c.seed, mode: c.world === 'fictional' ? 'custom' : undefined });
      S.screen = 'main'; S.tab = 'home'; S.sub = null; S.notifSeen = 0; S.feed = [];
      checkAchievementToasts();
      await autosave(); render();
    } catch (e) { err(e); }
  },
  continue: async () => {
    const list = S.slots.filter((s) => !s.empty && s.ok !== false).sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
    if (!list.length) return toast('No saved career found.');
    await A.loadSlot({ id: list[0].slot });
  },
  openSaves: async () => { await refreshSlots(); S.sheet = { type: 'saves' }; render(); },
  settings: () => { S.screen = 'main'; S.tab = 'more'; S.sub = 'settings'; if (!S.g.career) { S.screen = 'title'; S.sheet = { type: 'html', html: '<div class="row spread"><h2>Settings</h2><button class="btn small ghost" data-action="closeSheet">Close</button></div>' + settingsInline() }; } render(); },
  setting: ({ k, v }) => { S.settings[k] = k === 'size' ? +v : k === 'autosave' ? v === '1' : v; applySettings(); if (S.sheet?.type === 'html') S.sheet.html = '<div class="row spread"><h2>Settings</h2><button class="btn small ghost" data-action="closeSheet">Close</button></div>' + settingsInline(); render(); },
  closeSheet: () => { S.sheet = null; render(); },
  closeSheetBg: (d, el, ev) => { if (ev.target === el) { S.sheet = null; render(); } },
  inspect: ({ id }) => { S.sheet = { type: 'event', id }; render(); },
  evidence: ({ sec, i }) => { S.sheet = { type: 'evidence', sec, i: +i }; render(); },
  profile: ({ id }) => { S.sheet = { type: 'profile', id }; render(); },
  achDetail: ({ id }) => { S.sheet = { type: 'ach', id }; render(); },
  achFilter: ({ id }) => { S.ui.achFilter = id; render(); },
  tlmin: ({ id }) => { S.ui.tlMin = +id; render(); },

  train: async ({ id }) => { try { const r = S.g.train(id); toast(r.message); await afterTime(); } catch (e) { err(e); } },
  rest: async () => { try { toast(S.g.rest().message); await afterTime(); } catch (e) { err(e); } },
  advance: async () => { try { S.g.advanceToNextEvent(); await afterTime(); } catch (e) { err(e); } },

  bookTonight: () => { S.sub = 'booking'; S.ui.stakes = null; render(); },
  openScenario: () => { S.screen = 'scenario'; S.ui.scnResult = null; render(); },
  scnChoose: async ({ id }) => {
    try {
      const inst = S.g.pendingScenario();
      const res = S.g.resolveScenario(id);
      S.ui.scnResult = { title: inst.title, text: res.text, notes: res.notes, events: res.events };
      checkAchievementToasts(); await autosave(); render();
    } catch (e) { err(e); }
  },
  scnDone: async () => {
    S.ui.scnResult = null;
    if (S.g.pendingScenario()) { render(); return; }
    S.screen = 'main'; S.tab = 'home'; S.sub = null; await autosave(); render();
  },
  startRumble: () => { try { S.g.startRumble(); S.feed = [{ seq: 0, type: 'bell', text: 'The countdown clock starts.' }, ...S.g.recentRumbleLines(6)]; S.screen = 'rumble'; render(); } catch (e) { err(e); } },
  resumeRumble: () => { S.feed = S.g.recentRumbleLines(12); S.screen = 'rumble'; render(); },
  rchoose: async ({ id }) => {
    try {
      const r = S.g.rumbleChoose(id);
      S.feed.push(...r.lines); if (S.feed.length > 80) S.feed.splice(0, S.feed.length - 80);
      render();
      if (S.g.rumble.state.tick % 8 === 0) autosave();
    } catch (e) { err(e); }
  },
  finishRumble: async () => {
    try { S.ui.rumbleResult = S.g.finishRumble(); S.screen = 'rumbleResult'; checkAchievementToasts(); await autosave(); render(); } catch (e) { err(e); }
  },
  rumbleDone: async () => { S.screen = 'main'; S.tab = 'home'; S.sub = null; if (S.g.pendingScenario()) S.screen = 'scenario'; render(); },
  scout: ({ id }) => { try { S.ui.oppId = id; S.ui.scout = S.g.scout(id); S.ui.prep = { plan: 'balanced', entrance: S.g.career.player.entrance.style, type: 'singles', ...S.ui.prep }; S.sub = 'prep'; render(); } catch (e) { err(e); } },
  pickOpp: ({ id, stakes, type }) => { S.ui.oppId = id; S.ui.stakes = stakes || null; S.ui.scout = null; S.ui.prep = { plan: 'balanced', entrance: S.g.career.player.entrance.style, type: type || 'singles' }; S.sub = 'prep'; render(); },
  pset: ({ k, v }) => { S.ui.prep[k] = v; render(); },
  toPrep: () => { const b = S.g.career.pendingMatch; S.ui.oppId = b.opponents[0].id; S.ui.prep = { plan: b.plan, entrance: b.entrance, type: b.type }; S.sub = 'prep'; render(); },
  startMatch: () => {
    try {
      const p = S.ui.prep;
      if (S.g.career.flags.phase === 'prematch') S.g.career.flags.phase = 'home'; // re-book with new choices
      S.g.prepareMatch({ opponentId: S.ui.oppId, type: p.type, plan: p.plan, entrance: p.entrance, stakes: S.ui.stakes || null });
      S.g.startMatch();
      S.toast = null; S.feed = [{ seq: 0, type: 'bell', text: 'The bell rings.' }]; S.ui.group = 'Top'; S.choices = 0; S.screen = 'match'; S.sub = null;
      render();
    } catch (e) { err(e); }
  },
  resumeMatch: () => { S.feed = S.g.recentLines(12); S.ui.group = 'Top'; S.screen = 'match'; render(); },
  group: ({ id }) => { S.ui.group = id; render(); },
  choose: async ({ id }) => {
    try {
      const r = S.g.choose(id);
      S.feed.push(...r.lines); if (S.feed.length > 80) S.feed.splice(0, S.feed.length - 80);
      S.ui.group = 'Top'; S.choices++;
      render();
      if (S.choices % 6 === 0) autosave();
    } catch (e) { err(e); }
  },
  finishMatch: async () => {
    try {
      S.ui.result = S.g.finishMatch(); S.ui.postMsg = ''; S.screen = 'result';
      checkAchievementToasts(); await autosave(); render();
    } catch (e) { err(e); }
  },
  toResult: () => { S.ui.result = S.g.resultView(); S.ui.postMsg = ''; S.screen = 'result'; render(); },
  post: async ({ id }) => {
    try {
      const r = S.g.postMatchChoose(id);
      S.ui.postMsg = r.message;
      if (S.g.career.flags.promoPending) { S.ui.promo.target = S.g.career.flags.promoPending.target || S.ui.promo.target; }
      checkAchievementToasts(); render();
    } catch (e) { err(e); }
  },
  donePost: async () => {
    try {
      const pending = S.g.career.flags.promoPending;
      S.g.endPostMatch(); S.screen = 'main'; S.tab = pending ? 'more' : 'home'; S.sub = pending ? 'media' : null;
      if (S.g.pendingScenario()) { S.screen = 'scenario'; S.ui.scnResult = null; }
      await autosave(); render();
    } catch (e) { err(e); }
  },
  promoSet: ({ k, v }) => { S.ui.promo[k] = v; render(); },
  deliverPromo: async () => {
    try {
      const u = S.ui.promo, tone = S.g.promoOptions().tones[u.tone];
      let target = tone.needsTarget ? (document.getElementById('promo-target')?.value || u.target) : null;
      if (tone.needsTarget && !target) target = S.g.universe.list((w) => w.brand === S.g.career.player.brand)[0].id;
      S.ui.promoResult = S.g.promo({ tone: u.tone, targetId: target, claim: u.claim });
      checkAchievementToasts(); await autosave(); render();
    } catch (e) { err(e); }
  },
  lifestyle: ({ id }) => { try { S.g.setLifestyle(id); render(); } catch (e) { err(e); } },
  rbToggle: () => { S.ui.rbAll = !S.ui.rbAll; render(); },
  openLegacy: () => { S.tab = 'career'; S.sub = 'legacy'; render(); },
  retireAsk: () => { S.ui.confirmRetire = true; render(); },
  retireCancel: () => { S.ui.confirmRetire = false; render(); },
  retireGo: async () => { try { S.g.retire('choice'); S.ui.confirmRetire = false; checkAchievementToasts(); await autosave(); render(); } catch (e) { err(e); } },
  promoDone: () => { S.ui.promoResult = null; S.sub = null; render(); },
  apStart: async ({ id }) => { try { S.g.startAppearance(id); await autosave(); render(); } catch (e) { err(e); } },
  apAnswer: async ({ id }) => {
    try {
      const r = S.g.answerAppearance(id);
      if (r && r.done) { S.ui.apResult = r; checkAchievementToasts(); await autosave(); }
      render();
    } catch (e) { err(e); }
  },
  apCancel: async () => { S.g.cancelAppearance(); await autosave(); render(); },
  apDone: () => { S.ui.apResult = null; render(); },
  saveSlot: async ({ id }) => { try { await S.g.save(id); await refreshSlots(); toast(`Saved to ${id === 'auto' ? 'autosave' : 'slot ' + id.slice(-1)}.`); } catch (e) { err(e); } render(); },
  loadSlot: async ({ id }) => {
    try {
      const r = await S.g.load(id);
      S.notifSeen = S.g.career.notifications.length; S.sheet = null;
      const ph = S.g.career.flags.phase;
      S.screen = ph === 'match' ? 'match' : ph === 'rumble' ? 'rumble' : 'main'; S.tab = 'home'; S.sub = null;
      if (ph === 'rumble') S.feed = S.g.recentRumbleLines(12);
      if (S.g.pendingScenario()) S.screen = 'scenario';
      if (ph === 'match') S.feed = S.g.recentLines(12);
      if (ph === 'postmatch') { S.ui.result = S.g.resultView(); S.ui.postMsg = ''; S.screen = 'result'; }
      await refreshSlots(); render();
      toast(r.recovered ? `Recovered from backup (${r.error}).` : 'Career loaded.');
    } catch (e) { err(e); }
  },
  delSlot: async ({ id }) => { await saves.delete(id); await refreshSlots(); render(); },
};

function settingsInline() {
  const st = S.settings;
  const chip = (cond, k, v, l) => `<button class="chip ${cond ? 'on' : ''}" data-action="setting" data-k="${k}" data-v="${v}">${l}</button>`;
  return `<div class="card"><h3>Text size</h3><div class="chips">${[[15, 'Small'], [16, 'Medium'], [18, 'Large'], [20, 'Extra large']].map(([n, l]) => chip(st.size === n, 'size', n, l)).join('')}</div>
    <h3>Theme</h3><div class="chips">${['system', 'light', 'dark'].map((t) => chip(st.theme === t, 'theme', t, t[0].toUpperCase() + t.slice(1))).join('')}</div></div>`;
}

root.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action]');
  if (!el) return;
  const fn = A[el.dataset.action];
  if (!fn) return;
  Promise.resolve(fn(el.dataset, el, ev)).catch(err);
});
root.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.dataset.actionChange === 'sig') { syncCreate(); }
  if (el.dataset.actionChange === 'promoTarget') S.ui.promo.target = el.value;
});
root.addEventListener('input', (ev) => {
  const el = ev.target;
  if (el.id === 'in-rq') { S.ui.rq = el.value; render(); }
});

// ------------------------------------------------------------------ boot
(async function boot() {
  applySettings();
  await refreshSlots();
  render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !/claude|artifact/.test(location.hostname)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
