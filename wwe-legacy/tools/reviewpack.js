// Builds a self-contained pack of *generated* content so independent reviewers (fresh agents with no
// access to the author's reasoning) can judge it: match commentary, scenario prose, promos and memory
// callbacks, all produced by real simulated play. Output: docs/gauntlet/review-pack/*.md
import fs from 'node:fs';
import path from 'node:path';
import { Game } from '../src/game.js';
import { MatchEngine } from '../src/match/engine.js';
import { narrate } from '../src/match/commentary.js';
import { SAMPLE_WRESTLERS as W } from '../src/match/samples.js';
import { PROFILES, decideFor } from '../src/match/ai.js';
import { Rng } from '../src/core/rng.js';
import { memoryLines } from '../src/story/dialogue.js';
import { deliverPromo } from '../src/story/media.js';
import { buildRecordBook } from '../src/career/recordbook.js';
import { summarizeMatch, rateMatch } from '../src/match/rating.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'docs/gauntlet/review-pack');
fs.mkdirSync(out, { recursive: true });

// ---------------------------------------------------------------- 1. match commentary
const lines = ['# Match commentary samples', '', 'Each line was produced by `narrate()` from a structured engine event. The engine decides outcomes; the text only describes them.', ''];
for (const [type, a, b, seed] of [['singles', 'brawler', 'tech', 11], ['ladder', 'flyer', 'power', 5], ['tag', 'show', 'sub', 3]]) {
  const sides = type === 'tag' ? [[W[a], W.partnerA], [W[b], W.partnerB]] : [[W[a]], [W[b]]];
  const e = MatchEngine.simulate({ seed, type, sides, playerId: W[a].id }, {});
  const s = summarizeMatch(e.state), r = rateMatch(e.state);
  lines.push(`## ${type}: ${W[a].name} vs ${W[b].name} (seed ${seed})`, '', `Result: ${e.state.result.finish}, ${Math.round(e.state.result.durationSec / 60)} min, ${r.stars.toFixed(1)} stars.`, '');
  for (const ev of e.state.events) { const t = narrate(e.state, ev); if (t) lines.push(`- ${Array.isArray(t) ? t.join(' ') : t}`); }
  lines.push('');
}
fs.writeFileSync(path.join(out, 'commentary.md'), lines.join('\n'));

// ---------------------------------------------------------------- 2. a played career: scenarios, promos, memory
const g = new Game();
const c = g.newCareer({ seed: 33, name: 'Review Sample', startYear: 2024, background: 'prospect', style: 'brawler', bonus: { technical: 5, psychology: 5 }, signatures: [], finisher: { tpl: 'fin_ddt', name: 'Sample Finisher' } });
const rng = new Rng('review');
const scn = [];
const captureScenario = () => {
  let guard = 0;
  while (c.flags.scenario && guard++ < 10) {
    const inst = c.flags.scenario;
    const ok = inst.choices.filter((x) => x.enabled);
    const pick = ok[rng.int(0, ok.length - 1)];
    const res = g.resolveScenario(pick.id);
    scn.push({ inst, pick, res, day: c.day });
  }
};
let matches = 0;
let guard = 0;
while (c.day < 560 && matches < 100 && guard++ < 4000) {
  captureScenario();
  const ev = g.nextEvent();
  if (!ev) break;
  if (ev.day > c.day) { g.rest(); continue; }
  if (g.rumbleAvailable()) { g.startRumble(); let n = 0; while (!g.rumble.over && n++ < 500) { const d = g.rumble.getDecision(); const o = d.options.filter((x) => x.enabled !== false); g.rumbleChoose(o[0].id); } g.finishRumble(); continue; }
  const opps = g.suggestOpponents();
  if (!opps.length) { g.advanceToNextEvent(); continue; }
  const pick = opps.find((o) => o.forced) || opps[0];
  g.prepareMatch({ opponentId: pick.id, stakes: pick.stakes || null, type: pick.type || 'singles', plan: 'balanced' });
  g.startMatch();
  let n = 0;
  while (!g.engine.over && n++ < 3000) { const d = g.decision(); if (!d) break; g.choose(decideFor(g.engine.state, d, PROFILES.smart)); }
  g.finishMatch(); matches++;
  g.endPostMatch();
}
captureScenario();

const L = ['# Scenario prose samples', '', `A representative sample of the ${scn.length} situations shown to a simulated player during a played career (day ${c.day}, ${matches} matches): up to 8 that cited remembered history, then others in order. Choices were picked at random. \`Memory\` lines are generated from ledger events the character can actually cite.`, ''];
const seenT = new Set();
const ordered = [...scn.filter((x) => x.inst.memory && x.inst.memory.length), ...scn.filter((x) => !(x.inst.memory && x.inst.memory.length))];
let memShown = 0;
for (const x of ordered) {
  if (seenT.has(x.inst.templateId) || seenT.size >= 16) continue;
  if (x.inst.memory && x.inst.memory.length) { if (memShown >= 8) continue; memShown++; }
  seenT.add(x.inst.templateId);
  L.push(`## ${x.inst.title}  _(day ${x.day}, ${x.inst.category})_`, '', ...x.inst.body.map((p) => `> ${p}`), '');
  if (x.inst.memory && x.inst.memory.length) L.push('Memory callbacks shown: ' + x.inst.memory.map((m) => `"${m.text}"`).join(' / '), '');
  L.push('Choices offered: ' + x.inst.choices.map((ch) => `[${ch.label}]`).join(' '), '', `Chosen: **${x.pick.label}** → ${x.res.text || x.res.result || JSON.stringify(x.res).slice(0, 300)}`, '');
}
fs.writeFileSync(path.join(out, 'scenarios.md'), L.join('\n'));

// promos against rivals
const P = ['# Promo samples (generated with memory)', ''];
const rivals = Object.values(c.memory.world.rivalries).filter((r) => r.a === c.player.id || r.b === c.player.id).sort((a, b) => b.matches - a.matches).slice(0, 3);
for (const r of rivals) {
  const other = r.a === c.player.id ? r.b : r.a;
  for (const tone of ['challenge', 'insult']) {
    try {
      const res = deliverPromo(c, { tone, targetId: other, claim: 'win_match' });
      P.push(`## ${tone} on ${g.universe.get(other).name} (heat ${Math.round(r.heat)}, ${r.matches} prior matches)`, '', ...res.lines.map((l) => `- ${l.text}${l.refs.length ? `  _[cites ${l.refs.join(', ')}]_` : ''}`), '', `Quality ${res.quality}/100${res.viral ? ' (viral)' : ''}. ${res.reaction || ''}`, '');
    } catch (e) { P.push(`(promo failed: ${e.message})`); }
  }
}
for (const kind of ['interview', 'podcast', 'press_conference']) {
  try {
    let v = g.startAppearance(kind); let i = 0;
    while (!v.done && i++ < 10) { const a = v.answers[(i * 2) % v.answers.length]; v = g.answerAppearance(a.id); }
    P.push(`## ${v.label} (${v.quality}/100)`, '');
    for (const x of v.given) P.push(`- Q: ${x.question}`, `  - A (${x.answer}): ${x.text}`, `  - ${x.react} ${x.refs.length ? `_[grounded in ${x.refs.join(', ')}]_` : ''}`);
    P.push('');
    c.advanceDays(15);
  } catch (e) { P.push(`(${kind} unavailable: ${e.message})`); }
}
fs.writeFileSync(path.join(out, 'promos.md'), P.join('\n'));

// memory dump: ledger excerpt, relationship + rivalry state, memory lines
const M = ['# Memory & record-book dump', '', `Player: ${c.player.name}. Ledger: ${c.memory.ledger.size} events, chain verified: ${c.memory.ledger.verify().ok}.`, ''];
M.push('## Last 25 player-scope ledger events', '');
for (const e of c.memory.ledger.query({ scope: 'player', newestFirst: true, limit: 25 }).reverse()) M.push(`- ${e.id} [${e.date}] ${e.type}: ${e.summary}`);
M.push('', '## Relationships / rivalries from world state', '');
for (const r of rivals) {
  const other = r.a === c.player.id ? r.b : r.a; const name = g.universe.get(other).name;
  M.push(`- Rivalry with ${name}: heat ${Math.round(r.heat)}, ${r.matches} matches, status ${r.status}`);
  for (const l of memoryLines(c.memory, c.player.id, other, name, { speaker: 'other', max: 4 })) M.push(`  - ${name} says: "${l.text}"  (cites ${l.refs.join(', ') || 'nothing'})`);
}
M.push('', '## Record book (each number opens to evidence event ids)', '');
const book = buildRecordBook(c, (id) => g.universe.get(id)?.name || id);
for (const s of book.sections.slice(0, 5)) { M.push(`### ${s.title}`); for (const it of s.items.slice(0, 8)) M.push(`- ${it.label}: ${it.value}${it.evidence ? ` (evidence: ${it.evidence.slice(0, 4).join(', ')}${it.evidence.length > 4 ? ` +${it.evidence.length - 4} more` : ''})` : ''}`); }
fs.writeFileSync(path.join(out, 'memory.md'), M.join('\n'));
console.log(`review pack written to ${path.relative(root, out)}: ${scn.length} scenarios seen, ${matches} matches played`);
