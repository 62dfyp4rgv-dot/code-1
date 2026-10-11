// Flow screens: sea zone card, event decisions, main menu, new-game wizard, end-of-game report, tutorial coach marks.
import { esc, money, pct, people, idx100, GOV_LABEL, REGION_LABEL } from '../fmt.js';
import { icon } from '../icons.js';
import { stat, kv, sec, tag, btn, li, note } from './util.js';
import { gauge, lineChart, bars } from '../charts.js';
import { eventText } from '../../sim/events.js';
import { Sim } from '../../sim/world.js';
import { gradeOf } from '../../sim/victory.js';
import { regionLabel } from '../../sim/war.js';
import { loadAutosave, store } from '../storage.js';
import { loadText, refreshSaves } from './more.js';
import { sfx } from '../audio.js';

export const sea = {
  render(app, p) {
    const sim = app.sim,
      g = sim.geo,
      st = sim.state,
      s = g.seas[p.id];
    const fleets = st.forces.filter((f) => f.branch === 'sea' && f.loc === p.id);
    const cps = sim.data.chokepoints.filter((cp) => cp.seas.includes(s.name));
    let h = `<div class="hint">${Math.round((s.area / 1e6) * 10) / 10}M km² · ${s.coastRegions.length} coastal regions</div>`;
    if (cps.length)
      h +=
        sec('Chokepoints') +
        cps
          .map((cp) => {
            const o = st.chokes.find((x) => x.id === cp.id).open;
            return `<div class="li"><div class="grow"><div class="t">${esc(cp.name)}</div><div class="s">${cp.commodities.join(', ')}</div></div>${tag(o > 0.85 ? 'Open' : o > 0.5 ? 'Disrupted' : 'Closed', o > 0.85 ? 'good' : o > 0.5 ? 'warn' : 'bad')}</div>`;
          })
          .join('');
    h +=
      sec('Fleets present') +
      (fleets.length
        ? fleets
            .map((f) =>
              li(
                esc(f.name),
                esc(st.countries[f.owner].name) + ' · ' + f.size.toFixed(1) + 'k',
                '',
                f.owner === st.playerId ? `data-open="force:${f.id}"` : '',
              ),
            )
            .join('')
        : '<div class="hint">No fleets visible.</div>');
    return { title: s.name, sub: 'Sea zone', html: h };
  },
};
export function installFlow(App) {
  const P = App.prototype;
  P.showDecision = function (inst) {
    const sim = this.sim;
    const t = eventText(sim, inst);
    const def = sim.eventById[inst.id];
    this.openOverlay(
      `<div class="modal"><div class="row sp"><span class="tag warn">Decision</span><span class="mu">${Math.max(0, inst.expires - sim.state.day)} days to decide</span></div><h2>${esc(t.title)}</h2><p>${esc(t.text)}</p>${t.options.map((o) => `<button class="opt ${o.ok ? '' : 'dis'}" data-opt="${o.i}"><b>${esc(o.text)}</b>${o.hint ? `<span>${esc(o.hint)}</span>` : ''}</button>`).join('')}<div class="hint">If you do nothing, the default option is applied when the deadline passes.</div></div>`,
    );
    const ov = this.$('#overlay');
    ov.dataset.lock = '1';
    ov.onclick = (e) => {
      const b = e.target.closest('[data-opt]');
      if (!b) return;
      this.closeOverlay();
      const r = this.sim.exec({ type: 'resolveEvent', uid: inst.uid, option: +b.dataset.opt });
      if (r.ok) {
        sfx.confirm();
        this.refreshSheet?.(true);
      }
      /* an already-expired decision is resolved by default: no error toast */ const nxt = this.sim.state.events.pending.find(
        (x) => x.country === this.sim.state.playerId,
      );
      if (nxt) setTimeout(() => this.showDecision(nxt), 250);
    };
  };
  P.showPeaceOffer = function (offer) {
    const sim = this.sim,
      st = sim.state,
      w = st.wars.find((x) => x.id === offer.war);
    if (!w) return;
    const from = st.countries[offer.from];
    const me = st.countries[st.playerId];
    const termText = (t) =>
      t.kind === 'cede'
        ? `You cede ${esc(regionLabel(sim, t.region))}`
        : t.kind === 'reparations'
          ? `Reparations: ${(t.pct * 100).toFixed(2)}% of GDP for ${t.years} years`
          : t.kind === 'demilitarize'
            ? 'Your forces are limited for five years'
            : t.kind === 'puppet'
              ? 'Your government becomes a client state'
              : 'Ceasefire along the current lines';
    const adv = w.score[w.attackers.includes(st.playerId) ? 'a' : 'd'] - w.score[w.attackers.includes(st.playerId) ? 'd' : 'a'];
    this.openOverlay(
      `<div class="modal"><div class="row sp"><span class="tag warn">Peace offer</span><span class="mu">${Math.max(0, offer.expires - st.day)} days to answer</span></div><h2>${esc(from.name)} proposes terms</h2><p>To end the ${esc(w.name)}. Your war score ${adv >= 0 ? 'advantage' : 'deficit'}: ${adv.toFixed(0)}; war exhaustion ${(me.mil.exhaustion * 100).toFixed(0)}%.</p>${offer.terms.map((t) => `<div class="li" style="cursor:default"><div class="grow"><div class="t">${termText(t)}</div></div></div>`).join('')}<div class="btnrow"><button class="btn primary" data-po="1">Accept</button><button class="btn" data-po="0">Decline</button></div><div class="hint">Declining keeps the war going. Offers lapse after 45 days.</div></div>`,
    );
    const ov = this.$('#overlay');
    ov.dataset.lock = '1';
    ov.onclick = (e) => {
      const b = e.target.closest('[data-po]');
      if (!b) return;
      this.closeOverlay();
      this.cmd({ type: 'answerOffer', id: offer.id, accept: b.dataset.po === '1' });
    };
  };
  P.showMainMenu = async function () {
    this.pause?.();
    const auto = await loadAutosave().catch(() => null);
    let sub = '';
    if (auto) {
      try {
        const { peek } = await import('../../sim/save.js');
        const h = peek(auto.text);
        sub = `${esc(h.player)} · ${esc(h.date)} · ${esc(h.scenario.replace(/_/g, ' '))}`;
      } catch {
        /* ignore */
      }
    }
    this
      .openOverlay(`<div class="splash" style="background:transparent"><div style="max-width:420px;width:100%"><div style="font-size:12px;letter-spacing:.4em;color:var(--accent)">GRAND STRATEGY</div><h1>MODERN AGE</h1><p>Govern a nation in a connected, unpredictable world.</p>
      ${auto ? `<button class="opt" data-m="continue"><b>Continue</b><span>${sub}</span></button>` : ''}<button class="opt" data-m="new"><b>New game</b><span>Choose a scenario and a country</span></button><button class="opt" data-m="load"><b>Load or import</b><span>Saved games on this device</span></button><button class="opt" data-m="help"><b>How to play</b><span>Core ideas in one screen</span></button>${this.sim ? `<button class="opt" data-m="back"><b>Back to game</b></button>` : ''}
      <div class="hint" style="margin-top:10px">Offline single-player. Starting data is approximate and documented in the game files.</div></div></div>`);
    const ov = this.$('#overlay');
    ov.dataset.lock = '1';
    ov.onclick = async (e) => {
      const b = e.target.closest('[data-m]');
      if (!b) return;
      const m = b.dataset.m;
      if (m === 'continue') {
        this.closeOverlay();
        await loadText(this, auto.text, 'autosave');
      } else if (m === 'new') this.showNewGame();
      else if (m === 'load') {
        this.closeOverlay();
        if (!this.sim) {
          await this.bootBlank();
        }
        this.openSheet('saves');
      } else if (m === 'help') {
        this.closeOverlay();
        if (!this.sim) await this.bootBlank();
        this.openSheet('help');
      } else if (m === 'back') this.closeOverlay();
    };
  };
  P.bootBlank = async function () {
    const sim = new Sim(this.data, { seed: 1, scenario: 'quiet_decade', player: 'USA' });
    this.start(sim, { resumed: true });
    this.showMainMenuLater = true;
  };
  P.showNewGame = function () {
    const d = this.data;
    const draft =
      this.newDraft ||
      (this.newDraft = {
        scenario: 'fault_lines',
        country: 'USA',
        difficulty: 'normal',
        seed: Math.floor(Math.random() * 99999),
        q: '',
        step: 1,
        aggression: null,
      });
    const sc = d.scenarioById[draft.scenario];
    const rows = d.countries.filter((r) => !r.parent);
    const tier = (r) =>
      r.gdp_bn > 3000
        ? 'Superpower'
        : r.gdp_bn > 800
          ? 'Major power'
          : r.gdp_bn > 150
            ? 'Regional power'
            : r.gdp_bn > 25
              ? 'Middle state'
              : 'Small state';
    const rating = (r) => {
      const dev = r.gdp_bn / r.pop_m / (r.gdp_bn / r.pop_m + 15);
      const riv = d.rivalries.filter((x) => x[0] === r.iso3 || x[1] === r.iso3).reduce((s, x) => s + x[2], 0) / 100;
      return Math.max(
        1,
        Math.min(
          5,
          Math.round(
            1 +
              2.0 * (1 - dev) +
              Math.min(1.5, 0.45 * riv) +
              (r.dem < 30 ? 0.5 : 0) +
              (r.gdp_bn < 25 ? 0.5 : 0) -
              (r.gdp_bn > 3000 ? 0.4 : 0),
          ),
        ),
      );
    };
    const traits = (r) => {
      const res = d.resources[r.iso3];
      const t = [];
      if (res && (res.oil > 5 || res.gas > 8)) t.push('energy producer');
      if (res && res.minerals > 5) t.push('minerals');
      if (r.nuke) t.push('nuclear');
      if (r.pop_m > 200) t.push('huge population');
      if (r.dem < 30) t.push('authoritarian');
      else if (r.dem > 75) t.push('open democracy');
      if (d.rivalries.some((x) => (x[0] === r.iso3 || x[1] === r.iso3) && x[2] > 70)) t.push('hot rivalry');
      if (r.gdp_bn / r.pop_m < 5) t.push('developing');
      return t.slice(0, 3).join(' · ');
    };
    let list = rows;
    const q = draft.q.toLowerCase();
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q) || r.iso3.toLowerCase() === q);
    else
      list = (sc.recommended || [])
        .map((id) => rows.find((r) => r.iso3 === id))
        .filter(Boolean)
        .concat(
          rows
            .filter((r) => !(sc.recommended || []).includes(r.iso3))
            .sort((a, b) => b.gdp_bn - a.gdp_bn)
            .slice(0, 14),
        );
    const pick = rows.find((r) => r.iso3 === draft.country) || rows[0];
    this
      .openOverlay(`<div class="modal" style="max-height:96dvh"><div class="row sp"><h2>New game</h2><button class="iconbtn" data-n="close" aria-label="Close" style="width:38px;height:38px">${icon('x', '', 18)}</button></div>
      <div class="sec">Scenario</div>${d.scenarios.map((s) => `<button class="opt" data-sc="${s.id}" style="${s.id === draft.scenario ? 'border-color:var(--accent)' : ''}"><b>${esc(s.name)} ${s.id === draft.scenario ? '✓' : ''}</b><span>${esc(s.blurb)} · ${s.years} years</span></button>`).join('')}
      <div class="sec">Your country: <span style="color:var(--accent)">${esc(pick.name)}</span></div><input class="search" id="nq" placeholder="Search 168 countries…" value="${esc(draft.q)}" aria-label="Search countries">
      <div style="max-height:30dvh;overflow:auto;border:1px solid var(--line);border-radius:12px;padding:0 10px">${list
        .slice(0, 40)
        .map(
          (r) =>
            `<div class="li" data-c="${r.iso3}" style="${r.iso3 === draft.country ? 'background:color-mix(in srgb,var(--accent) 14%,transparent)' : ''}"><div class="grow"><div class="t">${esc(r.name)} ${r.iso3 === draft.country ? '✓' : ''}</div><div class="s">${tier(r)} · ${money(r.gdp_bn)} · ${people(r.pop_m)} · ${traits(r)}</div></div><div class="end" aria-label="difficulty ${rating(r)} of 5">${'●'.repeat(rating(r))}<span class="mu">${'●'.repeat(5 - rating(r))}</span></div></div>`,
        )
        .join('')}</div>
      <div class="sec">Difficulty</div><div class="seg">${['easy', 'normal', 'hard'].map((k) => `<button data-d="${k}" class="${draft.difficulty === k ? 'on' : ''}" style="text-transform:capitalize">${k}</button>`).join('')}</div><div class="slider-row"><div class="top"><span>AI aggression</span><b id="nagg">×${(draft.aggression ?? 1).toFixed(1)}</b></div><input class="slider" type="range" id="nagr" min="0.3" max="1.8" step="0.1" value="${draft.aggression ?? 1}" aria-label="AI aggression"></div><div class="hint">Difficulty scales AI aggression, event severity, and your political capital. Starting position difficulty (●) is shown per country.</div>
      <div class="row sp" style="margin-top:8px"><span class="mu">Seed ${draft.seed} (same seed + same choices = same world)</span><button class="btn small ghost" data-n="seed">Re-roll</button></div>
      <div class="btnrow"><button class="btn primary block" data-n="start" style="min-height:52px;font-size:1.05rem">Begin as ${esc(pick.name)}</button></div></div>`);
    const ov = this.$('#overlay');
    ov.dataset.lock = '1';
    const ag = this.$('#nagr');
    if (ag)
      ag.oninput = () => {
        draft.aggression = +ag.value;
        this.$('#nagg').textContent = '×' + (+ag.value).toFixed(1);
      };
    const input = this.$('#nq');
    input.oninput = () => {
      draft.q = input.value;
      clearTimeout(this._nq);
      this._nq = setTimeout(() => {
        this.showNewGame();
        const i = this.$('#nq');
        i.focus();
        i.setSelectionRange(i.value.length, i.value.length);
      }, 200);
    };
    ov.onclick = (e) => {
      const b = e.target.closest('[data-sc],[data-c],[data-d],[data-n]');
      if (!b) return;
      sfx.tap();
      if (b.dataset.sc) {
        draft.scenario = b.dataset.sc;
        this.showNewGame();
      } else if (b.dataset.c) {
        draft.country = b.dataset.c;
        this.showNewGame();
      } else if (b.dataset.d) {
        draft.difficulty = b.dataset.d;
        this.showNewGame();
      } else if (b.dataset.n === 'seed') {
        draft.seed = Math.floor(Math.random() * 99999);
        this.showNewGame();
      } else if (b.dataset.n === 'close') {
        this.closeOverlay();
        if (!this.sim) this.showMainMenu();
      } else if (b.dataset.n === 'start') this.startNew(draft);
    };
  };
  P.startNew = function (draft) {
    this.openOverlay(
      `<div class="splash" style="background:transparent"><div><div class="spinner"></div><p>Building the world…</p></div></div>`,
    );
    this.$('#overlay').dataset.lock = '1';
    setTimeout(() => {
      try {
        const sim = new Sim(this.data, {
          seed: draft.seed,
          scenario: draft.scenario,
          player: draft.country,
          difficulty: draft.difficulty,
          aiMult: draft.aggression ?? 1,
        });
        this.$('#overlay').classList.remove('on');
        this.$('#overlay').innerHTML = '';
        this.start(sim);
        if (!this.settings.tutorial) this.openSheet('country', { id: sim.state.playerId }, 'half');
      } catch (e) {
        console.error(e);
        this.closeOverlay();
        this.toast('Could not start', e.message, 'bad');
      }
    }, 60);
  };
  P.showEnd = function () {
    const sim = this.sim,
      st = sim.state,
      V = st.victory,
      e = st.ended;
    const c = sim.player;
    const S = st.stats.monthly;
    const headline =
      e.reason === 'time'
        ? gradeOf(V)
        : e.reason === 'regime_collapse'
          ? 'Government collapsed'
          : e.reason === 'lost_election'
            ? 'Voted out of office'
            : 'Campaign ended';
    const log = st.log.filter((l) => l.c === st.playerId && ['war', 'peace', 'election', 'regime', 'tech'].includes(l.kind)).slice(-12);
    this
      .openOverlay(`<div class="modal"><div class="row sp"><span class="tag acc">Final report</span><span class="mu">${sim.calendar.format(st.day)}</span></div><h1>${esc(headline)}</h1><p>${esc(c.name)} under ${esc(c.gov.leader.name)}.</p>
      <div class="grid3">${stat('Standing', V.standing + '/100')}${stat('Paths', V.counts + '/6')}${stat('GDP', money(c.econ.gdp))}</div>
      ${Object.values(V.paths)
        .map(
          (p) =>
            `<div class="li" style="cursor:default"><div class="grow"><div class="t">${esc(p.title)}</div></div>${p.done ? tag('Achieved', 'good') : tag(Math.round(p.progress * 100) + '%')}</div>`,
        )
        .join('')}
      <div class="sec">GDP over time</div>${lineChart([{ name: c.name, data: S.gdp }], { fmt: (v) => money(v) })}
      <div class="sec">Key moments</div>${log.map((l) => `<div class="hint">${sim.calendar.format(l.day)} — ${esc(l.text)}</div>`).join('') || '<div class="hint">A quiet term.</div>'}
      <div class="btnrow"><button class="btn" data-e="sandbox">Keep playing (sandbox)</button><button class="btn primary" data-e="new">New game</button><button class="btn" data-e="menu">Main menu</button></div></div>`);
    const ov = this.$('#overlay');
    ov.dataset.lock = '1';
    ov.onclick = (ev) => {
      const b = ev.target.closest('[data-e]');
      if (!b) return;
      if (b.dataset.e === 'sandbox') {
        sim.continueSandbox();
        this.closeOverlay();
      } else if (b.dataset.e === 'new') this.showNewGame();
      else this.showMainMenu();
    };
  };
  P.startTutorial = function () {
    const steps = [
      [
        'Welcome, head of government',
        'Drag the map to pan; pinch or double-tap to zoom. Tap any country for its profile and diplomatic options.',
      ],
      ['Time moves when you press ▶', 'The faster buttons skip ahead. The game pauses by itself for decisions, wars and elections.'],
      [
        'Your levers',
        'Use the tabs below: <b>Nation</b> for policy, <b>Economy</b> for budget and trade, <b>Diplomacy</b> and <b>Military</b>. Changes cost <b>political capital</b> (PC) and take months to bite.',
      ],
      [
        'Win by building',
        'Open More → Objectives to see six victory paths: prosperity, economic weight, influence, science, stability and security. Conquest is optional.',
      ],
    ];
    let i = 0;
    const root = this.root;
    const show = () => {
      root.querySelector('.coach')?.remove();
      if (i >= steps.length) {
        this.settings.tutorial = false;
        this.applySettings?.();
        return;
      }
      const el = document.createElement('div');
      el.className = 'coach';
      el.innerHTML = `<b>${steps[i][0]}</b>${steps[i][1]}<div class="btnrow"><button class="btn small" data-t="skip">Skip tips</button><button class="btn small" data-t="next">${i === steps.length - 1 ? 'Got it' : 'Next'}</button></div>`;
      root.appendChild(el);
      el.onclick = (e) => {
        const b = e.target.closest('[data-t]');
        if (!b) return;
        if (b.dataset.t === 'skip') {
          i = 99;
        } else i++;
        show();
      };
    };
    show();
  };
}
