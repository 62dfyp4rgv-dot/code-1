// Small fictional sample roster used by tests, simulations and the quick-start demo.
// (The real roster database lives in src/data/roster.js.)
const w = (id, name, style, alignment, attrs, extra = {}) => ({ id, name, style, alignment, attrs, popularity: 50, ...extra });

export const SAMPLE_WRESTLERS = {
  brawler: w('brawler', 'Rex Hammer', 'brawler', 'heel', { power: 70, striking: 80, grappling: 55, technical: 45, agility: 55, endurance: 65, toughness: 75, psychology: 55 }),
  tech: w('tech', 'Adrian Vale', 'technician', 'face', { power: 50, striking: 55, grappling: 80, technical: 85, agility: 62, endurance: 70, toughness: 60, psychology: 78 }),
  flyer: w('flyer', 'Kai Storm', 'highflyer', 'face', { power: 45, striking: 60, grappling: 50, technical: 62, agility: 90, endurance: 66, toughness: 50, psychology: 60 }),
  power: w('power', 'Goliath Rourke', 'powerhouse', 'heel', { power: 92, striking: 65, grappling: 70, technical: 40, agility: 40, endurance: 62, toughness: 85, psychology: 50 }),
  sub: w('sub', 'Dmitri Sable', 'submission', 'tweener', { power: 60, striking: 50, grappling: 85, technical: 82, agility: 55, endurance: 72, toughness: 68, psychology: 74 }),
  show: w('show', 'Johnny Spotlight', 'showman', 'face', { power: 62, striking: 68, grappling: 62, technical: 60, agility: 60, endurance: 68, toughness: 62, psychology: 72 }, { popularity: 80 }),
  rookie: w('rookie', 'Tommy Green', 'allrounder', 'face', { power: 38, striking: 40, grappling: 38, technical: 36, agility: 45, endurance: 50, toughness: 40, psychology: 30 }, { popularity: 20 }),
  partnerA: w('partnerA', 'Lou Mason', 'brawler', 'heel', { power: 62, striking: 66, grappling: 55, technical: 50, agility: 55, endurance: 62, toughness: 64, psychology: 52 }),
  partnerB: w('partnerB', 'Eli Park', 'technician', 'face', { power: 52, striking: 55, grappling: 68, technical: 72, agility: 62, endurance: 66, toughness: 56, psychology: 66 }),
};
