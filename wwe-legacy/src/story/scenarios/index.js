// Aggregates every authored scenario group into one library.
import core from './core.js';
import careerLife from './career_life.js';
import relationships from './relationships.js';
import mediaFans from './media_fans.js';
import marquee from './marquee.js';
export const SCENARIO_GROUPS = { core, career_life: careerLife, relationships, media_fans: mediaFans, marquee };
export const SCENARIO_TEMPLATES = Object.values(SCENARIO_GROUPS).flat();
