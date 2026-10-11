import { esc, money, pct, GOV_LABEL } from '../fmt.js';
import { icon } from '../icons.js';
import { stat, kv, sec, tag, btn, li, note } from './util.js';
import { serialize, deserialize, peek, SaveError } from '../../sim/save.js';
import { store, autosave, loadAutosave } from '../storage.js';

export const more = {
  render(app) {
    const sim = app.sim;
    const items = [
      ['research', 'research', 'Research & technology', 'Queue projects and adopt known technology'],
      ['intel', 'intel', 'Intelligence & cyber', 'Networks, covert operations, digital defence'],
      ['inbox', 'inbox', 'Messages & timeline', 'Decisions, events and history'],
      ['stats', 'stats', 'Statistics & rankings', 'Charts, comparisons, world overview'],
      ['objectives', 'star', 'Objectives', 'Victory paths and your standing'],
      ['saves', 'save', 'Save & load', 'Slots, autosave, export'],
      ['settings', 'settings', 'Settings & accessibility', 'Text size, contrast, motion, sound'],
      ['help', 'help', 'How to play', 'Core ideas and tips'],
    ];
    return {
      title: 'More',
      sub: esc(sim.scenario.name),
      html:
        items.map(([id, ic, t, s]) => li(t, s, '', `data-open="${id}"`, icon(ic, 'wn', 24))).join('') +
        `<div class="btnrow">${btn('New game', 'data-act="newgame"', 'small')}${btn('Main menu', 'data-act="mainmenu"', 'small')}</div>`,
    };
  },
  actions: { newgame: (app) => app.showNewGame(), mainmenu: (app) => app.showMainMenu() },
};
export const settings = {
  render(app) {
    const s = app.settings;
    const tg = (key, label, help) =>
      `<label class="row sp card"><span><b>${label}</b><div class="hint">${help}</div></span><input type="checkbox" data-commit="1" data-key="${key}" ${s[key] ? 'checked' : ''} style="width:26px;height:26px;accent-color:var(--accent)"></label>`;
    let h =
      sec('Appearance') +
      `<div class="seg">${[
        ['auto', 'Auto'],
        ['dark', 'Dark'],
        ['light', 'Light'],
      ]
        .map(([v, l]) => `<button data-act="theme" data-v="${v}" class="${s.theme === v ? 'on' : ''}">${l}</button>`)
        .join('')}</div>`;
    h += `<div class="slider-row"><div class="top"><span>Text size</span><b id="sv-s-text">${Math.round(s.textScale * 100)}%</b></div><input class="slider" type="range" min="0.85" max="1.5" step="0.05" value="${s.textScale}" data-live="1" data-commit="1" data-key="textScale" aria-label="Text size"></div>`;
    h +=
      tg('highContrast', 'High contrast', 'Stronger borders and text.') +
      tg('colorBlind', 'Colour-blind friendly palette', 'Blue/orange instead of green/red; labels always accompany colours.') +
      tg('reduceMotion', 'Reduce motion', 'No animations or map inertia.');
    h +=
      sec('Performance & power') + tg('lowPower', 'Low-power mode', 'Lower render resolution and a smaller per-frame simulation budget.');
    h +=
      sec('Feedback') +
      tg('sound', 'Sound effects', 'Synthesised UI sounds.') +
      tg('haptics', 'Haptics', 'Vibration on important alerts (where supported).') +
      tg('confirmDestructive', 'Confirm risky actions', 'Ask before declaring war or lifting protections.') +
      tg('tutorial', 'Show tips on new games', '');
    h +=
      sec('Autosave') +
      `<div class="seg">${[
        [15, '15 days'],
        [30, '30 days'],
        [90, '90 days'],
      ]
        .map(([v, l]) => `<button data-act="autosave" data-v="${v}" class="${s.autosaveDays === v ? 'on' : ''}">${l}</button>`)
        .join('')}</div>`;
    h +=
      sec('Difficulty (this game)') +
      `<div class="card"><b style="text-transform:capitalize">${esc(app.sim.state.settings.difficulty)}</b><div class="hint">AI aggression ×${app.sim.diff.aiAggression} · political capital ×${app.sim.diff.pcMult}. Fixed for the playthrough.</div></div>`;
    return { title: 'Settings', sub: 'Accessibility & options', html: h };
  },
  actions: { theme: (app, el) => app.set('theme', el.dataset.v), autosave: (app, el) => app.set('autosaveDays', +el.dataset.v) },
  live(app, el) {
    if (el.dataset.key === 'textScale') {
      app.$('#sv-s-text').textContent = Math.round(+el.value * 100) + '%';
    }
  },
  commit(app, el) {
    const k = el.dataset.key;
    if (el.type === 'checkbox') app.set(k, el.checked);
    else app.set(k, +el.value);
  },
};
export const saves = {
  render(app) {
    const slots = app.saveList || [];
    let h = `<div class="note">Autosave alternates between two buffers so an interrupted write never corrupts your last good save. ${app.autosavedAt ? 'Last autosave ' + new Date(app.autosavedAt).toLocaleTimeString() + '.' : ''}</div>`;
    h += `<div class="btnrow">${btn('Save now', 'data-act="saveslot" data-slot="manual"', 'primary')}${btn('Export to file', 'data-act="export"')}${btn('Import file', 'data-act="import"')}</div><input type="file" id="importfile" accept=".mage,.json,.txt" hidden>`;
    h +=
      sec('Slots') +
      (slots.length
        ? slots
            .map(
              (s) =>
                `<div class="card"><div class="row sp"><b>${esc(s.key)}</b>${tag(esc(s.player || ''))}</div><div class="hint">${esc(s.date || '')} · ${esc(s.scenario || '')} · ${esc(s.label || '')}</div><div class="btnrow">${btn('Load', `data-act="loadslot" data-key="${esc(s.key)}"`, 'small primary')}${s.key.startsWith('slot') ? btn('Delete', `data-act="delslot" data-key="${esc(s.key)}"`, 'small danger') : ''}</div></div>`,
            )
            .join('')
        : '<div class="empty">No saves yet.</div>');
    return { title: 'Save & load', sub: 'Slots and autosave', html: h };
  },
  after(app) {
    refreshSaves(app);
    const f = app.$('#importfile');
    if (f)
      f.onchange = async () => {
        const file = f.files[0];
        if (!file) return;
        const text = await file.text();
        await loadText(app, text, 'imported file');
      };
  },
  actions: {
    saveslot: async (app) => {
      const text = app.snapshot('manual save');
      const n = (app.saveList || []).filter((x) => x.key.startsWith('slot')).length + 1;
      const key = 'slot' + Date.now().toString(36).slice(-4);
      await store.put(key, text);
      app.toast('Saved', 'Game saved to ' + key, 'good');
      refreshSaves(app);
    },
    loadslot: async (app, el) => {
      const t = await store.get(el.dataset.key);
      if (!t) return app.toast('Missing save', 'That slot is empty.', 'bad');
      await loadText(app, t, el.dataset.key);
    },
    delslot: async (app, el) => {
      await store.del(el.dataset.key);
      refreshSaves(app);
    },
    export: (app) => {
      const text = app.snapshot('exported');
      const wk = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.exportSave;
      if (wk) {
        wk.postMessage(text);
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
      a.download = `modern-age-${app.sim.calendar.format(app.sim.state.day)}.mage`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    },
    import: (app) => app.$('#importfile').click(),
  },
};
export async function refreshSaves(app) {
  const keys = (await store.keys()).filter((k) => !k.endsWith(':ptr'));
  const out = [];
  for (const k of keys) {
    try {
      const t = await store.get(k);
      if (!t) continue;
      const h = peek(t);
      out.push({ key: k, ...h });
    } catch {
      /* skip foreign keys */
    }
  }
  const sig = JSON.stringify(out.map((x) => x.key + x.savedAt));
  if (sig !== app._saveSig) {
    app._saveSig = sig;
    app.saveList = out;
    if (app.sheetScreen === 'saves') app.refreshSheet(true);
  }
}
export async function loadText(app, text, label) {
  try {
    const sim = deserialize(app.data, text);
    app.start(sim, { resumed: true });
    app.toast('Loaded', label, 'good');
  } catch (e) {
    app.toast('Cannot load', e instanceof SaveError ? e.message : 'Unexpected error: ' + e.message, 'bad');
  }
}
export const help = {
  render(app) {
    const t = (h, p) => `<div class="card"><b>${h}</b><div class="hint" style="margin-top:6px">${p}</div></div>`;
    return {
      title: 'How to play',
      sub: 'Core ideas',
      html:
        t(
          'Everything is connected',
          'Energy prices move inflation, inflation moves approval, approval moves elections, elections move policy. Few levers act alone.',
        ) +
        t(
          'Three currencies',
          '<b>Political capital</b> changes policy and starts wars. <b>Influence</b> buys diplomacy. <b>Intelligence points</b> run covert operations. All regenerate; none is unlimited.',
        ) +
        t(
          'Time',
          'Use ▶ for 1 day per second and faster speeds for long periods. The game pauses for decisions and wars. Space bar toggles pause.',
        ) +
        t(
          'The map',
          'Drag to pan, pinch or double-tap to zoom, tap a country for details. The globe button changes the map view: relations, economy, stability, military and trade flows.',
        ) +
        t(
          'War',
          'Armies are deployed to fronts automatically; you set stance and objectives. Supply, terrain, air superiority and readiness decide battles. Peace is negotiated, and every term has a price.',
        ) +
        t(
          'Winning',
          'Complete victory paths — prosperity, economic weight, influence, science, stability, security — before the scenario ends. Conquest is optional.',
        ) +
        t('Saving', 'The game autosaves regularly and when you leave the app. Resume from the main menu.'),
    };
  },
};
