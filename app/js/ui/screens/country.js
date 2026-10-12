import { esc, money, pct, pctS, people, GOV_LABEL, REGION_LABEL, monthYear, idx100 } from '../fmt.js';
import { icon } from '../icons.js';
import { stat, kv, sec, tag, btn, cmdBtn, li, opinionTag, note } from './util.js';
import { perceive, netLevel } from '../../sim/intel.js';
import { spark } from '../charts.js';
import { TERRAIN } from '../../sim/constants.js';

export const country = {
  render(app, p) {
    const sim = app.sim,
      st = sim.state,
      me = st.playerId,
      i = p.id ?? me,
      c = st.countries[i],
      N = sim.geo.N,
      self = i === me;
    const e = c.econ;
    const pv = perceive(sim, me, i);
    const conf = pv.exact ? 'exact' : `±${Math.round(pv.sigma * 100)}%`;
    const op = st.rel.op[i * N + me],
      myop = st.rel.op[me * N + i];
    const war = sim.atWarWith(me, i);
    const ally = sim.alliesOf(me).has(i);
    const trade = st.treaties.some((t) => t.active && t.type === 'trade_agreement' && t.parties.includes(me) && t.parties.includes(i));
    let h = '';
    h += `<div class="row" style="flex-wrap:wrap;gap:6px;margin:2px 0 8px">${tag(GOV_LABEL[c.gov.type])}${tag(REGION_LABEL[c.region])}${self ? tag('You', 'acc') : ''}${c.gov.civil ? tag('Civil conflict', 'bad') : ''}${c.dip.vassalOf !== null && c.dip.vassalOf !== undefined ? tag('Client of ' + esc(sim.state.countries[c.dip.vassalOf].name), 'warn') : ''}${war ? tag('At war', 'bad') : ''}${ally ? tag('Allied', 'good') : ''}${trade ? tag('Trade agreement', 'good') : ''}${sim.sanctioned(me, i) ? tag('Sanctions', 'warn') : ''}${c.mil.nukes ? tag('Nuclear', 'warn') : ''}</div>`;
    h += `<div class="grid3">${stat('GDP', money(pv.gdp), self ? pctS(e.growth) + ' yr' : conf, '', 'economy')}${stat('Per head', '$' + (((pv.gdp / c.pop.total) * 1000) / 1000).toFixed(1) + 'k', '', '', 'coin')}${stat('Population', people(c.pop.total), self ? pctS(c.pop.growth) : '', '', 'people')}</div>`;
    h += `<div class="grid3" style="margin-top:8px">${stat('Military', Math.round(pv.mil).toLocaleString(), self ? 'power index' : conf, '', 'military')}${stat('Stability', idx100(pv.stability) + '%', self ? '' : conf, pv.stability < 0.35 ? 'dn' : '')}${stat(self ? 'Approval' : 'Their view', self ? idx100(c.gov.approval) + '%' : (op > 0 ? '+' : '') + op, self ? '' : 'of you', op < -20 && !self ? 'dn' : '')}</div>`;
    if (p.region !== undefined && p.region >= 0) h += regionCard(app, p.region);
    if (self) {
      h += sec('Manage');
      h += `<div class="btnrow">${btn('Nation', 'data-open="nation"')}${btn('Economy', 'data-open="economy"')}${btn('Military', 'data-open="military"')}${btn('Objectives', 'data-open="objectives"')}</div>`;
    } else {
      h += sec('Relations');
      h += `<div class="card"><div class="row sp"><span>They regard you</span>${opinionTag(op)}</div><div class="row sp" style="margin-top:6px"><span>You regard them</span>${opinionTag(myop)}</div>${st.rel.rivalry[me * N + i] > 0 ? `<div class="row sp" style="margin-top:6px"><span>Standing rivalry</span>${tag(Math.round(st.rel.rivalry[me * N + i]) + '/100', st.rel.rivalry[me * N + i] > 50 ? 'bad' : 'warn')}</div>` : ''}</div>`;
      h += `<div class="btnrow">${btn(icon('diplomacy', '', 18) + ' Diplomacy', `data-open="dipTarget:${i}"`, 'primary')}${btn(icon('intel', '', 18) + ' Intelligence', `data-open="intelTarget:${i}"`)}${war ? btn(icon('military', '', 18) + ' War room', 'data-open="military"', 'danger') : ''}</div>`;
      const net = netLevel(sim, me, i);
      h += `<div class="hint">Intelligence network: ${Math.round(net)}/100 · estimates are ${conf} uncertain.${net < 25 ? ' Build a network to see more accurately.' : ''}</div>`;
    }
    h += sec('Economy & society');
    h +=
      kv(
        'Inflation / unemployment',
        `${self || !pv.exact ? '' : ''}${pct(e.infl)} · ${pct(e.unemp)}${self ? '' : ' <span class="mu">(reported)</span>'}`,
      ) +
      kv('Public debt', pct(e.debtRatio ?? 0, 0) + ' of GDP') +
      kv('Human development', (e.hdi * 100).toFixed(0) + '/100') +
      kv('Leader', esc(c.gov.leader.name)) +
      kv('Capital', esc(c.capital.name));
    const series = st.stats.yearly[i];
    if (series && series.gdp.length > 2)
      h += `<div class="card"><div class="row sp"><span class="mu">GDP, last ${series.gdp.length} years</span><b>${money(e.gdp)}</b></div>${spark(series.gdp)}</div>`;
    const treaties = st.treaties.filter((t) => t.active && t.parties.includes(i) && t.type !== 'ceasefire').slice(0, 6);
    if (treaties.length) {
      h += sec('Treaties');
      h += treaties
        .map((t) =>
          li(
            esc(t.type.replace(/_/g, ' ')),
            'with ' + esc(st.countries[t.parties.find((x) => x !== i)].name),
            '',
            `data-sel="${t.parties.find((x) => x !== i)}"`,
          ),
        )
        .join('');
    }
    const orgs = st.orgs.filter((o) => o.members.includes(i) && o.id !== 'un');
    if (orgs.length) {
      h += sec('Organisations');
      h += `<div class="row" style="flex-wrap:wrap;gap:6px">${orgs.map((o) => tag(esc(o.name.split('(')[0]))).join('')}</div>`;
    }
    return { title: c.name, sub: `${esc(c.capital.name)} · ${esc(c.gov.leader.name)}`, html: h };
  },
};
function regionCard(app, r) {
  const sim = app.sim,
    g = sim.geo,
    R = g.regions[r],
    st = sim.state,
    reg = st.reg;
  const owner = st.countries[reg.owner[r]],
    ctl = st.countries[reg.ctrl[r]];
  const forces = sim.forcesAtRegion.get(r) || [];
  const vis = app.map.visibleRegions()[r] || reg.owner[r] === st.playerId;
  const mine = forces.filter((f) => f.owner === st.playerId);
  const cities = R.cities.map((ci) => g.cities[ci].name).join(', ');
  let h = sec('Selected region');
  h += `<div class="card"><div class="row sp"><b>${cities ? esc(cities) : 'Region ' + r}</b>${tag(R.terrain)}</div>`;
  h +=
    kv('Owner', esc(owner.name)) +
    (reg.ctrl[r] !== reg.owner[r] ? kv('Occupied by', esc(ctl.name), 'dn') : '') +
    kv('Area', Math.round(R.area / 1000) + 'k km²') +
    kv('Defence modifier', '×' + TERRAIN[R.terrain].defense.toFixed(2) + ' · mobility ×' + TERRAIN[R.terrain].mobility.toFixed(2));
  if (reg.dev[r] > 0.01) h += kv('War damage', pct(reg.dev[r], 0), 'dn');
  if (reg.fort[r] > 0.01) h += kv('Fortification', pct(reg.fort[r], 0));
  if (vis && forces.length)
    h += kv(
      'Forces here',
      forces
        .map((f) => `${esc(st.countries[f.owner].id)} ${f.type}`)
        .slice(0, 6)
        .join(', '),
    );
  else if (!vis) h += `<div class="hint">No visibility of forces here (fog of war).</div>`;
  h += `</div>`;
  if (mine.length) h += `<div class="btnrow">${btn('Manage my forces here', 'data-open="military"')}</div>`;
  return h;
}
