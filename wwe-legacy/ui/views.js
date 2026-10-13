// Pure rendering: state -> HTML strings. No game logic lives here; every number shown comes from
// Game / Career / ledger queries. Interactive elements carry data-action attributes handled in app.js.
import { Game, BACKGROUNDS, PLANS, ENTRANCES, TRAINING } from '../src/game.js';
import { GROUPS } from '../src/match/actions.js';
import { buildRecordBook } from '../src/career/recordbook.js';
import { eraForYear, ERAS } from '../src/data/eras.js';
import { plesInYear, eventsOn, formatDate } from '../src/universe/calendar.js';
import { getRel } from '../src/memory/world.js';
import { STYLES } from '../src/match/moves.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = (s) => String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const stars = (n) => { const full = Math.floor(n), half = n - full >= 0.5; return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(Math.max(0, 5 - full - (half ? 1 : 0))); };
const pct = (v, m = 100) => Math.max(0, Math.min(100, (v / m) * 100));
const bar = (v, m = 100, cls = '') => `<div class="bar ${cls}" role="progressbar" aria-valuenow="${Math.round(v)}" aria-valuemax="${m}"><i style="width:${pct(v, m)}%"></i></div>`;

const ICON = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  career: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  roster: '<circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c.6-3.4 3-5 6-5s5.4 1.6 6 5M16 15c2.6 0 4.4 1.3 5 4"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
};
export const tabbar = (S) => {
  const t = [['home', 'Home'], ['career', 'Career'], ['calendar', 'Calendar'], ['roster', 'Roster'], ['more', 'More']];
  return `<nav class="tabbar" aria-label="Main"><div class="in">${t.map(([id, l]) => `<button class="tab ${S.tab === id ? 'on' : ''}" data-action="tab" data-id="${id}" aria-current="${S.tab === id}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[id]}</svg>${l}</button>`).join('')}</div></nav>`;
};

const header = (title, sub, right = '') => `<div class="topbar"><div class="col" style="gap:2px"><h1>${esc(title)}</h1>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</div>${right}</div>`;
const back = (to = 'back') => `<button class="btn small ghost" data-action="${to}" aria-label="Back">← Back</button>`;
const kv = (k, v) => `<div class="kv"><span>${esc(k)}</span><span class="v">${v}</span></div>`;

// ---------------------------------------------------------------- title
export function title(S) {
  const has = S.slots.some((s) => !s.empty);
  return `<main class="screen noTab" style="justify-content:center">
    <div class="banner">
      <div class="eyebrow">Ultimate Career RPG</div>
      <h1 style="font-size:3.1rem;font-weight:900">WWE<br>Legacy</h1>
      <p style="max-width:34ch;opacity:.85">Live a whole wrestling career. Every match, promo and promise is remembered.</p>
    </div>
    <div class="col">
      ${has ? `<button class="btn primary" data-action="continue" id="btn-continue">Continue Career</button>` : ''}
      <button class="btn ${has ? '' : 'primary'}" data-action="newCareer" id="btn-new">New Career</button>
      <button class="btn" data-action="openSaves">Load / Manage Saves</button>
      <button class="btn ghost" data-action="settings">Settings</button>
    </div>
    <p class="muted" style="font-size:.78rem">Unofficial fan project. Names, ratings and dates are approximate and for entertainment. Not affiliated with or endorsed by WWE.</p>
  </main>`;
}

// ---------------------------------------------------------------- create
const STYLE_INFO = {
  brawler: 'Hard strikes, corner attacks, toughness.', technician: 'Holds, counters, mat wrestling.', highflyer: 'Aerial offence, speed, risk.',
  powerhouse: 'Slams, strength, big moves.', showman: 'Crowd control, signature spots.', submission: 'Joint locks and grinding pressure.', allrounder: 'No weakness, no specialty.',
};
export function create(S) {
  const c = S.create, opts = Game.creationOptions();
  const step = c.step;
  const bg = BACKGROUNDS[c.background];
  const used = Object.values(c.bonus).reduce((a, b) => a + b, 0);
  const left = bg.bonus - used;
  let body = '';
  if (step === 0) {
    body = `<label class="f">Ring name<input type="text" id="in-name" value="${esc(c.name)}" maxlength="28" autocomplete="off"></label>
      <div class="col"><div class="eyebrow">Alignment</div><div class="chips">${['face', 'heel', 'tweener'].map((a) => `<button class="chip ${c.alignment === a ? 'on' : ''}" data-action="cset" data-k="alignment" data-v="${a}">${cap(a)}</button>`).join('')}</div></div>
      <div class="col"><div class="eyebrow">Where do you start?</div>${Object.entries(BACKGROUNDS).map(([id, b]) => `<button class="btn" data-action="cset" data-k="background" data-v="${id}" aria-pressed="${c.background === id}" style="${c.background === id ? 'border-color:var(--rope);' : ''}"><span class="t"><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></span><span class="r">${c.background === id ? 'Selected' : ''}</span></button>`).join('')}</div>`;
  } else if (step === 1) {
    body = `<div class="col"><div class="eyebrow">Wrestling style</div>${STYLES.map((s) => `<button class="btn" data-action="cset" data-k="style" data-v="${s}" style="${c.style === s ? 'border-color:var(--rope);' : ''}"><span class="t"><b>${cap(s)}</b><small>${STYLE_INFO[s]}</small></span><span class="r">${c.style === s ? 'Selected' : ''}</span></button>`).join('')}</div>
      <div class="card"><div class="row spread"><h3>Starting skill points</h3><span class="pill brass">${left} left</span></div>
      ${opts.ringAttrs.map((a) => `<div class="pm"><button data-action="bonus" data-k="${a}" data-d="-1" aria-label="Decrease ${a}">−</button><div class="col" style="gap:3px"><div class="row spread"><span>${cap(a)}</span><span class="num">+${c.bonus[a] || 0}</span></div></div><button data-action="bonus" data-k="${a}" data-d="1" aria-label="Increase ${a}">+</button></div>`).join('')}</div>`;
  } else if (step === 2) {
    const sigs = opts.signatureTemplates;
    body = `<div class="card"><h3>Signature moves</h3><p class="muted">Pick up to two. Name them anything you like.</p>
      ${[0, 1].map((i) => `<label class="f">Signature ${i + 1}<select id="sig-${i}" data-action-change="sig" data-i="${i}"><option value="">None</option>${sigs.map((s) => `<option value="${s.id}" ${c.signatures[i]?.tpl === s.id ? 'selected' : ''}>${esc(s.name.replace('Signature ', ''))} (${esc(s.baseCat)})</option>`).join('')}</select></label>
      <label class="f">Name<input type="text" id="signame-${i}" value="${esc(c.signatures[i]?.name || '')}" maxlength="30" placeholder="e.g. Hammer of the Gods"></label>`).join('')}</div>
      <div class="card"><h3>Finishing move</h3>
      <label class="f">Finisher<select id="fin-tpl">${opts.finisherTemplates.map((s) => `<option value="${s.id}" ${c.finisher.tpl === s.id ? 'selected' : ''}>${esc(s.name.replace('Finisher ', ''))} (${esc(s.baseCat)})</option>`).join('')}</select></label>
      <label class="f">Name<input type="text" id="fin-name" value="${esc(c.finisher.name)}" maxlength="30"></label></div>`;
  } else if (step === 3) {
    body = `<div class="col"><div class="eyebrow">Entrance</div>${Object.entries(ENTRANCES).map(([id, e]) => `<button class="btn" data-action="cset" data-k="entrance" data-v="${id}" style="${c.entrance === id ? 'border-color:var(--rope);' : ''}"><span class="t"><b>${esc(e.label)}</b><small>${esc(e.desc)}</small></span></button>`).join('')}</div>
      <div class="col"><div class="eyebrow">Career goal</div><div class="chips">${opts.goals.map((g) => `<button class="chip ${c.goal === g ? 'on' : ''}" data-action="cset" data-k="goal" data-v="${esc(g)}">${esc(g)}</button>`).join('')}</div></div>
      <div class="col"><div class="eyebrow">Start year</div><div class="chips">${opts.startYears.map((y) => `<button class="chip ${c.startYear === y ? 'on' : ''}" data-action="cset" data-k="startYear" data-v="${y}">${y}</button>`).join('')}</div><p class="muted">${esc(eraForYear(c.startYear).name)}: ${esc(eraForYear(c.startYear).desc)}</p></div>`;
  } else {
    body = `<div class="card"><h3>${esc(c.name || 'The Rookie')}</h3>
      ${kv('Style', cap(c.style))}${kv('Alignment', cap(c.alignment))}${kv('Background', esc(bg.name))}${kv('Finisher', esc(c.finisher.name))}${kv('Signatures', esc(c.signatures.filter(Boolean).map((s) => s.name).join(', ') || 'Style defaults'))}${kv('Entrance', esc(ENTRANCES[c.entrance].label))}${kv('Start', `${c.startYear} (${esc(eraForYear(c.startYear).name)})`)}${kv('Goal', esc(c.goal || 'None yet'))}</div>`;
  }
  const titles = ['Who are you?', 'How do you fight?', 'Your signature moves', 'Presentation & goals', 'Ready for your debut?'];
  return `<main class="screen noTab">
    ${header(titles[step], `Step ${step + 1} of 5`)}
    ${body}
    <div class="row" style="margin-top:auto">
      ${step > 0 ? `<button class="btn" data-action="cstep" data-d="-1">Back</button>` : `<button class="btn ghost" data-action="toTitle">Cancel</button>`}
      <div class="grow">${step < 4 ? `<button class="btn primary" style="width:100%" data-action="cstep" data-d="1" id="btn-next">Next</button>` : `<button class="btn primary" style="width:100%" data-action="beginCareer" id="btn-begin">Begin Career</button>`}</div>
    </div></main>`;
}

// ---------------------------------------------------------------- home
export function home(S) {
  const g = S.g, c = g.career, h = g.home();
  const p = c.player;
  const ph = c.flags.phase;
  if (S.sub === 'booking') return book(S);
  if (S.sub === 'prep') return prep(S);
  const next = h.next;
  const today = next && next.inDays === 0;
  let action = '';
  if (h.scenario) action = `<button class="btn primary" data-action="openScenario" id="btn-scenario">Something is happening: handle it</button>`;
  else if (ph === 'rumble') action = `<button class="btn primary" data-action="resumeRumble" id="btn-resume-rumble">Resume the Royal Rumble</button>`;
  else if (ph === 'match') action = `<button class="btn primary" data-action="resumeMatch" id="btn-resume">Resume Match</button>`;
  else if (ph === 'postmatch') action = `<button class="btn primary" data-action="toResult">Post-Match Decisions</button>`;
  else if (ph === 'prematch') action = `<button class="btn primary" data-action="toPrep">Back to Match Preparation</button>`;
  else if (today && h.rumbleToday) action = `<button class="btn primary" data-action="startRumble" id="btn-rumble">Enter the Royal Rumble</button>`;
  else if (today) action = `<button class="btn primary" data-action="bookTonight" id="btn-book">Book Tonight's Match</button>`;
  const held = g.universe.titlesOf(p.id);
  const timeCard = ph === 'home' && !h.scenario ? `<div class="card"><div class="row spread"><h2>${today ? 'Show day' : 'Before the show'}</h2>${today ? '' : `<span class="pill">${next ? `${next.inDays} day${next.inDays === 1 ? '' : 's'}` : ''}</span>`}</div>
      ${today ? '<p class="muted">Training is off until after tonight\'s show.</p>' : `<div class="grid2">${Object.entries(TRAINING).map(([id, t]) => `<button class="btn small" data-action="train" data-id="${id}"><span class="t">${esc(t.label)}<small class="fx">+${cap(t.attr)}</small></span></button>`).join('')}</div>
      <div class="row"><button class="btn grow" data-action="rest" id="btn-rest">Rest a day</button><button class="btn grow" data-action="advance" id="btn-advance">Go to the show</button></div>`}</div>` : '';
  const injuries = h.status.injuries;
  return `<main class="screen">
    <div class="banner">
      <div class="eyebrow">${esc(h.date)} · ${esc(h.era.name)}</div>
      <h1>${esc(p.name)}</h1>
      <div class="row wrap"><span class="pill" style="color:var(--mat-ink);border-color:currentColor">${esc(p.brand)}</span><span class="pill" style="color:var(--mat-ink);border-color:currentColor">${cap(p.alignment)}</span><span class="pill" style="color:var(--mat-ink);border-color:currentColor">${cap(p.style)}</span></div>
      <div class="row spread" style="margin-top:6px"><span>Record <b class="num">${h.record.w}-${h.record.l}${h.record.d ? `-${h.record.d}` : ''}</b></span><span>Overall <b class="num">${h.status.overall}</b></span></div>
    </div>
    ${next ? `<div class="card"><div class="eyebrow">Next event</div><div class="row spread"><h2>${esc(next.displayName || next.name)}</h2>${next.kind === 'ple' ? '<span class="pill brass">PLE</span>' : ''}</div><div class="muted">${esc(next.dateText)} · ${today ? 'tonight' : `in ${next.inDays} day${next.inDays === 1 ? '' : 's'}`}</div></div>` : ''}
    ${action}
    ${held.length ? `<div class="card" style="border-color:var(--brass-fill)"><div class="eyebrow">Champion</div>${held.map((t) => `<div class="row spread"><h3>${esc(t.name)}</h3><span class="pill brass">${c.day - t.since} days · ${t.defenses} def.</span></div>`).join('')}</div>` : ''}
    ${h.lastScenario && c.day - h.lastScenario.day < 3 ? `<div class="card plain"><div class="eyebrow">${esc(h.lastScenario.title)}</div><p>${esc(h.lastScenario.text)}</p></div>` : ''}
    <div class="card">
      <div class="stat"><span>Fatigue</span>${bar(h.status.fatigue, 100, h.status.fatigue > 70 ? 'rope' : '')}<span class="num">${h.status.fatigue}</span></div>
      <div class="stat"><span>Popularity</span>${bar(h.status.popularity, 100, 'brass')}<span class="num">${h.status.popularity}</span></div>
      <div class="stat"><span>Confidence</span>${bar(h.status.confidence, 100, 'good')}<span class="num">${h.status.confidence}</span></div>
      ${kv('Bank', `$${h.status.money.toLocaleString()}`)}
      ${injuries.length ? injuries.map((i) => `<div class="row"><span class="pill bad">${i.severity > 1 ? 'Serious' : 'Minor'}</span><span>${cap(i.part)} injury · ${i.daysLeft} days left</span></div>`).join('') : '<div class="row"><span class="pill good">Healthy</span></div>'}
    </div>
    ${timeCard}
    ${h.notifications.length ? `<div class="card"><h3>Recent</h3>${h.notifications.slice().reverse().map((n) => `<div class="row"><span class="pill brass">Achievement</span><span>${esc(n.name)}</span></div>`).join('')}</div>` : ''}
  </main>`;
}

const oppCard = (o, sel) => `<div class="card" style="${sel || o.title || o.forced ? 'border-color:var(--rope)' : ''}">
  ${o.title ? `<div class="row"><span class="pill brass">${o.defense ? 'Title defense' : 'Title match'}</span><b>${esc(o.title.name)}</b></div>` : ''}${o.forced && !o.title ? '<div class="row"><span class="pill rope">Scripted match</span></div>' : ''}${o.rumbleShot ? '<div class="row"><span class="pill brass">Rumble winner\'s shot</span></div>' : ''}
  <div class="row spread"><h3>${esc(o.name)}</h3><span class="pill ${o.alignment === 'heel' ? 'rope' : o.alignment === 'face' ? 'good' : ''}">${cap(o.alignment)}</span></div>
  <div class="row wrap"><span class="pill">${cap(o.style)}</span><span class="pill">OVR ${o.overall}</span><span class="pill">Pop ${o.popularity}</span><span class="pill">${esc(o.record)}</span>${o.rivalry ? `<span class="pill rope">Rivalry ${o.rivalry.heat}</span>` : ''}${o.tags.slice(0, 2).map((t) => `<span class="pill warn">${cap(t)}</span>`).join('')}</div>
  <div class="row"><button class="btn small grow" data-action="scout" data-id="${o.id}">Scout</button><button class="btn small primary grow" data-action="pickOpp" data-id="${o.id}" data-stakes="${o.stakes || ''}" data-type="${o.type || ''}">Face ${esc(o.name.split(' ')[0])}</button></div></div>`;

function book(S) {
  const opps = S.g.suggestOpponents();
  return `<main class="screen">${header('Tonight\'s card', 'Choose your opponent', back('closeSub'))}
    <p class="muted">Management has offered these matchups. Scout first or pick one now.</p>
    ${opps.map((o) => oppCard(o, S.ui.oppId === o.id)).join('')}</main>`;
}

function prep(S) {
  const g = S.g, o = g.universe.get(S.ui.oppId);
  const card = g.opponentCard(o);
  const scout = S.ui.scout && S.ui.scout.id === o.id ? S.ui.scout : null;
  const stips = g.availableStipulations(o.id);
  const sel = S.ui.prep;
  const stake = S.ui.stakes ? g.suggestOpponents().find((x) => x.id === o.id && x.stakes === S.ui.stakes) : null;
  return `<main class="screen">${header(`vs ${o.name}`, 'Match preparation', back('closeSub'))}
    ${stake && stake.title ? `<div class="card" style="border-color:var(--brass-fill)"><span class="pill brass">${stake.defense ? 'Title defense' : 'Title match'}</span><h3>${esc(stake.title.name)}</h3></div>` : ''}
    ${oppCard(card, false).replace(/<div class="row"><button class="btn small grow" data-action="scout"[\s\S]*?<\/div><\/div>$/, '</div>')}
    ${scout ? `<div class="card"><h3>Scouting report</h3><p>Favours ${esc(scout.favours)}.</p>${kv('Strengths', esc(scout.strong.map(cap).join(', ')))}${kv('Weaknesses', esc(scout.weak.map(cap).join(', ')))}${kv('Finisher', esc(scout.finisher || '—'))}${scout.tips.map((t) => `<p class="line">${esc(t)}</p>`).join('')}${scout.history.map((l) => `<p class="line">${esc(l.text)}<span class="why">memory · ${l.refs.length} event${l.refs.length === 1 ? '' : 's'}</span></p>`).join('')}</div>`
      : `<button class="btn" data-action="scout" data-id="${o.id}">Scout ${esc(o.name.split(' ')[0])}</button>`}
    <div class="col"><div class="eyebrow">Game plan</div>${Object.entries(PLANS).map(([id, p]) => `<button class="btn" data-action="pset" data-k="plan" data-v="${id}" style="${sel.plan === id ? 'border-color:var(--rope)' : ''}"><span class="t"><b>${esc(p.label)}</b><small>${esc(p.desc)}</small></span></button>`).join('')}</div>
    <div class="col"><div class="eyebrow">Entrance</div><div class="chips">${Object.entries(ENTRANCES).map(([id, e]) => `<button class="chip ${sel.entrance === id ? 'on' : ''}" data-action="pset" data-k="entrance" data-v="${id}">${esc(e.label)}</button>`).join('')}</div></div>
    <div class="col"><div class="eyebrow">Match type</div>${stips.map((s) => `<button class="btn" ${s.unlocked ? '' : 'disabled'} data-action="pset" data-k="type" data-v="${s.id}" style="${sel.type === s.id ? 'border-color:var(--rope)' : ''}"><span class="t"><b>${esc(s.name)}</b><small>${esc(s.desc)}</small></span><span class="r">${s.unlocked ? '' : `Rivalry ${s.need}`}</span></button>`).join('')}</div>
    <button class="btn primary" data-action="startMatch" id="btn-start">Head to the ring</button></main>`;
}

// ---------------------------------------------------------------- match
const POSNAME = { standing: 'Standing', grounded: 'Down', corner: 'Cornered', ropes: 'On ropes', apron: 'Apron', outside: 'Floor', top: 'Top rope' };
const FAMILY = { strike: 'a STRIKE', grapple: 'a GRAPPLE', power: 'a POWER move', aerial: 'an AERIAL attack', sub: 'a HOLD', special: 'a BIG MOVE' };
const PARTS = [['head', 'Head'], ['torso', 'Torso'], ['arms', 'Arms'], ['legs', 'Legs']];

function fighterBoard(f, right) {
  return `<div class="fighter ${right ? 'r' : ''}">
    <div class="meter sta"><span title="Stamina">STA <span class="val">${Math.round(f.stamina)}</span></span>${bar(f.stamina, f.maxStamina)}</div>
    <div class="meter mom"><span title="Momentum">MOM <span class="val">${Math.round(f.momentum)}</span></span>${bar(f.momentum)}</div>
    <div class="dmg" aria-label="Damage by body part">${PARTS.map(([k, l]) => `<b title="${cap(k)} damage ${Math.round(f.dmg[k])}"><i style="width:${Math.max(f.dmg[k] > 0 ? 8 : 0, f.dmg[k])}%"></i><span>${l}</span><em>${Math.round(f.dmg[k])}</em></b>`).join('')}</div>
    <div class="posrow"><span class="pill" style="color:var(--mat-ink)">${POSNAME[f.pos] || f.pos}</span>${f.dazed ? '<span class="pill" style="color:var(--brass-fill)">Dazed</span>' : ''}</div></div>`;
}
const feedClass = (l, me) => (/^(finisher_(connected|reversed)|pin_win|submission_win|match_end|knockout|objective)/.test(l.type) ? 'gold' : /^(pin_kickout|dq|warning|finisher|move_reversed|hot_tag|tag|injury)/.test(l.type) ? 'hot' : l.actor === me ? 'me' : '');

export function match(S) {
  const g = S.g, mv = g.matchView(), d = g.decision();
  const me = g.career.player.id;
  const over = g.engine.over;
  let panel = '';
  if (over) {
    const r = g.engine.state.result;
    const won = r.winnerId === me;
    panel = `<div class="card"><h2>${r.winnerSide === null ? 'Draw' : won ? 'Victory' : 'Defeat'}</h2><p class="muted">${esc(String(r.finish).replace(/_/g, ' '))} · ${mmss(r.durationSec)}</p><button class="btn primary" data-action="finishMatch" id="btn-finish">See the result</button></div>`;
  } else if (d) panel = decisionPanel(S, d, mv);
  const lines = S.feed.slice(-40);
  return `<div class="match" id="match">
    <div class="board" id="board" aria-live="polite">
      <div class="names"><div class="nm">${esc(mv.me.name)}</div><div class="clock num">${mmss(mv.time)}<small>${esc(mv.phase)} · ${mmss(mv.timeLimit)}</small></div><div class="nm r">${esc(mv.opp.name)}</div></div>
      <div class="grid2" style="gap:12px">${fighterBoard(mv.me, false)}${fighterBoard(mv.opp, true)}</div>
      <div class="legend">STA stamina · MOM momentum · red fill = damage taken</div>
      <div class="heat"><span>Crowd</span>${bar(mv.crowd)}<span>${mv.referee === 'watching' ? 'Ref watching' : mv.referee === 'down' ? 'REF DOWN' : 'Ref distracted'}</span></div>
      ${mv.rules.tag && mv.team ? `<div class="posrow"><span class="eyebrow" style="color:var(--mat-ink)">Legal: ${esc(mv.team.mine.find((x) => x.legal)?.name || '')}</span><span class="eyebrow" style="color:var(--mat-ink)">Legal: ${esc(mv.team.theirs.find((x) => x.legal)?.name || '')}</span></div>` : ''}
      ${mv.rules.ironMan ? `<div class="posrow"><b class="num">Falls ${mv.falls[mv.mySide]}</b><b class="num">Falls ${mv.falls[1 - mv.mySide]}</b></div>` : ''}
      ${mv.rules.objective ? `<div class="posrow"><b class="num">Climb ${mv.climb.me}/${mv.objective.steps}</b><b class="num">Climb ${mv.climb.opp}/${mv.objective.steps}</b></div>` : ''}
    </div>
    <div class="feed" id="feed" role="log" aria-label="Commentary">${lines.length ? lines.map((l) => `<p class="${feedClass(l, me)}">${esc(l.text)}</p>`).join('') : '<p>The bell rings.</p>'}</div>
    ${panel}
  </div>`;
}

function decisionPanel(S, d, mv) {
  const g = S.g;
  let head = '', chips = '';
  const all = d.options.filter((o) => o.enabled !== false);
  let shown = all;
  if (d.kind === 'action') {
    head = `<div class="prompt"><div class="eyebrow">Your move · ${mmss(mv.time)}</div><h2>${mv.me.pos === 'grounded' ? 'You are down' : 'Take control'}</h2></div>`;
    const groups = GROUPS.filter((gr) => all.some((o) => o.group === gr));
    const cur = S.ui.group || 'Top';
    chips = `<div class="chips wrap" role="tablist">${['Top', ...groups].map((gr) => `<button class="chip ${cur === gr ? 'on' : ''}" data-action="group" data-id="${gr}" role="tab">${gr}</button>`).join('')}</div>`;
    shown = cur === 'Top' ? all.filter((o) => o.featured) : all.filter((o) => o.group === cur);
    if (!shown.length) shown = all.filter((o) => o.featured);
  } else if (d.kind === 'defense') {
    const a = d.context.attack;
    head = `<div class="prompt"><div class="eyebrow">Incoming</div><h2>${esc(g.engine.state.fighters[a.attackerId].name)} goes for ${FAMILY[a.family] || 'an attack'}</h2><div class="muted">Choose how to respond. The percentage is your chance to stop it.</div></div>`;
  } else if (d.kind === 'pin') {
    head = `<div class="prompt"><div class="eyebrow">Cover!</div><h2>You're being pinned</h2></div>`;
  } else if (d.kind === 'hold_h') {
    head = `<div class="prompt"><div class="eyebrow">Submission</div><h2>${esc(d.context.hold.moveName)} locked in</h2><div class="muted">Pressure ${Math.round(d.context.hold.sev)}</div></div>`;
  } else if (d.kind === 'hold_v') {
    head = `<div class="prompt"><div class="eyebrow">Trapped</div><h2>Escape the ${esc(d.context.hold.moveName)}</h2><div class="muted">Pressure ${Math.round(d.context.hold.sev)}</div></div>`;
  } else if (d.kind === 'rise') {
    head = `<div class="prompt"><div class="eyebrow">Ten count</div><h2>Count: ${d.context.count.n}</h2></div>`;
  } else if (d.kind === 'apron') {
    head = `<div class="prompt"><div class="eyebrow">On the apron</div><h2>${d.context.pin ? 'Your partner is being pinned!' : 'Support your partner'}</h2></div>`;
  }
  const btn = (o) => {
    const hint = o.hint ? `<span class="hint ${(o.hint.split(' ')[0] || '').replace(/\W/g, '')} ${/%/.test(o.hint) ? 'n' : ''}">${esc(o.hint)}</span>` : '';
    const cost = o.cost > 0 ? `<span class="r">${o.cost} STA</span>` : o.cost < 0 ? `<span class="r">+${-o.cost} STA</span>` : o.free ? '<span class="r">Free</span>' : '';
    return `<button class="btn" data-action="choose" data-id="${esc(o.id)}"><span class="t"><b>${esc(o.label)}</b>${o.desc ? `<small>${esc(o.desc)}</small>` : ''}</span><span class="col" style="align-items:flex-end;gap:4px">${hint}${cost}</span></button>`;
  };
  return `<div class="col" id="decision" data-kind="${d.kind}">${head}${chips}<div class="opts">${shown.map(btn).join('')}</div></div>`;
}

// ---------------------------------------------------------------- result
export function result(S) {
  const g = S.g, r = S.ui.result, c = g.career;
  const opts = g.postMatchOptions();
  const st = r.stats || {};
  const win = r.result === 'win';
  return `<main class="screen noTab">
    <div class="banner"><div class="eyebrow">${esc(r.opponents.join(' & '))}</div><h1>${r.result === 'win' ? 'Victory' : r.result === 'loss' ? 'Defeat' : 'Draw'}</h1>
      <div class="row spread"><span class="stars" aria-label="${r.rating.stars} stars">${stars(r.rating.stars)}</span><span class="num">${mmss(r.durationSec)}</span></div>
      <p style="opacity:.85">${esc(r.summary)}</p></div>
    ${r.unlocked.length ? `<div class="card" style="border-color:var(--brass-fill)"><h3>Achievements unlocked</h3>${r.unlocked.map((u) => `<div class="item"><span class="dot gold"></span><div class="col" style="gap:2px"><b>${esc(u.name)}</b><span class="muted" style="font-size:.85rem">${esc(u.explanation)}</span></div></div>`).join('')}</div>` : ''}
    <div class="card"><h3>Match stats</h3>
      ${kv('Moves landed', `${st.connected ?? 0} of ${st.moves ?? 0}`)}${kv('Reversals made', st.reversalsMade ?? 0)}${kv('Near falls', st.nearFalls ?? 0)}${kv('Damage taken', st.damageTaken ?? 0)}${kv('Finisher', st.finishersHit ? 'Hit' : 'Not landed')}
      <button class="btn small ghost" data-action="inspect" data-id="${esc(r.event.id)}">See the ledger entry</button></div>
    ${r.injuries.length ? `<div class="card"><h3>Injuries</h3>${r.injuries.map((i) => `<div class="row"><span class="pill bad">${i.severity > 1 ? 'Serious' : 'Minor'}</span>${cap(i.part)}</div>`).join('')}</div>` : ''}
    <div class="col"><div class="eyebrow">What now?</div>
    ${opts.map((o) => `<button class="btn" data-action="post" data-id="${o.id}"><span class="t"><b>${esc(o.label)}</b><small>${esc(o.desc)}</small></span></button>`).join('') || '<p class="muted">Nothing left to decide.</p>'}
    ${S.ui.postMsg ? `<p class="line">${esc(S.ui.postMsg)}</p>` : ''}</div>
    <button class="btn primary" data-action="donePost" id="btn-done">Back to the locker room</button></main>`;
}

// ---------------------------------------------------------------- career
export function career(S) {
  const g = S.g, c = g.career, p = c.player;
  if (S.sub === 'recordbook') return recordBook(S);
  const tl = c.timeline({ minImportance: S.ui.tlMin || 2, limit: 40 });
  const attrs = Object.entries(p.attrs);
  return `<main class="screen">${header(p.name, p.nickname || `${cap(p.style)} · ${cap(p.alignment)}`, `<span class="pill brass">OVR ${c.overall()}</span>`)}
    <div class="card"><h3>Attributes</h3>${attrs.map(([k, v]) => `<div class="stat"><span>${cap(k)}</span>${bar(v)}<span class="num">${Math.round(v)}</span></div>`).join('')}
      <div class="stat"><span>Mic skills</span>${bar(p.mic, 100, 'good')}<span class="num">${Math.round(p.mic)}</span></div><div class="stat"><span>Charisma</span>${bar(p.charisma, 100, 'good')}<span class="num">${Math.round(p.charisma)}</span></div></div>
    ${g.universe.titlesOf(p.id).length || c.stats.s.titles.won ? `<div class="card"><h3>Championships</h3>${c.stats.s.titles.reigns.map((r) => `<div class="kv"><span>${esc(r.name)}</span><span class="v">${r.endDay == null ? 'Current' : ''} ${(r.endDay ?? c.day) - r.startDay}d · ${r.defenses} def.</span></div>`).join('')}</div>` : ''}
    <div class="card"><h3>Moves</h3>${kv('Finisher', esc(p.finisher?.name || 'Style default'))}${kv('Signatures', esc((p.signatures || []).map((s) => s.name).join(', ') || 'Style defaults'))}${kv('Entrance', esc(ENTRANCES[p.entrance.style]?.label || p.entrance.style))}${p.goals.length ? kv('Goal', esc(p.goals[0])) : ''}</div>
    <button class="btn" data-action="openSub" data-id="recordbook"><span class="t"><b>Career Record Book</b><small>Every number opens to its evidence</small></span><span class="r">Open</span></button>
    <div class="card"><div class="row spread"><h3>Timeline</h3><div class="chips" style="max-width:60%">${[[1, 'All'], [2, 'Notable'], [4, 'Major']].map(([n, l]) => `<button class="chip ${(S.ui.tlMin || 2) === n ? 'on' : ''}" data-action="tlmin" data-id="${n}">${l}</button>`).join('')}</div></div>
      <div class="list">${tl.map((e) => `<button class="item" data-action="inspect" data-id="${e.id}" style="background:none;border:0;border-bottom:1px solid var(--line);text-align:left;width:100%;color:inherit;font:inherit;cursor:pointer"><span class="dot ${e.data.result === 'win' ? 'win' : e.data.result === 'loss' ? 'loss' : e.type === 'achievement_unlocked' || e.type === 'title_win' ? 'gold' : ''}"></span><span class="col" style="gap:1px"><span class="eyebrow">${esc(e.date)} · ${esc(cap(e.type))}</span><span>${esc(e.summary)}</span></span></button>`).join('') || '<div class="empty">Your story begins with the first bell.</div>'}</div></div>
  </main>`;
}

function recordBook(S) {
  const g = S.g, c = g.career;
  const names = (id) => g.universe.get(id)?.name || (id === c.player.id ? c.player.name : id);
  const book = buildRecordBook(c, names);
  return `<main class="screen">${header('Record Book', `${book.player} · as of ${book.asOf}`, back('closeSub'))}
    ${book.sections.map((s) => `<div class="card"><h3>${esc(s.title)}</h3>${s.items.length ? s.items.map((it, i) => `<div class="kv"><span>${esc(it.label)}</span><span class="v">${esc(it.value)} ${it.evidence && it.evidence.length ? `<button class="chip" style="margin:-9px 0;padding:1px 10px" data-action="evidence" data-sec="${s.id}" data-i="${i}">${it.evidence.length} ev.</button>` : ''}</span></div>`).join('') : '<div class="empty">Nothing yet.</div>'}</div>`).join('')}</main>`;
}

// ---------------------------------------------------------------- calendar
export function calendar(S) {
  const g = S.g, c = g.career;
  const rows = [];
  for (let i = 0; i < 45 && rows.length < 14; i++) {
    const ev = eventsOn(c.day + i, c.startYear, c.player.brand).sort((a, b) => (b.tier || 0) - (a.tier || 0))[0];
    if (ev) rows.push({ day: c.day + i, ev });
  }
  const ples = plesInYear(c.year);
  return `<main class="screen">${header('Calendar', c.player.brand)}
    <div class="card"><h3>Coming up</h3><div class="list">${rows.map(({ day, ev }) => `<div class="item"><span class="dot ${ev.kind === 'ple' ? 'gold' : ''}"></span><div class="col" style="gap:0"><b>${esc(ev.displayName || ev.name)}</b><span class="muted">${esc(formatDate(day, c.startYear))}${day === c.day ? ' · today' : ''}</span></div></div>`).join('')}</div></div>
    <div class="card"><h3>${c.year} Premium Live Events</h3><p class="muted" style="font-size:.8rem">Dates are generated by rule and approximate.</p><div class="list">${ples.map((p) => `<div class="item"><span class="dot ${p.tier >= 2 ? 'rope' : 'gold'}"></span><div class="col" style="gap:0"><b>${esc(p.displayName)}</b><span class="muted">${esc(formatDate(Math.round((Date.UTC(p.year, 0, 1) - Date.UTC(c.startYear, 0, 1)) / 86400000) + p.dayOfYear, c.startYear))}</span></div></div>`).join('')}</div></div></main>`;
}

// ---------------------------------------------------------------- roster
export function roster(S) {
  const g = S.g, q = (S.ui.rq || '').toLowerCase();
  const list = g.universe.list((w) => !q || w.name.toLowerCase().includes(q)).sort((a, b) => b.tier - a.tier || b.popularity - a.popularity);
  return `<main class="screen">${header('Roster', `${list.length} wrestlers`)}
    <input type="search" id="in-rq" placeholder="Search" value="${esc(S.ui.rq || '')}" aria-label="Search roster">
    <div class="card"><div class="list">${list.map((w) => `<button class="item" data-action="profile" data-id="${w.id}" style="background:none;border:0;border-bottom:1px solid var(--line);text-align:left;width:100%;color:inherit;font:inherit;cursor:pointer"><span class="dot ${w.alignment === 'heel' ? 'rope' : w.alignment === 'face' ? 'win' : ''}"></span><span class="col grow" style="gap:0"><b>${esc(w.name)}</b><span class="muted">${cap(w.style)} · ${esc(w.brand)}</span></span><span class="num">${Math.round(g._overall(w))}</span></button>`).join('')}</div></div></main>`;
}

export function profileSheet(S, id) {
  const g = S.g, w = g.universe.get(id), c = g.career;
  const card = g.opponentCard(w);
  const lines = g.scout(id).history;
  const rel = getRel(c.memory.world, c.player.id, id);
  return `<div class="row spread"><h2>${esc(w.name)}</h2><button class="btn small ghost" data-action="closeSheet">Close</button></div>
    <div class="row wrap"><span class="pill">${cap(w.style)}</span><span class="pill">${cap(w.alignment)}</span><span class="pill">${esc(w.brand)}</span><span class="pill brass">OVR ${card.overall}</span></div>
    ${Object.entries(w.attrs).map(([k, v]) => `<div class="stat"><span>${cap(k)}</span>${bar(v)}<span class="num">${v}</span></div>`).join('')}
    ${kv('Finisher', esc(w.finisher?.name || '—'))}${kv('Your record', esc(card.record))}${kv('Relationship', rel.tags.length ? esc(rel.tags.map(cap).join(', ')) : 'Neutral')}
    ${lines.map((l) => `<p class="line">${esc(l.text)}<span class="why">memory · ${l.refs.length} event${l.refs.length === 1 ? '' : 's'}</span></p>`).join('')}`;
}

// ---------------------------------------------------------------- more
export function more(S) {
  const s = S.sub;
  if (s === 'achievements') return achievements(S);
  if (s === 'rivalries') return rivalries(S);
  if (s === 'relationships') return relationships(S);
  if (s === 'media') return media(S);
  if (s === 'matches') return matches(S);
  if (s === 'settings') return settingsView(S);
  const items = [['matches', 'Matches', 'Every match you have wrestled'], ['rivalries', 'Rivalries', 'Heat, history, grudges'], ['media', 'Media', 'Cut promos and make promises'], ['achievements', 'Achievements', 'Earned, in progress and secret'], ['relationships', 'Relationships', 'Allies, enemies and trust'], ['settings', 'Settings & Saves', 'Text size, theme, save slots']];
  return `<main class="screen">${header('More')}${items.map(([id, l, d]) => `<button class="btn" data-action="openSub" data-id="${id}"><span class="t"><b>${l}</b><small>${d}</small></span><span class="r">›</span></button>`).join('')}</main>`;
}

function achievements(S) {
  const c = S.g.career, f = S.ui.achFilter || 'all';
  const list = c.achievements.list();
  const cats = [...new Set(list.map((a) => a.category))];
  const sel = list.filter((a) => (f === 'all' ? true : f === 'unlocked' ? a.unlocked : f === 'progress' ? !a.unlocked && a.progress && a.progress.ratio > 0 && !a.secret : a.category === f));
  sel.sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || (b.progress?.ratio || 0) - (a.progress?.ratio || 0));
  const total = list.length, got = list.filter((a) => a.unlocked).length;
  return `<main class="screen">${header('Achievements', `${got} of ${total} unlocked`, back('closeSub'))}
    <div class="chips">${['all', 'unlocked', 'progress', ...cats].map((x) => `<button class="chip ${f === x ? 'on' : ''}" data-action="achFilter" data-id="${x}">${cap(x)}</button>`).join('')}</div>
    <div class="card"><div class="list">${sel.slice(0, 120).map((a) => `<button class="item" data-action="achDetail" data-id="${a.id}" style="background:none;border:0;border-bottom:1px solid var(--line);text-align:left;width:100%;color:inherit;font:inherit;cursor:pointer"><span class="dot ${a.unlocked ? 'gold' : ''}"></span><span class="col grow" style="gap:3px"><b>${esc(a.name)} ${a.unlocked ? '' : a.secret ? '<span class="pill">Secret</span>' : ''}</b><span class="muted" style="font-size:.88rem">${esc(a.desc)}</span>${!a.unlocked && a.progress ? `${bar(a.progress.value, a.progress.target, 'brass')}<span class="num muted">${Math.floor(a.progress.value)}/${a.progress.target}</span>` : ''}</span><span class="pill ${a.rarity === 'legendary' ? 'rope' : a.rarity === 'epic' || a.rarity === 'rare' ? 'brass' : ''}">${cap(a.rarity)}</span></button>`).join('')}</div></div></main>`;
}

export function achievementSheet(S, id) {
  const c = S.g.career;
  const a = c.achievements.list().find((x) => x.id === id);
  const evs = a.record ? a.record.evidence.map((e) => c.memory.ledger.get(e)).filter(Boolean) : [];
  return `<div class="row spread"><h2>${esc(a.name)}</h2><button class="btn small ghost" data-action="closeSheet">Close</button></div>
    <div class="row wrap"><span class="pill brass">${cap(a.rarity)}</span><span class="pill">${cap(a.category)}</span>${a.unlocked ? `<span class="pill good">Unlocked ${esc(a.record.date)}</span>` : ''}</div>
    <p>${esc(a.desc)}</p>
    ${a.unlocked ? `<div class="card"><h3>Why you earned it</h3><p>${esc(a.record.explanation)}</p>${evs.map((e) => `<div class="item"><span class="dot"></span><div class="col" style="gap:0"><span class="eyebrow">${esc(e.date)} · ${esc(cap(e.type))} · ${esc(e.id)}</span><span>${esc(e.summary)}</span></div></div>`).join('')}</div>` : a.progress ? `<div class="card"><h3>Progress</h3>${bar(a.progress.value, a.progress.target, 'brass')}<span class="num">${Math.floor(a.progress.value)} / ${a.progress.target}</span></div>` : ''}`;
}

function rivalries(S) {
  const c = S.g.career, me = c.player.id;
  const rvs = Object.values(c.memory.world.rivalries).filter((r) => r.a === me || r.b === me).sort((a, b) => b.heat - a.heat);
  const nm = (r) => S.g.universe.get(r.a === me ? r.b : r.a)?.name || '?';
  return `<main class="screen">${header('Rivalries', `${rvs.length} on record`, back('closeSub'))}
    ${rvs.map((r) => `<div class="card"><div class="row spread"><h3>${esc(nm(r))}</h3><span class="pill ${r.status === 'active' ? 'rope' : ''}">${cap(r.status)}</span></div>${bar(r.heat, 100, 'rope')}${kv('Heat', Math.round(r.heat))}${kv('Matches', r.matches)}${kv('Wins', `${r.wins[me] || 0} - ${r.wins[r.a === me ? r.b : r.a] || 0}`)}<button class="btn small ghost" data-action="profile" data-id="${r.a === me ? r.b : r.a}">Open profile</button></div>`).join('') || '<div class="empty">No rivalries yet. Beat someone, insult someone, or just make noise.</div>'}</main>`;
}

function relationships(S) {
  const c = S.g.career, me = c.player.id;
  const rels = Object.values(c.memory.world.relationships).filter((r) => r.a === me || r.b === me).sort((a, b) => b.events.length - a.events.length);
  return `<main class="screen">${header('Relationships', `${rels.length} known`, back('closeSub'))}
    ${rels.map((r) => { const o = r.a === me ? r.b : r.a; const i = r.a === o ? 0 : 1; return `<div class="card"><div class="row spread"><h3>${esc(S.g.universe.get(o)?.name || o)}</h3>${r.tags.slice(0, 2).map((t) => `<span class="pill ${t === 'betrayal' ? 'bad' : 'brass'}">${cap(t)}</span>`).join('')}</div>${kv('Their trust in you', Math.round(r.trust[i]))}${kv('Their respect for you', Math.round(r.respect[i]))}${kv('Heat', Math.round(r.heat))}<button class="btn small ghost" data-action="profile" data-id="${o}">Memory & profile</button></div>`; }).join('') || '<div class="empty">Nobody knows you yet.</div>'}</main>`;
}

function appearances(S) {
  const g = S.g;
  const res = S.ui.apResult;
  if (res) return `<main class="screen" id="appearance-result">${header(res.label, `${res.quality}/100${res.viral ? ' · VIRAL' : ''}`, `<button class="btn small ghost" data-action="apDone" id="btn-ap-done">Done</button>`)}
    ${res.given.map((x) => `<div class="card"><p class="why">${esc(x.question)}</p><p class="line">${esc(x.text)}</p><p class="why">${esc(x.react)} · ${x.quality}/100${x.refs.length ? ` · remembers ${x.refs.length} event${x.refs.length === 1 ? '' : 's'}` : ''}</p></div>`).join('')}
    ${res.promises.length ? `<div class="card"><span class="pill brass">Promise on record</span> <b>${esc(res.promises[0].text)}</b></div>` : ''}
    ${res.pay ? `<div class="card">${kv('Appearance fee', '$' + res.pay.toLocaleString())}</div>` : ''}
    ${res.unlocked.map((u) => `<div class="row"><span class="pill brass">Achievement</span><b>${esc(u.name)}</b></div>`).join('')}</main>`;
  const v = g.appearanceView();
  if (v && !v.done) return `<main class="screen" id="appearance">${header(v.label, `Question ${v.step} of ${v.of}`, `<button class="btn small ghost" data-action="apCancel">Walk out</button>`)}
    <div class="card"><p class="line" id="ap-question">${esc(v.question)}</p>${v.refs.length ? `<span class="why">based on ${v.refs.length} event${v.refs.length === 1 ? '' : 's'} in your history</span>` : ''}</div>
    <div class="opts col" id="ap-answers">${v.answers.map((a) => `<button class="btn" data-action="apAnswer" data-id="${a.id}"><span class="t"><b>${esc(a.label)}</b><small>${esc(a.desc)}</small></span></button>`).join('')}</div></main>`;
  return null;
}

function media(S) {
  const ap = appearances(S);
  if (ap) return ap;
  const g = S.g, o = g.promoOptions(), ui = S.ui.promo;
  const targets = g.universe.list((w) => w.brand === g.career.player.brand).slice(0, 40);
  const res = S.ui.promoResult;
  if (res) return `<main class="screen">${header('Promo cut', `${res.quality}/100${res.viral ? ' · VIRAL' : ''}`, `<button class="btn small ghost" data-action="promoDone">Done</button>`)}
    <div class="card">${res.lines.map((l) => `<p class="line">${esc(l.text)}${l.refs.length ? `<span class="why">remembers ${l.refs.length} past event${l.refs.length === 1 ? '' : 's'}</span>` : l.promise ? '<span class="why">promise recorded</span>' : ''}</p>`).join('')}${res.reaction ? `<p class="muted">${esc(res.reaction)}</p>` : ''}
    ${res.unlocked.map((u) => `<div class="row"><span class="pill brass">Achievement</span><b>${esc(u.name)}</b></div>`).join('')}</div></main>`;
  const tone = o.tones[ui.tone];
  return `<main class="screen">${header('Media', 'Promos, interviews and press', back('closeSub'))}
    ${o.pending ? '<p class="line">The crowd is waiting for you to speak.</p>' : ''}
    <div class="col"><div class="eyebrow">Interviews &amp; press</div>${g.appearanceOptions().map((k) => `<button class="btn" data-action="apStart" data-id="${k.id}" ${k.available ? '' : 'disabled'}><span class="t"><b>${esc(k.label)}</b><small>${esc(k.reason || k.desc)}</small></span><span class="r">${k.questions} Qs</span></button>`).join('')}</div>
    <div class="eyebrow">Cut a promo</div>
    <div class="col"><div class="eyebrow">Tone</div><div class="chips">${Object.entries(o.tones).map(([id, t]) => `<button class="chip ${ui.tone === id ? 'on' : ''}" data-action="promoSet" data-k="tone" data-v="${id}">${esc(t.label)}</button>`).join('')}</div><p class="muted">${esc(tone.desc)}</p></div>
    ${tone.needsTarget ? `<label class="f">Target<select id="promo-target" data-action-change="promoTarget">${targets.map((w) => `<option value="${w.id}" ${ui.target === w.id ? 'selected' : ''}>${esc(w.name)}</option>`).join('')}</select></label>` : ''}
    <div class="col"><div class="eyebrow">Promise</div><div class="chips">${Object.entries(o.claims).filter(([id, cl]) => !cl.needsTarget || tone.needsTarget).map(([id, cl]) => `<button class="chip ${ui.claim === id ? 'on' : ''}" data-action="promoSet" data-k="claim" data-v="${id}">${esc(cl.label)}</button>`).join('')}</div><p class="muted">Promises are public and remembered. Break one and the media will bring it up.</p></div>
    <button class="btn primary" data-action="deliverPromo" id="btn-promo">Grab the mic</button></main>`;
}

function matches(S) {
  const c = S.g.career;
  const evs = c.memory.ledger.query({ types: ['match_result'], scope: 'player', newestFirst: true });
  return `<main class="screen">${header('Matches', `${evs.length} total`, back('closeSub'))}
    <div class="card"><div class="list">${evs.map((e) => `<button class="item" data-action="inspect" data-id="${e.id}" style="background:none;border:0;border-bottom:1px solid var(--line);text-align:left;width:100%;color:inherit;font:inherit;cursor:pointer"><span class="dot ${e.data.result === 'win' ? 'win' : e.data.result === 'loss' ? 'loss' : ''}"></span><span class="col grow" style="gap:1px"><span class="eyebrow">${esc(e.date)} · ${esc(e.data.show || '')}</span><span>${esc(e.summary)}</span></span></button>`).join('') || '<div class="empty">No matches yet.</div>'}</div></div></main>`;
}

function settingsView(S) {
  const st = S.settings;
  return `<main class="screen">${header('Settings', 'Display and saves', back('closeSub'))}
    <div class="card"><h3>Text size</h3><div class="chips">${[[15, 'Small'], [16, 'Medium'], [18, 'Large'], [20, 'Extra large']].map(([n, l]) => `<button class="chip ${st.size === n ? 'on' : ''}" data-action="setting" data-k="size" data-v="${n}">${l}</button>`).join('')}</div>
    <h3>Theme</h3><div class="chips">${['system', 'light', 'dark'].map((t) => `<button class="chip ${st.theme === t ? 'on' : ''}" data-action="setting" data-k="theme" data-v="${t}">${cap(t)}</button>`).join('')}</div>
    <h3>Autosave</h3><div class="chips"><button class="chip ${st.autosave ? 'on' : ''}" data-action="setting" data-k="autosave" data-v="1">On</button><button class="chip ${!st.autosave ? 'on' : ''}" data-action="setting" data-k="autosave" data-v="0">Off</button></div></div>
    ${savesCard(S)}</main>`;
}

export function savesCard(S) {
  return `<div class="card"><h3>Save slots</h3>${S.slots.map((s) => `<div class="card" style="background:var(--surface-2)"><div class="row spread"><b>${s.slot === 'auto' ? 'Autosave' : `Slot ${s.slot.slice(-1)}`}</b>${s.empty ? '<span class="pill">Empty</span>' : s.ok === false ? '<span class="pill bad">Damaged</span>' : `<span class="pill good">${esc((s.savedAt || '').slice(0, 10))}</span>`}</div>
    ${s.empty ? '' : `<div class="muted">${esc(s.name)} · ${esc(s.date)} · ${s.matches} matches · ${s.titles} titles · ${s.achievements} achievements</div>`}
    <div class="row">${S.g.career && s.slot !== 'auto' ? `<button class="btn small grow" data-action="saveSlot" data-id="${s.slot}">Save here</button>` : ''}${s.empty ? '' : `<button class="btn small grow" data-action="loadSlot" data-id="${s.slot}">Load</button><button class="btn small ghost" data-action="delSlot" data-id="${s.slot}">Delete</button>`}</div></div>`).join('')}</div>`;
}

export function eventSheet(S, id) {
  const c = S.g.career, e = c.memory.ledger.get(id);
  const refs = e.refs.map((r) => c.memory.ledger.get(r)).filter(Boolean);
  const rows = Object.entries(e.data).filter(([k, v]) => typeof v !== 'object' && v !== null && v !== undefined).slice(0, 18);
  return `<div class="row spread"><h2>${esc(cap(e.type))}</h2><button class="btn small ghost" data-action="closeSheet">Close</button></div>
    <div class="eyebrow">${esc(e.id)} · ${esc(e.date)} · ${esc(e.category)}</div><p>${esc(e.summary)}</p>
    <div class="card">${rows.map(([k, v]) => kv(cap(k), esc(String(v)))).join('')}</div>
    ${refs.length ? `<div class="card"><h3>Related events</h3>${refs.map((r) => `<button class="item" data-action="inspect" data-id="${r.id}" style="background:none;border:0;text-align:left;color:inherit;font:inherit;cursor:pointer"><span class="dot"></span><span>${esc(r.date)} · ${esc(r.summary)}</span></button>`).join('')}</div>` : ''}
    <div class="eyebrow">Hash ${esc(e.hash)}</div>`;
}

export function evidenceSheet(S, sec, i) {
  const c = S.g.career;
  const names = (id) => S.g.universe.get(id)?.name || id;
  const book = buildRecordBook(c, names);
  const it = book.sections.find((s) => s.id === sec).items[i];
  const evs = it.evidence.map((id) => c.memory.ledger.get(id)).filter(Boolean).slice(-60).reverse();
  return `<div class="row spread"><h2>${esc(it.label)}</h2><button class="btn small ghost" data-action="closeSheet">Close</button></div><p class="muted">${esc(it.value)} · ${it.evidence.length} event(s) produced this number.</p>
    ${evs.map((e) => `<button class="item" data-action="inspect" data-id="${e.id}" style="background:none;border:0;border-bottom:1px solid var(--line);text-align:left;color:inherit;font:inherit;cursor:pointer"><span class="dot ${e.data.result === 'win' ? 'win' : e.data.result === 'loss' ? 'loss' : ''}"></span><span class="col" style="gap:0"><span class="eyebrow">${esc(e.date)}</span><span>${esc(e.summary)}</span></span></button>`).join('')}`;
}

// ---------------------------------------------------------------- scenario
export function scenario(S) {
  const g = S.g, inst = g.pendingScenario(), res = S.ui.scnResult;
  if (res) {
    return `<main class="screen noTab" id="scenario-result"><div class="banner"><div class="eyebrow">${esc(res.title)}</div><h1>Outcome</h1></div>
      <div class="card"><p>${esc(res.text)}</p>${res.notes.map((n) => `<p class="line">${esc(n)}</p>`).join('')}${res.events.slice(1).map((e) => `<div class="row"><span class="pill brass">${esc(cap(e.type))}</span><span class="muted">${esc(e.summary)}</span></div>`).join('')}</div>
      <button class="btn primary" data-action="scnDone" id="btn-scn-done">Continue</button></main>`;
  }
  if (!inst) return `<main class="screen noTab"><div class="empty">Nothing is happening right now.</div><button class="btn primary" data-action="scnDone">Back</button></main>`;
  return `<main class="screen noTab" id="scenario">
    <div class="banner"><div class="eyebrow">${esc(cap(inst.category))}</div><h1>${esc(inst.title)}</h1></div>
    <div class="card">${inst.body.map((b) => `<p>${esc(b)}</p>`).join('')}${inst.memory.map((l) => `<p class="line">${esc(l.text)}<span class="why">memory · ${l.refs.length} event${l.refs.length === 1 ? '' : 's'}</span></p>`).join('')}</div>
    <div class="col"><div class="eyebrow">What do you do?</div>${inst.choices.map((ch) => `<button class="btn" ${ch.enabled ? '' : 'disabled'} data-action="scnChoose" data-id="${esc(ch.id)}"><span class="t"><b>${esc(ch.label)}</b>${ch.hint ? `<small>${esc(ch.hint)}</small>` : ''}${!ch.enabled ? '<small>Not available right now.</small>' : ''}</span>${ch.risk ? `<span class="hint ${ch.risk === 'low' ? 'Good' : ch.risk === 'med' ? 'Fair' : 'Risky'}">${esc(ch.risk)} risk</span>` : ''}</button>`).join('')}</div></main>`;
}

// ---------------------------------------------------------------- Royal Rumble
export function rumble(S) {
  const g = S.g, v = g.rumbleView(), d = g.rumble.getDecision();
  const e = g.rumble;
  let panel = '';
  if (e.over) {
    const win = e.result.winner === g.career.player.id;
    panel = `<div class="card"><h2>${win ? 'You won the Royal Rumble!' : v.out ? 'You are eliminated' : `${esc(e.result.winnerName)} wins`}</h2><button class="btn primary" data-action="finishRumble" id="btn-finish-rumble">See the result</button></div>`;
  } else if (d) {
    const head = d.kind === 'danger' ? `<div class="prompt"><div class="eyebrow">Danger</div><h2>${esc(e.state.fighters[d.attacker].name)} is trying to eliminate you!</h2></div>`
      : d.kind === 'team' ? '<div class="prompt"><div class="eyebrow">Alliance</div><h2>Who do you team up with?</h2></div>' : `<div class="prompt"><div class="eyebrow">Your move · ${Math.floor(v.t / 60)} min</div><h2>Survive and eliminate</h2></div>`;
    const opts = d.options.filter((o) => o.enabled !== false);
    panel = `<div class="col" id="decision" data-kind="${d.kind}">${head}<div class="opts">${opts.map((o) => `<button class="btn" data-action="rchoose" data-id="${esc(o.id)}"><span class="t"><b>${esc(o.label)}</b>${o.desc ? `<small>${esc(o.desc)}</small>` : ''}</span>${o.p != null ? `<span class="hint ${o.p >= 0.65 ? 'Good' : o.p >= 0.45 ? 'Fair' : 'Risky'}">${Math.round(o.p * 100)}%</span>` : ''}</button>`).join('')}</div></div>`;
  }
  const lines = S.feed.slice(-40);
  return `<div class="match" id="rumble">
    <div class="board" aria-live="polite">
      <div class="names"><div class="nm">Royal Rumble ${v.year}</div><div class="clock num">${Math.floor(v.t / 60)}:${String(v.t % 60).padStart(2, '0')}<small>${v.entered}/30 entered</small></div><div class="nm r">${v.out ? 'Eliminated' : `Entry #${v.entry}`}</div></div>
      <div class="meter sta"><span>STA</span>${bar(v.me.stamina, v.me.max)}</div><div class="meter mom"><span>MOM</span>${bar(v.me.momentum)}</div>
      <div class="posrow"><span class="eyebrow" style="color:var(--mat-ink)">In the ring: ${v.ringCount}</span><span class="eyebrow" style="color:var(--mat-ink)">Your eliminations: ${v.elims}${v.me.ally ? ` · ally ${esc(v.me.ally)}` : ''}</span></div>
      <div class="chips">${v.ring.slice(0, 14).map((r) => `<span class="pill" style="color:var(--mat-ink);${r.isMe ? 'border-color:var(--brass-fill)' : r.rival ? 'border-color:var(--rope)' : ''}">${esc(r.name.split(' ').slice(-1)[0])} ${r.stamina}%</span>`).join('')}${v.ring.length > 14 ? `<span class="pill" style="color:var(--mat-ink)">+${v.ring.length - 14}</span>` : ''}</div>
    </div>
    <div class="feed" id="feed" role="log">${lines.length ? lines.map((l) => `<p class="${/elimination|end/.test(l.type) ? 'gold' : /danger|attempt/.test(l.type) ? 'hot' : ''}">${esc(l.text)}</p>`).join('') : '<p>The countdown begins...</p>'}</div>
    ${panel}</div>`;
}

export function rumbleResult(S) {
  const r = S.ui.rumbleResult;
  return `<main class="screen noTab"><div class="banner"><div class="eyebrow">Royal Rumble ${r.year}</div><h1>${r.won ? 'Winner!' : 'Eliminated'}</h1><p style="opacity:.85">${esc(r.summary)}</p></div>
    <div class="card"><h3>Your Rumble</h3>${kv('Entry number', r.entryNumber)}${kv('Eliminations', r.eliminations)}${kv('Time in the ring', `${Math.floor(r.survivalSec / 60)}m ${r.survivalSec % 60}s`)}${kv('Final two', r.finalTwo ? 'Yes' : 'No')}${kv('Winner', esc(r.winnerName))}</div>
    ${r.unlocked.length ? `<div class="card" style="border-color:var(--brass-fill)"><h3>Achievements unlocked</h3>${r.unlocked.map((u) => `<div class="item"><span class="dot gold"></span><div class="col" style="gap:2px"><b>${esc(u.name)}</b><span class="muted" style="font-size:.85rem">${esc(u.explanation)}</span></div></div>`).join('')}</div>` : ''}
    ${r.won ? '<p class="line">As the Rumble winner you have earned a championship match at WrestleMania.</p>' : ''}
    <button class="btn primary" data-action="rumbleDone" id="btn-rumble-done">Back to the locker room</button></main>`;
}
