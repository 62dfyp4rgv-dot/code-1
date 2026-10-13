import { Career } from '../src/career/career.js';
import { makeBooking, playHeadless } from '../src/career/booking.js';
import { SAMPLE_WRESTLERS as W } from '../src/match/samples.js';

export function newCareer(seed = 1, extra = {}) {
  return new Career({ seed, startYear: 2024, player: { id: 'player', name: 'Test Hero', style: 'allrounder', alignment: 'face', attrs: { power: 55, striking: 55, grappling: 55, technical: 55, agility: 55, endurance: 60, toughness: 55, psychology: 55 }, ...extra } });
}
export const opp = (key, over = {}) => ({ ...W[key], ...over });
export function debut(c) {
  return c.record({ key: 'debut', category: 'career', type: 'debut', summary: 'Debut', importance: 4, data: { brand: 'NXT', show: 'NXT' } });
}
export function fight(c, key = 'rookie', o = {}, strategy = 'strong') {
  const booking = makeBooking(c, [opp(key)], { show: 'NXT', ...o });
  return playHeadless(c, booking, strategy);
}
export { W, makeBooking, playHeadless };
