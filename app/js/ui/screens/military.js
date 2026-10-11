import { esc, money, pct, pctS, idx100, GOOD } from '../fmt.js';
import { icon } from '../icons.js';
import { stat, kv, sec, tag, btn, li, note, probBar, swatch } from './util.js';
import { gauge, bars } from '../charts.js';
import { UNIT_TYPES } from '../../sim/military.js';
import { DOCTRINES, regionLabel, enemiesOf, termCost } from '../../sim/war.js';

const ORDER_LABEL = {
  hold: 'Holding',
  defend: 'Defending',
  attack: 'Attacking',
  move: 'Moving',
  bomb: 'Bombing',
  blockade: 'Blockading',
  patrol: 'Patrolling',
  rest: 'Resting',
  locked: 'Locked',
};
const sigm = (x) => 1 / (1 + Math.exp(-x));
function forceRow(app, f) {
  const sim = app.sim,
    loc = f.branch === 'sea' ? sim.geo.seas[f.loc]?.name : regionLabel(sim, f.loc);
  return li(
    `${esc(f.name)}`,
    `${esc(loc || '—')} · ${f.size.toFixed(1)}k · fill ${idx100(f.fill)}% · morale ${idx100(f.morale)}% · supply ${idx100(f.supply)}%`,
    tag(ORDER_LABEL[f.order.kind] || f.order.kind, f.order.kind === 'attack' ? 'warn' : ''),
    `data-open="force:${f.id}"`,
    icon(f.branch === 'land' ? 'tank' : f.branch === 'air' ? 'plane' : 'ship', 'mu', 20),
  );
}
export const military = {
  render(app, p) {
    const sim = app.sim,
      st = sim.state,
      me = st.playerId,
      c = sim.player,
      m = c.mil,
      e = c.econ;
    const wars = st.wars.filter((w) => w.active && (w.attackers.includes(me) || w.defenders.includes(me)));
    const tab = p.tab || (wars.length ? 'war' : 'overview');
    const tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'forces', label: 'Forces' },
      { id: 'war', label: wars.length ? `War (${wars.length})` : 'War & threats' },
      { id: 'build', label: 'Build' },
    ];
    let h = '';
    if (tab === 'overview') {
      h += `<div class="grid3">${stat('Active', m.active.toFixed(0) + 'k', 'reserve ' + m.reserve.toFixed(0) + 'k', '', 'military')}${stat('Power index', Math.round(sim.milPower(me)).toLocaleString(), 'rank #' + (st.countries.filter((x) => sim.milPower(x.idx) > sim.milPower(me)).length + 1))}${stat('Budget', money(c.spendCat ? c.spendCat.defense : 0), pct((c.spendCat ? c.spendCat.defense : 0) / e.gdp, 1) + ' of GDP')}</div>`;
      h +=
        gauge('Readiness', m.readiness, { hint: 'Driven by operations & maintenance funding, training and conscription.' }) +
        gauge('Land equipment fill', Math.min(1, m.equipFill.land)) +
        gauge('Air equipment fill', Math.min(1, m.equipFill.air)) +
        gauge('Naval equipment fill', Math.min(1, m.equipFill.sea));
      h +=
        gauge('Munitions stock', m.ammo / m.ammoCap, { text: m.ammo.toFixed(0) + ' days of intense operations' }) +
        gauge('Fuel stock', m.fuel / m.fuelCap, { text: m.fuel.toFixed(0) + ' days' });
      h +=
        sec('Budget use') +
        `<div class="card">${bars([
          { label: 'Personnel', v: m.budget.personnel, text: money(m.budget.personnel) },
          { label: 'Operations', v: m.budget.om, text: money(m.budget.om) },
          { label: 'Procurement', v: m.budget.proc, text: money(m.budget.proc) },
        ])}<div class="hint">Procurement replaces losses and modernises equipment. Cutting it erodes fill and quality.</div></div>`;
      h +=
        sec('Mobilisation') +
        `<div class="seg">${['Peacetime', 'Partial', 'Large', 'Total'].map((l, i) => `<button data-act="mobilize" data-l="${i}" class="${(m.mobilizationTarget || 0) === i ? 'on' : ''}">${l}</button>`).join('')}</div><div class="hint">Level ${m.mobilization.toFixed(1)} now. Mobilising raises forces, shrinks the workforce and increases war weariness; each step above current costs 6 PC.</div>`;
      h +=
        sec('Doctrine') +
        Object.entries(DOCTRINES)
          .map(
            ([id, d]) =>
              `<div class="card tap" data-act="doctrine" data-d="${id}" style="${m.doctrine === id ? 'border-color:var(--accent)' : ''}"><div class="row sp"><b style="text-transform:capitalize">${id}</b>${m.doctrine === id ? tag('Current', 'acc') : ''}</div><div class="hint">${d.desc}</div></div>`,
          )
          .join('') +
        `<div class="hint">Changing doctrine costs 15 PC and temporarily disorganises forces; allowed once a year.</div>`;
      h += sec('Commanders') + m.commanders.map((x) => kv(esc(x.name), `skill ${idx100(x.skill)}`)).join('');
      h += `<div class="grid2" style="margin-top:10px">${stat('Nuclear deterrent', ['None', 'Limited', 'Strategic'][m.nukes], 'deterrence only', '', 'shield')}${stat('War exhaustion', idx100(m.exhaustion) + '%', '', m.exhaustion > 0.5 ? 'dn' : '')}</div>`;
    } else if (tab === 'forces') {
      const fs = sim.forcesOf[me];
      const region = p.region;
      h += `<div class="hint">${fs.length} formations. Tap one to give orders. Formations are deployed automatically to fronts unless you take manual control.</div>`;
      h += `<label class="row sp card"><span>Manual control (disable auto-deployment)</span><input type="checkbox" data-commit="1" data-key="manual" data-scope="mil" ${m.manual ? 'checked' : ''} style="width:26px;height:26px;accent-color:var(--accent)"></label>`;
      for (const [b, l] of [
        ['land', 'Land'],
        ['air', 'Air'],
        ['sea', 'Naval'],
      ]) {
        const list = fs.filter((f) => f.branch === b);
        h +=
          sec(`${l} (${list.length})`) +
          (list.length
            ? list
                .sort((x, y) => y.size - x.size)
                .map((f) => forceRow(app, f))
                .join('')
            : '<div class="hint">None.</div>');
      }
    } else if (tab === 'war') {
      if (!wars.length) {
        h += `<div class="empty">${icon('shield', '', 36)}<br>You are at peace.</div>`;
        const N = sim.geo.N;
        const rivals = st.countries
          .filter((x) => x.idx !== me && (st.rel.rivalry[me * N + x.idx] > 30 || sim.hasCasusBelli(me, x.idx)))
          .sort((a, b) => st.rel.rivalry[me * N + b.idx] - st.rel.rivalry[me * N + a.idx])
          .slice(0, 8);
        h +=
          sec('Tensions & threats') +
          (rivals.length
            ? rivals
                .map((x) =>
                  li(
                    esc(x.name),
                    `rivalry ${Math.round(st.rel.rivalry[me * N + x.idx])}/100 · ${sim.hasCasusBelli(me, x.idx) ? 'you hold a casus belli' : 'no casus belli'}`,
                    tag(x.mil.nukes ? 'nuclear' : 'conventional', x.mil.nukes ? 'warn' : ''),
                    `data-open="dipTarget:${x.idx}"`,
                    swatch(app, x.idx),
                  ),
                )
                .join('')
            : '<div class="hint">No standing rivals.</div>');
        h += note(
          "War is declared from a country's diplomacy panel. Preparation, logistics and allies decide outcomes more than headcount.",
        );
      }
      for (const w of wars) h += warCard(app, w);
    } else {
      h += `<div class="note">New formations draw on your reserves and add to public debt. Equipment quality follows your technology; fill follows procurement.</div>`;
      for (const [id, u] of Object.entries(UNIT_TYPES)) {
        const pr = sim.exec({ type: 'raiseForce', unit: id, preview: true });
        h += `<div class="card"><div class="row sp"><b>${u.name}</b><span class="tag">~${pr.ok ? money(pr.cost) : '—'}</span></div><div class="hint">${u.branch} · nominal ${u.size}k${u.atk ? ` · attack ×${u.atk} defence ×${u.def} mobility ×${u.mob}` : ''}</div><div class="btnrow">${btn('Raise', `data-act="raise" data-u="${id}"`, 'small primary')}</div></div>`;
      }
    }
    return { title: 'Military', sub: `${esc(c.name)} · ${m.active.toFixed(0)}k active`, tabs, html: h };
  },
  actions: {
    mobilize: (app, el) => app.cmd({ type: 'mobilize', level: +el.dataset.l }),
    doctrine: (app, el) => app.cmd({ type: 'setDoctrine', doctrine: el.dataset.d }),
    raise: (app, el) => app.cmd({ type: 'raiseForce', unit: el.dataset.u }),
    stance: (app, el) =>
      app.cmd({
        type: 'setStance',
        enemy: +el.dataset.e,
        stance: el.dataset.s,
        objective: app.sim.player.mil.posture[+el.dataset.e]?.objective ?? -1,
      }),
    objective: (app, el) => {
      const sim = app.sim,
        e = +el.dataset.e,
        me = sim.state.playerId;
      const cands = [];
      for (let r = 0; r < sim.state.reg.ctrl.length; r++)
        if (sim.state.reg.ctrl[r] === e && sim.geo.regions[r].adj.some((a) => sim.state.reg.ctrl[a.to] === me)) cands.push(r);
      if (!cands.length) return app.toast('No contact', 'You have no regions bordering that enemy.', '');
      app.startPick(
        cands,
        (r) => {
          app.cmd({ type: 'setStance', enemy: e, stance: sim.player.mil.posture[e]?.stance || 'attack', objective: r });
          app.openSheet('military', { tab: 'war' });
        },
        'Choose the strategic objective',
      );
    },
    peace: (app, el) => peaceFlow(app, +el.dataset.w, +el.dataset.e),
    sendpeace: (app, el) => sendPeace(app, +el.dataset.w, +el.dataset.e),
    toggleterm: (app, el) => {
      const k = el.dataset.t;
      const d = app._peaceDraft;
      d.terms[k] = !d.terms[k];
      app.openSheet('peace', { w: d.w, e: d.e });
    },
    callyes: (app, el) => app.cmd({ type: 'respondCall', war: +el.dataset.w, join: true }),
    callno: (app, el) => app.cmd({ type: 'respondCall', war: +el.dataset.w, join: false }),
  },
  commit(app, el) {
    if (el.dataset.scope === 'mil') app.cmd({ type: 'setManualWar', value: el.checked });
  },
};
function warCard(app, w) {
  const sim = app.sim,
    st = sim.state,
    me = st.playerId;
  const side = w.attackers.includes(me) ? 'a' : 'd';
  const mine = w.score[side],
    theirs = w.score[side === 'a' ? 'd' : 'a'];
  const foes = side === 'a' ? w.defenders : w.attackers,
    friends = side === 'a' ? w.attackers : w.defenders;
  const dur = Math.round((st.day - w.start) / 30);
  let h = `<div class="card"><div class="row sp"><b>${esc(w.name)}</b>${tag(dur + ' months', 'warn')}</div>`;
  h += gauge('Your war score', Math.max(0, Math.min(1, (mine + 50) / 150)), {
    text: mine.toFixed(0) + ' vs ' + theirs.toFixed(0),
    cls: mine >= theirs ? 'good' : 'bad',
  });
  h +=
    kv('Your side', friends.map((i) => esc(st.countries[i].name)).join(', ')) +
    kv('Enemy', foes.map((i) => esc(st.countries[i].name)).join(', ')) +
    kv('Casualties (you)', Math.round(w.cas[me] || 0) + 'k') +
    kv('War exhaustion', idx100(sim.player.mil.exhaustion) + '%', sim.player.mil.exhaustion > 0.5 ? 'dn' : '') +
    `</div>`;
  for (const e of foes) {
    const po = sim.player.mil.posture[e] || { stance: 'defend', objective: -1 };
    h += `<div class="card"><div class="row sp"><b>Front vs ${esc(st.countries[e].name)}</b></div><div class="seg" style="margin-top:8px">${[
      ['defend', 'Defend'],
      ['attack', 'Attack'],
      ['hold', 'Hold'],
    ]
      .map(([s, l]) => `<button data-act="stance" data-e="${e}" data-s="${s}" class="${po.stance === s ? 'on' : ''}">${l}</button>`)
      .join(
        '',
      )}</div><div class="hint">Objective: ${po.objective >= 0 ? esc(regionLabel(sim, po.objective)) : 'none — forces pick targets by value and odds'}</div><div class="btnrow">${btn(icon('target', '', 16) + ' Set objective on map', `data-act="objective" data-e="${e}"`, 'small')}${btn('Negotiate peace', `data-act="peace" data-w="${w.id}" data-e="${e}"`, 'small primary')}</div></div>`;
  }
  for (const p of sim.player.dip.pending.filter((x) => x.kind === 'call' && x.war === w.id))
    h += `<div class="card" style="border-color:var(--warn)"><b>Call to arms</b><div class="hint">${esc(st.countries[p.principal].name)} asks you to join.</div><div class="btnrow">${btn('Join', `data-act="callyes" data-w="${w.id}"`, 'primary small')}${btn('Decline', `data-act="callno" data-w="${w.id}"`, 'small')}</div></div>`;
  return h;
}
function peaceFlow(app, wid, e) {
  app._peaceDraft = { w: wid, e, terms: { ceasefire: true } };
  app.openSheet('peace', { w: wid, e });
}
function buildTerms(app, d) {
  const sim = app.sim,
    st = sim.state,
    me = st.playerId,
    reg = st.reg;
  const terms = [];
  if (d.terms.ceasefire) terms.push({ kind: 'ceasefire' });
  for (const [k, on] of Object.entries(d.terms)) {
    if (!on) continue;
    if (k.startsWith('cede:')) terms.push({ kind: 'cede', region: +k.slice(5), to: me });
    if (k.startsWith('giveup:')) terms.push({ kind: 'cede', region: +k.slice(7), to: d.e });
    if (k === 'reparations') terms.push({ kind: 'reparations', pct: 0.01, years: 5 });
    if (k === 'demil') terms.push({ kind: 'demilitarize' });
    if (k === 'puppet') terms.push({ kind: 'puppet' });
  }
  return terms;
}
export const peace = {
  render(app, p) {
    const sim = app.sim,
      st = sim.state,
      me = st.playerId,
      reg = st.reg;
    const d = app._peaceDraft;
    if (!d) return { title: 'Peace', html: '<div class="empty">Nothing to negotiate.</div>' };
    const w = st.wars.find((x) => x.id === d.w && x.active);
    if (!w) return { title: 'Peace', html: '<div class="empty">That war has ended.</div>' };
    const foe = st.countries[d.e];
    const terms = buildTerms(app, d);
    const r = sim.exec({
      type: 'proposePeace',
      war: w.id,
      target: d.e,
      terms: terms.length ? terms : [{ kind: 'ceasefire' }],
      preview: true,
    });
    const ev = r.eval;
    const heldByMe = [];
    const heldByThem = [];
    for (let i = 0; i < reg.owner.length; i++) {
      if (reg.owner[i] === d.e && reg.ctrl[i] === me) heldByMe.push(i);
      if (reg.owner[i] === me && reg.ctrl[i] === d.e) heldByThem.push(i);
    }
    let h = `<div class="note">Offer terms to ${esc(foe.name)}. The likelihood reflects the war score balance, their exhaustion and the price of your demands.</div>`;
    h += `<label class="card row sp tap"><span><b>Ceasefire</b><div class="hint">Stop fighting where the lines stand; 4-year truce.</div></span><input type="checkbox" data-act="toggleterm" data-t="ceasefire" ${d.terms.ceasefire ? 'checked' : ''} style="width:26px;height:26px;accent-color:var(--accent)"></label>`;
    if (heldByMe.length) {
      h += sec('Demand territory you occupy');
      for (const i of heldByMe)
        h += `<label class="card row sp tap"><span><b>${esc(regionLabel(sim, i))}</b><div class="hint">price ${termCost(sim, w, { kind: 'cede', region: i }).toFixed(0)}</div></span><input type="checkbox" data-act="toggleterm" data-t="cede:${i}" ${d.terms['cede:' + i] ? 'checked' : ''} style="width:26px;height:26px;accent-color:var(--accent)"></label>`;
    }
    h +=
      sec('Other demands') +
      `<label class="card row sp tap"><span><b>Reparations</b><div class="hint">1% of their GDP for 5 years</div></span><input type="checkbox" data-act="toggleterm" data-t="reparations" ${d.terms.reparations ? 'checked' : ''} style="width:26px;height:26px;accent-color:var(--accent)"></label><label class="card row sp tap"><span><b>Demilitarisation</b><div class="hint">Cut their forces 25-30%</div></span><input type="checkbox" data-act="toggleterm" data-t="demil" ${d.terms.demil ? 'checked' : ''} style="width:26px;height:26px;accent-color:var(--accent)"></label><label class="card row sp tap"><span><b>Client state</b><div class="hint">They become your client: 1.5% of GDP tribute, shared wars, no foreign wars of their own. Revolts if you weaken. Price ${termCost(sim, w, { kind: 'puppet' }).toFixed(0)}</div></span><input type="checkbox" data-act="toggleterm" data-t="puppet" ${d.terms.puppet ? 'checked' : ''} style="width:26px;height:26px;accent-color:var(--accent)"></label>`;
    if (heldByThem.length) {
      h += sec('Concede territory (they hold)');
      for (const i of heldByThem)
        h += `<label class="card row sp tap"><span><b>${esc(regionLabel(sim, i))}</b><div class="hint">recognise their annexation</div></span><input type="checkbox" data-act="toggleterm" data-t="giveup:${i}" ${d.terms['giveup:' + i] ? 'checked' : ''} style="width:26px;height:26px;accent-color:var(--accent)"></label>`;
    }
    h +=
      sec('Likelihood') +
      probBar(sigm(ev.margin / 14)) +
      `<div class="hint">${ev.reasons.join(' · ')}</div>` +
      `<div class="btnrow">${btn('Back', 'data-act="back"', '')}${btn('Send offer', `data-act="sendpeace" data-w="${w.id}" data-e="${d.e}"`, 'primary')}</div>`;
    return { title: 'Peace terms', sub: esc(w.name), html: h };
  },
  actions: military.actions,
};
Object.assign(peace.actions, { sendpeace: (app, el) => sendPeace(app, +el.dataset.w, +el.dataset.e) });
function sendPeace(app, wid, e) {
  const d = app._peaceDraft;
  const terms = buildTerms(app, d);
  const r = app.cmd({ type: 'proposePeace', war: wid, target: e, terms: terms.length ? terms : [{ kind: 'ceasefire' }] });
  if (r.ok) {
    app.toast('Peace', 'The offer is accepted.', 'good');
    app.openSheet('military', { tab: 'war' });
    app.map.markDirty('colors');
  }
}

export const force = {
  render(app, p) {
    const sim = app.sim,
      f = sim.forceById(p.id);
    if (!f) return { title: 'Formation', html: '<div class="empty">This formation no longer exists.</div>' };
    const g = sim.geo;
    const loc = f.branch === 'sea' ? g.seas[f.loc].name : regionLabel(sim, f.loc);
    let h = `<div class="card"><div class="row sp"><b>${esc(f.name)}</b>${tag(ORDER_LABEL[f.order.kind] || f.order.kind)}</div><div class="hint">${esc(loc)}</div></div>`;
    h +=
      gauge('Strength', Math.min(1, f.size / Math.max(0.1, f.max)), { text: f.size.toFixed(1) + 'k / ' + f.max.toFixed(1) + 'k' }) +
      gauge('Equipment', Math.min(1, f.fill)) +
      gauge('Morale', f.morale) +
      gauge('Organisation', f.org) +
      gauge('Supply', f.supply, { hint: f.supply < 0.4 ? 'Cut off or overextended: attrition and weak combat power.' : '' }) +
      `<div class="hint">Experience ${idx100(f.exp)}%</div>`;
    h +=
      sec('Orders') +
      `<div class="btnrow">${btn('Hold', `data-act="ord" data-id="${f.id}" data-k="hold"`, 'small')}${btn('Defend', `data-act="ord" data-id="${f.id}" data-k="defend"`, 'small')}${f.branch === 'land' ? btn(icon('target', '', 15) + ' Attack…', `data-act="fatk" data-id="${f.id}"`, 'small primary') : ''}${f.branch === 'air' ? btn('Bomb…', `data-act="fbomb" data-id="${f.id}"`, 'small primary') : ''}${f.branch === 'sea' ? btn('Blockade here', `data-act="ord" data-id="${f.id}" data-k="blockade"`, 'small primary') : ''}${btn('Move…', `data-act="fmove" data-id="${f.id}"`, 'small')}</div>`;
    const c = sim.player.mil.commanders;
    if (f.branch === 'land' && c.length)
      h +=
        sec('Commander') +
        c
          .map(
            (x, i) =>
              `<div class="li" data-act="cmdr" data-id="${f.id}" data-i="${i}"><div class="grow"><div class="t">${esc(x.name)}</div><div class="s">skill ${idx100(x.skill)}</div></div>${f.cmd === i ? tag('Assigned', 'acc') : ''}</div>`,
          )
          .join('');
    h += `<div class="btnrow">${btn('Back', 'data-act="back"', '')}</div>`;
    return { title: 'Formation', sub: esc(f.name), html: h };
  },
  actions: {
    ord: (app, el) => {
      app.cmd({ type: 'setOrder', force: +el.dataset.id, kind: el.dataset.k, target: -1 });
    },
    cmdr: (app, el) => app.cmd({ type: 'assignCommander', force: +el.dataset.id, commander: +el.dataset.i }),
    fatk: (app, el) => {
      const sim = app.sim,
        f = sim.forceById(+el.dataset.id),
        g = sim.geo,
        reg = sim.state.reg,
        en = enemiesOf(sim, f.owner);
      const cands = [];
      const seen = new Set();
      const around = [f.loc, ...g.regions[f.loc].adj.map((a) => a.to)];
      for (const r of around)
        for (const a of g.regions[r].adj)
          if (en.has(reg.ctrl[a.to]) && !seen.has(a.to)) {
            seen.add(a.to);
            cands.push(a.to);
          }
      if (!cands.length) return app.toast('No enemy target', 'No enemy-held region is within reach.', '');
      app.startPick(
        cands,
        (r) => {
          app.cmd({ type: 'attackRegion', force: f.id, target: r });
          app.openSheet('force', { id: f.id });
        },
        'Choose the target region',
      );
    },
    fbomb: (app, el) => {
      const sim = app.sim,
        f = sim.forceById(+el.dataset.id),
        g = sim.geo,
        reg = sim.state.reg,
        en = enemiesOf(sim, f.owner);
      const cands = [];
      const seen = new Set([f.loc]);
      let fr = [f.loc];
      for (let h = 0; h < 2; h++) {
        const nf = [];
        for (const u of fr)
          for (const a of g.regions[u].adj)
            if (!seen.has(a.to)) {
              seen.add(a.to);
              nf.push(a.to);
              if (en.has(reg.ctrl[a.to]) || en.has(reg.owner[a.to])) cands.push(a.to);
            }
        fr = nf;
      }
      if (!cands.length) return app.toast('No targets in range', 'Move the wing closer to the enemy.', '');
      app.startPick(
        cands,
        (r) => {
          app.cmd({ type: 'setOrder', force: f.id, kind: 'bomb', target: r });
          app.openSheet('force', { id: f.id });
        },
        'Choose the bombing target',
      );
    },
    fmove: (app, el) => {
      const sim = app.sim,
        f = sim.forceById(+el.dataset.id),
        g = sim.geo;
      if (f.branch === 'sea') {
        const s = g.seas[f.loc];
        const opts = [f.loc, ...s.adj, ...s.adj.flatMap((a) => g.seas[a].adj)].filter((v, i, a) => a.indexOf(v) === i).slice(0, 14);
        app.openOverlay(
          `<div class="modal"><h2>Move fleet to…</h2>${opts.map((i) => `<button class="opt" data-sea="${i}"><b>${esc(g.seas[i].name)}</b></button>`).join('')}</div>`,
        );
        app.$('#overlay').onclick = (e) => {
          const b = e.target.closest('[data-sea]');
          if (!b) {
            if (e.target === app.$('#overlay')) app.closeOverlay();
            return;
          }
          app.closeOverlay();
          app.cmd({ type: 'moveForce', force: f.id, region: +b.dataset.sea });
        };
        return;
      }
      const reg = sim.state.reg,
        fr = sim.alliesOf(f.owner);
      fr.add(f.owner);
      const seen = new Set([f.loc]);
      let front = [f.loc];
      const cands = [];
      for (let h = 0; h < (f.branch === 'air' ? 4 : 3); h++) {
        const nf = [];
        for (const u of front)
          for (const a of g.regions[u].adj)
            if (!seen.has(a.to) && fr.has(reg.ctrl[a.to])) {
              seen.add(a.to);
              nf.push(a.to);
              cands.push(a.to);
            }
        front = nf;
      }
      if (!cands.length) return app.toast('Nowhere to go', 'No friendly region is within reach.', '');
      app.startPick(
        cands,
        (r) => {
          app.cmd({ type: 'moveForce', force: f.id, region: r });
          app.openSheet('force', { id: f.id });
        },
        'Choose a destination',
      );
    },
  },
};
