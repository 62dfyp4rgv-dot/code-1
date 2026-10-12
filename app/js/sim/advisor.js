// Advisor: turns the state of the player's country into a short, prioritised list of things worth acting on.
// Pure and read-only (it never changes the simulation); the UI renders the result and the `open` hints navigate to the right screen.
import * as PRJ from './projects.js';

const SEV = { bad: 0, warn: 1, info: 2, good: 3 };
const f1 = (x) => (x * 100).toFixed(1);

export function advise(sim) {
  const st = sim.state;
  const me = st.playerId;
  const c = st.countries[me];
  const e = c.econ;
  const out = [];
  const add = (id, sev, title, text, open, tab) => out.push({ id, sev, title, text, open, tab });

  // --- things waiting for an answer
  const decisions = st.events.pending.filter((p) => p.country === me).length;
  if (decisions)
    add(
      'decisions',
      'bad',
      `${decisions} decision${decisions > 1 ? 's' : ''} waiting`,
      'Unanswered decisions are settled by default when their deadline passes.',
      'inbox',
    );
  const offers = c.dip.offers.filter((o) => o.kind === 'peace');
  if (offers.length)
    add(
      'offers',
      'bad',
      'A peace offer is on the table',
      'It lapses after 45 days. Accepting ends the war on the offered terms.',
      'military',
      'war',
    );
  const calls = c.dip.pending.filter((p) => p.kind === 'call');
  if (calls.length)
    add('calls', 'warn', 'An ally has called you to arms', 'Joining preserves your credibility; refusing costs it.', 'military', 'war');

  // --- war
  const wars = st.wars.filter((w) => w.active && (w.attackers.includes(me) || w.defenders.includes(me)));
  if (wars.length) {
    const ex = c.mil.exhaustion;
    const w = wars[0];
    const side = w.attackers.includes(me) ? 'a' : 'd';
    const adv = w.score[side] - w.score[side === 'a' ? 'd' : 'a'];
    if (ex > 0.65)
      add(
        'exhaustion',
        'bad',
        `War exhaustion ${Math.round(ex * 100)}%`,
        'Your public and army are worn out. Seek a ceasefire before stability breaks.',
        'military',
        'war',
      );
    else if (adv < -25)
      add(
        'losing',
        'warn',
        `You are losing the ${w.name}`,
        `War score ${Math.round(adv)}. Consider defending, asking for outside help, or negotiating.`,
        'military',
        'war',
      );
    else if (adv > 25)
      add(
        'winning',
        'info',
        `You are winning the ${w.name}`,
        `War score +${Math.round(adv)}. Press for favourable terms while you hold the advantage.`,
        'military',
        'war',
      );
    if (c.mil.ammo < 10 || c.mil.fuel < 10)
      add(
        'stocks',
        'warn',
        'Ammunition or fuel is running low',
        'Raise defence spending or secure supplies; unsupplied units stall.',
        'economy',
        'fiscal',
      );
  }

  if (c.gov.civil)
    add(
      'civil',
      'bad',
      'Civil conflict',
      `Fighting inside your borders (intensity ${Math.round(c.gov.civil.intensity * 100)}%). It drains output and displaces people; talks, welfare and calm restore stability.`,
      'nation',
      'government',
    );

  // --- economy
  if (e.infl > 0.06)
    add(
      'infl',
      'warn',
      `Inflation ${f1(e.infl)}%`,
      'Raise the policy rate, trim the deficit or ease energy and food shortages.',
      'economy',
      'fiscal',
    );
  else if (e.infl < 0)
    add(
      'defl',
      'warn',
      `Prices are falling (${f1(e.infl)}%)`,
      'Deflation depresses demand. Consider lower rates or stimulus.',
      'economy',
      'fiscal',
    );
  if (e.unemp > e.uNat + 0.03)
    add(
      'unemp',
      'warn',
      `Unemployment ${f1(e.unemp)}%`,
      `Natural rate is about ${f1(e.uNat)}%. Demand support or investment projects can help.`,
      'economy',
      'overview',
    );
  const defR = e.deficit / Math.max(1, e.gdp);
  if (defR > 0.06)
    add(
      'deficit',
      'warn',
      `Deficit ${f1(defR)}% of GDP`,
      'Large deficits push up borrowing costs. Review spending and taxes.',
      'economy',
      'fiscal',
    );
  if (e.debtRatio > 1.0)
    add(
      'debt',
      'warn',
      `Public debt ${Math.round(e.debtRatio * 100)}% of GDP`,
      'High debt leaves little room for shocks.',
      'economy',
      'fiscal',
    );
  if (e.reservesMonths < 2)
    add(
      'reserves',
      'bad',
      `Reserves cover ${e.reservesMonths.toFixed(1)} months of imports`,
      'Low reserves invite a currency crisis. Cut imports, build reserves or seek help.',
      'economy',
      'trade',
    );
  if (e.shortage[1] > 0.05 || e.shortage[2] > 0.05)
    add(
      'energy',
      'warn',
      'Energy shortages',
      'Diversify suppliers, build clean power, or lift constraints on imports.',
      'economy',
      'trade',
    );
  if (e.shortage[0] > 0.05)
    add('food', 'warn', 'Food shortages', 'Imports are not covering demand. Check sanctions, prices and the harvest.', 'economy', 'trade');

  // --- politics
  const g = c.gov;
  if (g.stability < 0.35)
    add(
      'stab',
      'bad',
      `Stability ${Math.round(g.stability * 100)}%`,
      'Below 20% for months a regime collapses. Calm unrest: jobs, welfare, fewer shocks.',
      'nation',
      'government',
    );
  else if (g.approval < 0.4)
    add(
      'appr',
      'warn',
      `Approval ${Math.round(g.approval * 100)}%`,
      'Voters are unhappy. Look at inflation, unemployment and taxes.',
      'nation',
      'government',
    );
  if (g.corruption > 0.55)
    add('corr', 'info', 'Corruption is high', 'An anti-corruption agency project raises revenue and state capacity.', 'nation', 'projects');
  const elect = g.nextElection === null || g.nextElection === undefined ? null : (g.nextElection - st.day) / 30;
  if (elect !== null && elect < 10 && g.approval < 0.5)
    add(
      'elect',
      'warn',
      `Election in ${Math.max(0, Math.round(elect))} months`,
      `Approval is ${Math.round(g.approval * 100)}%. Improve the numbers voters feel first.`,
      'nation',
      'government',
    );
  if (g.pc > 70)
    add(
      'pc',
      'info',
      `${Math.round(g.pc)} political capital unspent`,
      'Capital caps out. Spend it on policies, projects or diplomacy.',
      'nation',
      'policy',
    );

  // --- growth levers
  const ps = c.projects || { active: [] };
  if (!ps.active.length && !wars.length && defR < 0.05) {
    const avail = sim.data.projects.filter((p) => PRJ.status(sim, c, p).state === 'available');
    if (avail.length && g.pc >= 15)
      add(
        'projects',
        'info',
        'No national project under way',
        `${avail.length} are available, for example ${avail[0].name}.`,
        'nation',
        'projects',
      );
  }
  if (!c.tech.queue.length)
    add(
      'research',
      'info',
      'The research queue is empty',
      'Technologies add permanent productivity, security and welfare bonuses.',
      'research',
    );

  // --- security
  if (!wars.length) {
    let worst = null;
    for (let j = 0; j < sim.geo.N; j++) {
      if (j === me) continue;
      const rv = st.rel.rivalry[me * sim.geo.N + j];
      if (rv > 60 && (sim.geo.neighbors[me].has(j) || sim.geo.dist[me * sim.geo.N + j] < 3500) && (!worst || rv > worst.rv))
        worst = { j, rv };
    }
    if (worst)
      add(
        'threat',
        'info',
        `Tension with ${st.countries[worst.j].name}`,
        `Rivalry ${Math.round(worst.rv)}. Check alliances, guarantees and readiness.`,
        'dipTarget',
        String(worst.j),
      );
  }

  // --- mandates close to their deadline
  for (const a of (c.mandates && c.mandates.active) || []) {
    const left = Math.ceil((a.deadline - st.day) / 30.4);
    const t = sim.data.mandates.find((x) => x.id === a.id);
    if (t && left <= 3 && left >= 0)
      add(
        'mandate_' + a.id,
        'info',
        `Mandate running out: ${t.name}`,
        `About ${left} month${left === 1 ? '' : 's'} left. Reward: ${t.reward.pc} political capital.`,
        'objectives',
        'mandates',
      );
  }

  if (!out.some((a) => a.sev === 'bad' || a.sev === 'warn'))
    add('ok', 'good', 'Nothing urgent', 'Your numbers look sound. A good moment to invest in the long term.', 'objectives');
  out.sort((a, b) => SEV[a.sev] - SEV[b.sev]);
  return out;
}
