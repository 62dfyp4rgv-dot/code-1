import { esc, money, pct, pctS, GOOD, trend, idx100 } from '../fmt.js';
import { icon } from '../icons.js';
import { stat, kv, sec, tag, btn, li, note, slider, fmtLever } from './util.js';
import { gauge, bars, spark, lineChart } from '../charts.js';
import { SECTORS, COMMODITIES, BUDGET_CATS } from '../../sim/constants.js';
import { commitPolicySlider } from './nation.js';

const SECTOR_LABEL = {
  agri: 'Agriculture',
  industry: 'Industry',
  oil: 'Oil',
  gas: 'Gas',
  mining: 'Mining',
  utilities: 'Power & utilities',
  services: 'Services',
  tech: 'Technology',
};
export const economy = {
  render(app, p) {
    const sim = app.sim,
      c = sim.player,
      e = c.econ,
      st = sim.state;
    const tab = p.tab || 'overview';
    const tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'sectors', label: 'Sectors' },
      { id: 'fiscal', label: 'Fiscal & money' },
      { id: 'trade', label: 'Trade & energy' },
    ];
    const S = st.stats.monthly;
    let h = '';
    if (tab === 'overview') {
      h += `<div class="grid3">${stat('GDP', money(e.gdp), pctS(e.growth) + ' yr', e.growth < 0 ? 'dn' : 'up', 'economy')}${stat('Inflation', pct(e.infl), 'expected ' + pct(e.inflExp), e.infl > 0.06 ? 'dn' : '')}${stat('Unemployment', pct(e.unemp), 'natural ' + pct(e.uNat), e.unemp > e.uNat + 0.03 ? 'dn' : '')}</div>`;
      h += `<div class="grid3" style="margin-top:8px">${stat('Public debt', pct(e.debtRatio ?? 0, 0), money(e.debt), (e.debtRatio ?? 0) > 1 ? 'dn' : '')}${stat('Deficit', pctS(-(e.deficit / e.gdp)), money(e.deficit) + '/yr', e.deficit / e.gdp > 0.06 ? 'dn' : '')}${stat('Reserves', (e.reservesMonths ?? 0).toFixed(1) + ' mo', 'of imports', (e.reservesMonths ?? 9) < 2 ? 'dn' : '')}</div>`;
      h +=
        sec('Trends (monthly)') +
        `<div class="card"><div class="row sp"><span class="mu">GDP</span><b>${money(e.gdp)}</b></div>${spark(S.gdp)}<div class="row sp"><span class="mu">Inflation</span><b>${pct(e.infl)}</b></div>${spark(S.infl, { color: 'var(--warn)', zero: true })}<div class="row sp"><span class="mu">Unemployment</span><b>${pct(e.unemp)}</b></div>${spark(S.unemp, { color: 'var(--bad)' })}</div>`;
      h +=
        sec('Where the money goes (GDP by expenditure)') +
        `<div class="card">${bars(
          [
            { label: 'Consumption', v: e.cons / e.gdp, text: pct(e.cons / e.gdp, 0) },
            { label: 'Investment', v: e.inv / e.gdp, text: pct(e.inv / e.gdp, 0) },
            { label: 'Government', v: e.govC / e.gdp, text: pct(e.govC / e.gdp, 0) },
            {
              label: 'Net exports',
              v: Math.abs((e.exp - e.imp) / e.gdp),
              text: pctS((e.exp - e.imp) / e.gdp),
              cls: e.exp - e.imp < 0 ? 'warn' : 'good',
            },
          ],
          { max: 0.8 },
        )}<div class="hint">Capacity use ${pct(e.util, 0)} — ${e.util > 1.02 ? 'overheating: prices rise' : e.util < 0.96 ? 'slack: unemployment rises' : 'balanced'}.</div></div>`;
      const rk = [...st.countries].sort((a, b) => b.econ.gdp - a.econ.gdp).findIndex((x) => x.idx === st.playerId) + 1;
      h +=
        kv('World GDP rank', '#' + rk) +
        kv('Per head', '$' + (e.gdp / c.pop.total).toFixed(1) + 'k') +
        kv('Gini / poverty', e.gini.toFixed(2) + ' / ' + pct(e.poverty, 1));
    } else if (tab === 'sectors') {
      const tot = e.Y.reduce((a, b) => a + b, 0);
      h +=
        sec('Output by sector') +
        `<div class="card">${bars(SECTORS.map((s, i) => ({ label: SECTOR_LABEL[s], v: e.Y[i], text: money(e.Y[i]) + ' · ' + pct(e.Y[i] / tot, 0) })).filter((r) => r.v > 0.001))}</div>`;
      h +=
        sec('Capital & investment') +
        `<div class="card">${SECTORS.map((s, i) => (e.K[i] > 0.01 ? kv(SECTOR_LABEL[s], `${money(e.K[i])} capital · ${(e.invKeep ? (e.invKeep[i] / Math.max(1e-9, e.K[i])) * 100 : 0).toFixed(1)}%/yr`) : '')).join('')}<div class="hint">Private investment flows to sectors with high returns, scarce supply or policy priority. Steer it with the industrial focus in Nation → Policies.</div></div>`;
      h +=
        sec('Electricity & energy') +
        gauge('Clean share of power', e.clean, { cls: e.clean > 0.5 ? 'good' : 'warn' }) +
        `<div class="grid3">${stat('Emissions', Math.round(e.emis) + ' Mt', 'CO₂', '', 'flame')}${stat('Infrastructure', idx100(e.infra), GOOD(e.infra))}${stat('Productivity', '×' + (e.A[6] / 1).toFixed(2), 'services TFP')}</div>`;
      h +=
        sec('Technology effects') +
        `<div class="card">${
          Object.entries(c.techMods)
            .filter(([k]) => k.startsWith('tfp.'))
            .map(([k, v]) => kv(k.replace('tfp.', 'TFP '), '+' + (v * 100).toFixed(0) + '%'))
            .join('') || '<div class="hint">Research more technologies for productivity gains.</div>'
        }</div>`;
    } else if (tab === 'fiscal') {
      const lv = (k) => sim.data.policies.levers.find((l) => l.key === k);
      h += `<div class="grid3">${stat('Revenue', money(e.revenue), pct(e.revenue / e.gdp, 0) + ' of GDP')}${stat('Spending', money(e.spend), pct(e.spend / e.gdp, 0))}${stat('Interest', money(e.interest), pct(e.interest / Math.max(1, e.revenue), 0) + ' of revenue', e.interest / Math.max(1, e.revenue) > 0.15 ? 'dn' : '')}</div>`;
      h += `<div class="note">Tax revenue ${money(e.taxRev)} · tariffs ${money(e.tariffRev)} · resource rents ${money(e.rentRev)}. Bond yield ${pct(e.bondYield)}${e.marketClosed ? ' — <b>markets are closed to you</b>' : ''}.</div>`;
      for (const key of ['taxRate', 'spendRate', 'tariff', 'policyRate']) {
        const l = lv(key);
        h += slider({
          key,
          label: l.label,
          min: l.min,
          max: l.max,
          step: l.step,
          value: c.target[key],
          fmt: (v) => fmtLever(l, +v),
          help: l.help,
          cost: `Actual now: ${fmtLever(l, c.policy[key])}`,
        });
      }
      h += sec('Budget shares') + `<div class="hint">Share of non-interest spending. Dragging one share rescales the rest.</div>`;
      for (const k of BUDGET_CATS) {
        const cat = sim.data.policies.budgetCategories.find((x) => x.key === k);
        const v = c.target.budget[k];
        h += slider({
          key: k,
          label: cat.label,
          min: 0,
          max: 0.6,
          step: 0.01,
          value: Math.min(0.6, v),
          fmt: (x) => pct(+x, 0) + ' · ' + money(+x * e.spend),
          help: cat.help,
          cost: '',
          scope: 'b',
        });
      }
      h += `<div class="btnrow">${btn('Apply budget', 'data-act="applybudget"', 'primary')}</div>`;
    } else {
      h += sec('Resource balances') + `<div class="card">`;
      COMMODITIES.forEach((k, i) => {
        const cover = e.dem[i] > 0 ? (e.stock[i] / e.dem[i]) * 12 : 0;
        const net = e.exports[i] - e.imports[i];
        h += `<div class="row sp" style="padding:7px 0;border-bottom:1px solid var(--line)"><div><b style="text-transform:capitalize">${k}</b><div class="hint" style="margin:0">price ×${st.prices[i].toFixed(2)} · stock ${cover.toFixed(1)} mo</div></div><div style="text-align:right"><b class="${net >= 0 ? 'up' : 'wn'}">${net >= 0 ? 'exports ' : 'imports '}${money(Math.abs(net))}</b>${e.shortage[i] > 0.005 ? `<div class="dn" style="font-size:.78rem">shortage ${pct(e.shortage[i], 0)}</div>` : '<div class="hint" style="margin:0">no shortage</div>'}</div></div>`;
      });
      h += `</div>`;
      h +=
        sec('World prices') +
        `<div class="card">${COMMODITIES.map((k, i) => `<div class="row sp"><span style="text-transform:capitalize">${k}</span>${spark(st.stats.world[k].slice(-20), { w: 120, h: 28, color: 'var(--accent)' })}<b>×${st.prices[i].toFixed(2)}</b></div>`).join('')}</div>`;
      h +=
        sec('Chokepoints') +
        st.chokes
          .map((cp) => {
            const d = sim.data.chokepoints.find((x) => x.id === cp.id);
            return `<div class="li"><div class="grow"><div class="t">${esc(d.name)}</div><div class="s">carries ${d.commodities.join(', ')}</div></div><div class="end">${tag(cp.open > 0.85 ? 'Open' : cp.open > 0.5 ? 'Disrupted' : 'Closed', cp.open > 0.85 ? 'good' : cp.open > 0.5 ? 'warn' : 'bad')}</div></div>`;
          })
          .join('');
      h += `<div class="btnrow">${btn('Show flows on the map', 'data-act="mapflows"', '')}</div>`;
      const onMe = st.sanctions.filter((s) => s.target === st.playerId);
      if (onMe.length)
        h += note(`Sanctioned by ${onMe.map((s) => esc(st.countries[s.by].name)).join(', ')} — trade access ${pct(e.tradeAccess, 0)}.`);
    }
    return { title: 'Economy', sub: `${esc(c.name)} · ${money(e.gdp)}`, tabs, html: h };
  },
  actions: {
    mapflows: (app) => {
      app.map.setMode('trade', 'oil');
      app.updateLegend();
      app.closeSheet(true);
    },
    applybudget: (app) => {
      const shares = {};
      for (const k of BUDGET_CATS) shares[k] = app._budgetDraft?.[k] ?? app.sim.player.target.budget[k];
      const r = app.cmd({ type: 'setBudget', shares });
      if (r.ok) app._budgetDraft = null;
    },
  },
  live(app, el) {
    const sim = app.sim,
      c = sim.player,
      e = c.econ;
    if (el.dataset.scope === 'p') {
      const l = sim.data.policies.levers.find((x) => x.key === el.dataset.key);
      const v = +el.value;
      app.$('#sv-p-' + l.key).textContent = fmtLever(l, v);
      const r = sim.exec({ type: 'setPolicy', key: l.key, value: v, preview: true });
      app.$('#sc-p-' + l.key).innerHTML = r.ok
        ? `Cost: <b>${r.cost.toFixed(1)}</b> political capital`
        : `<span class="dn">${esc(r.reason)}</span>`;
    } else if (el.dataset.scope === 'b') {
      app._budgetDraft = app._budgetDraft || { ...c.target.budget };
      app._budgetDraft[el.dataset.key] = +el.value;
      let t = 0;
      for (const k of BUDGET_CATS) t += app._budgetDraft[k];
      app.$('#sv-b-' + el.dataset.key).textContent = pct(+el.value / t, 0) + ' · ' + money((+el.value / t) * e.spend);
      const r = sim.exec({ type: 'setBudget', shares: app._budgetDraft, preview: true });
      const n = app.$('#sc-b-' + el.dataset.key);
      if (n) n.innerHTML = r.ok ? `Total reshuffle costs <b>${r.cost.toFixed(1)}</b> PC` : `<span class="dn">${esc(r.reason)}</span>`;
    }
  },
  commit(app, el) {
    if (el.dataset.scope === 'p') commitPolicySlider(app, el);
  },
};
