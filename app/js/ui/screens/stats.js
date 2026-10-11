import { esc, money, pct, idx100, GOV_LABEL } from '../fmt.js';
import { icon } from '../icons.js';
import { stat, kv, sec, tag, btn, li, note, swatch } from './util.js';
import { gauge, bars, lineChart, spark } from '../charts.js';
import { gradeOf } from '../../sim/victory.js';

export const stats = {
  render(app, p) {
    const sim = app.sim, st = sim.state, me = st.playerId; const tab = p.tab || 'charts';
    const tabs = [{ id: 'charts', label: 'Charts' }, { id: 'rank', label: 'Rankings' }, { id: 'world', label: 'World' }];
    let h = '';
    if (tab === 'charts') {
      const S = st.stats.monthly; const cmp = app.cmpCountry; const Y = cmp !== undefined ? st.stats.yearly[cmp] : null;
      const opts = [['gdp', 'GDP', (v) => money(v)], ['gdppc', 'GDP per head ($k)', (v) => v.toFixed(0)], ['growth', 'Growth', (v) => (v * 100).toFixed(1) + '%'], ['infl', 'Inflation', (v) => (v * 100).toFixed(1) + '%'], ['unemp', 'Unemployment', (v) => (v * 100).toFixed(1) + '%'], ['debt', 'Debt / GDP', (v) => (v * 100).toFixed(0) + '%'], ['approval', 'Approval', (v) => (v * 100).toFixed(0) + '%'], ['stability', 'Stability', (v) => (v * 100).toFixed(0) + '%'], ['pop', 'Population (M)', (v) => v.toFixed(0)], ['mil', 'Military power', (v) => Math.round(v)], ['poverty', 'Poverty', (v) => (v * 100).toFixed(1) + '%'], ['hdi', 'Development index', (v) => v.toFixed(2)]];
      const key = app.chartKey || 'gdp'; const o = opts.find((x) => x[0] === key);
      h += `<div class="sheet-tabs" style="padding:0 0 8px;flex-wrap:wrap">${opts.map(([k, l]) => `<button data-act="chartkey" data-k="${k}" class="${k === key ? 'on' : ''}">${l}</button>`).join('')}</div>`;
      const data = S[key].slice(-96); const series = [{ name: sim.player.name + ' (monthly)', data }];
      h += `<div class="card">${lineChart(series, { fmt: o[2], labels: [`${data.length} months ago`, 'now'] })}</div>`;
      if (Y && cmp !== undefined && Y[key].length > 1) h += `<div class="card"><div class="row sp"><b>${esc(st.countries[cmp].name)} (yearly)</b><button class="btn small ghost" data-act="cmpclear">clear</button></div>${lineChart([{ name: st.countries[cmp].name, data: Y[key], color: 'var(--info)' }], { fmt: o[2] })}</div>`;
      h += `<div class="hint">Compare with another country: open its card, then tap “Compare” below.</div><div class="btnrow">${btn('Compare with…', 'data-act="cmppick"', 'small')}</div>`;
    } else if (tab === 'rank') {
      const metric = app.rankKey || 'gdp'; const ms = [['gdp', 'GDP', (c) => c.econ.gdp, money], ['gdppc', 'GDP/head', (c) => c.econ.gdp / c.pop.total, (v) => '$' + v.toFixed(1) + 'k'], ['pop', 'Population', (c) => c.pop.total, (v) => v.toFixed(0) + 'M'], ['mil', 'Military', (c) => sim.milPower(c.idx), (v) => Math.round(v).toLocaleString()], ['tech', 'Technology', (c) => c.tech.known.length, (v) => v + ' techs'], ['stab', 'Stability', (c) => c.gov.stability, (v) => idx100(v) + '%'], ['hdi', 'Development', (c) => c.econ.hdi, (v) => idx100(v)], ['inf', 'Influence', (c) => (c.dip.credibility), (v) => v.toFixed(0)]];
      const m = ms.find((x) => x[0] === metric); h += `<div class="sheet-tabs" style="padding:0 0 8px">${ms.map(([k, l]) => `<button data-act="rankkey" data-k="${k}" class="${k === metric ? 'on' : ''}">${l}</button>`).join('')}</div>`;
      const list = st.countries.slice().sort((a, b) => m[2](b) - m[2](a)); const rank = list.findIndex((c) => c.idx === me) + 1;
      h += `<div class="note">You are <b>#${rank}</b> of ${list.length} on ${m[1]}.</div>` + list.slice(0, 15).map((c, i) => li(`${i + 1}. ${esc(c.name)}`, GOV_LABEL[c.gov.type], `<b>${m[3](m[2](c))}</b>`, `data-sel="${c.idx}"`, swatch(app, c.idx))).join('');
      if (rank > 15) h += li(`${rank}. ${esc(sim.player.name)}`, 'you', `<b>${m[3](m[2](sim.player))}</b>`);
    } else {
      const w = st.world, W = st.stats.world; h += `<div class="grid3">${stat('World GDP', money(st.countries.reduce((s, c) => s + c.econ.gdp, 0)), '', '', 'globe')}${stat('Temperature', '+' + w.temp.toFixed(2) + '°C', 'vs pre-industrial', w.temp > 1.5 ? 'dn' : '', 'bolt')}${stat('Emissions', Math.round((w.emis || 0) / 1000) + ' Gt', 'CO₂/yr', '', 'flame')}</div>`;
      h += sec('Commodity prices') + ['food', 'oil', 'gas', 'minerals'].map((k, i) => `<div class="card"><div class="row sp"><b style="text-transform:capitalize">${k}</b><b>×${st.prices[i].toFixed(2)}</b></div>${spark(W[k], { color: 'var(--accent)' })}</div>`).join('');
      const act = st.wars.filter((x) => x.active); h += sec('Conflicts') + (act.length ? act.map((x) => li(esc(x.name), `since ${sim.calendar.format(x.start)} · score ${x.score.a.toFixed(0)}–${x.score.d.toFixed(0)}`, '')).join('') : '<div class="hint">No wars are being fought.</div>');
      if (st.pandemic) h += note(`Pandemic: ${esc(st.pandemic.name)} — ${st.pandemic.deaths.toFixed(1)}M deaths so far.`);
    }
    return { title: 'Statistics', sub: 'Your country and the world', tabs, html: h };
  },
  actions: {
    chartkey: (app, el) => { app.chartKey = el.dataset.k; app.refreshSheet(true); }, rankkey: (app, el) => { app.rankKey = el.dataset.k; app.refreshSheet(true); },
    cmpclear: (app) => { app.cmpCountry = undefined; app.refreshSheet(true); },
    cmppick: (app) => { const sim = app.sim; app.openOverlay(`<div class="modal"><h2>Compare with</h2><input class="search" id="cmpq" placeholder="Search…"><div id="cmplist"></div></div>`); const draw = (q) => { app.$('#cmplist').innerHTML = sim.state.countries.filter((c) => c.idx !== sim.state.playerId && (!q || c.name.toLowerCase().includes(q))).sort((a, b) => b.econ.gdp - a.econ.gdp).slice(0, 25).map((c) => `<button class="opt" data-cmp="${c.idx}"><b>${esc(c.name)}</b></button>`).join(''); }; draw(''); app.$('#cmpq').oninput = (e) => draw(e.target.value.toLowerCase()); app.$('#overlay').onclick = (e) => { const b = e.target.closest('[data-cmp]'); if (!b) { if (e.target === app.$('#overlay')) app.closeOverlay(); return; } app.cmpCountry = +b.dataset.cmp; app.closeOverlay(); }; },
  },
};
export const objectives = {
  render(app) {
    const sim = app.sim, st = sim.state, V = st.victory, c = sim.player;
    const yrsLeft = Math.max(0, (V.endDay - st.day) / 365);
    let h = `<div class="grid3">${stat('Standing', V.standing + '/100', 'vs all nations', '', 'star')}${stat('Paths won', V.counts + '/6', gradeOf(V), V.counts >= 2 ? 'up' : '')}${stat('Time left', yrsLeft.toFixed(1) + ' yr', sim.calendar.format(V.endDay))}</div>`;
    h += `<div class="note">There is no single way to win. Complete victory paths through prosperity, economic weight, diplomacy, science, stability or security — conquest is optional. The scenario ends on ${sim.calendar.format(V.endDay)}; two paths is a success, four is a triumph.</div>`;
    h += Object.values(V.paths).map((p) => `<div class="card" style="${p.done ? 'border-color:var(--good)' : ''}"><div class="row sp"><b>${esc(p.title)}</b>${p.done ? tag('Achieved', 'good') : tag(Math.round(p.progress * 100) + '%')}</div><div class="hint">${esc(p.desc)}</div>${gauge('Progress', p.progress, { cls: p.done ? 'good' : '' })}</div>`).join('');
    return { title: 'Objectives', sub: `${esc(sim.scenario.name)}`, html: h };
  },
};
