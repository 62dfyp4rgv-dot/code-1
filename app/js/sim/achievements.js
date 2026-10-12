// Achievements and optional challenges. Checked monthly against simulation state; counters are bumped by commands and modules.
export const ACHIEVEMENTS = [
  { id: 'first_policy', name: 'First Steps', desc: 'Enact a policy change.', test: (s) => s.counters.policy >= 1 },
  {
    id: 'balanced_books',
    name: 'Balanced Books',
    desc: 'Hold the deficit under 1% of GDP with debt below 60% for 12 months.',
    test: (s, c) => (c.flags._bb || 0) >= 12,
  },
  { id: 'peacemaker', name: 'Peacemaker', desc: 'End a war you are fighting through negotiation.', test: (s) => s.counters.peace >= 1 },
  {
    id: 'green_transition',
    name: 'Green Transition',
    desc: 'Lift the clean share of electricity by 20 points.',
    test: (s, c) => c.econ.clean - c.econ.clean0 >= 0.2,
  },
  { id: 'tech_leader', name: 'Technology Leader', desc: 'Research 6 technologies.', test: (s) => s.counters.researched >= 6 },
  { id: 'diplomat', name: 'Diplomat', desc: 'Conclude 5 treaties.', test: (s) => s.counters.treaties >= 5 },
  { id: 'resolution', name: 'Voice of the Assembly', desc: 'Pass a Global Assembly resolution.', test: (s) => s.counters.resolutions >= 1 },
  { id: 'spymaster', name: 'Spymaster', desc: 'Complete 5 covert operations successfully.', test: (s) => s.counters.opsOk >= 5 },
  { id: 'crisis_manager', name: 'Crisis Manager', desc: 'Decide 10 crisis events.', test: (s) => s.counters.decisions >= 10 },
  {
    id: 'survivor',
    name: 'Survivor',
    desc: 'Recover stability above 55% after it fell below 25%.',
    test: (s, c) => c.flags._lowStab && c.gov.stability > 0.55,
  },
  {
    id: 'miracle',
    name: 'Economic Miracle',
    desc: 'Average 5% real growth over 36 months.',
    test: (s, c) => (c.flags._miracle || 0) >= 36,
  },
  { id: 'defender', name: 'Hold the Line', desc: 'Survive a war without losing a region.', test: (s) => s.counters.defended >= 1 },
  {
    id: 'bloc_builder',
    name: 'Bloc Builder',
    desc: 'Belong to three international organisations.',
    test: (s, c, sim) => sim.state.orgs.filter((o) => o.members.includes(sim.state.playerId) && o.id !== 'un').length >= 3,
  },
  {
    id: 'prosperity',
    name: 'Shared Prosperity',
    desc: 'Cut poverty by half.',
    test: (s, c) => c.econ.poverty <= s.victory.start.poverty * 0.5,
  },
  {
    id: 'builder',
    name: 'Nation Builder',
    desc: 'Complete three national projects.',
    test: (s, c) => (c.projects?.done.length || 0) >= 3,
  },
  {
    id: 'grand_builder',
    name: 'Grand Designer',
    desc: 'Complete eight national projects.',
    test: (s, c) => (c.projects?.done.length || 0) >= 8,
  },
  {
    id: 'steady_hand',
    name: 'Steady Hand',
    desc: 'End a civil conflict inside your borders.',
    test: (s) => s.counters.civilEnded >= 1,
  },
  {
    id: 'web_of_friends',
    name: 'Web of Friends',
    desc: 'Hold alliances or pacts with four countries at once.',
    test: (s, c, sim) => sim.alliesOf(sim.state.playerId).size >= 4,
  },
  {
    id: 'closed_ledger',
    name: 'Closed Ledger',
    desc: 'Run a budget surplus for twelve months while debt is under 70% of GDP.',
    test: (s, c) => (c.flags._surplus || 0) >= 12,
  },
  {
    id: 'long_peace',
    name: 'Long Peace',
    desc: 'Go 8 years without being at war.',
    test: (s, c, sim) =>
      !sim.atWar(sim.state.playerId) &&
      sim.state.day - (c.mil.lastWar > -9000 ? c.mil.lastWar : -9000) > 8 * 365 &&
      sim.state.day > 8 * 365,
  },
];
export function checkAchievements(sim) {
  const st = sim.state;
  const c = st.countries[st.playerId];
  st.counters = st.counters || {};
  st.ach = st.ach || {};
  const e = c.econ;
  c.flags._bb = e.deficit / e.gdp < 0.01 && (e.debtRatio ?? 9) < 0.6 ? (c.flags._bb || 0) + 1 : 0;
  c.flags._surplus = e.deficit < 0 && (e.debtRatio ?? 9) < 0.7 ? (c.flags._surplus || 0) + 1 : 0;
  c.flags._miracle = e.growth > 0.05 ? (c.flags._miracle || 0) + 1 : Math.max(0, (c.flags._miracle || 0) - 1);
  if (c.gov.stability < 0.25) c.flags._lowStab = true;
  for (const a of ACHIEVEMENTS) {
    if (st.ach[a.id] !== undefined) continue;
    let ok = false;
    try {
      ok = a.test(Object.assign(st, { counters: st.counters }), c, sim);
    } catch {
      ok = false;
    }
    if (ok) {
      st.ach[a.id] = st.day;
      sim.log(st.playerId, 'achievement', `Achievement unlocked: ${a.name}`, { id: a.id }, 'high');
      sim.emit('achievement', a);
    }
  }
}
export function bump(sim, key, n = 1) {
  const st = sim.state;
  st.counters = st.counters || {};
  st.counters[key] = (st.counters[key] || 0) + n;
}
