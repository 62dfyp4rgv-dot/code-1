import test from 'node:test';
import assert from 'node:assert/strict';
import { RNG } from '../../app/js/sim/rng.js';
import { Calendar } from '../../app/js/sim/calendar.js';
test('rng is deterministic and state is restorable', () => {
  const a = new RNG(42), b = new RNG(42); const sa = [], sb = [];
  for (let i = 0; i < 50; i++) { sa.push(a.next()); sb.push(b.next()); }
  assert.deepEqual(sa, sb);
  const st = a.getState(); const x = a.next(); const c = new RNG(1); c.setState(st); assert.equal(c.next(), x);
  assert.notEqual(new RNG(43).next(), new RNG(42).next());
});
test('rng distribution sanity', () => {
  const r = new RNG(9); let s = 0; const n = 20000; for (let i = 0; i < n; i++) s += r.next(); assert.ok(Math.abs(s / n - 0.5) < 0.01);
  const w = [0, 0, 0]; for (let i = 0; i < 6000; i++) w[r.weighted([1, 2, 3])]++; assert.ok(w[2] > w[1] && w[1] > w[0]);
});
test('calendar: month/year boundaries and leap years', () => {
  const c = new Calendar(2025, 1, 1);
  assert.equal(c.format(0), '2025-01-01'); assert.equal(c.format(31), '2025-02-01'); assert.equal(c.format(365), '2026-01-01');
  assert.ok(c.isYearStart(365)); assert.ok(c.isMonthStart(31)); assert.ok(!c.isMonthStart(30));
  assert.equal(c.daysInMonth(c.dayOf(2028, 2, 1)), 29);
});
