// Static geography derived from the map data pack + country table. Nothing here is saved; it is rebuilt on load.
import { W, H, cellX, cellY, haversineKm, rleDecode } from './geo.js';
import { TERRAIN } from './constants.js';

const MOVE_KM_DAY = 40; // nominal travel scale used for supply/route costs

export function buildGeography(data) {
  const map = data.map;
  // ---- sim countries (territories folded into parents) ----
  const rows = data.countries;
  const sovereign = rows.filter((r) => !r.parent);
  const idOf = {};
  sovereign.forEach((r, i) => {
    idOf[r.iso3] = i;
  });
  const mapCountryToSim = new Int16Array(map.countries.length).fill(-1);
  const rowByNum = new Map();
  const rowBySpecial = new Map();
  for (const r of rows) {
    if (r.num) rowByNum.set(r.num, r);
    else rowBySpecial.set(r.iso3, r);
  }
  map.countries.forEach((mc, k) => {
    const r = mc.num ? rowByNum.get(mc.num) : rowBySpecial.get(mc.special);
    if (!r) return;
    const owner = r.parent ? r.parent : r.iso3;
    mapCountryToSim[k] = idOf[owner];
  });
  const N = sovereign.length;
  const regions = map.regions.map((r, i) => ({
    idx: i,
    id: r.id,
    mapCountry: r.c,
    owner0: mapCountryToSim[r.c],
    lat: r.lat,
    lon: r.lon,
    area: r.area,
    cells: r.n,
    terrain: r.terrain,
    mix: r.mix,
    adj: [],
    coast: [],
    cities: [],
    cityPop: 0,
    port: 0,
    popW: 0,
    farm: 0,
    isTerritory: false,
  }));
  for (const [a, b, border, gap] of map.adj) {
    regions[a - 1].adj.push({ to: b - 1, border, strait: gap > 0, gap });
    regions[b - 1].adj.push({ to: a - 1, border, strait: gap > 0, gap });
  }
  for (const [r, s, n] of map.coast) regions[r - 1].coast.push({ sea: s - 1, n });
  for (const r of regions) {
    r.farm = r.area * Object.entries(r.mix).reduce((s, [t, f]) => s + f * (TERRAIN[t]?.farm ?? 0.3), 0);
  }
  const rasterRegion = rleDecode(map.rasterRegion, Uint16Array);
  const rasterSea = rleDecode(map.rasterSea, Uint8Array);
  const regionAt = (lon, lat) => {
    const x = cellX(lon),
      y = cellY(lat);
    const v = rasterRegion[y * W + x];
    if (v) return v - 1;
    // search nearby (capitals/cities on coarse coast)
    for (let rad = 1; rad <= 3; rad++)
      for (let dy = -rad; dy <= rad; dy++)
        for (let dx = -rad; dx <= rad; dx++) {
          const nx = x + dx,
            ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const w = rasterRegion[ny * W + nx];
          if (w) return w - 1;
        }
    return -1;
  };
  // country -> regions
  const cRegions = Array.from({ length: N }, () => []);
  regions.forEach((r) => {
    if (r.owner0 >= 0) cRegions[r.owner0].push(r.idx);
  });
  // ---- capitals, cities ----
  const capitalRegion = new Int16Array(N).fill(-1);
  sovereign.forEach((r, i) => {
    let rg = regionAt(r.lon, r.lat);
    if (rg < 0 || regions[rg].owner0 !== i) {
      // snap to the region of this country nearest the capital
      let best = -1,
        bd = Infinity;
      for (const ri of cRegions[i]) {
        const d = haversineKm(r.lat, r.lon, regions[ri].lat, regions[ri].lon);
        if (d < bd) {
          bd = d;
          best = ri;
        }
      }
      rg = best;
    }
    capitalRegion[i] = rg;
  });
  const cities = [];
  for (const c of data.cities) {
    const i = idOf[c.iso3];
    if (i === undefined) continue;
    let rg = regionAt(c.lon, c.lat);
    if (rg < 0 || regions[rg].owner0 !== i) rg = capitalRegion[i];
    const city = { name: c.name, country: i, region: rg, lat: c.lat, lon: c.lon, pop: c.pop_m, port: !!c.port };
    cities.push(city);
    regions[rg].cities.push(cities.length - 1);
    regions[rg].cityPop += c.pop_m;
    if (c.port) regions[rg].port += c.pop_m;
  }
  // coastal regions without a listed port get a minor port
  for (const r of regions) if (r.coast.length && r.port === 0 && r.owner0 >= 0) r.port = 0.3;
  // population weight within a country: area share (damped) + city share
  for (let i = 0; i < N; i++) {
    const rs = cRegions[i].map((k) => regions[k]);
    const totA = rs.reduce((s, r) => s + Math.sqrt(r.area), 0) || 1;
    const totC = rs.reduce((s, r) => s + r.cityPop, 0);
    for (const r of rs)
      r.popW = (0.5 * Math.sqrt(r.area)) / totA + (totC > 0 ? (0.5 * r.cityPop) / totC : (0.5 * Math.sqrt(r.area)) / totA);
    const sum = rs.reduce((s, r) => s + r.popW, 0) || 1;
    for (const r of rs) r.popW /= sum;
  }
  // ---- country adjacency (land + strait) and capital distances ----
  const neighbors = Array.from({ length: N }, () => new Set());
  const landNeighbors = Array.from({ length: N }, () => new Set());
  for (const r of regions)
    for (const a of r.adj) {
      const o1 = r.owner0,
        o2 = regions[a.to].owner0;
      if (o1 >= 0 && o2 >= 0 && o1 !== o2) {
        neighbors[o1].add(o2);
        if (!a.strait) landNeighbors[o1].add(o2);
      }
    }
  const dist = new Float32Array(N * N);
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      const ri = regions[capitalRegion[i]],
        rj = regions[capitalRegion[j]];
      dist[i * N + j] = i === j ? 0 : haversineKm(ri.lat, ri.lon, rj.lat, rj.lon);
    }
  const coastal = sovereign.map((_, i) => cRegions[i].some((k) => regions[k].coast.length > 0));
  const seas = map.seas.map((s, i) => ({ idx: i, name: s.name, lat: s.lat, lon: s.lon, area: s.area, adj: [], coastRegions: [] }));
  for (const [a, b] of map.seaLinks) {
    seas[a - 1].adj.push(b - 1);
    seas[b - 1].adj.push(a - 1);
  }
  for (const r of regions) for (const c of r.coast) seas[c.sea].coastRegions.push(r.idx);
  const seaByName = Object.fromEntries(seas.map((s) => [s.name, s.idx]));
  return {
    N,
    rows: sovereign,
    idOf,
    regions,
    cRegions,
    capitalRegion,
    cities,
    neighbors,
    landNeighbors,
    dist,
    coastal,
    seas,
    seaByName,
    rasterRegion,
    rasterSea,
    regionAt,
    mapCountries: map.countries,
    MOVE_KM_DAY,
    regionDistance: (a, b) => haversineKm(regions[a].lat, regions[a].lon, regions[b].lat, regions[b].lon),
  };
}
