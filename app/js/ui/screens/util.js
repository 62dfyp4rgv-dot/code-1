import { esc, money, pct, GOV_LABEL, REGION_LABEL } from '../fmt.js';
import { icon } from '../icons.js';
export const stat = (k, v, d = '', cls = '', ic = '') =>
  `<div class="stat"><div class="k">${ic ? icon(ic, '', 13) : ''}${esc(k)}</div><div class="v ${cls}">${v}</div>${d ? `<div class="d">${d}</div>` : ''}</div>`;
export const kv = (k, v, cls = '') => `<div class="kv"><span class="k">${esc(k)}</span><span class="v ${cls}">${v}</span></div>`;
export const sec = (t, extra = '') => `<div class="sec">${esc(t)}${extra}</div>`;
export const tag = (t, cls = '') => `<span class="tag ${cls}">${t}</span>`;
export const btn = (label, attrs = '', cls = '') => `<button class="btn ${cls}" ${attrs}>${label}</button>`;
export const cmdBtn = (label, cmd, cls = '', extra = '') =>
  `<button class="btn ${cls}" data-cmd="${esc(JSON.stringify(cmd)).replace(/"/g, '&quot;')}" ${extra}>${label}</button>`;
export const note = (t) => `<div class="note">${t}</div>`;
export const li = (title, sub, end, attrs = '', lead = '') =>
  `<div class="li" ${attrs} role="button" tabindex="0">${lead}<div class="grow"><div class="t">${title}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>${end ? `<div class="end">${end}</div>` : ''}${attrs ? icon('right', 'mu', 16) : ''}</div>`;
export const swatch = (app, i) => {
  const c = app.map.colorSnapshot ? app.map.colorSnapshot[i] : null;
  return `<span class="sw" style="background:${c ? `rgb(${c[0]},${c[1]},${c[2]})` : 'var(--line)'}"></span>`;
};
export function opinionTag(op) {
  const t =
    op > 50
      ? ['Close', 'good']
      : op > 20
        ? ['Friendly', 'good']
        : op > -20
          ? ['Neutral', '']
          : op > -50
            ? ['Cool', 'warn']
            : ['Hostile', 'bad'];
  return `<span class="tag ${t[1]}">${t[0]} ${op > 0 ? '+' : ''}${op}</span>`;
}
export const GL = GOV_LABEL;
export function probBar(p) {
  return `<div class="prob" role="meter" aria-label="Chance of acceptance" aria-valuenow="${Math.round(p * 100)}"><i style="width:${Math.round(p * 100)}%"></i><span>${Math.round(p * 100)}% likely</span></div>`;
}
export function slider({ key, label, min, max, step, value, fmt, help, cost, scope = 'p' }) {
  return `<div class="slider-row"><div class="top"><span>${esc(label)}</span><b id="sv-${scope}-${key}">${esc(fmt(value))}</b></div><input class="slider" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-live="1" data-commit="1" data-key="${key}" data-scope="${scope}" aria-label="${esc(label)}">${help ? `<div class="hint">${help}</div>` : ''}<div class="hint" id="sc-${scope}-${key}">${cost ?? ''}</div></div>`;
}
export function fmtLever(l, v) {
  switch (l.fmt) {
    case 'pct':
      return pct(v, 0);
    case 'pct2':
      return pct(v, 2);
    case 'idx':
      return Math.round(v * 100) + '/100';
    case 'level':
      return (l.labels && l.labels[Math.round(v)]) || String(v);
    default:
      return String(v);
  }
}
export const regionName = (r) => REGION_LABEL[r] || r;
