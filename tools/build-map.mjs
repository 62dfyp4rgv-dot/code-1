// Builds app/data/map.json from Natural Earth derived `world-atlas` (ISC license; Natural Earth is public domain).
// Produces: country polygons (render), 0.5-degree raster of strategic regions and sea zones, region/sea graphs.
// Terrain is HAND-AUTHORED APPROXIMATION (see TERRAIN_BOXES), not surveyed data.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W, H, CELL, LAT_TOP, cellLon, cellLat, cellAreaKm2, haversineKm, rleEncode } from '../app/js/sim/geo.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const topo = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/world-atlas/countries-110m.json'), 'utf8'));

// ---------- decode topojson ----------
const { scale, translate } = topo.transform;
const arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * scale[0] + translate[0], y * scale[1] + translate[1]]; });
});
function ring(indices) {
  const pts = [];
  for (const i of indices) {
    const a = i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
    for (let k = pts.length ? 1 : 0; k < a.length; k++) pts.push(a[k]);
  }
  return pts;
}
function geomPolys(g) {
  if (g.type === 'Polygon') return [g.arcs.map(ring)];
  if (g.type === 'MultiPolygon') return g.arcs.map((p) => p.map(ring));
  return [];
}
const geoms = topo.objects.countries.geometries.filter((g) => g.properties.name !== 'Antarctica' && g.properties.name !== 'Fr. S. Antarctic Lands');
const NAME_FIX = { 'N. Cyprus': 'CYN', Somaliland: 'SOL', Kosovo: 'XKX' };
const countries = geoms.map((g, i) => ({ idx: i, num: g.id ? Number(g.id) : null, name: g.properties.name, special: NAME_FIX[g.properties.name] || null, polys: geomPolys(g) }));

// ---------- rasterize countries (scanline even-odd) ----------
const cellCountry = new Uint16Array(W * H); // countryIdx+1
// Rings that cross the antimeridian are unwrapped to continuous longitudes, then rasterized at -360/0/+360 offsets.
function unwrap(r) {
  const out = [r[0].slice()];
  for (let k = 1; k < r.length; k++) {
    let lon = r[k][0]; const prev = out[k - 1][0];
    while (lon - prev > 180) lon -= 360;
    while (lon - prev < -180) lon += 360;
    out.push([lon, r[k][1]]);
  }
  return out;
}
for (const c of countries) {
  for (const poly of c.polys) {
    const rings = poly.map(unwrap);
    for (const off of [-360, 0, 360]) {
      const edges = [];
      for (const r of rings) for (let k = 0; k < r.length - 1; k++) edges.push([[r[k][0] + off, r[k][1]], [r[k + 1][0] + off, r[k + 1][1]]]);
      let minLat = 90, maxLat = -90;
      for (const [a, b] of edges) { minLat = Math.min(minLat, a[1], b[1]); maxLat = Math.max(maxLat, a[1], b[1]); }
      for (let y = 0; y < H; y++) {
        const lat = cellLat(y);
        if (lat < minLat || lat > maxLat) continue;
        const xs = [];
        for (const [a, b] of edges) {
          if ((a[1] <= lat && b[1] > lat) || (b[1] <= lat && a[1] > lat)) xs.push(a[0] + ((lat - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
        }
        xs.sort((p, q) => p - q);
        for (let k = 0; k + 1 < xs.length; k += 2) {
          const x0 = Math.ceil((xs[k] + 180) / CELL - 0.5);
          const x1 = Math.floor((xs[k + 1] + 180) / CELL - 0.5);
          for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) cellCountry[y * W + x] = c.idx + 1;
        }
      }
    }
  }
}
// countries with no cells: claim the cell nearest their centroid if unclaimed (tiny states at 110m)
const counts = new Int32Array(countries.length + 1);
for (const v of cellCountry) counts[v]++;
for (const c of countries) {
  if (counts[c.idx + 1] > 0) continue;
  let sx = 0, sy = 0, n = 0;
  for (const poly of c.polys) for (const [lon, lat] of poly[0]) { sx += lon; sy += lat; n++; }
  const x = Math.min(W - 1, Math.floor((sx / n + 180) / CELL));
  const y = Math.min(H - 1, Math.floor((LAT_TOP - sy / n) / CELL));
  if (cellCountry[y * W + x] === 0) { cellCountry[y * W + x] = c.idx + 1; counts[c.idx + 1] = 1; }
}
const missing = countries.filter((c) => counts[c.idx + 1] === 0).map((c) => c.name);

// ---------- terrain (hand-authored approximation) ----------
// [latMin, latMax, lonMin, lonMax, type]; later entries override earlier ones.
const TERRAIN_BOXES = [
  [45, 56, 8, 40, 'forest'], [50, 66, 60, 140, 'forest'], [48, 60, -130, -60, 'forest'], [30, 45, -95, -70, 'forest'], [40, 47, 128, 145, 'forest'],
  [-45, -35, -75, -70, 'forest'], [-40, -30, 145, 152, 'forest'],
  [44, 54, 28, 48, 'plains'], [35, 50, -105, -95, 'plains'], [-40, -30, -65, -58, 'plains'], [32, 42, 110, 120, 'plains'], [24, 30, 76, 90, 'plains'],
  [-10, 4, -75, -50, 'jungle'], [-5, 5, 10, 28, 'jungle'], [10, 22, 97, 108, 'jungle'], [-10, 8, 95, 150, 'jungle'], [8, 18, -93, -77, 'jungle'],
  [4, 8, -12, 10, 'jungle'], [-25, -12, 47, 50, 'jungle'], [8, 22, 76, 80, 'jungle'],
  [15, 32, -17, 35, 'desert'], [16, 30, 35, 58, 'desert'], [36, 46, 80, 112, 'desert'], [-31, -20, 118, 140, 'desert'], [-28, -18, 12, 24, 'desert'],
  [27, 35, 52, 62, 'desert'], [24, 29, 69, 74, 'desert'], [36, 45, 54, 66, 'desert'], [30, 37, -118, -106, 'desert'], [4, 12, 40, 50, 'desert'],
  [-28, -18, -71, -68, 'desert'], [20, 30, -112, -100, 'desert'],
  [27, 37, 70, 100, 'mountain'], [36, 44, 66, 82, 'mountain'], [32, 37, 60, 70, 'mountain'], [-55, 10, -80, -66, 'mountain'], [32, 60, -125, -105, 'mountain'],
  [44, 48, 5, 16, 'mountain'], [41, 44, 38, 48, 'mountain'], [45, 49, 20, 26, 'mountain'], [42, 43.5, -2, 3, 'mountain'], [50, 68, 58, 62, 'mountain'],
  [36, 40, 38, 46, 'mountain'], [6, 14, 36, 42, 'mountain'], [30, 36, -8, 10, 'mountain'], [35, 45, -84, -70, 'mountain'], [60, 68, 6, 16, 'mountain'],
  [48, 54, 84, 100, 'mountain'], [22, 30, 100, 108, 'mountain'], [42, 46, 14, 22, 'mountain'], [-5, 5, 28, 36, 'mountain'], [35, 40, 138, 142, 'mountain'],
  [-45, -40, 168, 175, 'mountain'], [34, 38, 44, 52, 'mountain'], [-20, -10, 30, 40, 'plains'],
];
function terrainAt(lat, lon) {
  let t = Math.abs(lat) >= 66 ? 'arctic' : Math.abs(lat) >= 50 ? 'forest' : 'plains';
  for (const [a, b, c, d, type] of TERRAIN_BOXES) if (lat >= a && lat <= b && lon >= c && lon <= d) t = type;
  return t;
}

// ---------- strategic regions via k-means per country component ----------
const cellRegion = new Uint16Array(W * H); // regionId (1-based)
const regions = [];
const dist2 = (lat1, lon1, lat2, lon2) => { const dx = (lon1 - lon2) * Math.cos((lat1 * Math.PI) / 180); const dy = lat1 - lat2; return dx * dx + dy * dy; };
function components(cells) {
  const set = new Set(cells); const seen = new Set(); const out = [];
  for (const s of cells) {
    if (seen.has(s)) continue;
    const comp = []; const q = [s]; seen.add(s);
    while (q.length) {
      const cur = q.pop(); comp.push(cur);
      const cx = cur % W, cy = (cur / W) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const ni = ny * W + nx;
        if (set.has(ni) && !seen.has(ni)) { seen.add(ni); q.push(ni); }
      }
    }
    out.push(comp);
  }
  return out.sort((a, b) => b.length - a.length);
}
function kmeans(cells, k) {
  const pts = cells.map((i) => [cellLat((i / W) | 0), cellLon(i % W)]);
  if (k <= 1) return new Array(cells.length).fill(0);
  let mlat = 0, mlon = 0; for (const p of pts) { mlat += p[0]; mlon += p[1]; }
  mlat /= pts.length; mlon /= pts.length;
  let best = 0, bd = Infinity; pts.forEach((p, i) => { const d = dist2(p[0], p[1], mlat, mlon); if (d < bd) { bd = d; best = i; } });
  const seeds = [pts[best]];
  const md = pts.map((p) => dist2(p[0], p[1], seeds[0][0], seeds[0][1]));
  while (seeds.length < k) {
    let bi = 0, bv = -1; md.forEach((v, i) => { if (v > bv) { bv = v; bi = i; } });
    if (bv <= 0) break;
    seeds.push(pts[bi]);
    pts.forEach((p, i) => { md[i] = Math.min(md[i], dist2(p[0], p[1], pts[bi][0], pts[bi][1])); });
  }
  let assign = new Array(pts.length).fill(0);
  for (let it = 0; it < 12; it++) {
    for (let i = 0; i < pts.length; i++) {
      let bj = 0, bv = Infinity;
      for (let j = 0; j < seeds.length; j++) { const d = dist2(pts[i][0], pts[i][1], seeds[j][0], seeds[j][1]); if (d < bv) { bv = d; bj = j; } }
      assign[i] = bj;
    }
    const sums = seeds.map(() => [0, 0, 0]);
    for (let i = 0; i < pts.length; i++) { const s = sums[assign[i]]; s[0] += pts[i][0]; s[1] += pts[i][1]; s[2]++; }
    sums.forEach((s, j) => { if (s[2]) seeds[j] = [s[0] / s[2], s[1] / s[2]]; });
  }
  return assign;
}
for (const c of countries) {
  const cells = [];
  for (let i = 0; i < cellCountry.length; i++) if (cellCountry[i] === c.idx + 1) cells.push(i);
  c.cells = cells.length;
  c.areaKm2 = Math.round(cells.reduce((s, i) => s + cellAreaKm2(cellLat((i / W) | 0)), 0));
  if (!cells.length) continue;
  const comps = components(cells);
  const effA = cells.reduce((s, i) => s + Math.cos((cellLat((i / W) | 0) * Math.PI) / 180), 0);
  const kTotal = Math.max(1, Math.min(22, Math.round(Math.sqrt(effA) / 4.2)));
  const small = [];
  const countryRegions = [];
  comps.forEach((comp, ci) => {
    if (comp.length < 3 && ci > 0) { small.push(comp); return; }
    const compA = comp.reduce((s, i) => s + Math.cos((cellLat((i / W) | 0) * Math.PI) / 180), 0);
    const k = Math.max(1, Math.round((kTotal * compA) / effA));
    const assign = kmeans(comp, Math.min(k, comp.length));
    const groups = new Map();
    comp.forEach((cell, n) => { if (!groups.has(assign[n])) groups.set(assign[n], []); groups.get(assign[n]).push(cell); });
    for (const g of groups.values()) {
      const id = regions.length + 1;
      for (const cell of g) cellRegion[cell] = id;
      const r = { id, country: c.idx, cells: g };
      regions.push(r); countryRegions.push(r);
    }
  });
  for (const comp of small) { // attach tiny islands to the nearest region of the same country
    let bestR = null, bd = Infinity;
    const [la, lo] = [cellLat((comp[0] / W) | 0), cellLon(comp[0] % W)];
    for (const r of countryRegions) { const d = haversineKm(la, lo, cellLat((r.cells[0] / W) | 0), cellLon(r.cells[0] % W)); if (d < bd) { bd = d; bestR = r; } }
    for (const cell of comp) { cellRegion[cell] = bestR.id; bestR.cells.push(cell); }
  }
}
for (const r of regions) {
  let sa = 0, so = 0, area = 0; const tc = {};
  for (const cell of r.cells) {
    const la = cellLat((cell / W) | 0), lo = cellLon(cell % W), a = cellAreaKm2(la);
    sa += la * a; so += lo * a; area += a;
    const t = terrainAt(la, lo); tc[t] = (tc[t] || 0) + 1;
  }
  r.lat = +(sa / area).toFixed(2); r.lon = +(so / area).toFixed(2); r.area = Math.round(area);
  r.terrain = Object.entries(tc).sort((a, b) => b[1] - a[1])[0][0];
  r.terrainMix = Object.fromEntries(Object.entries(tc).map(([k, v]) => [k, +(v / r.cells.length).toFixed(2)]));
  r.n = r.cells.length; delete r.cells;
}

// ---------- sea zones: geodesic Voronoi flood-fill from named seeds ----------
const SEAS = [
  ['North Atlantic', 45, -35], ['Norwegian Sea', 68, 0], ['North Sea', 56, 3], ['Baltic Sea', 58, 19], ['Western Mediterranean', 38, 3], ['Eastern Mediterranean', 34, 25],
  ['Black Sea', 43, 34], ['Red Sea', 20, 38], ['Arabian Sea', 15, 65], ['Persian Gulf', 27, 51], ['Bay of Bengal', 14, 88], ['Indian Ocean', -20, 75],
  ['South China Sea', 12, 114], ['East China Sea', 30, 125], ['Sea of Japan', 40, 134], ['Philippine Sea', 20, 135], ['North Pacific', 40, -160], ['Central Pacific', 5, -150],
  ['South Pacific', -30, -130], ['South Atlantic', -25, -15], ['Caribbean Sea', 15, -75], ['Gulf of Mexico', 25, -90], ['Hudson Bay', 60, -85], ['Arctic Ocean', 80, 0],
  ['Gulf of Guinea', 2, 0], ['Mozambique Channel', -18, 42], ['Tasman Sea', -38, 160], ['Coral Sea', -12, 150], ['Java Sea', -6, 115], ['Sea of Okhotsk', 55, 150],
  ['Bering Sea', 58, -175], ['Labrador Sea', 58, -52], ['Gulf of Alaska', 55, -145], ['Eastern Pacific', 10, -110], ['Humboldt Current', -25, -85], ['Caspian Sea', 42, 51],
  ['Western Pacific', 5, 160], ['Southern Indian Ocean', -45, 80], ['Southern Atlantic', -45, -20], ['Southern Pacific', -48, -140], ['Southwest Pacific', -45, -170],
  ['Canadian Arctic', 75, -100], ['Siberian Arctic', 76, 100], ['Greenland Sea', 72, -15], ['Bay of Biscay', 45, -6], ['Adriatic Sea', 42, 16], ['Aegean Sea', 38.5, 25],
  ['Timor Sea', -12, 126], ['Great Australian Bight', -36, 130], ['East Africa Coast', -5, 48], ['West Africa Coast', 15, -22], ['Sargasso Sea', 28, -55], ['Andaman Sea', 11, 96],
];
const seaOf = new Uint8Array(W * H);
const q = [];
SEAS.forEach(([, lat, lon], i) => {
  const x = Math.min(W - 1, Math.floor((lon + 180) / CELL)), y = Math.min(H - 1, Math.floor((LAT_TOP - lat) / CELL));
  let placed = false;
  for (let rad = 0; rad < 6 && !placed; rad++) for (let dy = -rad; dy <= rad && !placed; dy++) for (let dx = -rad; dx <= rad && !placed; dx++) {
    const nx = (x + dx + W) % W, ny = y + dy; if (ny < 0 || ny >= H) continue;
    const idx = ny * W + nx;
    if (cellCountry[idx] === 0 && seaOf[idx] === 0) { seaOf[idx] = i + 1; q.push(idx); placed = true; }
  }
  if (!placed) console.warn('sea seed on land:', SEAS[i][0]);
});
for (let h = 0; h < q.length; h++) {
  const cur = q[h], cx = cur % W, cy = (cur / W) | 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = (cx + dx + W) % W, ny = cy + dy; if (ny < 0 || ny >= H) continue;
    const ni = ny * W + nx;
    if (cellCountry[ni] === 0 && seaOf[ni] === 0) { seaOf[ni] = seaOf[cur]; q.push(ni); }
  }
}
const seas = SEAS.map(([name, lat, lon], i) => {
  let n = 0, area = 0; for (let k = 0; k < seaOf.length; k++) if (seaOf[k] === i + 1) { n++; area += cellAreaKm2(cellLat((k / W) | 0)); }
  return { id: i + 1, name, lat, lon, n, area: Math.round(area) };
});

// ---------- graphs ----------
const landAdj = new Map(); // "a-b" -> {border, strait}
const coastal = new Map(); // regionId -> Map(seaId -> count)
const seaAdj = new Map();
const bump = (m, k, f) => { const e = m.get(k) || { border: 0 }; f(e); m.set(k, e); };
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x, r = cellRegion[i], s = seaOf[i];
  for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
    const nx = x + dx, ny = y + dy; if (nx >= W || ny < 0 || ny >= H) continue;
    const j = ny * W + nx, r2 = cellRegion[j], s2 = seaOf[j];
    if (r && r2 && r !== r2) bump(landAdj, r < r2 ? `${r}-${r2}` : `${r2}-${r}`, (e) => { e.border += (dx && dy) ? 0.5 : 1; });
    if (s && s2 && s !== s2) bump(seaAdj, s < s2 ? `${s}-${s2}` : `${s2}-${s}`, (e) => { e.border++; });
    if (r && s2) { if (!coastal.has(r)) coastal.set(r, new Map()); coastal.get(r).set(s2, (coastal.get(r).get(s2) || 0) + 1); }
    if (r2 && s) { if (!coastal.has(r2)) coastal.set(r2, new Map()); coastal.get(r2).set(s, (coastal.get(r2).get(s) || 0) + 1); }
  }
}
// narrow-strait links: land cells within 4 cells (~220 km) across water in a different region, not already adjacent.
// Stored with the minimum gap (in cells); gap<=2 are short ferry/strait links, 3-4 need real sealift.
const R = 4;
const strait = new Map(); // key -> {n, gap}
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const r = cellRegion[y * W + x]; if (!r) continue;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const nx = x + dx, ny = y + dy; if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
    const gap = Math.max(Math.abs(dx), Math.abs(dy)); if (gap < 2) continue;
    const r2 = cellRegion[ny * W + nx]; if (!r2 || r2 === r) continue;
    const key = r < r2 ? `${r}-${r2}` : `${r2}-${r}`;
    if (landAdj.has(key)) continue;
    const e = strait.get(key) || { n: 0, gap: 99 }; e.n++; e.gap = Math.min(e.gap, gap); strait.set(key, e);
  }
}
const adj = [];
for (const [k, e] of landAdj) { const [a, b] = k.split('-').map(Number); if (e.border >= 1) adj.push([a, b, Math.round(e.border), 0]); }
for (const [k, e] of strait) { const [a, b] = k.split('-').map(Number); if (e.n >= 2) adj.push([a, b, e.n, e.gap]); }
const coast = [];
for (const [r, m] of coastal) for (const [s, n] of m) if (n >= 1) coast.push([r, s, n]);
const seaLinks = [...seaAdj].map(([k, e]) => { const [a, b] = k.split('-').map(Number); return [a, b, e.border]; });

// ---------- country render geometry (quantized 0.01 deg) + metadata ----------
const outCountries = countries.map((c) => {
  const nb = new Set();
  for (const [a, b] of adj) { const ra = regions[a - 1], rb = regions[b - 1]; if (ra.country === c.idx && rb.country !== c.idx) nb.add(rb.country); if (rb.country === c.idx && ra.country !== c.idx) nb.add(ra.country); }
  const rs = regions.filter((r) => r.country === c.idx).map((r) => r.id);
  const coastalCountry = coast.some(([r]) => rs.includes(r));
  return {
    idx: c.idx, num: c.num, name: c.name, special: c.special, area: c.areaKm2, cells: c.cells, regions: rs, coastal: coastalCountry, neighbors: [...nb],
    polys: c.polys.map((p) => p.map((r) => r.flatMap(([lo, la]) => [Math.round(lo * 100), Math.round(la * 100)]))),
  };
});

const out = {
  meta: { source: 'world-atlas 2.0.2 countries-110m (Natural Earth, public domain; ISC packaging)', grid: { W, H, CELL, LAT_TOP }, generator: 'tools/build-map.mjs', terrainNote: 'terrain hand-authored approximation' },
  countries: outCountries,
  regions: regions.map((r) => ({ id: r.id, c: r.country, lat: r.lat, lon: r.lon, area: r.area, n: r.n, terrain: r.terrain, mix: r.terrainMix })),
  seas, adj, coast, seaLinks,
  rasterRegion: rleEncode(cellRegion), rasterSea: rleEncode(seaOf),
};
fs.writeFileSync(path.join(root, 'app/data/map.json'), JSON.stringify(out));
const kb = (fs.statSync(path.join(root, 'app/data/map.json')).size / 1024).toFixed(0);
console.log(`countries=${outCountries.length} regions=${regions.length} seas=${seas.length} adj=${adj.length} coast=${coast.length} seaLinks=${seaLinks.length} size=${kb}KB`);
console.log('countries without cells:', missing.join(', ') || 'none');
console.log('landlocked-ish (no coast):', outCountries.filter((c) => !c.coastal).length);
