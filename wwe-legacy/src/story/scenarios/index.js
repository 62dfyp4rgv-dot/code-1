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
import newLife from './new_life.js';
import newF from './new_f.js';
import newG from './new_g.js';
import newH from './new_h.js';
import newI from './new_i.js';
export const SCENARIO_GROUPS = { core, career_life: careerLife, relationships, media_fans: mediaFans, marquee, new_a: newA, new_b: newB, new_c: newC, new_d: newD, new_e: newE, new_life: newLife, new_f: newF, new_g: newG, new_h: newH, new_i: newI };
export const SCENARIO_TEMPLATES = Object.values(SCENARIO_GROUPS).flat();
