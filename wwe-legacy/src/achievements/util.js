export function getPathValue(obj, path) {
  let cur = obj;
  for (const p of path.split('.')) { if (cur == null) return undefined; cur = cur[p]; }
  return cur;
}
