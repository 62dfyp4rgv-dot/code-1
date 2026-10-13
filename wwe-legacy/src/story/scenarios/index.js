// Aggregates every authored scenario group into one library.
import core from './core.js';
const groups = [core];
export const SCENARIO_GROUPS = { core };
export const SCENARIO_TEMPLATES = groups.flat();
