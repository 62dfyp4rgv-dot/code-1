// Money: match payouts, salary, merchandise, lifestyle costs, debt and contract renewal. Every monthly
// statement is a ledger event, so earnings and spending in the Record Book are derived from evidence.
import { clamp } from '../core/util.js';

export const LIFESTYLES = {
  frugal: { label: 'Frugal', desc: 'Cheap flights, shared rooms, home cooking. Banks the money.', cost: 2500, rest: 0, conf: 0, pop: 0 },
  comfortable: { label: 'Comfortable', desc: 'Decent hotels and proper meals. Recovers a little faster.', cost: 6000, rest: 2, conf: 1, pop: 0 },
  lavish: { label: 'Lavish', desc: 'First class, a stylist, the right parties. Costly, but the image sells.', cost: 18000, rest: 3, conf: 2, pop: 0.12 },
};

/** payout for one match, derived from event data only (so earnings can be recomputed from the ledger) */
export const matchPay = (d) => Math.round((800 * (1 + (d.ppvTier || 0) * 0.6 + (d.mainEvent ? 0.5 : 0)) + (d.result === 'win' ? 200 : 0)));

export const merchIncome = (popularity) => Math.round(Math.pow(Math.max(0, popularity), 1.6) * 11);
export const salaryFor = (popularity, base = 60000) => Math.round(base * Math.pow(1 + popularity / 22, 2) / 1000) * 1000;

/** month-end statement: salary, merchandise, lifestyle and agent fees; recorded as a ledger event */
export function settleMonth(c) {
  const p = c.player;
  const life = LIFESTYLES[p.lifestyle || 'comfortable'];
  const salary = p.contract && c.day <= p.contract.endDay ? Math.round(p.contract.salary / 12) : 0;
  const merch = merchIncome(p.popularity);
  const gross = salary + merch;
  const fees = Math.round(gross * 0.08);
  const expenses = life.cost + fees + Math.round(salary * 0.12); // taxes withheld on salary
  const net = gross - expenses;
  p.money += net;
  p.fatigue = clamp(p.fatigue - life.rest, 0, 100);
  p.confidence = clamp(p.confidence + life.conf + (p.money < 0 ? -4 : 0), 0, 100);
  if (life.pop) p.popularity = clamp(p.popularity + life.pop, 0, 100);
  const month = Math.round(c.day / 30);
  const out = c.record({
    key: `finance:${month}`, category: 'personal', type: 'finance_month', importance: p.money < 0 ? 3 : 1,
    summary: `Month ${month}: earned $${gross.toLocaleString()}, spent $${expenses.toLocaleString()} (${net >= 0 ? '+' : '-'}$${Math.abs(net).toLocaleString()}).${p.money < 0 ? ' In debt.' : ''}`,
    data: { salary, merch, fees, expenses, net, lifestyle: p.lifestyle || 'comfortable', balance: p.money },
  });
  return out.event;
}

/** an expiring contract is renewed on terms that reflect the wrestler's drawing power */
export function maybeRenewContract(c) {
  const p = c.player;
  if (!p.contract || c.day < p.contract.endDay) return null;
  const years = p.popularity >= 60 ? 3 : 2;
  const salary = Math.max(p.contract.salary, salaryFor(p.popularity, 60000));
  p.contract = { endDay: c.day + years * 365, salary, brand: p.contract.brand || p.brand };
  return c.record({ key: `contract:renew:${c.day}`, category: 'career', type: 'contract_signed', summary: `${p.name} re-signed for ${years} years at $${salary.toLocaleString()}/yr.`, importance: 3, data: { years, salary, brand: p.contract.brand, renewal: true } }).event;
}
