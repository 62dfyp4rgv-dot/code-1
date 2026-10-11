import { esc, money, pct, pctS, people, GOV_LABEL, idx100, GOOD, trend } from '../fmt.js';
import { icon } from '../icons.js';
import { stat, kv, sec, tag, btn, li, note, slider, fmtLever } from './util.js';
import { gauge, bars, spark } from '../charts.js';
import { policyIdeology, ideologyDistance } from '../../sim/politics.js';
import { policyCost } from '../../sim/commands.js';
import { GOV_PROFILE } from '../../sim/constants.js';

export const nation = {
  render(app, p) {
    const sim = app.sim, c = sim.player, g = c.gov, e = c.econ, st = sim.state;
    const tab = p.tab || 'government';
    const tabs = [{ id: 'government', label: 'Government' }, { id: 'policy', label: 'Policies' }, { id: 'society', label: 'Society' }];
    let h = '';
    if (tab === 'government') {
      const prof = GOV_PROFILE[g.type];
      h += `<div class="card"><div class="row sp"><div><b>${esc(g.leader.name)}</b><div class="hint">${GOV_LABEL[g.type]} · in office since ${sim.calendar.format(Math.max(g.leader.since, -4000)).slice(0, 4)}</div></div>${tag(esc(g.parties[0].name), 'acc')}</div></div>`;
      h += gauge('Approval', g.approval, { hint: g.approval < 0.4 ? 'Voters and elites are unhappy.' : 'Public mood towards the government.' });
      h += gauge('Legitimacy', g.legitimacy) + gauge('Stability', g.stability, { hint: g.stability < 0.25 ? 'Regime collapse risk is rising.' : '' });
      h += gauge('Unrest', g.unrest, { cls: g.unrest > 0.5 ? 'bad' : g.unrest > 0.3 ? 'warn' : 'good' }) + gauge('Corruption', g.corruption, { cls: g.corruption > 0.55 ? 'bad' : g.corruption > 0.35 ? 'warn' : 'good', hint: 'Cuts tax collection and investment efficiency.' });
      h += sec('Political capital') + `<div class="card"><div class="row sp"><b>${g.pc.toFixed(0)} / 100</b><span class="tag">${prof.pcRate >= 1.2 ? 'Fast' : 'Normal'} regeneration</span></div><div class="hint">Spent on policy changes, budget shifts and war. Regenerates with state capacity and stability.</div></div>`;
      if (g.nextElection !== null) { const mo = Math.round((g.nextElection - st.day) / 30); h += sec('Next election') + `<div class="card"><b>${mo > 0 ? 'in ' + mo + ' months' : 'imminent'}</b><div class="hint">Your party leads at ${idx100(g.parties[0].support)}% in the last result; approval ${idx100(g.approval)}% drives the next one.</div></div>`; }
      if (g.lastElection) h += sec('Last election') + `<div class="card">${bars(g.lastElection.results.map((r) => ({ label: r.name.slice(0, 14), v: r.share, text: idx100(r.share) + '%' })))}</div>`;
      const pi = policyIdeology(c), pop = g.popIdeo; const dist = ideologyDistance(pi, pop);
      h += sec('Public mood vs your policy') + `<div class="card">${bars([['Economy (state ↔ market)', 'econ'], ['Society (liberal ↔ traditional)', 'social'], ['Nation (global ↔ national)', 'nation']].map(([l, k]) => ({ label: l.split(' (')[0], v: Math.abs(pi[k] - pop[k]), text: (pi[k] - pop[k] > 0.05 ? 'too far right' : pi[k] - pop[k] < -0.05 ? 'too far left' : 'aligned').replace('right', k === 'econ' ? 'market' : k === 'social' ? 'traditional' : 'nationalist').replace('left', k === 'econ' ? 'statist' : k === 'social' ? 'liberal' : 'globalist'), cls: Math.abs(pi[k] - pop[k]) > 0.4 ? 'bad' : Math.abs(pi[k] - pop[k]) > 0.2 ? 'warn' : 'good' })), { max: 1.2 })}<div class="hint">Mismatch costs approval, especially in democracies (${prof.elect ? 'yours elects' : 'yours does not hold competitive elections'}).</div></div>`;
      h += sec('Automation') + `<div class="card"><label class="row sp"><span>Independent central bank sets interest rate</span><input type="checkbox" data-commit="1" data-key="autoCB" data-scope="auto" ${c.autoCB ? 'checked' : ''} style="width:26px;height:26px;accent-color:var(--accent)"></label><label class="row sp" style="margin-top:12px"><span>Automatic fiscal stabilisers (deficit rule)</span><input type="checkbox" data-commit="1" data-key="autoFiscal" data-scope="auto" ${c.autoFiscal ? 'checked' : ''} style="width:26px;height:26px;accent-color:var(--accent)"></label></div>`;
    } else if (tab === 'policy') {
      h += `<div class="note">Policies take months to bite and cost <b>political capital</b> in proportion to the change. You have <b>${c.gov.pc.toFixed(0)}</b>. Preview the cost while dragging; release to enact.</div>`;
      const groups = {}; for (const l of sim.data.policies.levers) (groups[l.group] ||= []).push(l);
      for (const [gname, ls] of Object.entries(groups)) { if (gname === 'Fiscal' || gname === 'Money') continue; h += sec(gname); for (const l of ls) h += slider({ key: l.key, label: l.label, min: l.min, max: l.max, step: l.step, value: c.target[l.key], fmt: (v) => fmtLever(l, +v), help: l.help, cost: `Actual now: ${fmtLever(l, c.policy[l.key])}${Math.abs(c.policy[l.key] - c.target[l.key]) > l.step ? ' → moving to ' + fmtLever(l, c.target[l.key]) : ''}` }); }
      h += note('Taxes, spending, tariffs and interest rates live in the Economy tab.');
      h += sec('Industrial focus') + `<div class="seg" style="flex-wrap:wrap">${sim.data.policies.industrialFocus.map((s) => `<button data-act="focus" data-s="${s}" class="${c.target.focus === s ? 'on' : ''}">${s}</button>`).join('')}</div><div class="hint">Directs private investment towards one sector (12 PC).</div>`;
    } else {
      const coh = c.pop.coh; const tot = coh[0] + coh[1] + coh[2];
      h += `<div class="grid3">${stat('Population', people(c.pop.total), pctS(c.pop.growth, 2) + '/yr', '', 'people')}${stat('Median-age proxy', pct(c.pop.elder, 0), '65+ share', c.pop.elder > 0.2 ? 'wn' : '')}${stat('Fertility', c.pop.fertility.toFixed(2), 'children/woman', c.pop.fertility < 1.5 ? 'dn' : '')}</div>`;
      h += sec('Age structure') + bars([{ label: '0–14', v: coh[0] / tot, text: pct(coh[0] / tot, 0) }, { label: '15–64', v: coh[1] / tot, text: pct(coh[1] / tot, 0) }, { label: '65+', v: coh[2] / tot, text: pct(coh[2] / tot, 0) }], { max: 0.8 });
      h += sec('Living standards') + gauge('Health', c.pop.health, { text: idx100(c.pop.health) + ' · ' + GOOD(c.pop.health) }) + gauge('Education', c.pop.edu, { text: idx100(c.pop.edu) + ' · ' + GOOD(c.pop.edu) }) + gauge('Development index', e.hdi);
      h += `<div class="grid3" style="margin-top:10px">${stat('Poverty', pct(e.poverty, 1), '', e.poverty > 0.2 ? 'dn' : '')}${stat('Inequality', e.gini.toFixed(2), 'Gini', e.gini > 0.5 ? 'dn' : '')}${stat('Urban', pct(c.pop.urban, 0), '')}</div>`;
      h += sec('Food, water & climate') + gauge('Food security', 1 - e.shortage[0], { cls: e.shortage[0] > 0.05 ? 'bad' : 'good', text: e.shortage[0] > 0.01 ? 'shortage ' + pct(e.shortage[0], 0) : 'secure' }) + gauge('Water stress', e.waterStress, { cls: e.waterStress > 0.6 ? 'bad' : e.waterStress > 0.35 ? 'warn' : 'good', text: GOOD(1 - e.waterStress) });
      h += `<div class="grid2" style="margin-top:8px">${stat('Migration', (c.pop.migNet * 1000).toFixed(0) + 'k/yr', c.pop.migNet >= 0 ? 'net inflow' : 'net outflow', '', 'people')}${stat('World temperature', '+' + st.world.temp.toFixed(2) + '°C', 'above pre-industrial', st.world.temp > 1.5 ? 'dn' : '', 'bolt')}</div>`;
      if (st.pandemic) h += note(`Active outbreak: ${esc(st.pandemic.name)} — ${(st.pandemic.infected[st.playerId] * 100).toFixed(1)}% of your population infected.`);
    }
    return { title: 'Nation', sub: esc(c.name), tabs, html: h };
  },
  actions: { focus: (app, el) => app.cmd({ type: 'setFocus', sector: el.dataset.s }) },
  live(app, el) {
    if (el.dataset.scope !== 'p') return; const c = app.sim.player; const l = app.sim.data.policies.levers.find((x) => x.key === el.dataset.key); const v = +el.value;
    app.$('#sv-p-' + l.key).textContent = fmtLever(l, v); const r = app.sim.exec({ type: 'setPolicy', key: l.key, value: v, preview: true });
    app.$('#sc-p-' + l.key).innerHTML = r.ok ? `Cost: <b>${r.cost.toFixed(1)}</b> political capital` : `<span class="dn">${esc(r.reason)}</span>`;
  },
  commit(app, el) {
    if (el.dataset.scope === 'auto') return app.cmd({ type: 'toggleAuto', what: el.dataset.key, value: el.checked });
    if (el.dataset.scope === 'p') { const r = app.cmd({ type: 'setPolicy', key: el.dataset.key, value: +el.value }); if (!r.ok) app.refreshSheet(true); }
  },
};
