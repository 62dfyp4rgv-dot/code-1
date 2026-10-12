// App controller: game loop (budgeted, generator-driven so monthly updates never block a frame), HUD, bottom sheet, toasts,
// map interaction routing, autosave and screen registry.
import { MapView, MODES } from './map.js';
import { icon } from './icons.js';
import { esc, money, pct, monthYear, people, GOV_LABEL } from './fmt.js';
import { loadSettings, saveSettings, autosave, store } from './storage.js';
import { sfx, unlock, setSound, haptic } from './audio.js';
import { serialize, peek } from '../sim/save.js';

export const SPEEDS = [1, 4, 12, 40]; // simulated days per real second

export class App {
  constructor(root, data) {
    this.root = root;
    this.data = data;
    this.settings = loadSettings();
    this.screens = {};
    this.sheetTab = {};
    this.sim = null;
    this.paused = true;
    this.speed = this.settings.speed ?? 1;
    this.acc = 0;
    this.gen = null;
    this.lastT = 0;
    this.lastHud = '';
    this.sheetScreen = null;
    this.sheetParams = {};
    this.unread = 0;
    this.interacting = false;
    this.history = [];
    try {
      this.earnedAchievements = JSON.parse(localStorage.getItem('ma:ach') || '{}');
    } catch {
      this.earnedAchievements = {};
    }
    this.build();
    this.applySettings();
    this.bindGlobal();
  }
  build() {
    this.root.innerHTML = `
      <canvas id="map" aria-label="World map"></canvas>
      <header id="hud"></header>
      <div id="maplegend" hidden></div>
      <div id="mapctl"></div>
      <div id="toasts" aria-live="polite"></div>
      <section id="sheet" aria-label="Details"><div class="grab" id="grab"><i></i></div><div class="sheet-head" id="sheetHead"></div><div class="sheet-tabs" id="sheetTabs"></div><div id="sheetBody"></div></section>
      <nav id="tabbar" aria-label="Main"></nav>
      <div id="overlay"></div>`;
    this.$ = (s) => this.root.querySelector(s);
    this.map = new MapView(this.$('#map'), this);
    this.tabs = [
      ['map', 'Map', 'map'],
      ['nation', 'Nation', 'nation'],
      ['economy', 'Economy', 'economy'],
      ['diplomacy', 'Diplomacy', 'diplomacy'],
      ['military', 'Military', 'military'],
      ['more', 'More', 'menu'],
    ];
    this.$('#tabbar').innerHTML = this.tabs
      .map(([id, label, ic]) => `<button data-tab="${id}" aria-label="${label}">${icon(ic, '', 22)}<span>${label}</span></button>`)
      .join('');
    this.$('#mapctl').innerHTML =
      `<button class="iconbtn" data-mapact="mode" aria-label="Map mode">${icon('globe')}</button><button class="iconbtn" data-mapact="zin" aria-label="Zoom in">${icon('plus')}</button><button class="iconbtn" data-mapact="zout" aria-label="Zoom out">${icon('minus')}</button><button class="iconbtn" data-mapact="home" aria-label="Centre on my country">${icon('target')}</button>`;
    window.addEventListener('resize', () => {
      this.map.resize();
      this.fitSheet();
    });
    window.addEventListener('orientationchange', () =>
      setTimeout(() => {
        this.map.resize();
        this.fitSheet();
      }, 200),
    );
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.sim) {
        this.pause();
        this.doAutosave('background');
      }
    });
    window.addEventListener('pagehide', () => {
      if (this.sim) this.doAutosave('pagehide');
    });
  }
  applySettings() {
    const s = this.settings,
      r = document.documentElement;
    r.dataset.theme = s.theme === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : s.theme;
    r.dataset.contrast = s.highContrast ? 'high' : '';
    r.dataset.cvd = s.colorBlind ? '1' : '';
    r.dataset.reduce = s.reduceMotion ? '1' : '';
    r.style.setProperty('--fs', `${16 * s.textScale}px`);
    setSound(s.sound);
    this.map.setTheme(r.dataset.theme);
    this.map.dpr && this.map.resize();
    saveSettings(s);
  }
  set(key, value) {
    this.settings[key] = value;
    this.applySettings();
    if (key === 'speed') this.speed = value;
    this.refreshSheet(true);
  }
  // ------------------------------------------------------------------------------------------------ game lifecycle
  start(sim, { resumed = false } = {}) {
    this.sim = sim;
    this.paused = true;
    this.gen = null;
    this.acc = 0;
    this.unread = 0;
    this.mapSelected = -1;
    sim.on((t, p) => this.onSimEvent(t, p));
    this.map.attach(sim);
    this.map.setMode('political');
    this.map.focusCountry(sim.state.playerId, 7);
    this.history = [];
    this.sheetScreen = null;
    this.closeSheet(true);
    this.renderHud(true);
    this.updateTabs();
    this.updateLegend();
    this.lastAutosave = sim.state.day;
    this.requestFrame();
    if (!resumed) this.afterStartHint();
  }
  afterStartHint() {
    if (this.settings.tutorial) this.startTutorial?.();
  }
  play() {
    unlock();
    this.paused = false;
    this.lastT = performance.now();
    this.renderHud(true);
  }
  pause() {
    this.paused = true;
    this.renderHud(true);
  }
  toggle() {
    this.paused ? this.play() : this.pause();
    sfx.tap();
  }
  setSpeed(i) {
    this.speed = i;
    this.settings.speed = i;
    saveSettings(this.settings);
    this.renderHud(true);
  }
  requestFrame() {
    if (this._raf) return;
    this._raf = requestAnimationFrame((t) => {
      this._raf = 0;
      this.frame(t);
    });
  }
  frame(t) {
    const sim = this.sim;
    if (!sim) return;
    const dt = Math.min(250, t - (this.lastT || t));
    this.lastT = t;
    if (!this.paused && !sim.state.ended) this.advance(dt);
    this.map.render();
    this.renderHud(false);
    this.requestFrame();
  }
  advance(dt) {
    const sim = this.sim;
    this.acc += (dt / 1000) * SPEEDS[this.speed];
    if (this.acc > 6) this.acc = 6;
    const t0 = performance.now(),
      budget = this.settings.lowPower ? 5 : 9;
    const day0 = sim.state.day;
    while (this.acc >= 1 || this.gen) {
      if (!this.gen) {
        this.gen = sim.stepGen();
        this.acc -= 1;
      }
      const r = this.gen.next();
      if (r.done) {
        this.gen = null;
        if (this.paused) break;
      }
      if (performance.now() - t0 > budget) break;
    }
    if (sim.state.day !== day0) {
      this.map.markDirty(sim.calendar.isMonthStart(sim.state.day) || this.mapNeedsColors() ? 'colors' : 'view');
      if (sim.calendar.isMonthStart(sim.state.day)) {
        this.onMonth();
      }
      if (sim.state.day - this.lastAutosave >= (this.settings.autosaveDays || 30)) this.doAutosave('interval');
    }
  }
  mapNeedsColors() {
    return false;
  }
  onMonth() {
    sfx.month();
    this.refreshSheet(false);
    this.updateLegend();
  }
  // Finish the in-flight day (remaining monthly phases) so a save never captures a half-processed month.
  settle() {
    while (this.gen) {
      if (this.gen.next().done) this.gen = null;
    }
  }
  snapshot(label) {
    this.settle();
    return serialize(this.sim, { savedAt: Date.now(), label });
  }
  async doAutosave() {
    if (!this.sim || this.saving) return;
    this.saving = true;
    this.lastAutosave = this.sim.state.day;
    try {
      const text = this.snapshot('autosave');
      await autosave(text);
      this.autosavedAt = Date.now();
    } catch (e) {
      this.toast('Autosave failed', String(e.message || e), 'bad');
    } finally {
      this.saving = false;
    }
  }
  onSimEvent(type, p) {
    const sim = this.sim,
      me = sim.state.playerId;
    if (type === 'log') {
      if (p.c === me || p.level === 'high') {
        this.unread++;
        this.renderHud(true);
      }
      if (
        p.c === me &&
        p.level !== 'low' &&
        ['war', 'peace', 'election', 'regime', 'tech', 'diplomacy', 'intel', 'cyber', 'health', 'world'].includes(p.kind)
      )
        this.toast(p.kind.toUpperCase(), p.text, p.kind === 'war' || p.kind === 'regime' ? 'bad' : 'good');
      else if (p.level === 'high' && p.c !== me && ['war', 'world', 'peace'].includes(p.kind))
        this.toast(p.kind === 'world' ? 'World' : p.kind.toUpperCase(), p.text, p.kind === 'war' ? 'bad' : '');
      if (p.kind === 'war' && /declares war/.test(p.text) && (p.data.att === me || p.data.def === me)) {
        this.pause();
        sfx.war();
        haptic(40, this.settings.haptics);
      }
    } else if (type === 'decision') {
      this.pause();
      sfx.alert();
      haptic(25, this.settings.haptics);
      this.showDecision(p);
    } else if (type === 'peaceOffer') {
      this.pause();
      sfx.alert();
      haptic(25, this.settings.haptics);
      this.showPeaceOffer(p);
    } else if (type === 'ended') {
      this.pause();
      this.showEnd?.();
    } else if (type === 'tech' && p.country === me) sfx.tech();
    else if (type === 'achievement') {
      this.earnedAchievements = { ...this.earnedAchievements, [p.id]: Date.now() };
      try {
        localStorage.setItem('ma:ach', JSON.stringify(this.earnedAchievements));
      } catch {
        /* storage unavailable */
      }
      sfx.tech();
      this.toast('Achievement', p.name + ' — ' + p.desc, 'good');
    } else if (type === 'capture') this.map.markDirty('colors');
  }
  // ------------------------------------------------------------------------------------------------ HUD
  renderHud(force) {
    const sim = this.sim;
    if (!sim) return;
    const st = sim.state,
      c = sim.player,
      e = c.econ;
    const nowT = performance.now();
    if (!force && nowT - (this._hudT || 0) < 220) return;
    this._hudT = nowT;
    const key = [
      st.day,
      this.paused,
      this.speed,
      this.unread,
      c.gov.pc | 0,
      c.dip.influence | 0,
      (c.gov.approval * 100) | 0,
      e.gdp | 0,
    ].join('|');
    if (!force && key === this.lastHud) return;
    this.lastHud = key;
    const d = sim.date;
    const dateStr = `${d.d} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.m - 1]} ${d.y}`;
    const warn = (v, a, b) => (v < a ? 'bad' : v < b ? 'warn' : 'good');
    const atWar = sim.atWar(st.playerId);
    const sp = ['×1', '×4', '×12', '×40'][this.speed];
    this.$('#hud').innerHTML = `
      <div class="hud-row">
        <button class="chip-country" data-act="selfcard" aria-label="${esc(c.name)} overview"><span class="emblem">${esc(c.id)}</span><span class="grow" style="min-width:0;text-align:left"><div class="name">${esc(c.name)}</div><div class="sub">${dateStr} · ${this.paused ? 'Paused' : SPEEDS[this.speed] + ' d/s'}${atWar ? ' · <b style="color:var(--bad)">WAR</b>' : ''}</div></span></button>
        <div class="speedbox" role="group" aria-label="Simulation speed">
          <button data-act="toggle" class="${this.paused ? '' : 'on'}" aria-label="${this.paused ? 'Play' : 'Pause'}">${icon(this.paused ? 'play' : 'pause', '', 20)}</button>
          <button data-act="cyclespeed" aria-label="Change speed, currently ${sp}" style="width:48px;font-weight:800;font-size:.86rem">${sp}</button>
        </div>
        <button class="iconbtn" data-act="inbox" aria-label="Messages">${icon('inbox')}${this.unread ? `<span class="badge">${Math.min(99, this.unread)}</span>` : ''}</button>
      </div>
      <div class="pills" role="list">
        <span class="pill ${warn(c.gov.pc, 15, 35)}" role="listitem" title="Political capital">${icon('flag', '', 15)}<span class="k">PC</span> ${c.gov.pc.toFixed(0)}</span>
        <span class="pill" role="listitem" title="Diplomatic influence">${icon('diplomacy', '', 15)}<span class="k">Inf</span> ${c.dip.influence.toFixed(0)}</span>
        <span class="pill ${warn(c.gov.approval, 0.35, 0.5)}" role="listitem">${icon('people', '', 15)}<span class="k">Approval</span> ${(c.gov.approval * 100).toFixed(0)}%</span>
        <span class="pill ${e.growth < 0 ? 'bad' : ''}" role="listitem">${icon('economy', '', 15)}<span class="k">GDP</span> ${money(e.gdp)} ${e.growth >= 0 ? '▲' : '▼'}${Math.abs(e.growth * 100).toFixed(1)}%</span>
        <span class="pill ${e.infl > 0.06 ? 'warn' : ''}" role="listitem"><span class="k">Infl</span> ${(e.infl * 100).toFixed(1)}%</span>
        <span class="pill ${e.unemp > e.uNat + 0.03 ? 'warn' : ''}" role="listitem"><span class="k">Jobless</span> ${(e.unemp * 100).toFixed(1)}%</span>
      </div>`;
    this.updateTabs();
  }
  updateTabs() {
    for (const b of this.root.querySelectorAll('#tabbar button'))
      b.classList.toggle('on', b.dataset.tab === (this.sheetScreen ? this.tabOf(this.sheetScreen) : 'map'));
  }
  tabOf(id) {
    return (
      {
        overview: 'map',
        country: 'map',
        nation: 'nation',
        economy: 'economy',
        diplomacy: 'diplomacy',
        military: 'military',
        research: 'more',
        intel: 'more',
        inbox: 'more',
        stats: 'more',
        objectives: 'more',
        settings: 'more',
        more: 'more',
        trade: 'economy',
        dipTarget: 'diplomacy',
        force: 'military',
        peace: 'military',
        sea: 'map',
      }[id] || 'more'
    );
  }
  // ------------------------------------------------------------------------------------------------ sheet
  register(id, screen) {
    this.screens[id] = screen;
  }
  openSheet(id, params = {}, snap) {
    const sc = this.screens[id];
    if (!sc) return;
    this.sheetScreen = id;
    this.sheetParams = params;
    this.history = this.history.filter((h) => h.id !== id).slice(-6);
    this.history.push({ id, params });
    this.$('#sheet').classList.add('open');
    this.snapName = snap || this.snapName || 'half';
    this.fitSheet();
    this.refreshSheet(true, true);
    this.updateTabs();
    sfx.tap();
  }
  closeSheet(silent) {
    this.sheetScreen = null;
    this.$('#sheet').classList.remove('open');
    this.updateTabs();
    if (!silent) sfx.tap();
  }
  snapHeights() {
    const vh = window.innerHeight;
    const top = this.hudBottom();
    return {
      peek: 200,
      half: Math.round(vh * 0.52),
      full: Math.round(vh - top - parseFloat(getComputedStyle(this.root).getPropertyValue('--tab-h') || 58) - 10),
    };
  }
  hudBottom() {
    const h = this.$('#hud');
    return h ? h.getBoundingClientRect().bottom : 100;
  }
  fitSheet() {
    const s = this.$('#sheet');
    const hs = this.snapHeights();
    const tabH = 58;
    const avail = window.innerHeight - this.hudBottom() - tabH - 8;
    s.style.height = Math.min(hs[this.snapName || 'half'], avail) + 'px';
  }
  setSnap(n) {
    this.snapName = n;
    this.fitSheet();
  }
  refreshSheet(force, resetScroll) {
    if (!this.sheetScreen) return;
    if (!force && (this.interacting || this.root.querySelector('#sheetBody input:focus, #sheetBody textarea:focus'))) return;
    const sc = this.screens[this.sheetScreen];
    const tab = this.sheetTab[this.sheetScreen];
    let out;
    try {
      out = sc.render(this, { ...this.sheetParams, tab });
    } catch (e) {
      console.error(e);
      out = { title: 'Error', html: `<div class="note">This panel failed to render: ${esc(e.message)}</div>` };
    }
    const body = this.$('#sheetBody');
    const scroll = body.scrollTop;
    const key = out.html;
    if (!force && this._sheetKey === key + out.title) return;
    this._sheetKey = key + out.title;
    this.$('#sheetHead').innerHTML =
      `<h2>${esc(out.title)}${out.sub ? `<div class="sub">${out.sub}</div>` : ''}</h2>${out.headExtra || ''}<button class="iconbtn" data-act="closeSheet" aria-label="Close" style="width:44px;height:44px">${icon('x', '', 18)}</button>`;
    const tabsEl = this.$('#sheetTabs');
    tabsEl.style.display = out.tabs ? '' : 'none';
    tabsEl.innerHTML = out.tabs
      ? out.tabs
          .map(
            (t) => `<button data-sheettab="${t.id}" class="${(out.tab || tab || out.tabs[0].id) === t.id ? 'on' : ''}">${t.label}</button>`,
          )
          .join('')
      : '';
    body.innerHTML = out.html;
    body.scrollTop = resetScroll ? 0 : scroll;
    if (sc.after) sc.after(this, body, out);
  }
  // ------------------------------------------------------------------------------------------------ events & delegation
  bindGlobal() {
    this.root.addEventListener('click', (ev) => {
      unlock();
      const t = ev.target.closest('[data-act],[data-tab],[data-speed],[data-sheettab],[data-mapact],[data-open],[data-sel],[data-cmd]');
      if (!t) return;
      if (t.dataset.tab) return this.onTab(t.dataset.tab);
      if (t.dataset.speed !== undefined) {
        this.setSpeed(+t.dataset.speed);
        if (this.paused) this.play();
        return;
      }
      if (t.dataset.sheettab) {
        this.sheetTab[this.sheetScreen] = t.dataset.sheettab;
        this.refreshSheet(true, true);
        sfx.tap();
        return;
      }
      if (t.dataset.mapact) return this.onMapAct(t.dataset.mapact);
      if (t.dataset.open) {
        const [id, arg] = t.dataset.open.split(':');
        this.openSheet(id, arg !== undefined ? { id: /^\d+$/.test(arg) ? +arg : arg } : {});
        return;
      }
      if (t.dataset.sel !== undefined) {
        this.selectCountry(+t.dataset.sel, true);
        return;
      }
      if (t.dataset.cmd) {
        this.runCmdAttr(t);
        return;
      }
      const act = t.dataset.act;
      const a = this.actions[act];
      if (a) a(this, t, ev);
      else {
        const sc = this.screens[this.sheetScreen];
        if (sc && sc.actions && sc.actions[act]) sc.actions[act](this, t, ev);
      }
    });
    this.root.addEventListener('input', (ev) => {
      const sc = this.screens[this.sheetScreen];
      const t = ev.target;
      if (t.dataset.live && sc && sc.live) sc.live(this, t, ev);
    });
    this.root.addEventListener('change', (ev) => {
      const sc = this.screens[this.sheetScreen];
      const t = ev.target;
      if (t.dataset.commit && sc && sc.commit) {
        sc.commit(this, t, ev);
      }
    });
    const body = this.$('#sheetBody');
    body.addEventListener('pointerdown', (e) => {
      if (e.target.closest('input[type=range]')) this.interacting = true;
    });
    window.addEventListener('pointerup', () => {
      if (this.interacting) {
        this.interacting = false;
      }
    });
    window.addEventListener('pointercancel', () => {
      this.interacting = false;
    });
    // sheet dragging
    const grab = this.$('#grab'),
      head = this.$('#sheetHead');
    const sheet = this.$('#sheet');
    let drag = null;
    const down = (e) => {
      if (e.target.closest('button')) return;
      drag = { y: e.clientY, h: sheet.getBoundingClientRect().height, t: performance.now(), lastY: e.clientY };
      sheet.classList.add('dragging');
      e.currentTarget.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if (!drag) return;
      const dy = drag.y - e.clientY;
      const hs = this.snapHeights();
      const avail = window.innerHeight - this.hudBottom() - 58 - 8;
      sheet.style.height = Math.max(120, Math.min(avail, drag.h + dy)) + 'px';
      drag.lastY = e.clientY;
    };
    const up = (e) => {
      if (!drag) return;
      sheet.classList.remove('dragging');
      const h = sheet.getBoundingClientRect().height;
      const hs = this.snapHeights();
      const dyTotal = drag.y - drag.lastY;
      const flick = (e.clientY - drag.y) / Math.max(1, performance.now() - drag.t);
      drag = null;
      const opts = Object.entries(hs).map(([k, v]) => [k, Math.abs(v - h)]);
      if (h < 150) {
        this.closeSheet();
        return;
      }
      this.snapName = opts.sort((a, b) => a[1] - b[1])[0][0];
      this.fitSheet();
    };
    for (const el of [grab, head]) {
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ' && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) {
        e.preventDefault();
        if (this.sim) this.toggle();
      }
      if (e.key === 'Escape') this.closeSheet();
    });
  }
  actions = {
    toggle: (app) => app.toggle(),
    cyclespeed: (app) => {
      app.setSpeed((app.speed + 1) % 4);
      if (app.paused) app.play();
      sfx.tap();
    },
    closeSheet: (app) => app.closeSheet(),
    inbox: (app) => app.openSheet('inbox'),
    selfcard: (app) => app.selectCountry(app.sim.state.playerId, true),
    snapfull: (app) => app.setSnap('full'),
    snaphalf: (app) => app.setSnap('half'),
    back: (app) => {
      app.history.pop();
      const h = app.history.pop();
      if (h) app.openSheet(h.id, h.params);
      else app.closeSheet();
    },
  };
  onTab(id) {
    sfx.tap();
    if (id === 'map') {
      this.closeSheet(true);
      this.updateTabs();
      return;
    }
    const map = { nation: 'nation', economy: 'economy', diplomacy: 'diplomacy', military: 'military', more: 'more' };
    if (this.sheetScreen === map[id] && this.$('#sheet').classList.contains('open')) {
      this.closeSheet();
      return;
    }
    this.openSheet(map[id]);
  }
  onMapAct(a) {
    const m = this.map;
    const cx = m.vw / 2,
      cy = m.vh / 2;
    if (a === 'zin') {
      m.zoomAt(cx, cy, m.view.s * 1.6);
      m.clampView();
      m.markDirty();
    } else if (a === 'zout') {
      m.zoomAt(cx, cy, m.view.s / 1.6);
      m.clampView();
      m.markDirty();
    } else if (a === 'home') m.focusCountry(this.sim.state.playerId, 8);
    else if (a === 'mode') this.showModePicker();
    sfx.tap();
  }
  showModePicker() {
    const cur = this.map.mode;
    const flows = ['food', 'oil', 'gas', 'minerals'];
    this
      .openOverlay(`<div class="modal"><h2>Map view</h2>${MODES.map((m) => `<button class="opt ${m.id === cur ? 'sel' : ''}" data-mode="${m.id}"><b>${m.label}${m.id === cur ? ' ✓' : ''}</b><span>${this.modeHelp(m.id)}</span></button>`).join('')}
      <div class="sec">Commodity (Resources / Trade flows)</div><div class="seg" data-flowseg>${flows.map((f) => `<button data-flow="${f}" class="${this.map.flow === f ? 'on' : ''}">${f}</button>`).join('')}</div><div class="btnrow"><button class="btn" data-act="closeOverlay">Done</button></div></div>`);
    const ov = this.$('#overlay');
    ov.onclick = (e) => {
      const b = e.target.closest('[data-mode],[data-flow],[data-act]');
      if (!b) {
        if (e.target === ov) this.closeOverlay();
        return;
      }
      if (b.dataset.mode) {
        this.map.setMode(b.dataset.mode);
        this.updateLegend();
        this.showModePicker();
      } else if (b.dataset.flow) {
        this.map.setMode(this.map.mode, b.dataset.flow);
        this.updateLegend();
        this.showModePicker();
      } else if (b.dataset.act === 'closeOverlay') this.closeOverlay();
    };
  }
  modeHelp(id) {
    return {
      political: 'Countries in distinct colours; your territory outlined in gold.',
      relations: 'Green = friendly to you, red = hostile; hatched/dark red = at war.',
      economy: 'Income per head (log scale).',
      stability: 'Political stability (red unstable, green stable).',
      military: 'Estimated military power.',
      resources: 'Net exporters (amber) vs importers (blue) of the chosen commodity.',
      trade: 'Top bilateral flows of the chosen commodity.',
    }[id];
  }
  updateLegend() {
    const L = this.$('#maplegend');
    const m = this.map.mode;
    const rows = {
      political: null,
      relations: ['#c45a50', '#3c4660', '#40ae78', 'Hostile', 'Friendly'],
      economy: ['#28405a', '#50cdbe', null, 'Low income', 'High income'],
      stability: ['#c8504a', '#3c4660', '#40ae78', 'Unstable', 'Stable'],
      military: ['#3c4660', '#e99640', null, 'Weak', 'Strong'],
      resources: ['#508cdc', '#3c4660', '#e9aa3c', 'Net importer', 'Net exporter'],
      trade: ['#508cdc', '#3c4660', '#e9aa3c', 'Importer', 'Exporter'],
    }[m];
    if (!rows) {
      L.hidden = true;
      return;
    }
    L.hidden = false;
    const g = rows[2] ? `linear-gradient(90deg, ${rows[0]}, ${rows[1]}, ${rows[2]})` : `linear-gradient(90deg, ${rows[0]}, ${rows[1]})`;
    L.innerHTML = `<b>${MODES.find((x) => x.id === m).label}${m === 'resources' || m === 'trade' ? ' · ' + this.map.flow : ''}</b><div class="bar" style="background:${g}"></div><div class="ends"><span>${rows[3]}</span><span>${rows[4]}</span></div>`;
  }
  // ------------------------------------------------------------------------------------------------ selection & routing
  onMapTap(hit) {
    sfx.select();
    if (this.map.pick) {
      const p = this.map.pick;
      if (hit.region >= 0 && p.candidates.includes(hit.region)) {
        this.map.pick = null;
        this.map.markDirty();
        p.onPick(hit.region);
      } else {
        this.toast('Pick a highlighted region', 'Tap one of the marked regions, or cancel.', '');
      }
      return;
    }
    if (hit.region >= 0) {
      this.map.selectedRegion = hit.region;
      this.selectCountry(hit.country, true, hit.region);
    } else if (hit.sea >= 0) {
      this.map.selected = -1;
      this.map.markDirty();
      this.openSheet('sea', { id: hit.sea }, 'peek');
    } else {
      this.closeSheet(true);
      this.map.selected = -1;
      this.map.markDirty();
    }
  }
  selectCountry(i, open, region) {
    this.map.selected = i;
    this.map.markDirty();
    if (open) {
      const me = i === this.sim.state.playerId;
      this.openSheet('country', { id: i, region }, this.sheetScreen === 'country' ? this.snapName : 'half');
    }
  }
  startPick(candidates, onPick, label) {
    this.map.pick = { candidates, onPick };
    this.closeSheet(true);
    this.map.markDirty();
    this.toast(label || 'Choose a region', 'Tap a marked region on the map.', '');
  }
  cmd(c) {
    const r = this.sim.exec(c);
    if (!r.ok && !c.preview) {
      sfx.deny();
      this.toast('Not possible', r.reason || 'Command rejected', 'bad');
    } else if (r.ok && !c.preview) sfx.confirm();
    this.map.markDirty('colors');
    this.refreshSheet(true);
    this.renderHud(true);
    return r;
  }
  askConfirm(message, onYes) {
    this.openOverlay(
      `<div class="modal center"><h2>Are you sure?</h2><p>${esc(message)}</p><div class="btnrow"><button class="btn danger" data-cf="1">Yes, do it</button><button class="btn primary" data-cf="0">Cancel</button></div></div>`,
    );
    const ov = this.$('#overlay');
    ov.dataset.lock = '1';
    ov.onclick = (e) => {
      const b = e.target.closest('[data-cf]');
      if (!b) return;
      this.closeOverlay();
      if (b.dataset.cf === '1') onYes();
    };
  }
  runCmdAttr(el) {
    const c = JSON.parse(el.dataset.cmd.replace(/&quot;/g, '"'));
    if (el.dataset.confirm && (this.settings.confirmDestructive || el.dataset.confirmForce)) {
      // in-app dialog (native confirm() is unreliable inside WKWebView and cannot be tested headlessly)
      this.askConfirm(el.dataset.confirm, () => this.cmd(c));
      return;
    }
    this.cmd(c);
  }
  // ------------------------------------------------------------------------------------------------ toasts / overlay
  toast(title, text, kind = '') {
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.innerHTML = `<div class="grow"><b>${esc(title)}</b>${esc(text)}</div>`;
    const box = this.$('#toasts');
    box.appendChild(el);
    while (box.children.length > 2) box.firstChild.remove();
    el.addEventListener('click', () => el.remove());
    setTimeout(() => el.remove(), kind === 'bad' ? 7000 : 4500);
  }
  openOverlay(html) {
    const o = this.$('#overlay');
    o.innerHTML = html;
    o.classList.add('on');
    o.onclick = (e) => {
      if (e.target === o && !o.dataset.lock) this.closeOverlay();
    };
  }
  closeOverlay() {
    const o = this.$('#overlay');
    o.classList.remove('on');
    o.innerHTML = '';
    o.onclick = null;
    delete o.dataset.lock;
    this.refreshSheet(true);
  }
}
