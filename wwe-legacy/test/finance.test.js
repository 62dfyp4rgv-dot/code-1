import test from 'node:test';
import assert from 'node:assert/strict';
import { playCareer, audit } from '../tools/careersim.js';
import { recomputeStats } from '../src/career/stats.js';
import { buildRecordBook } from '../src/career/recordbook.js';
import { matchPay, salaryFor, merchIncome } from '../src/career/finance.js';

test('monthly statements are ledger events and earnings are derivable from the ledger', () => {
  const g = playCareer({ years: 1.2, strategy: 'smart', seed: 51 }).game;
  const c = g.career;
  const months = c.memory.ledger.ofType('finance_month');
  assert.ok(months.length >= 10, `statements: ${months.length}`);
  const re = recomputeStats(c.memory.ledger, c.player.id).s.earnings;
  assert.deepEqual(re, c.stats.s.earnings);
  assert.ok(re.salary > 0 && re.merch > 0 && re.matches > 0 && re.spent > 0);
  assert.deepEqual(audit(g), []);
});

test('lifestyle changes the monthly cost and the Record Book cites the statements', () => {
  const g = playCareer({ years: 0.5, strategy: 'smart', seed: 52 }).game;
  g.setLifestyle('lavish');
  const before = g.career.player.money;
  g.career.advanceDays(30);
  const last = g.career.memory.ledger.ofType('finance_month').slice(-1)[0];
  assert.equal(last.data.lifestyle, 'lavish');
  assert.ok(last.data.expenses >= 18000);
  assert.ok(g.career.player.money < before + 20000);
  const book = buildRecordBook(g.career);
  const fin = book.sections.find((s) => s.id === 'finance');
  for (const it of fin.items) assert.ok(it.evidence.length > 0, it.label);
});

test('pay formulas behave and an expiring contract is renewed on better terms for a star', () => {
  assert.ok(matchPay({ ppvTier: 2, mainEvent: true, result: 'win' }) > matchPay({ ppvTier: 0, result: 'loss' }));
  assert.ok(salaryFor(90) > salaryFor(20));
  assert.ok(merchIncome(90) > merchIncome(30));
  const g = playCareer({ years: 0.1, strategy: 'smart', seed: 53 }).game;
  const c = g.career;
  c.player.popularity = 85;
  c.player.contract.endDay = c.day + 1;
  const old = c.player.contract.salary;
  c.advanceDays(35);
  assert.ok(c.player.contract.salary > old);
  assert.ok(c.memory.ledger.ofType('contract_signed').some((e) => e.data.renewal));
});
