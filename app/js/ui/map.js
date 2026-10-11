// Touch-first world map: vector coastlines/borders + raster ownership layers, pinch/drag/double-tap, level-of-detail labels,
// force markers with fog-of-war, front lines, chokepoints, trade arcs and several data modes. No external libraries.
import { W, H, LAT_TOP, rleDecode } from '../sim/geo.js';

const RAD = Math.PI / 180;
const MODES = [
  { id: 'political', label: 'Political' },
  { id: 'relations', label: 'Relations' },
  { id: 'economy', label: 'Economy' },
  { id: 'stability', label: 'Stability' },
  { id: 'military', label: 'Military' },
  { id: 'resources', label: 'Resources' },
  { id: 'trade', label: 'Trade flows' },
];
export { MODES };
const PALETTE_DARK = ['#3f7fbf', '#5aa17a', '#b9863f', '#8a6bbf', '#bf5f6a', '#3fa3a3', '#a3b23f', '#c27a4f', '#6a8fd0', '#9a5f9a'];
const PALETTE_LIGHT = ['#7fb2e0', '#8fcaa0', '#e0b97a', '#b7a0e0', '#e09aa2', '#7fd0d0', '#d0da7a', '#e0a67f', '#a0bbf0', '#d09ad0'];

export class MapView {
  constructor(canvas, app) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.app = app;
    this.view = { s: 5, tx: 0, ty: 0 };
    this.dirty = true;
    this.mode = 'political';
    this.selected = -1;
    this.selectedRegion = -1;
    this.pick = null;
    this.pointers = new Map();
    this.vel = { x: 0, y: 0 };
    this.lastTap = 0;
    this.theme = 'dark';
    this.flow = 'oil';
    this.layers = {};
    this.bind();
  }
  // ---------------------------------------------------------------------------------------------- setup
  attach(sim) {
    this.sim = sim;
    const geo = sim.geo;
    this.rr = geo.rasterRegion;
    this.rs = geo.rasterSea;
    // Path2D per map country + union path for land clip
    this.land = new Path2D();
    this.paths = [];
    sim.data.map.countries.forEach((mc, k) => {
      const p = new Path2D();
      for (const poly of mc.polys)
        for (const ring of poly) {
          // rings that cross the antimeridian jump by 360 degrees: unwrap them and draw the copy shifted by ±360 as well
          const q = new Path2D();
          let off = 0,
            prev = 0,
            wrapped = false;
          for (let i = 0; i < ring.length; i += 2) {
            let x = ring[i] / 100 + 180;
            const y = LAT_TOP === 84 ? 84 - ring[i + 1] / 100 : 0;
            if (i > 0) {
              if (x + off - prev > 180) {
                off -= 360;
                wrapped = true;
              } else if (x + off - prev < -180) {
                off += 360;
                wrapped = true;
              }
            }
            x += off;
            prev = x;
            if (i === 0) q.moveTo(x, y);
            else q.lineTo(x, y);
          }
          q.closePath();
          p.addPath(q);
          if (wrapped) {
            p.addPath(q, new DOMMatrix().translate(360, 0));
            p.addPath(q, new DOMMatrix().translate(-360, 0));
          }
        }
      this.land.addPath(p);
      this.paths.push(p);
    });
    this.colorIdx = this.graphColor();
    this.labelPts = this.computeLabelPoints();
    this.buildBorderLayer();
    this.markDirty('all');
    this.resize();
  }
  graphColor() {
    // greedy colouring so neighbours get distinct hues
    const g = this.sim.geo,
      N = g.N,
      idx = new Int8Array(N).fill(-1);
    const order = [...Array(N).keys()].sort((a, b) => g.neighbors[b].size - g.neighbors[a].size);
    for (const i of order) {
      const used = new Set();
      for (const j of g.neighbors[i]) if (idx[j] >= 0) used.add(idx[j]);
      let c = 0;
      while (used.has(c)) c++;
      idx[i] = c % PALETTE_DARK.length;
    }
    return idx;
  }
  computeLabelPoints() {
    const g = this.sim.geo;
    const pts = [];
    for (let i = 0; i < g.N; i++) {
      let sx = 0,
        sy = 0,
        a = 0,
        cells = 0,
        minX = 1e9,
        maxX = -1e9,
        minY = 1e9,
        maxY = -1e9;
      for (const r of g.cRegions[i]) {
        const R = g.regions[r];
        cells += R.cells;
        sx += (R.lon + 180) * R.area;
        sy += (84 - R.lat) * R.area;
        a += R.area;
        minX = Math.min(minX, R.lon + 180);
        maxX = Math.max(maxX, R.lon + 180);
        minY = Math.min(minY, 84 - R.lat);
        maxY = Math.max(maxY, 84 - R.lat);
      }
      pts.push({ x: sx / a, y: sy / a, area: a, cells, w: Math.max(2, maxX - minX + 3), h: Math.max(1.5, maxY - minY + 2) });
    }
    return pts;
  }
  buildBorderLayer() {
    // region borders rendered once at 3x raster resolution
    const S = 3,
      cv = document.createElement('canvas');
    cv.width = W * S;
    cv.height = H * S;
    const c = cv.getContext('2d');
    c.strokeStyle = '#000';
    c.lineWidth = 1.2;
    c.lineCap = 'round';
    c.beginPath();
    const rr = this.rr;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const a = rr[y * W + x];
        if (!a) continue;
        if (x + 1 < W) {
          const b = rr[y * W + x + 1];
          if (b && b !== a) {
            c.moveTo((x + 1) * S, y * S);
            c.lineTo((x + 1) * S, (y + 1) * S);
          }
        }
        if (y + 1 < H) {
          const b = rr[(y + 1) * W + x];
          if (b && b !== a) {
            c.moveTo(x * S, (y + 1) * S);
            c.lineTo((x + 1) * S, (y + 1) * S);
          }
        }
      }
    c.stroke();
    this.layers.regionBorders = cv;
  }
  markDirty(what = 'view') {
    if (what === 'all' || what === 'colors') this.colorsDirty = true;
    this.dirty = true;
  }
  setMode(m, flow) {
    this.mode = m;
    if (flow) this.flow = flow;
    this.markDirty('colors');
  }
  setTheme(t) {
    this.theme = t;
    this.markDirty('colors');
  }
  // ---------------------------------------------------------------------------------------------- geometry
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.app.settings.lowPower ? 1.5 : 3);
    const r = this.cv.getBoundingClientRect();
    this.vw = r.width;
    this.vh = r.height;
    this.dpr = dpr;
    this.cv.width = Math.round(r.width * dpr);
    this.cv.height = Math.round(r.height * dpr);
    this.minS = Math.max(this.vw / 360, this.vh / 142) * 1.0;
    this.maxS = 90;
    if (!this.inited) {
      this.inited = true;
      this.view.s = Math.max(this.minS * 1.6, 8);
    }
    this.clampView();
    this.markDirty();
  }
  clampView() {
    const v = this.view;
    v.s = Math.min(this.maxS, Math.max(this.minS, v.s));
    const mw = 360 * v.s,
      mh = 142 * v.s;
    v.tx = mw <= this.vw ? (this.vw - mw) / 2 : Math.min(0, Math.max(this.vw - mw, v.tx));
    v.ty = mh <= this.vh ? (this.vh - mh) / 2 : Math.min(0, Math.max(this.vh - mh, v.ty));
  }
  toScreen(lon, lat) {
    const v = this.view;
    return [(lon + 180) * v.s + v.tx, (84 - lat) * v.s + v.ty];
  }
  toWorld(px, py) {
    const v = this.view;
    return [(px - v.tx) / v.s - 180, 84 - (py - v.ty) / v.s];
  }
  focus(lon, lat, scale, animate = true) {
    const target = { s: scale ?? this.view.s, tx: 0, ty: 0 };
    target.tx = this.vw / 2 - (lon + 180) * target.s;
    target.ty = this.vh * 0.32 - (84 - lat) * target.s;
    const save = this.view;
    this.view = target;
    this.clampView();
    const dest = { ...this.view };
    this.view = save;
    if (!animate || this.app.settings.reduceMotion) {
      this.view = dest;
      this.markDirty();
      return;
    }
    const from = { ...save };
    const t0 = performance.now();
    const dur = 450;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      this.view = { s: from.s + (dest.s - from.s) * e, tx: from.tx + (dest.tx - from.tx) * e, ty: from.ty + (dest.ty - from.ty) * e };
      this.markDirty();
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  focusCountry(i, scale) {
    const lp = this.labelPts[i];
    this.focus(lp.x - 180, 84 - lp.y, scale ?? Math.max(this.view.s, Math.min(40, 120 / Math.sqrt(Math.max(4, lp.w * lp.h))) * 1.2));
  }
  // ---------------------------------------------------------------------------------------------- input
  bind() {
    const cv = this.cv;
    cv.style.touchAction = 'none';
    const pos = (e) => {
      const r = cv.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId);
      const [x, y] = pos(e);
      this.pointers.set(e.pointerId, { x, y, sx: x, sy: y, t: performance.now(), moved: false });
      this.vel = { x: 0, y: 0 };
      this.pinch = null;
    });
    cv.addEventListener('pointermove', (e) => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      const [x, y] = pos(e);
      const dx = x - p.x,
        dy = y - p.y;
      p.x = x;
      p.y = y;
      if (Math.hypot(x - p.sx, y - p.sy) > 6) p.moved = true;
      if (this.pointers.size === 1) {
        if (p.moved) {
          this.view.tx += dx;
          this.view.ty += dy;
          this.vel = { x: dx, y: dy };
          this.clampView();
          this.markDirty();
        }
      } else if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y),
          cx = (a.x + b.x) / 2,
          cy = (a.y + b.y) / 2;
        if (this.pinch) {
          this.zoomAt(cx, cy, this.view.s * (d / this.pinch.d));
          this.view.tx += cx - this.pinch.cx;
          this.view.ty += cy - this.pinch.cy;
          this.clampView();
          this.markDirty();
        }
        this.pinch = { d, cx, cy };
        for (const q of this.pointers.values()) q.moved = true;
      }
    });
    const end = (e) => {
      const p = this.pointers.get(e.pointerId);
      this.pointers.delete(e.pointerId);
      if (!p) return;
      if (!p.moved && performance.now() - p.t < 450 && this.pointers.size === 0) this.tap(p.x, p.y);
      else if (this.pointers.size === 0 && !this.app.settings.reduceMotion && Math.abs(this.vel.x) + Math.abs(this.vel.y) > 2)
        this.inertia();
      this.pinch = null;
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const [x, y] = pos(e);
        this.zoomAt(x, y, this.view.s * Math.exp(-e.deltaY * 0.0015));
        this.clampView();
        this.markDirty();
      },
      { passive: false },
    );
  }
  zoomAt(px, py, s) {
    const v = this.view;
    s = Math.min(this.maxS, Math.max(this.minS, s));
    const wx = (px - v.tx) / v.s,
      wy = (py - v.ty) / v.s;
    v.s = s;
    v.tx = px - wx * s;
    v.ty = py - wy * s;
  }
  inertia() {
    const step = () => {
      if (this.pointers.size || Math.abs(this.vel.x) + Math.abs(this.vel.y) < 0.3) return;
      this.view.tx += this.vel.x;
      this.view.ty += this.vel.y;
      this.vel.x *= 0.92;
      this.vel.y *= 0.92;
      this.clampView();
      this.markDirty();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  tap(x, y) {
    const now = performance.now();
    if (now - this.lastTap < 320 && Math.hypot(x - (this.lastTapPos?.[0] ?? 0), y - (this.lastTapPos?.[1] ?? 0)) < 30) {
      this.zoomAt(x, y, this.view.s * 2);
      this.clampView();
      this.markDirty();
      this.lastTap = 0;
      return;
    }
    this.lastTap = now;
    this.lastTapPos = [x, y];
    const hit = this.hit(x, y);
    this.app.onMapTap(hit, [x, y]);
  }
  // returns { region, country, sea } nearest within a touch-sized radius
  hit(px, py) {
    const [lon, lat] = this.toWorld(px, py);
    const g = this.sim.geo;
    const rad = Math.ceil(14 / (this.view.s * 0.5)); // cells within ~14px
    const cx = Math.floor((lon + 180) / 0.5),
      cy = Math.floor((84 - lat) / 0.5);
    let best = -1,
      bd = 1e9;
    for (let dy = -rad; dy <= rad; dy++)
      for (let dx = -rad; dx <= rad; dx++) {
        const x = cx + dx,
          y = cy + dy;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const r = this.rr[y * W + x];
        if (!r) continue;
        const d = dx * dx + dy * dy;
        if (d < bd) {
          bd = d;
          best = r - 1;
        }
      }
    if (best >= 0) return { region: best, country: this.sim.state.reg.owner[best], ctrl: this.sim.state.reg.ctrl[best], lon, lat };
    const ci = Math.min(W - 1, Math.max(0, cx)),
      ri = Math.min(H - 1, Math.max(0, cy));
    const sea = this.rs[ri * W + ci];
    return { region: -1, country: -1, sea: sea ? sea - 1 : -1, lon, lat };
  }
  // ---------------------------------------------------------------------------------------------- colours
  countryColor(i) {
    const sim = this.sim,
      st = sim.state,
      c = st.countries[i],
      me = st.playerId,
      dark = this.theme === 'dark';
    const mix = (a, b, t) => a.map((x, k) => Math.round(x + (b[k] - x) * t));
    const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const css = (rgb) => `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    const m = this.mode;
    if (m === 'political') return hex((dark ? PALETTE_DARK : PALETTE_LIGHT)[this.colorIdx[i]]);
    const neutral = dark ? [60, 70, 90] : [215, 222, 235];
    if (m === 'relations') {
      if (i === me) return hex('#f2b441');
      if (sim.atWarWith(me, i)) return [196, 70, 70];
      const o = st.rel.op[i * sim.geo.N + me];
      const t = Math.max(-1, Math.min(1, o / 70));
      return t >= 0 ? mix(neutral, [64, 174, 120], t) : mix(neutral, [196, 90, 80], -t);
    }
    if (m === 'economy') {
      const t = Math.max(0, Math.min(1, (Math.log10((c.econ.gdp / c.pop.total) * 1000) - 2.3) / 2.4));
      return mix(dark ? [40, 60, 90] : [225, 232, 245], [80, 205, 190], t);
    }
    if (m === 'stability') {
      const t = c.gov.stability;
      return t >= 0.5 ? mix(neutral, [64, 174, 120], (t - 0.5) * 2) : mix([200, 80, 70], neutral, t * 2);
    }
    if (m === 'military') {
      const p = Math.log10(1 + sim.milPower(i));
      const t = Math.max(0, Math.min(1, p / 4.2));
      return mix(neutral, [233, 150, 60], t);
    }
    if (m === 'resources' || m === 'trade') {
      const k = { food: 0, oil: 1, gas: 2, minerals: 3 }[this.flow];
      const e = c.econ;
      const net = (e.exports[k] - e.imports[k]) / Math.max(1, e.gdp);
      const t = Math.max(-1, Math.min(1, net * 12));
      return t >= 0 ? mix(neutral, [233, 170, 60], t) : mix(neutral, [80, 140, 220], -t);
    }
    return neutral;
  }
  rebuildOwnerLayer() {
    const sim = this.sim,
      st = sim.state,
      N = sim.geo.N;
    const colors = [];
    for (let i = 0; i < N; i++) colors.push(this.countryColor(i));
    if (!this.layers.owner) {
      const cv = document.createElement('canvas');
      cv.width = W;
      cv.height = H;
      this.layers.owner = cv;
      this.layers.occ = document.createElement('canvas');
      this.layers.occ.width = W;
      this.layers.occ.height = H;
    }
    const mk = (cv, fn) => {
      const c = cv.getContext('2d');
      const img = c.createImageData(W, H);
      const buf = new Uint32Array(img.data.buffer);
      for (let k = 0; k < buf.length; k++) {
        const r = this.rr[k];
        if (!r) continue;
        const px = fn(r - 1);
        if (px) buf[k] = px;
      }
      c.putImageData(img, 0, 0);
    };
    const pack = (rgb, a = 255) => (a << 24) | (rgb[2] << 16) | (rgb[1] << 8) | rgb[0];
    mk(this.layers.owner, (r) => pack(colors[st.reg.owner[r]]));
    const t = (this.occTick = this.occTick || 0);
    mk(this.layers.occ, (r) => {
      const o = st.reg.owner[r],
        c = st.reg.ctrl[r];
      if (o === c) return 0;
      const rgb = colors[c];
      const dark = [(rgb[0] * 0.55) | 0, (rgb[1] * 0.55) | 0, (rgb[2] * 0.55) | 0];
      return pack(dark, 215);
    });
    this.colorsDirty = false;
    this.colorSnapshot = colors;
  }
  // ---------------------------------------------------------------------------------------------- draw
  render() {
    if (!this.dirty || !this.sim) return;
    this.dirty = false;
    if (this.colorsDirty) this.rebuildOwnerLayer();
    const ctx = this.ctx,
      v = this.view,
      dpr = this.dpr,
      dark = this.theme === 'dark',
      sim = this.sim,
      st = sim.state;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = dark ? '#0a1424' : '#cfe0f2';
    ctx.fillRect(0, 0, this.cv.width, this.cv.height);
    ctx.setTransform(dpr * v.s, 0, 0, dpr * v.s, dpr * v.tx, dpr * v.ty);
    // graticule
    ctx.strokeStyle = dark ? 'rgba(120,150,200,0.07)' : 'rgba(40,70,110,0.08)';
    ctx.lineWidth = 0.1;
    ctx.beginPath();
    for (let lon = -150; lon <= 180; lon += 30) {
      ctx.moveTo(lon + 180, 0);
      ctx.lineTo(lon + 180, 142);
    }
    for (let lat = -60; lat <= 80; lat += 20) {
      ctx.moveTo(0, 84 - lat);
      ctx.lineTo(360, 84 - lat);
    }
    ctx.stroke();
    // land fill: raster ownership clipped to vector coast
    ctx.save();
    ctx.clip(this.land);
    ctx.fillStyle = dark ? '#2a3550' : '#e4e9f2';
    ctx.fill(this.land);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';
    ctx.drawImage(this.layers.owner, 0, 0, 360, 142);
    ctx.globalAlpha = 1;
    ctx.drawImage(this.layers.occ, 0, 0, 360, 142);
    if (v.s > 6) {
      ctx.globalAlpha = Math.min(0.55, (v.s - 6) / 30);
      ctx.drawImage(this.layers.regionBorders, 0, 0, 360, 142);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // hatch for hostile (colour-independent cue) and country borders
    ctx.lineJoin = 'round';
    ctx.strokeStyle = dark ? 'rgba(10,16,28,0.8)' : 'rgba(30,40,60,0.55)';
    ctx.lineWidth = Math.max(0.05, 0.9 / v.s);
    for (const p of this.paths) ctx.stroke(p);
    // selected / player outline
    const me = st.playerId;
    const outline = (i, color, w) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = w / v.s;
      for (const r of sim.geo.cRegions[i]) {
        /* outline via owner raster is heavy; use label rect pulse instead */
      }
    };
    this.drawCountryOutlines(ctx, v);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawSeaLabels(ctx);
    this.drawFronts(ctx);
    if (this.mode === 'trade') this.drawFlows(ctx);
    this.drawChokepoints(ctx);
    this.drawLabels(ctx);
    this.drawCities(ctx);
    this.drawForces(ctx);
    this.drawPick(ctx);
  }
  drawCountryOutlines(ctx, v) {
    const g = this.sim.geo,
      st = this.sim.state;
    const me = st.playerId;
    const outlineIdx = (i) => {
      const set = new Set(g.cRegions[i]);
      return set;
    };
    const stroke = (i, col, w) => {
      // draw polygons of the map entities that originally belong to country i
      ctx.strokeStyle = col;
      ctx.lineWidth = w / v.s;
      for (let k = 0; k < this.paths.length; k++) if (this.sim.geo.mapCountries && this.mapOwner(k) === i) ctx.stroke(this.paths[k]);
    };
    stroke(me, '#f2b441', 2.2);
    if (this.selected >= 0 && this.selected !== me) stroke(this.selected, this.theme === 'dark' ? '#ffffff' : '#10203a', 2.4);
  }
  mapOwner(k) {
    if (!this._mo) {
      this._mo = this.sim.data.map.countries.map((mc) => {
        const r = mc.regions[0];
        return r === undefined ? -1 : this.sim.geo.regions[r - 1].owner0;
      });
    }
    return this._mo[k];
  }
  px(lonlat) {
    return this.toScreen(lonlat[0], lonlat[1]);
  }
  drawLabels(ctx) {
    const v = this.view,
      g = this.sim.geo,
      st = this.sim.state,
      dark = this.theme === 'dark';
    const order =
      this.labelOrder ||
      (this.labelOrder = this.labelPts
        .map((p, i) => [i, p.area])
        .sort((a, b) => b[1] - a[1])
        .map((x) => x[0]));
    const placed = [];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const scale = this.app.settings.textScale || 1;
    for (const i of order) {
      const lp = this.labelPts[i];
      const sx = lp.x * v.s + v.tx,
        sy = lp.y * v.s + v.ty;
      if (sx < -80 || sy < -30 || sx > this.vw + 80 || sy > this.vh + 30) continue;
      const wpx = lp.w * v.s,
        hpx = lp.h * v.s;
      const bodyPx = Math.sqrt(lp.cells * 0.25) * v.s;
      const fs = Math.max(9, Math.min(17, bodyPx * 0.2)) * scale;
      if (bodyPx < 15) continue;
      const name = st.countries[i].name;
      ctx.font = `600 ${fs}px -apple-system, system-ui, sans-serif`;
      const tw = ctx.measureText(name).width;
      if (tw > bodyPx * 1.9 && v.s < 25) {
        const short = st.countries[i].id;
        if (ctx.measureText(short).width > bodyPx * 1.4) continue;
        this.placeLabel(ctx, short, sx, sy, fs, placed, dark);
        continue;
      }
      this.placeLabel(ctx, name, sx, sy, fs, placed, dark, i === st.playerId);
    }
  }
  placeLabel(ctx, text, x, y, fs, placed, dark, me) {
    const w = ctx.measureText(text).width + 4,
      h = fs + 2;
    const r = [x - w / 2, y - h / 2, x + w / 2, y + h / 2];
    for (const p of placed) if (r[0] < p[2] && r[2] > p[0] && r[1] < p[3] && r[3] > p[1]) return;
    placed.push(r);
    ctx.lineWidth = 3;
    ctx.strokeStyle = dark ? 'rgba(8,14,26,0.85)' : 'rgba(255,255,255,0.9)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = me ? '#f2b441' : dark ? '#e8eefc' : '#10203a';
    ctx.fillText(text, x, y);
  }
  drawCities(ctx) {
    const v = this.view;
    if (v.s < 14) return;
    const g = this.sim.geo,
      dark = this.theme === 'dark';
    ctx.font = '500 11px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const min = v.s > 30 ? 0 : v.s > 22 ? 2.5 : 5;
    for (const c of g.cities) {
      if (c.pop < min) continue;
      const [x, y] = this.toScreen(c.lon, c.lat);
      if (x < -20 || y < -20 || x > this.vw + 20 || y > this.vh + 20) continue;
      ctx.fillStyle = dark ? '#fff' : '#10203a';
      ctx.beginPath();
      ctx.arc(x, y, c.pop > 10 ? 3 : 2.2, 0, 6.3);
      ctx.fill();
      if (v.s > 18) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = dark ? 'rgba(8,14,26,.8)' : 'rgba(255,255,255,.85)';
        ctx.strokeText(c.name, x + 5, y);
        ctx.fillText(c.name, x + 5, y);
      }
    }
  }
  drawSeaLabels(ctx) {
    const v = this.view;
    if (v.s > 14) return;
    ctx.font = 'italic 500 10px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.theme === 'dark' ? 'rgba(150,180,230,0.45)' : 'rgba(40,80,130,0.5)';
    for (const s of this.sim.geo.seas) {
      if (s.area < 4e6) continue;
      const [x, y] = this.toScreen(s.lon, s.lat);
      if (x < 0 || y < 0 || x > this.vw || y > this.vh) continue;
      ctx.fillText(s.name, x, y);
    }
  }
  visibleRegions() {
    // fog of war: own/allied territory, regions adjacent to them, and countries covered by a strong intel network
    const st = this.sim.state,
      me = st.playerId,
      g = this.sim.geo;
    if (this._visDay === st.day && this._vis) return this._vis;
    const vis = new Uint8Array(g.regions.length);
    const friendly = this.sim.alliesOf(me);
    friendly.add(me);
    const mark = (r) => {
      vis[r] = 1;
      for (const a of g.regions[r].adj) vis[a.to] = 1;
    };
    for (let r = 0; r < vis.length; r++) {
      if (friendly.has(st.reg.ctrl[r]) || friendly.has(st.reg.owner[r])) mark(r);
    }
    for (const f of this.sim.forcesOf[me]) if (f.branch !== 'sea') mark(f.loc);
    for (let r = 0; r < vis.length; r++) {
      const o = st.reg.ctrl[r];
      if (this.sim.netLevelOf(me, o) >= 40) vis[r] = 1;
    }
    this._vis = vis;
    this._visDay = st.day;
    return vis;
  }
  drawForces(ctx) {
    const v = this.view;
    if (v.s < 9) return;
    const g = this.sim.geo,
      st = this.sim.state,
      me = st.playerId,
      vis = this.visibleRegions();
    const byLoc = new Map();
    for (const f of st.forces) {
      if (f.branch === 'sea') {
        const s = g.seas[f.loc];
        if (!s) continue;
        const k = 's' + f.loc;
        if (!byLoc.has(k)) byLoc.set(k, { x: s.lon, y: s.lat, list: [] });
        byLoc.get(k).list.push(f);
        continue;
      }
      if (!vis[f.loc] && f.owner !== me) continue;
      const k = 'r' + f.loc;
      if (!byLoc.has(k)) byLoc.set(k, { x: g.regions[f.loc].lon, y: g.regions[f.loc].lat, list: [] });
      byLoc.get(k).list.push(f);
    }
    ctx.font = '700 10px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const inWar = (o) => this.sim.atWarWith(me, o);
    for (const grp of byLoc.values()) {
      const [x, y] = this.toScreen(grp.x, grp.y);
      if (x < -20 || y < -20 || x > this.vw + 20 || y > this.vh + 20) continue;
      const owners = [...new Set(grp.list.map((f) => f.owner))];
      owners.forEach((o, k) => {
        const fl = grp.list.filter((f) => f.owner === o);
        const land = fl.filter((f) => f.branch === 'land').length,
          air = fl.filter((f) => f.branch === 'air').length,
          sea = fl.filter((f) => f.branch === 'sea').length;
        const ox = x + (k - (owners.length - 1) / 2) * 22,
          hostile = inWar(o) || (o !== me && false);
        const col = o === me ? '#f2b441' : hostile ? '#e05a5a' : this.sim.alliesOf(me).has(o) ? '#52c28a' : '#9aa7c2';
        ctx.fillStyle = 'rgba(8,14,26,0.82)';
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.6;
        const w = 20,
          h = 14;
        ctx.beginPath();
        ctx.roundRect(ox - w / 2, y - h / 2, w, h, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.fillText(String(land || sea || air) + (land ? '' : sea ? '⚓' : '✈'), ox, y + 0.5);
        if (hostile) {
          ctx.strokeStyle = col;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(ox - w / 2, y + h / 2 + 2);
          ctx.lineTo(ox + w / 2, y + h / 2 + 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    }
  }
  drawFronts(ctx) {
    const v = this.view;
    if (v.s < 5) return;
    const g = this.sim.geo,
      st = this.sim.state;
    const reg = st.reg;
    if (!st.wars.some((w) => w.active)) return;
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(224,90,90,0.9)';
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    for (let r = 0; r < g.regions.length; r++) {
      for (const a of g.regions[r].adj) {
        if (a.to < r || a.strait) continue;
        const c1 = reg.ctrl[r],
          c2 = reg.ctrl[a.to];
        if (c1 === c2 || !this.sim.atWarWith(c1, c2)) continue;
        const [x1, y1] = this.toScreen(g.regions[r].lon, g.regions[r].lat),
          [x2, y2] = this.toScreen(g.regions[a.to].lon, g.regions[a.to].lat);
        const mx = (x1 + x2) / 2,
          my = (y1 + y2) / 2;
        const dx = y2 - y1,
          dy = x1 - x2,
          l = Math.hypot(dx, dy) || 1;
        ctx.moveTo(mx - (dx / l) * 14, my - (dy / l) * 14);
        ctx.lineTo(mx + (dx / l) * 14, my + (dy / l) * 14);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
    // attack orders of the player
    const me = st.playerId;
    ctx.strokeStyle = '#f2b441';
    ctx.lineWidth = 2.2;
    ctx.fillStyle = '#f2b441';
    for (const f of this.sim.forcesOf[me])
      if (f.order.kind === 'attack' && f.order.target >= 0) {
        const [x1, y1] = this.toScreen(g.regions[f.loc].lon, g.regions[f.loc].lat),
          [x2, y2] = this.toScreen(g.regions[f.order.target].lon, g.regions[f.order.target].lat);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        const a = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 9 * Math.cos(a - 0.4), y2 - 9 * Math.sin(a - 0.4));
        ctx.lineTo(x2 - 9 * Math.cos(a + 0.4), y2 - 9 * Math.sin(a + 0.4));
        ctx.fill();
      }
  }
  drawFlows(ctx) {
    const k = { food: 0, oil: 1, gas: 2, minerals: 3 }[this.flow];
    const fl = (this.sim.lastFlows[k] || [])
      .slice()
      .sort((a, b) => b[2] - a[2])
      .slice(0, 36);
    if (!fl.length) return;
    const g = this.sim.geo;
    const max = fl[0][2];
    ctx.lineCap = 'round';
    for (const [i, j, q] of fl) {
      const a = g.regions[g.capitalRegion[j]],
        b = g.regions[g.capitalRegion[i]];
      const [x1, y1] = this.toScreen(a.lon, a.lat),
        [x2, y2] = this.toScreen(b.lon, b.lat);
      const mx = (x1 + x2) / 2,
        my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.18;
      ctx.strokeStyle = `rgba(242,180,65,${0.25 + (0.5 * q) / max})`;
      ctx.lineWidth = 0.8 + (4.5 * q) / max;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(mx, my, x2, y2);
      ctx.stroke();
    }
  }
  drawChokepoints(ctx) {
    if (this.view.s < 4) return;
    const cps = this.sim.data.chokepoints,
      st = this.sim.state;
    for (const cp of cps) {
      const o = st.chokes.find((x) => x.id === cp.id).open;
      const [x, y] = this.toScreen(cp.lon, cp.lat);
      if (x < 0 || y < 0 || x > this.vw || y > this.vh) continue;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = o > 0.85 ? '#52c28a' : o > 0.5 ? '#f2b441' : '#e05a5a';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
      if (this.view.s > 7) {
        ctx.font = '600 10px -apple-system, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = this.theme === 'dark' ? '#cfe0ff' : '#10203a';
        ctx.fillText(cp.name.replace('Strait of ', '').replace(' and Red Sea', ''), x + 8, y);
      }
    }
  }
  drawPick(ctx) {
    if (!this.pick) return;
    const g = this.sim.geo;
    ctx.strokeStyle = '#f2b441';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(242,180,65,0.18)';
    for (const r of this.pick.candidates || []) {
      const [x, y] = this.toScreen(g.regions[r].lon, g.regions[r].lat);
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, 6.3);
      ctx.fill();
      ctx.stroke();
    }
  }
}
