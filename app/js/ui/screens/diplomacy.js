import { esc, money, pct, REGION_LABEL, GOV_LABEL } from '../fmt.js';
import { icon } from '../icons.js';
import { stat, kv, sec, tag, btn, cmdBtn, li, opinionTag, note, swatch, probBar } from './util.js';
import { dipCost } from '../../sim/diplomacy.js';
import { OPS } from '../../sim/intel.js';

const ACTIONS = [
  ['improve', 'Improve relations', 'Spend influence to warm opinion.'], ['trade_agreement', 'Trade agreement', 'Lower trade friction and raise mutual opinion.'], ['non_aggression', 'Non-aggression pact', '10-year pledge.'],
  ['defense_pact', 'Defence pact', 'Mutual defence obligations.'], ['alliance', 'Alliance', 'Deep military and political partnership.'], ['research_partnership', 'Research partnership', 'Share know-how for 8 years.'],
  ['aid', 'Send aid', 'A gift of 0.2% of your GDP: raises opinion.'], ['arms_deal', 'Arms deal', 'Provide equipment on credit.'], ['guarantee', 'Guarantee independence', 'Pledge to defend their borders.'], ['embassy', 'Open embassy', 'Improves intelligence visibility.'],
];
export const diplomacy = {
  render(app, p) {
    const sim = app.sim, st = sim.state, me = st.playerId, N = sim.geo.N, c = sim.player;
    const tab = p.tab || 'relations';
    const tabs = [{ id: 'relations', label: 'Countries' }, { id: 'treaties', label: 'Treaties' }, { id: 'orgs', label: 'Blocs & UN' }, { id: 'sanctions', label: 'Sanctions' }];
    let h = `<div class="grid3">${stat('Influence', c.dip.influence.toFixed(0) + '/100', 'income ~' + ((0.55 + 0.11 * Math.pow(c.econ.gdp, 0.33)) * (0.55 + c.gov.bureaucracy)).toFixed(1) + '/mo', '', 'diplomacy')}${stat('Credibility', c.dip.credibility.toFixed(0), c.dip.credibility > 60 ? 'trusted' : c.dip.credibility < 40 ? 'doubted' : 'average', c.dip.credibility < 40 ? 'dn' : '', 'shield')}${stat('Allies', sim.alliesOf(me).size, 'treaty partners', '', 'link')}</div>`;
    if (tab === 'relations') {
      const f = app.dipFilter || 'near'; const q = (app.dipQuery || '').toLowerCase();
      const filters = [['near', 'Neighbours'], ['friends', 'Friends'], ['rivals', 'Rivals'], ['war', 'At war'], ['big', 'Great powers'], ['all', 'All']];
      h += `<div class="sec">Browse</div><input class="search" id="dipq" placeholder="Search countries…" value="${esc(app.dipQuery || '')}" data-live="1" aria-label="Search countries"><div class="sheet-tabs" style="padding:0 0 8px">${filters.map(([id, l]) => `<button data-act="dipfilter" data-f="${id}" class="${f === id ? 'on' : ''}">${l}</button>`).join('')}</div>`;
      let list = st.countries.filter((x) => x.idx !== me);
      if (q) list = list.filter((x) => x.name.toLowerCase().includes(q) || x.id.toLowerCase() === q);
      else if (f === 'near') list = list.filter((x) => sim.geo.neighbors[me].has(x.idx));
      else if (f === 'friends') list = list.filter((x) => st.rel.op[x.idx * N + me] > 25);
      else if (f === 'rivals') list = list.filter((x) => st.rel.rivalry[me * N + x.idx] > 30 || st.rel.op[x.idx * N + me] < -25);
      else if (f === 'war') list = list.filter((x) => sim.atWarWith(me, x.idx));
      else if (f === 'big') list = list.slice().sort((a, b) => b.econ.gdp - a.econ.gdp).slice(0, 25);
      list.sort((a, b) => (f === 'friends' ? st.rel.op[b.idx * N + me] - st.rel.op[a.idx * N + me] : f === 'rivals' ? st.rel.op[a.idx * N + me] - st.rel.op[b.idx * N + me] : b.econ.gdp - a.econ.gdp));
      h += list.slice(0, 60).map((x) => li(esc(x.name), `${GOV_LABEL[x.gov.type]} · ${money(x.econ.gdp)}`, opinionTag(st.rel.op[x.idx * N + me]), `data-open="dipTarget:${x.idx}"`, swatch(app, x.idx))).join('') || '<div class="empty">No countries match.</div>';
    } else if (tab === 'treaties') {
      const ts = st.treaties.filter((t) => t.active && t.parties.includes(me) && t.type !== 'ceasefire');
      h += sec('Your agreements') + (ts.length ? ts.map((t) => { const o = t.parties.find((x) => x !== me); return li(esc(t.type.replace(/_/g, ' ')), 'with ' + esc(st.countries[o].name) + (t.end ? ' · until ' + sim.calendar.format(t.end) : ''), '', `data-open="dipTarget:${o}"`, swatch(app, o)); }).join('') : '<div class="empty">No treaties yet. Open a country and propose one.</div>');
      const truces = st.treaties.filter((t) => t.active && t.type === 'ceasefire' && t.parties.includes(me)); if (truces.length) h += sec('Ceasefires') + truces.map((t) => li('Ceasefire with ' + esc(st.countries[t.parties.find((x) => x !== me)].name), 'until ' + sim.calendar.format(t.end), '')).join('');
      h += note('Breaking a ceasefire or leaving allies in the lurch costs credibility, which colours every future negotiation.');
    } else if (tab === 'orgs') {
      for (const o of st.orgs) { const member = o.members.includes(me); h += `<div class="card"><div class="row sp"><b>${esc(o.name)}</b>${member ? tag('Member', 'good') : tag(o.type.replace('_', ' '))}</div><div class="hint">${esc(sim.data.orgs.find((x) => x.id === o.id).desc)} · ${o.members.length} members</div>${!member && ['alliance', 'trade_bloc'].includes(o.type) ? `<div class="btnrow">${btn('Request accession', `data-act="accession" data-org="${o.id}"`, 'small')}</div>` : ''}</div>`; }
      const un = st.orgs.find((x) => x.id === 'un'); if (un) h += note(`Security Council: permanent seats held by ${un.permanent.map((i) => st.countries[i].name).join(', ')}. Rotating members: ${un.rotating.map((i) => st.countries[i].name).join(', ')}.`);
    } else {
      const mine = st.sanctions.filter((s) => s.by === me), onMe = st.sanctions.filter((s) => s.target === me || (s.coalition || []).includes(me));
      h += sec('Imposed by you') + (mine.length ? mine.map((s) => li('On ' + esc(st.countries[s.target].name), 'since ' + sim.calendar.format(s.start), btn('Lift', `data-cmd='${JSON.stringify({ type: 'liftSanction', id: s.id })}'`, 'small'))).join('') : '<div class="empty">None.</div>');
      h += sec('Affecting you') + (onMe.length ? onMe.map((s) => li('By ' + esc(st.countries[s.by].name), 'on ' + esc(st.countries[s.target].name), '')).join('') : '<div class="empty">None.</div>');
    }
    return { title: 'Diplomacy', sub: 'Influence is spent on every approach', tabs, html: h };
  },
  actions: {
    dipfilter: (app, el) => { app.dipFilter = el.dataset.f; app.dipQuery = ''; app.refreshSheet(true); },
    accession: (app, el) => { const org = app.sim.state.orgs.find((o) => o.id === el.dataset.org); const r = app.cmd({ type: 'propose', to: org.members[0], kind: 'join_org', params: { org: org.id } }); if (r.ok) app.toast(r.accepted ? 'Accepted' : 'Declined', r.accepted ? `You join ${org.name}.` : `${org.name} members are not ready to admit you.`, r.accepted ? 'good' : 'bad'); },
  },
  live(app, el) { if (el.id === 'dipq') { app.dipQuery = el.value; clearTimeout(app._dq); app._dq = setTimeout(() => { app.refreshSheet(true); const i = app.$('#dipq'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 150); } },
};

export const dipTarget = {
  render(app, p) {
    const sim = app.sim, st = sim.state, me = st.playerId, i = p.id, c = st.countries[i], N = sim.geo.N, me_c = sim.player;
    let h = `<div class="row sp"><div>${opinionTag(st.rel.op[i * N + me])}</div><div class="mu">Influence ${me_c.dip.influence.toFixed(0)}</div></div>`;
    h += sec('Propose'); const war = sim.atWarWith(me, i);
    for (const [kind, label, help] of ACTIONS) {
      if (war && kind !== 'improve') continue;
      const pr = sim.exec({ type: 'propose', to: i, kind, preview: true }); const ev = pr.eval; const cost = dipCost(kind); const can = me_c.dip.influence >= cost;
      h += `<div class="card"><div class="row sp"><b>${label}</b><span class="tag">${cost} inf</span></div><div class="hint">${help}</div>${kind === 'improve' ? '' : probBar(ev.prob)}<details style="margin-top:6px"><summary class="mu" style="cursor:pointer;font-size:.8rem">Why?</summary>${ev.factors.map((f) => kv(f.label, (f.v > 0 ? '+' : '') + f.v, f.v > 0 ? 'up' : f.v < 0 ? 'dn' : '')).join('')}</details><div class="btnrow">${btn('Propose', `data-act="propose" data-kind="${kind}" data-to="${i}" ${can ? '' : 'disabled'}`, 'primary small')}</div></div>`;
    }
    if (!war) {
      h += sec('Pressure');
      const sanc = st.sanctions.some((s) => s.by === me && s.target === i);
      h += `<div class="card"><div class="row sp"><b>${sanc ? 'Sanctions in force' : 'Impose sanctions'}</b><span class="tag">${dipCost('sanction')} inf</span></div><div class="hint">Embargo on energy trade and restricted market access. You and the target both lose trade; sanctions hurt more when allies join.</div><div class="btnrow">${sanc ? btn('Lift sanctions', `data-act="liftsanc" data-to="${i}"`, 'small') : btn('Impose', `data-act="sanction" data-to="${i}"`, 'danger small')}</div></div>`;
      const cb = sim.hasCasusBelli(me, i);
      h += `<div class="card"><div class="row sp"><b>Declare war</b>${cb ? tag('Casus belli', 'good') : tag('No casus belli', 'warn')}</div><div class="hint">Costs 30 political capital. Without a recognised cause you lose legitimacy and credibility. Allies of ${esc(c.name)} may join.</div><div class="btnrow">${btn('Declare war…', `data-act="warconfirm" data-to="${i}"`, 'danger small')}</div></div>`;
    }
    return { title: c.name, sub: 'Diplomacy', headExtra: btn(icon('left', '', 16), 'data-act="back"', 'small ghost'), html: h };
  },
  actions: {
    propose: (app, el) => { const to = +el.dataset.to, kind = el.dataset.kind; const r = app.cmd({ type: 'propose', to, kind }); if (r.ok) app.toast(r.accepted ? 'Accepted' : 'Declined', `${app.sim.state.countries[to].name} ${r.accepted ? 'agrees' : 'declines'}: ${kind.replace(/_/g, ' ')}`, r.accepted ? 'good' : 'bad'); },
    sanction: (app, el) => { app.cmd({ type: 'sanction', target: +el.dataset.to }); },
    liftsanc: (app, el) => { const s = app.sim.state.sanctions.find((x) => x.by === app.sim.state.playerId && x.target === +el.dataset.to); if (s) app.cmd({ type: 'liftSanction', id: s.id }); },
    warconfirm: (app, el) => { const to = +el.dataset.to, c = app.sim.state.countries[to]; const pv = app.sim.exec({ type: 'declareWar', target: to, preview: true }); app.openOverlay(`<div class="modal center"><h2>Declare war on ${esc(c.name)}?</h2><p>${pv.cb ? 'You have a recognised casus belli.' : '<b>You have no casus belli</b>: legitimacy and credibility will fall.'} Costs ${pv.cost} political capital. War will drive up exhaustion, casualties and costs.</p><div class="btnrow"><button class="btn" data-act="closeOverlay2">Cancel</button><button class="btn danger" data-act="dowar" data-to="${to}">Declare war</button></div></div>`); const ov = app.$('#overlay'); ov.onclick = (e) => { const b = e.target.closest('[data-act]'); if (!b) { if (e.target === ov) app.closeOverlay(); return; } if (b.dataset.act === 'closeOverlay2') app.closeOverlay(); if (b.dataset.act === 'dowar') { app.closeOverlay(); const r = app.cmd({ type: 'declareWar', target: +b.dataset.to, goal: 'territory' }); if (r.ok) app.openSheet('military', { tab: 'war' }); } }; },
  },
};
