import { createWorld, advanceDays } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
const w = createWorld(defaultWorldConfig('critic-prof', 'standard'));
const t = Date.now(); advanceDays(w, 60); console.log('60 days standard ms', Date.now() - t);
