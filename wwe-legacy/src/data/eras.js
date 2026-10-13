// WWE eras (conventional fan/historian groupings; boundaries are approximate by design).
export const ERAS = [
  { id: 'golden', name: 'Golden Era', from: 1984, to: 1992, desc: 'The national expansion: WrestleMania, Hulkamania and larger-than-life characters.' },
  { id: 'new_generation', name: 'New Generation', from: 1993, to: 1996, desc: 'Athletic, smaller stars lead the way as Monday Night Raw debuts.' },
  { id: 'attitude', name: 'Attitude Era', from: 1997, to: 2002, desc: 'Edgy, anti-hero storytelling and red-hot ratings.' },
  { id: 'ruthless', name: 'Ruthless Aggression', from: 2002, to: 2008, desc: 'Brand extension: Raw and SmackDown build rival rosters.' },
  { id: 'pg', name: 'PG Era', from: 2008, to: 2013, desc: 'Family-friendly programming and the rise of the Money in the Bank.' },
  { id: 'reality', name: 'Reality Era', from: 2013, to: 2016, desc: 'Authentic personas and the Network launches.' },
  { id: 'modern', name: 'New Era', from: 2016, to: 2022, desc: 'Brand split returns; a deeper women\'s division and NXT\'s rise.' },
  { id: 'current', name: 'Modern Day', from: 2022, to: 2100, desc: 'Premium Live Events, global expansion and a unified creative vision.' },
];
export function eraForYear(year) {
  let pick = ERAS[0];
  for (const e of ERAS) if (year >= e.from) pick = e;
  return pick;
}
export const eraById = (id) => ERAS.find((e) => e.id === id);
