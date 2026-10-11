// Shared geography helpers: raster grid constants, coordinate transforms, distance.
// Grid is equirectangular, 0.5 degree cells, covering lat +84 (top) .. -58 (bottom).
export const CELL = 0.5;
export const W = 720;
export const H = 284;
export const LAT_TOP = 84;
export const LAT_BOTTOM = LAT_TOP - H * CELL; // -58
export const EARTH_R_KM = 6371;

export const cellX = (lon) => Math.min(W - 1, Math.max(0, Math.floor((lon + 180) / CELL)));
export const cellY = (lat) => Math.min(H - 1, Math.max(0, Math.floor((LAT_TOP - lat) / CELL)));
export const cellLon = (x) => -180 + (x + 0.5) * CELL;
export const cellLat = (y) => LAT_TOP - (y + 0.5) * CELL;
export const cellIndex = (x, y) => y * W + x;

const rad = (d) => (d * Math.PI) / 180;
export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}
// Approximate area of one cell at a latitude, in km^2.
export function cellAreaKm2(lat) {
  const h = rad(CELL) * EARTH_R_KM;
  return h * h * Math.cos(rad(lat));
}
// Decode run-length encoded raster [count, value, count, value, ...] into a typed array.
export function rleDecode(rle, Type = Uint16Array, length = W * H) {
  const out = new Type(length);
  let p = 0;
  for (let i = 0; i < rle.length; i += 2) {
    const n = rle[i];
    const v = rle[i + 1];
    if (v !== 0) out.fill(v, p, p + n);
    p += n;
  }
  return out;
}
export function rleEncode(arr) {
  const out = [];
  let i = 0;
  while (i < arr.length) {
    let j = i + 1;
    while (j < arr.length && arr[j] === arr[i]) j++;
    out.push(j - i, arr[i]);
    i = j;
  }
  return out;
}
