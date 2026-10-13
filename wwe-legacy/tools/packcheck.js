// Validates the prose packs (commentary, interview answers, promos). Used by authors and by the test suite.
//   node tools/packcheck.js [commentary|answers|promos]
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

export const COMMENTARY_KEYS = [
  'connected_strike', 'connected_grapple', 'connected_power', 'connected_aerial', 'connected_technical', 'connected_combo', 'connected_corner', 'connected_weapon', 'connected_dirty',
  'signature', 'finisher', 'blocked', 'dodged', 'reversed', 'pin_attempt', 'kickout_near', 'kickout', 'pin_win', 'pin_save', 'submission_applied', 'hold_pressure', 'submission_escape',
  'rope_break', 'submission_win', 'taunt', 'hype', 'momentum_shift', 'recover', 'get_up', 'roll_out', 'slide_in', 'knockdown', 'ten_count', 'rise', 'tag', 'hot_tag', 'climb', 'slip', 'injury',
  'color_crowd_for', 'color_crowd_against', 'color_tired', 'color_momentum', 'color_late',
];
export const COMMENTARY_PLACEHOLDERS = ['a', 'aL', 't', 'tL', 'mv', 'part', 'adj', 'pos', 'self', 'tpos', 'tself'];
export const ANSWER_STANCES = ['confident', 'humble', 'aggressive', 'honest', 'joking', 'guarantee'];
export const ANSWER_TOPICS = ['last_match', 'rival', 'open_promise', 'title', 'upcoming', 'fans', 'career', 'broken_promise', 'injury'];
export const ANSWER_PLACEHOLDERS = ['opp', 'they', 'their', 'event', 'finish', 'movePhrase'];
export const PROMO_TONES = ['insult', 'humiliate', 'challenge', 'threat', 'respect', 'tribute', 'apology', 'boast', 'inspire'];
export const PROMO_PLACEHOLDERS = ['t', 'their', 'they', 'them'];

const tokens = (s) => [...s.matchAll(/\{([A-Za-z]+)\}/g)].map((m) => m[1]);

function lintLine(line, allowed, where, errors, { max = 170 } = {}) {
  if (typeof line !== 'string') { errors.push(`${where}: not a string`); return; }
  for (const t of tokens(line)) if (!allowed.includes(t)) errors.push(`${where}: unknown placeholder {${t}} in "${line.slice(0, 50)}"`);
  const bare = line.replace(/\{[A-Za-z]+\}/g, 'X');
  if (/[{}]/.test(bare)) errors.push(`${where}: stray brace in "${line.slice(0, 50)}"`);
  if (line.length < 12 || line.length > max) errors.push(`${where}: length ${line.length} outside 12-${max}: "${line.slice(0, 50)}"`);
  if (!/^[A-Z{"'(]/.test(line)) errors.push(`${where}: must start with a capital, a quote or a placeholder: "${line.slice(0, 50)}"`);
  if (!/[.!?"')…]$/.test(line)) errors.push(`${where}: must end with punctuation: "${line.slice(0, 50)}"`);
  if (/  |\s[,.;!?]/.test(line)) errors.push(`${where}: spacing problem in "${line.slice(0, 50)}"`);
  if (/\b(\w{3,})\s+\1\b/i.test(bare)) errors.push(`${where}: repeated word in "${line.slice(0, 50)}"`);
}

export function checkCommentary(pack, { min = 8 } = {}) {
  const errors = [];
  for (const k of COMMENTARY_KEYS) {
    const arr = pack[k];
    if (!Array.isArray(arr)) { errors.push(`missing key ${k}`); continue; }
    if (arr.length < min) errors.push(`${k}: ${arr.length} variants, need >= ${min}`);
    if (new Set(arr).size !== arr.length) errors.push(`${k}: duplicate lines`);
    arr.forEach((l, i) => lintLine(l, COMMENTARY_PLACEHOLDERS, `${k}[${i}]`, errors, { max: 150 }));
  }
  for (const k of Object.keys(pack)) if (!COMMENTARY_KEYS.includes(k)) errors.push(`unknown key ${k}`);
  return errors;
}

export function checkAnswers(pack, { min = 4 } = {}) {
  const errors = [];
  for (const st of ANSWER_STANCES) {
    if (!pack[st]) { errors.push(`missing stance ${st}`); continue; }
    const topics = st === 'guarantee' ? ['title', 'upcoming'] : ANSWER_TOPICS;
    for (const tp of topics) {
      const arr = pack[st][tp];
      if (!Array.isArray(arr)) { errors.push(`missing ${st}.${tp}`); continue; }
      if (arr.length < (st === 'guarantee' ? 3 : min)) errors.push(`${st}.${tp}: ${arr.length} variants`);
      if (new Set(arr).size !== arr.length) errors.push(`${st}.${tp}: duplicates`);
      arr.forEach((l, i) => lintLine(l, ANSWER_PLACEHOLDERS, `${st}.${tp}[${i}]`, errors, { max: 200 }));
    }
  }
  return errors;
}

export function checkPromos(pack, { min = 5 } = {}) {
  const errors = [];
  for (const sect of ['open', 'body']) {
    for (const tone of PROMO_TONES) {
      const v = pack[sect] && pack[sect][tone];
      if (sect === 'open') {
        if (!Array.isArray(v) || v.length < min + 1) { errors.push(`open.${tone}: need an array of >= ${min + 1}`); continue; }
        v.forEach((l, i) => lintLine(l, PROMO_PLACEHOLDERS, `open.${tone}[${i}]`, errors, { max: 180 }));
      } else {
        for (const al of ['face', 'heel', 'tweener']) {
          const a = v && v[al];
          if (!Array.isArray(a) || a.length < min) { errors.push(`body.${tone}.${al}: need >= ${min}`); continue; }
          a.forEach((l, i) => lintLine(l, PROMO_PLACEHOLDERS, `body.${tone}.${al}[${i}]`, errors, { max: 200 }));
        }
      }
    }
  }
  for (const sect of ['close', 'closePromise']) {
    const v = pack[sect];
    if (!Array.isArray(v) || v.length < 10) errors.push(`${sect}: need >= 10 lines`);
    else v.forEach((l, i) => lintLine(l, PROMO_PLACEHOLDERS, `${sect}[${i}]`, errors, { max: 120 }));
  }
  return errors;
}

if (process.argv[1] && process.argv[1].endsWith('packcheck.js')) {
  const which = process.argv[2];
  const jobs = [['commentary', 'src/match/commentary_pack.js', checkCommentary], ['answers', 'src/story/answers_pack.js', checkAnswers], ['promos', 'src/story/promo_pack.js', checkPromos]].filter(([n]) => !which || which === n);
  let bad = 0;
  for (const [name, file, fn] of jobs) {
    let mod;
    try { mod = (await import(path.join(root, file))).default; } catch (e) { console.log(`${name}: cannot load ${file}: ${e.message}`); bad++; continue; }
    const errs = fn(mod);
    console.log(`${name}: ${errs.length ? errs.length + ' problems' : 'ok'}`);
    for (const e of errs.slice(0, 40)) console.log('  ' + e);
    if (errs.length) bad++;
  }
  process.exit(bad ? 1 : 0);
}
