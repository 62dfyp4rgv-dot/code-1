import { loadDataNode } from '../app/js/sim/data.js';
import { Sim } from '../app/js/sim/world.js';
let dataP = null;
export const getData = () => (dataP ||= loadDataNode());
export async function makeSim(opts = {}) {
  return new Sim(await getData(), { seed: 7, scenario: 'quiet_decade', player: 'USA', ...opts });
}
export const finite = (x) => typeof x === 'number' && Number.isFinite(x);
// Walk a state tree and report non-finite numbers (NaN/Infinity) with their path.
export function findNonFinite(obj, path = '', out = []) {
  if (out.length > 5) return out;
  if (typeof obj === 'number') {
    if (!Number.isFinite(obj)) out.push(path);
    return out;
  }
  if (obj && typeof obj === 'object') {
    if (ArrayBuffer.isView(obj)) {
      for (let i = 0; i < obj.length; i++)
        if (!Number.isFinite(obj[i])) {
          out.push(path + '[' + i + ']');
          break;
        }
      return out;
    }
    for (const k of Object.keys(obj)) findNonFinite(obj[k], path + '.' + k, out);
  }
  return out;
}
