// Aggregates every authored scenario group into one library.
import core from './core.js';
import careerLife from './career_life.js';
import relationships from './relationships.js';
import mediaFans from './media_fans.js';
import marquee from './marquee.js';
import newA from './new_a.js';
import newB from './new_b.js';
import newC from './new_c.js';
export const SCENARIO_GROUPS = { core, career_life: careerLife, relationships, media_fans: mediaFans, marquee, new_a: newA, new_b: newB, new_c: newC };
export const SCENARIO_TEMPLATES = Object.values(SCENARIO_GROUPS).flat();
