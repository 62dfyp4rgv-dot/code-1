// Aggregates every authored scenario group into one library.
import core from './core.js';
import careerLife from './career_life.js';
import relationships from './relationships.js';
import mediaFans from './media_fans.js';
import marquee from './marquee.js';
import newA from './new_a.js';
import newB from './new_b.js';
import newC from './new_c.js';
import newD from './new_d.js';
import newE from './new_e.js';
export const SCENARIO_GROUPS = { core, career_life: careerLife, relationships, media_fans: mediaFans, marquee, new_a: newA, new_b: newB, new_c: newC, new_d: newD, new_e: newE };
export const SCENARIO_TEMPLATES = Object.values(SCENARIO_GROUPS).flat();
