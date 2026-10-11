import { esc, pct, idx100, GOV_LABEL } from '../fmt.js';
import { icon } from '../icons.js';
import { stat, kv, sec, tag, btn, li, note, swatch } from './util.js';
import { gauge } from '../charts.js';
import { OPS, netLevel, perceive } from '../../sim/intel.js';

export const intel = {
  render(app, p) {
    const sim = app.sim, st = sim.state, me = st.playerId, c = sim.player, I = c.intel;
    let h = `<div class="grid3">${stat('Points', I.points.toFixed(0), '+' + (1.2 + 4 * I.level).toFixed(1) + '/mo', '', 'intel')}${stat('Agency', idx100(I.level), 'capability')}${stat('Counter-intel', idx100(I.ci), 'security')}</div>`;
    h += sec('Cyber posture') + gauge('Cyber defence', c.cyber.def) + gauge('Cyber offence', c.cyber.off) + (c.cyber.disruption > 0.05 ? note(`Current disruption to digital services: ${idx100(c.cyber.disruption)}%.`) : '');
    h += sec('Operations in progress') + (I.ops.length ? I.ops.map((o) => li(esc(OPS[o.type].name), `against ${esc(st.countries[o.target].name)} · ${Math.max(0, Math.ceil((o.end - st.day) / 30))} months`, '')).join('') : '<div class="hint">None. Open a country and launch an operation.</div>');
    const nets = Object.entries(I.nets).filter(([, v]) => v > 5).sort((a, b) => b[1] - a[1]).slice(0, 12);
    h += sec('Networks') + (nets.length ? nets.map(([i, v]) => li(esc(st.countries[i].name), `network ${Math.round(v)}/100`, '', `data-open="intelTarget:${i}"`, swatch(app, +i))).join('') : '<div class="hint">No networks yet beyond neighbours and allies.</div>');
    h += sec('Pick a target') + st.countries.filter((x) => x.idx !== me && (st.rel.rivalry[me * sim.geo.N + x.idx] > 20 || sim.atWarWith(me, x.idx))).slice(0, 10).map((x) => li(esc(x.name), 'rival', '', `data-open="intelTarget:${x.idx}"`, swatch(app, x.idx))).join('');
    h += note('Covert operations are abstract strategic mechanics: success depends on your agency and networks versus the target\'s counter-intelligence. Exposure harms relations and credibility.');
    return { title: 'Intelligence', sub: 'Information is power — and a liability', html: h };
  },
};
export const intelTarget = {
  render(app, p) {
    const sim = app.sim, st = sim.state, me = st.playerId, i = p.id, t = st.countries[i], c = sim.player; const pv = perceive(sim, me, i); const net = netLevel(sim, me, i);
    let h = `<div class="grid3">${stat('Network', Math.round(net) + '/100', '', '', 'intel')}${stat('Estimate error', '±' + Math.round(pv.sigma * 100) + '%', pv.exact ? '' : 'confidence ' + Math.round(pv.conf * 100) + '%')}${stat('Their counter-intel', idx100(t.intel.ci) > 0 ? 'unknown' : '', '')}</div>`;
    h += sec('Operations') + Object.entries(OPS).map(([id, o]) => `<div class="card"><div class="row sp"><b>${o.name}</b><span class="tag">${o.cost} pts · ${o.months} mo</span></div><div class="hint">${o.desc}</div><div class="hint">Base exposure risk ${Math.round(o.risk * 100)}%</div><div class="btnrow">${btn('Launch', `data-cmd='${JSON.stringify({ type: 'intelOp', op: id, target: i })}'`, 'small primary', c.intel.points < o.cost ? 'disabled' : '')}</div></div>`).join('');
    return { title: t.name, sub: 'Intelligence operations', headExtra: btn(icon('left', '', 16), 'data-act="back"', 'small ghost'), html: h };
  },
};
