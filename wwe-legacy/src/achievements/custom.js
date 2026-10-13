// Custom achievement checks for conditions the declarative DSL cannot express directly.
// Each returns { value, target, done, evidence:[eventIds] } computed from real ledger data.
const mr = (ctx) => ctx.q({ types: ['match_result'], scope: 'player' });

export const CUSTOM = {
  /** won a title after a prolonged losing period: >= lossesIn of the previous `window` matches were losses */
  title_after_slump(ctx, { window = 10, lossesIn = 7 } = {}) {
    const matches = mr(ctx);
    const wins = ctx.q({ types: ['title_win'], scope: 'player' });
    let best = 0, evidence = [];
    for (const tw of wins) {
      const before = matches.filter((m) => m.seq < tw.seq).slice(-window);
      const l = before.filter((m) => m.data.result === 'loss').length;
      if (before.length >= window && l > best) { best = l; evidence = [...before.filter((m) => m.data.result === 'loss').map((m) => m.id), tw.id]; }
    }
    return { value: best, target: lossesIn, done: best >= lossesIn, evidence: evidence.slice(-12) };
  },
  /** a losing streak of >= lose followed later by a winning streak of >= win */
  comeback_after_slump(ctx, { lose = 3, win = 3 } = {}) {
    let run = 0, sign = 0, sawSlump = null, ev = [];
    for (const m of mr(ctx)) {
      const r = m.data.result;
      const s = r === 'win' ? 1 : r === 'loss' ? -1 : 0;
      if (s !== 0 && s === sign) run++; else { run = s === 0 ? 0 : 1; sign = s; ev = []; }
      ev.push(m.id);
      if (sign === -1 && run >= lose) sawSlump = true;
      if (sign === 1 && run >= win && sawSlump) return { value: win, target: win, done: true, evidence: ev.slice(-win) };
    }
    return { value: sawSlump ? 1 : 0, target: 2, done: false, evidence: [] };
  },
  /** a calendar year with at least `n` matches and no losses */
  undefeated_year(ctx, { n = 10 } = {}) {
    const by = {};
    for (const m of mr(ctx)) { const y = m.date.slice(0, 4); (by[y] ||= []).push(m); }
    let best = 0, ev = [];
    for (const list of Object.values(by)) {
      if (list.some((m) => m.data.result === 'loss')) continue;
      if (list.length > best) { best = list.length; ev = list.map((m) => m.id); }
    }
    return { value: best, target: n, done: best >= n, evidence: ev.slice(0, n) };
  },
  /** finished a rivalry (>= matches vs one opponent) with no DQ / interference / betrayal between them */
  clean_rivalry(ctx, { matches = 3 } = {}) {
    const per = {};
    for (const m of mr(ctx)) for (const o of m.data.opponents || []) (per[o] ||= []).push(m);
    let best = 0, ev = [];
    for (const [o, list] of Object.entries(per)) {
      const clean = list.every((m) => !['dq', 'countout'].includes(m.data.finish) && !m.data.interference);
      const betray = ctx.q({ types: ['betrayal'], allParticipants: [ctx.playerId, o] }).length;
      if (clean && !betray && list.length > best) { best = list.length; ev = list.map((m) => m.id); }
    }
    return { value: best, target: matches, done: best >= matches, evidence: ev.slice(0, matches) };
  },
  /** beat someone who betrayed the player, after the betrayal */
  avenged_betrayal(ctx) {
    for (const b of ctx.q({ types: ['betrayal'] })) {
      if (b.participants[1] !== ctx.playerId) continue;
      const betrayer = b.participants[0];
      const win = mr(ctx).find((m) => m.seq > b.seq && m.data.result === 'win' && (m.data.opponents || []).includes(betrayer));
      if (win) return { value: 1, target: 1, done: true, evidence: [b.id, win.id] };
    }
    return { value: 0, target: 1, done: false, evidence: [] };
  },
  /** main-evented a WrestleMania-tier show without ever having held a title */
  main_event_no_title(ctx) {
    const me = mr(ctx).find((m) => m.data.mainEvent && (m.data.ppvTier || 0) >= 2);
    if (!me) return { value: 0, target: 1, done: false, evidence: [] };
    const titlesBefore = ctx.q({ types: ['title_win'], scope: 'player' }).filter((t) => t.seq < me.seq).length;
    return { value: titlesBefore === 0 ? 1 : 0, target: 1, done: titlesBefore === 0, evidence: titlesBefore === 0 ? [me.id] : [] };
  },
  /** an alliance (alliance_formed) that lasted >= days with no betrayal between the pair */
  long_alliance(ctx, { days = 365 } = {}) {
    const now = ctx.ledger.events.filter((e) => e.seq <= (ctx.maxSeq ?? Infinity)).slice(-1)[0]?.day ?? 0;
    let best = 0, ev = [];
    for (const a of ctx.q({ types: ['alliance_formed'] })) {
      if (!a.participants.includes(ctx.playerId)) continue;
      const betrayed = ctx.q({ types: ['betrayal'], allParticipants: a.participants }).some((b) => b.seq > a.seq);
      const span = now - a.day;
      if (!betrayed && span > best) { best = span; ev = [a.id]; }
    }
    return { value: Math.min(best, days), target: days, done: best >= days, evidence: ev };
  },
  /** held the same title for >= days, from the stats projection */
  reign_length(ctx, { days = 365 } = {}) {
    const s = ctx.stats.s.titles;
    const now = ctx.ledger.events.filter((e) => e.seq <= (ctx.maxSeq ?? Infinity)).slice(-1)[0]?.day ?? 0;
    let best = s.longestReignDays, ev = s.longestReign ? [s.longestReign.startEvent] : [];
    for (const idx of Object.values(s.current)) {
      const r = s.reigns[idx];
      if (now - r.startDay > best) { best = now - r.startDay; ev = [r.startEvent]; }
    }
    return { value: Math.min(best, days), target: days, done: best >= days, evidence: ev };
  },
  /** won an extended match (>= minutes) after taking >= damage total damage */
  survived_war(ctx, { minutes = 20, damage = 220 } = {}) {
    const m = mr(ctx).find((x) => x.data.result === 'win' && x.data.durationSec >= minutes * 60 && (x.data.damageTaken || 0) >= damage);
    return { value: m ? 1 : 0, target: 1, done: !!m, evidence: m ? [m.id] : [] };
  },
  /** beat the same rival at least `n` times */
  rival_sweep(ctx, { n = 3 } = {}) {
    const per = {};
    for (const m of mr(ctx)) if (m.data.result === 'win' && m.data.vsRival) for (const o of m.data.opponents || []) (per[o] ||= []).push(m.id);
    let best = [];
    for (const l of Object.values(per)) if (l.length > best.length) best = l;
    return { value: best.length, target: n, done: best.length >= n, evidence: best.slice(0, n) };
  },
  /** overall win percentage over a minimum number of matches */
  win_rate(ctx, { pct = 0.7, min = 50 } = {}) {
    const s = ctx.stats.s;
    const rate = s.matches ? s.wins / s.matches : 0;
    const ok = s.matches >= min && rate >= pct;
    return { value: s.matches >= min ? Math.round(rate * 100) : 0, target: Math.round(pct * 100), done: ok, evidence: mr(ctx).filter((m) => m.data.result === 'win').slice(-25).map((m) => m.id) };
  },
  /** won at least 4 distinct classes of title inside one era */
  era_grand_slam(ctx, { classes = 4 } = {}) {
    const per = {};
    for (const t of ctx.q({ types: ['title_win'], scope: 'player' })) {
      const era = t.data.era; if (!era) continue;
      (per[era] ||= new Map()).set(t.data.titleClass, t.id);
    }
    let best = { n: 0, ev: [] };
    for (const m of Object.values(per)) if (m.size > best.n) best = { n: m.size, ev: [...m.values()] };
    return { value: best.n, target: classes, done: best.n >= classes, evidence: best.ev };
  },
  /** at least `n` match wins in one calendar year */
  year_wins(ctx, { n = 50 } = {}) {
    const by = {};
    for (const m of mr(ctx)) if (m.data.result === 'win') (by[m.date.slice(0, 4)] ||= []).push(m.id);
    let best = [];
    for (const l of Object.values(by)) if (l.length > best.length) best = l;
    return { value: best.length, target: n, done: best.length >= n, evidence: best.slice(0, n) };
  },
};
