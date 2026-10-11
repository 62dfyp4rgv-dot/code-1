import { esc } from '../fmt.js';
import { icon } from '../icons.js';
import { stat, kv, sec, tag, btn, li, note } from './util.js';
import { eventText } from '../../sim/events.js';

const KIND_ICON = { war: 'military', peace: 'check', election: 'flag', regime: 'warn', tech: 'research', diplomacy: 'diplomacy', intel: 'intel', cyber: 'bolt', health: 'warn', world: 'globe', event: 'info', politics: 'nation' };
export const inbox = {
  render(app, p) {
    const sim = app.sim, st = sim.state, me = st.playerId; app.unread = 0; const tab = p.tab || 'mine';
    const tabs = [{ id: 'mine', label: 'My country' }, { id: 'world', label: 'World' }, { id: 'all', label: 'Everything' }];
    let h = '';
    const pend = st.events.pending.filter((x) => x.country === me);
    if (pend.length) h += sec('Decisions waiting') + pend.map((x) => { const t = eventText(sim, x); return `<div class="card tap" data-act="opendecision" data-uid="${x.uid}" style="border-color:var(--warn)"><b>${esc(t.title)}</b><div class="hint">Expires in ${Math.max(0, x.expires - st.day)} days</div></div>`; }).join('');
    const calls = sim.player.dip.pending; if (calls.length) h += sec('Requests') + calls.map((cl) => li('Call to arms: ' + esc(st.countries[cl.principal].name), `expires in ${cl.expires - st.day} days`, '', 'data-open="military:war"')).join('');
    let log = st.log.slice().reverse();
    log = tab === 'mine' ? log.filter((l) => l.c === me) : tab === 'world' ? log.filter((l) => l.level === 'high' || l.kind === 'world') : log;
    h += sec('Timeline') + (log.length ? log.slice(0, 80).map((l) => `<div class="li" style="cursor:default">${icon(KIND_ICON[l.kind] || 'info', l.level === 'high' ? 'wn' : 'mu', 20)}<div class="grow"><div class="t" style="font-weight:600">${esc(l.text)}</div><div class="s">${sim.calendar.longFormat(l.day)}</div></div></div>`).join('') : '<div class="empty">Nothing yet. Press play to begin.</div>');
    return { title: 'Messages', sub: `${log.length} entries`, tabs, html: h };
  },
  actions: { opendecision: (app, el) => { const inst = app.sim.state.events.pending.find((x) => x.uid === +el.dataset.uid); if (inst) app.showDecision(inst); } },
};
