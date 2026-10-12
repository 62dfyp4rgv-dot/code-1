// Data pack loader. `readText(name)` is injected (fs in Node, fetch in browser) so the sim is environment-agnostic.
export function parseCSV(text) {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'));
  const head = lines[0].split(',');
  return lines.slice(1).map((l) => {
    const cells = l.split(',');
    const o = {};
    head.forEach((h, i) => {
      const v = cells[i] ?? '';
      o[h] = v !== '' && !Number.isNaN(Number(v)) && !/^(iso3|name|capital|region|gov|parent)$/.test(h) ? Number(v) : v;
    });
    return o;
  });
}
function parseTechs(text) {
  return text
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => {
      const [id, branch, name, tier, cost, devReq, req, fx] = l.split('|');
      return {
        id,
        branch,
        name,
        tier: +tier,
        cost: +cost,
        devReq: +devReq,
        req: req ? req.split(',') : [],
        effects: fx
          ? fx.split(',').map((p) => {
              const [k, v] = p.split(':');
              return { k, v: +v };
            })
          : [],
      };
    });
}
export async function loadData(readText) {
  const json = async (n) => JSON.parse(await readText(n));
  const [countries, resources, cities, map, econ, orgs, geo, choke, policies, scen, techs, events, projects, mandates] = await Promise.all([
    readText('countries.csv'),
    readText('resources.csv'),
    readText('cities.csv'),
    json('map.json'),
    json('econ_profiles.json'),
    json('orgs.json'),
    json('geopolitics.json'),
    json('chokepoints.json'),
    json('policies.json'),
    json('scenarios.json'),
    readText('techs.psv'),
    json('events.json'),
    json('projects.json'),
    json('mandates.json'),
  ]);
  const data = {
    countries: parseCSV(countries),
    resources: Object.fromEntries(parseCSV(resources).map((r) => [r.iso3, r])),
    cities: parseCSV(cities),
    map,
    econProfiles: econ,
    orgs: orgs.orgs,
    defensePacts: orgs.defensePacts,
    guarantees: orgs.guarantees || [],
    rivalries: geo.rivalries,
    claims: geo.claims,
    chokepoints: choke.chokepoints,
    policies,
    scenarios: scen.scenarios,
    difficulty: scen.difficulty,
    techs: parseTechs(techs),
    events: events.events,
    eventMeta: events.meta || {},
    projects: projects.projects,
    mandates: mandates.mandates,
  };
  data.techById = Object.fromEntries(data.techs.map((t) => [t.id, t]));
  data.scenarioById = Object.fromEntries(data.scenarios.map((s) => [s.id, s]));
  return data;
}
// Node convenience
export async function loadDataNode() {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const url = await import('node:url');
  const dir = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../data');
  return loadData((n) => fs.readFile(path.join(dir, n), 'utf8'));
}
