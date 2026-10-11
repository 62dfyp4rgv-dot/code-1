import { esc, money, pct, title } from '../fmt.js';
import { icon } from '../icons.js';
import { stat, kv, sec, tag, btn, li, note } from './util.js';
import { gauge } from '../charts.js';
import { techAvailable, techCostRP, adoptionCost, canAdopt, adoptionShare } from '../../sim/research.js';

const BRANCHES = ['civil', 'industrial', 'medical', 'energy', 'computing', 'communications', 'military', 'environment'];
const FX_LABEL = {
  'tfp.agri': 'Farm productivity',
  'tfp.industry': 'Industrial productivity',
  'tfp.oil': 'Oil output',
  'tfp.gas': 'Gas output',
  'tfp.mining': 'Mining output',
  'tfp.utilities': 'Power productivity',
  'tfp.services': 'Services productivity',
  'tfp.tech': 'Tech-sector productivity',
  'energy.clean_rate': 'Clean-energy build rate',
  'energy.eff': 'Energy efficiency',
  'emis.int': 'Lower emissions',
  'min.recycle': 'Mineral recycling',
  'health.rate': 'Health gains',
  'edu.rate': 'Education gains',
  'research.eff': 'Research speed',
  'infra.eff': 'Infrastructure',
  'trade.eff': 'Trade efficiency',
  'tax.eff': 'Tax collection',
  'admin.cap': 'Administrative capacity',
  'agri.water': 'Drought resilience',
  'water.supply': 'Water supply',
  'disaster.resil': 'Disaster resilience',
  'epid.resp': 'Epidemic response',
  'info.def': 'Information integrity',
  'cyber.def': 'Cyber defence',
  'ci.eff': 'Counter-intelligence',
  'intel.eff': 'Intelligence',
  'mil.land': 'Land force quality',
  'mil.air': 'Air force quality',
  'mil.sea': 'Naval quality',
  'mil.logi': 'Military logistics',
  'mil.recon': 'Reconnaissance',
  'mil.cyber_off': 'Cyber operations',
  'mil.air_def': 'Air defence',
  'mil.mobil': 'Mobilisation',
};
export const fxText = (t) =>
  t.effects
    .map(
      (e) =>
        `${FX_LABEL[e.k] || e.k} +${(e.v * (e.k.endsWith('_rate') && e.v < 0.05 && !e.k.startsWith('energy') ? 100 : 100)).toFixed(e.v < 0.01 ? 1 : 0)}%`,
    )
    .join(' · ');
export const research = {
  render(app, p) {
    const sim = app.sim,
      c = sim.player,
      T = c.tech;
    const tab = p.tab || 'queue';
    const tabs = [
      { id: 'queue', label: 'Projects' },
      { id: 'adopt', label: 'Adopt' },
      ...BRANCHES.map((b) => ({ id: b, label: title(b) })),
    ];
    let h = `<div class="grid3">${stat('Research', T.rp.toFixed(1) + ' RP/mo', 'from ' + money(c.spendCat ? c.spendCat.research : 0) + '/yr', '', 'research')}${stat('Slots', T.slots, 'in parallel')}${stat('Known', T.known.length + '/' + sim.data.techs.length, 'technologies')}</div>`;
    if (tab === 'queue') {
      h +=
        sec('Active & queued') +
        (T.queue.length
          ? T.queue
              .map((q, i) => {
                const t = sim.data.techById[q.id];
                const cost = techCostRP(sim, c, t);
                const eta = Math.ceil((cost - q.progress) / Math.max(0.01, T.rp / Math.max(1, Math.min(T.slots, T.queue.length))));
                return `<div class="card"><div class="row sp"><b>${esc(t.name)}</b>${i < T.slots ? tag('Researching', 'acc') : tag('Queued')}</div><div class="hint">${fxText(t)}</div>${gauge('Progress', q.progress / cost, { text: Math.round(q.progress) + ' / ' + Math.round(cost) + ' RP · ~' + eta + ' mo' })}<div class="btnrow">${i > 0 ? btn('Prioritise', `data-cmd='${JSON.stringify({ type: 'prioritizeTech', tech: t.id })}'`, 'small') : ''}${btn('Remove', `data-cmd='${JSON.stringify({ type: 'dequeueTech', tech: t.id })}'`, 'small')}</div></div>`;
              })
              .join('')
          : '<div class="empty">No projects. Open a branch and queue a technology.</div>');
      if (T.adopting.length)
        h +=
          sec('Being adopted') +
          T.adopting.map((a) => li(esc(sim.data.techById[a.id].name), `${a.left} months left · ${money(a.monthly)}/mo`, '')).join('');
      h += note(
        'Research spends the national research budget on new technology. Adopting a technology other leading economies already use is cheaper and faster, but needs education and trade links.',
      );
    } else if (tab === 'adopt') {
      const list = sim.data.techs.filter((t) => canAdopt(sim, c, t)).sort((a, b) => adoptionCost(sim, c, a) - adoptionCost(sim, c, b));
      h +=
        sec('Technologies you can adopt') +
        (list.length
          ? list
              .map(
                (t) =>
                  `<div class="card"><div class="row sp"><b>${esc(t.name)}</b><span class="tag">${money(adoptionCost(sim, c, t))} · ${4 + 3 * t.tier} mo</span></div><div class="hint">${fxText(t)} · used by ${Math.round(adoptionShare(sim, t.id) * 100)}% of leading economies</div><div class="btnrow">${btn('Adopt', `data-cmd='${JSON.stringify({ type: 'adoptTech', tech: t.id })}'`, 'small primary')}</div></div>`,
              )
              .join('')
          : '<div class="empty">Nothing is available to adopt yet. Prerequisites or global uptake (≥20% of leading economies) are missing.</div>');
    } else {
      const list = sim.data.techs.filter((t) => t.branch === tab).sort((a, b) => a.tier - b.tier);
      h += list
        .map((t) => {
          const known = T.known.includes(t.id),
            avail = techAvailable(sim, c, t),
            queued = T.queue.some((q) => q.id === t.id);
          const missing = t.req.filter((r) => !T.known.includes(r)).map((r) => sim.data.techById[r].name);
          return `<div class="card" style="${known ? 'border-color:var(--good)' : ''}"><div class="row sp"><b>${esc(t.name)}</b><span class="row" style="gap:6px">${tag('T' + t.tier)}${known ? tag('Known', 'good') : queued ? tag('Queued', 'acc') : avail ? tag('Available') : tag('Locked', '')}</span></div><div class="hint">${fxText(t)}</div>${!known ? `<div class="hint">Cost ${Math.round(techCostRP(sim, c, t))} RP${missing.length ? ' · needs ' + missing.map(esc).join(', ') : ''}</div>` : ''}${avail && !queued ? `<div class="btnrow">${btn('Queue research', `data-cmd='${JSON.stringify({ type: 'queueTech', tech: t.id })}'`, 'small primary')}</div>` : ''}</div>`;
        })
        .join('');
    }
    return { title: 'Research', sub: 'Technology and know-how', tabs, html: h };
  },
};
