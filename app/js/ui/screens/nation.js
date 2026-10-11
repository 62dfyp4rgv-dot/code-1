import { esc, money, pct, pctS, people, GOV_LABEL, idx100, GOOD, trend } from '../fmt.js';
import { icon } from '../icons.js';
import { stat, kv, sec, tag, btn, li, note, slider, fmtLever } from './util.js';
import { gauge, bars, spark } from '../charts.js';
import { policyIdeology, ideologyDistance } from '../../sim/politics.js';
import { policyCost } from '../../sim/commands.js';
import * as PRJ from '../../sim/projects.js';
import { GOV_PROFILE } from '../../sim/constants.js';

// Shared by the Nation and Economy screens: commit a policy slider, asking first when the change is expensive.
export function commitPolicySlider(app, el) {
  const cmd = { type: 'setPolicy', key: el.dataset.key, value: +el.value };
  const pv = app.sim.exec({ ...cmd, preview: true });
  // a stray tap on a long slider can be an expensive mistake: ask before spending a large share of political capital
  if (pv.ok && pv.cost >= 10) {
    const l = app.sim.data.policies.levers.find((x) => x.key === cmd.key);
    app.openOverlay(
      `<div class="modal center"><h2>Change ${esc(l.label)}?</h2><p>${esc(fmtLever(l, app.sim.player.target[cmd.key]))} → <b>${esc(fmtLever(l, cmd.value))}</b> costs <b>${pv.cost.toFixed(1)}</b> political capital (you have ${app.sim.player.gov.pc.toFixed(0)}).</p><div class="btnrow"><button class="btn primary" data-pc="1">Confirm</button><button class="btn" data-pc="0">Cancel</button></div></div>`,
    );
    const ov = app.$('#overlay');
    ov.dataset.lock = '1';
    ov.onclick = (e) => {
      const b = e.target.closest('[data-pc]');
      if (!b) return;
      app.closeOverlay();
      if (b.dataset.pc === '1') {
        const r = app.cmd(cmd);
        if (!r.ok) app.refreshSheet(true);
      } else app.refreshSheet(true);
    };
    return;
  }
  const r = app.cmd(cmd);
  if (!r.ok) app.refreshSheet(true);
}
export const nation = {
  render(app, p) {
    const sim = app.sim,
      c = sim.player,
      g = c.gov,
      e = c.econ,
      st = sim.state;
    const tab = p.tab || 'government';
    const tabs = [
      { id: 'government', label: 'Government' },
      { id: 'policy', label: 'Policies' },
      { id: 'society', label: 'Society' },
      { id: 'projects', label: 'Projects' },
    ];
    let h = '';
    if (tab === 'government') {
      const prof = GOV_PROFILE[g.type];
      h += `<div class="card"><div class="row sp"><div><b>${esc(g.leader.name)}</b><div class="hint">${GOV_LABEL[g.type]} · in office since ${sim.calendar.format(Math.max(g.leader.since, -4000)).slice(0, 4)}</div></div>${tag(esc(g.parties[0].name), 'acc')}</div></div>`;
      h += gauge('Approval', g.approval, {
        hint: g.approval < 0.4 ? 'Voters and elites are unhappy.' : 'Public mood towards the government.',
      });
      h +=
        gauge('Legitimacy', g.legitimacy) +
        gauge('Stability', g.stability, { hint: g.stability < 0.25 ? 'Regime collapse risk is rising.' : '' });
      h +=
        gauge('Unrest', g.unrest, { cls: g.unrest > 0.5 ? 'bad' : g.unrest > 0.3 ? 'warn' : 'good' }) +
        gauge('Corruption', g.corruption, {
          cls: g.corruption > 0.55 ? 'bad' : g.corruption > 0.35 ? 'warn' : 'good',
          hint: 'Cuts tax collection and investment efficiency.',
        });
      h +=
        sec('Political capital') +
        `<div class="card"><div class="row sp"><b>${g.pc.toFixed(0)} / 100</b><span class="tag">${prof.pcRate >= 1.2 ? 'Fast' : 'Normal'} regeneration</span></div><div class="hint">Spent on policy changes, budget shifts and war. Regenerates with state capacity and stability.</div></div>`;
      if (g.nextElection !== null) {
        const mo = Math.round((g.nextElection - st.day) / 30);
        h +=
          sec('Next election') +
          `<div class="card"><b>${mo > 0 ? 'in ' + mo + ' months' : 'imminent'}</b><div class="hint">Your party leads at ${idx100(g.parties[0].support)}% in the last result; approval ${idx100(g.approval)}% drives the next one.</div></div>`;
      }
      if (g.lastElection)
        h +=
          sec('Last election') +
          `<div class="card">${bars(g.lastElection.results.map((r) => ({ label: r.name.slice(0, 14), v: r.share, text: idx100(r.share) + '%' })))}</div>`;
      const pi = policyIdeology(c),
        pop = g.popIdeo;
      const dist = ideologyDistance(pi, pop);
      h +=
        sec('Public mood vs your policy') +
        `<div class="card">${bars(
          [
            ['Economy (state ↔ market)', 'econ'],
            ['Society (liberal ↔ traditional)', 'social'],
            ['Nation (global ↔ national)', 'nation'],
          ].map(([l, k]) => ({
            label: l.split(' (')[0],
            v: Math.abs(pi[k] - pop[k]),
            text: (pi[k] - pop[k] > 0.05 ? 'too far right' : pi[k] - pop[k] < -0.05 ? 'too far left' : 'aligned')
              .replace('right', k === 'econ' ? 'market' : k === 'social' ? 'traditional' : 'nationalist')
              .replace('left', k === 'econ' ? 'statist' : k === 'social' ? 'liberal' : 'globalist'),
            cls: Math.abs(pi[k] - pop[k]) > 0.4 ? 'bad' : Math.abs(pi[k] - pop[k]) > 0.2 ? 'warn' : 'good',
          })),
          { max: 1.2 },
        )}<div class="hint">Mismatch costs approval, especially in democracies (${prof.elect ? 'yours elects' : 'yours does not hold competitive elections'}).</div></div>`;
      h +=
        sec('Automation') +
        `<div class="card"><label class="row sp"><span>Independent central bank sets interest rate</span><input type="checkbox" data-commit="1" data-key="autoCB" data-scope="auto" ${c.autoCB ? 'checked' : ''} style="width:26px;height:26px;accent-color:var(--accent)"></label><label class="row sp" style="margin-top:12px"><span>Automatic fiscal stabilisers (deficit rule)</span><input type="checkbox" data-commit="1" data-key="autoFiscal" data-scope="auto" ${c.autoFiscal ? 'checked' : ''} style="width:26px;height:26px;accent-color:var(--accent)"></label></div>`;
    } else if (tab === 'policy') {
      h += `<div class="note">Policies take months to bite and cost <b>political capital</b> in proportion to the change. You have <b>${c.gov.pc.toFixed(0)}</b>. Preview the cost while dragging; release to enact.</div>`;
      const groups = {};
      for (const l of sim.data.policies.levers) (groups[l.group] ||= []).push(l);
      for (const [gname, ls] of Object.entries(groups)) {
        if (gname === 'Fiscal' || gname === 'Money') continue;
        h += sec(gname);
        for (const l of ls)
          h += slider({
            key: l.key,
            label: l.label,
            min: l.min,
            max: l.max,
            step: l.step,
            value: c.target[l.key],
            fmt: (v) => fmtLever(l, +v),
            help: l.help,
            cost: `Actual now: ${fmtLever(l, c.policy[l.key])}${Math.abs(c.policy[l.key] - c.target[l.key]) > l.step ? ' → moving to ' + fmtLever(l, c.target[l.key]) : ''}`,
          });
      }
      h += note('Taxes, spending, tariffs and interest rates live in the Economy tab.');
      h +=
        sec('Industrial focus') +
        `<div class="seg" style="flex-wrap:wrap">${sim.data.policies.industrialFocus.map((s) => `<button data-act="focus" data-s="${s}" class="${c.target.focus === s ? 'on' : ''}">${s}</button>`).join('')}</div><div class="hint">Directs private investment towards one sector (12 PC).</div>`;
    } else {
      const coh = c.pop.coh;
      const tot = coh[0] + coh[1] + coh[2];
      h += `<div class="grid3">${stat('Population', people(c.pop.total), pctS(c.pop.growth, 2) + '/yr', '', 'people')}${stat('Median-age proxy', pct(c.pop.elder, 0), '65+ share', c.pop.elder > 0.2 ? 'wn' : '')}${stat('Fertility', c.pop.fertility.toFixed(2), 'children/woman', c.pop.fertility < 1.5 ? 'dn' : '')}</div>`;
      h +=
        sec('Age structure') +
        bars(
          [
            { label: '0–14', v: coh[0] / tot, text: pct(coh[0] / tot, 0) },
            { label: '15–64', v: coh[1] / tot, text: pct(coh[1] / tot, 0) },
            { label: '65+', v: coh[2] / tot, text: pct(coh[2] / tot, 0) },
          ],
          { max: 0.8 },
        );
      h +=
        sec('Living standards') +
        gauge('Health', c.pop.health, { text: idx100(c.pop.health) + ' · ' + GOOD(c.pop.health) }) +
        gauge('Education', c.pop.edu, { text: idx100(c.pop.edu) + ' · ' + GOOD(c.pop.edu) }) +
        gauge('Development index', e.hdi);
      h += `<div class="grid3" style="margin-top:10px">${stat('Poverty', pct(e.poverty, 1), '', e.poverty > 0.2 ? 'dn' : '')}${stat('Inequality', e.gini.toFixed(2), 'Gini', e.gini > 0.5 ? 'dn' : '')}${stat('Urban', pct(c.pop.urban, 0), '')}</div>`;
      h +=
        sec('Food, water & climate') +
        gauge('Food security', 1 - e.shortage[0], {
          cls: e.shortage[0] > 0.05 ? 'bad' : 'good',
          text: e.shortage[0] > 0.01 ? 'shortage ' + pct(e.shortage[0], 0) : 'secure',
        }) +
        gauge('Water stress', e.waterStress, {
          cls: e.waterStress > 0.6 ? 'bad' : e.waterStress > 0.35 ? 'warn' : 'good',
          text: GOOD(1 - e.waterStress),
        });
      h += `<div class="grid2" style="margin-top:8px">${stat('Migration', (c.pop.migNet * 1000).toFixed(0) + 'k/yr', c.pop.migNet >= 0 ? 'net inflow' : 'net outflow', '', 'people')}${stat('World temperature', '+' + st.world.temp.toFixed(2) + '°C', 'above pre-industrial', st.world.temp > 1.5 ? 'dn' : '', 'bolt')}</div>`;
      if (st.pandemic)
        h += note(
          `Active outbreak: ${esc(st.pandemic.name)} — ${(st.pandemic.infected[st.playerId] * 100).toFixed(1)}% of your population infected.`,
        );
    }
    if (tab === 'projects') {
      const ps = PRJ.ensure(c);
      h += note(
        `National projects take years and cost a share of GDP each year (financed by borrowing). Each grants permanent bonuses when finished. You can run ${PRJ.MAX_ACTIVE} at a time; starting one costs political capital.`,
      );
      const fx = (p) => p.effects.map((e) => `${e.mod.replace('.', ' ')} ${e.add > 0 ? '+' : ''}${(e.add * 100).toFixed(1)}%`).join(' · ');
      const order = { active: 0, available: 1, locked: 2, done: 3 };
      const list = sim.data.projects.map((p) => ({ p, s: PRJ.status(sim, c, p) })).sort((a, b) => order[a.s.state] - order[b.s.state]);
      for (const { p, s: ps2 } of list) {
        const cost = `${(p.cost * 100).toFixed(1)}% of GDP/yr for ${p.years} years`;
        let right = '';
        if (ps2.state === 'active')
          right = btn(
            'Cancel',
            `data-cmd="${esc(JSON.stringify({ type: 'cancelProject', project: p.id }))}" data-confirm="Cancel this project? Money already spent is lost."`,
            'small danger',
          );
        else if (ps2.state === 'available')
          right = btn(`Start · ${p.pc} PC`, `data-cmd="${esc(JSON.stringify({ type: 'startProject', project: p.id }))}"`, 'small primary');
        else if (ps2.state === 'locked') right = tag('Requirements not met', 'warn');
        else right = tag('Completed', 'good');
        h += `<div class="card"><div class="row sp"><b>${esc(p.name)}</b>${right}</div><div class="hint">${esc(p.desc)}</div><div class="hint">${esc(cost)} · ${esc(fx(p))}</div>${ps2.state === 'active' ? gauge('Progress', ps2.progress, { text: Math.round(ps2.progress * 100) + '%' }) : ''}</div>`;
      }
      if (!ps.active.length && !ps.done.length) h += `<div class="hint">No projects yet.</div>`;
    }
    return { title: 'Nation', sub: esc(c.name), tabs, html: h };
  },
  actions: { focus: (app, el) => app.cmd({ type: 'setFocus', sector: el.dataset.s }) },
  live(app, el) {
    if (el.dataset.scope !== 'p') return;
    const c = app.sim.player;
    const l = app.sim.data.policies.levers.find((x) => x.key === el.dataset.key);
    const v = +el.value;
    app.$('#sv-p-' + l.key).textContent = fmtLever(l, v);
    const r = app.sim.exec({ type: 'setPolicy', key: l.key, value: v, preview: true });
    app.$('#sc-p-' + l.key).innerHTML = r.ok
      ? `Cost: <b>${r.cost.toFixed(1)}</b> political capital`
      : `<span class="dn">${esc(r.reason)}</span>`;
  },
  commit(app, el) {
    if (el.dataset.scope === 'auto') return app.cmd({ type: 'toggleAuto', what: el.dataset.key, value: el.checked });
    if (el.dataset.scope === 'p') commitPolicySlider(app, el);
  },
};
