// Tiny SVG chart helpers (no dependencies). Colours come from CSS variables so charts follow theme / contrast settings.
import { esc } from './fmt.js';
export function spark(vals, { w = 160, h = 46, color = 'var(--accent2)', fill = true, zero = false } = {}) {
  if (!vals || vals.length < 2) return `<svg class="spark" viewBox="0 0 ${w} ${h}"></svg>`;
  const mn = Math.min(...vals),
    mx = Math.max(...vals),
    span = mx - mn || 1;
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - 4 - ((v - mn) / span) * (h - 8)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const zeroY = zero && mn < 0 && mx > 0 ? h - 4 - ((0 - mn) / span) * (h - 8) : null;
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="trend">${zeroY !== null ? `<line x1="0" x2="${w}" y1="${zeroY}" y2="${zeroY}" stroke="var(--line)" stroke-dasharray="3 3"/>` : ''}${fill ? `<path d="${d} L${w} ${h} L0 ${h} Z" fill="${color}" opacity=".16"/>` : ''}<path d="${d}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
}
export function lineChart(
  series,
  {
    w = 340,
    h = 160,
    labels = null,
    fmt = (v) => v.toFixed(1),
    colors = ['var(--accent)', 'var(--accent2)', 'var(--info)', 'var(--bad)'],
  } = {},
) {
  const all = series.flatMap((s) => s.data);
  if (all.length < 2) return '<div class="empty">Not enough data yet.</div>';
  const mn = Math.min(...all),
    mx = Math.max(...all),
    span = mx - mn || 1;
  const pad = Math.max(30, 8 + 5.4 * Math.max(...[0, 1, 2, 3].map((k) => String(fmt(mn + (span * k) / 3)).length)));
  const n = Math.max(...series.map((s) => s.data.length));
  const X = (i, len) => pad + (i / Math.max(1, len - 1)) * (w - pad - 6),
    Y = (v) => h - 20 - ((v - mn) / span) * (h - 34);
  let g = '';
  for (let k = 0; k <= 3; k++) {
    const v = mn + (span * k) / 3,
      y = Y(v);
    g += `<line x1="${pad}" x2="${w - 6}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/><text x="${pad - 4}" y="${y + 3}" text-anchor="end" fill="var(--muted)" font-size="9">${esc(fmt(v))}</text>`;
  }
  const paths = series
    .map(
      (s, si) =>
        `<path d="${s.data.map((v, i) => (i ? 'L' : 'M') + X(i, s.data.length).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ')}" fill="none" stroke="${s.color || colors[si % colors.length]}" stroke-width="2.2" stroke-linejoin="round"/>`,
    )
    .join('');
  const lg = series
    .map((s, si) => `<span class="tag" style="color:${s.color || colors[si % colors.length]}">${esc(s.name)}</span>`)
    .join(' ');
  const xl = labels
    ? `<text x="${pad}" y="${h - 4}" fill="var(--muted)" font-size="9">${esc(labels[0])}</text><text x="${w - 6}" y="${h - 4}" text-anchor="end" fill="var(--muted)" font-size="9">${esc(labels[1])}</text>`
    : '';
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="chart">${g}${paths}${xl}</svg><div class="row" style="flex-wrap:wrap;gap:6px">${lg}</div>`;
}
export function bars(rows, { max = null, fmt = (v) => v.toFixed(1), color = 'var(--accent2)' } = {}) {
  const mx = max ?? Math.max(...rows.map((r) => Math.abs(r.v)), 1e-9);
  return `<div class="bars">${rows.map((r) => `<div class="bar-row"><span class="lbl">${esc(r.label)}</span><div class="gauge ${r.cls || ''}"><i style="width:${Math.max(1, Math.min(100, (Math.abs(r.v) / mx) * 100))}%;${r.color ? 'background:' + r.color : ''}"></i></div><b>${esc(r.text ?? fmt(r.v))}</b></div>`).join('')}</div>`;
}
export function gauge(label, value01, { text, cls = '', hint = '' } = {}) {
  const v = Math.max(0, Math.min(1, value01));
  const auto = cls || (v < 0.3 ? 'bad' : v < 0.5 ? 'warn' : 'good');
  return `<div class="gauge-l"><div class="t"><span>${esc(label)}</span><b>${esc(text ?? Math.round(v * 100) + '%')}</b></div><div class="gauge ${auto}" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(v * 100)}" aria-label="${esc(label)}"><i style="width:${v * 100}%"></i></div>${hint ? `<div class="hint">${hint}</div>` : ''}</div>`;
}
