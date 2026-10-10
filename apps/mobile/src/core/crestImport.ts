/**
 * Pure helpers for the "Import crest images" feature: match picked image files to clubs by file name and turn them into
 * embedded `data:image/...;base64,` URIs. No file or network access happens here (the pickers live in `core/files*.ts`).
 * The 300 KB limit is the engine's: it applies to the whole embedded URI string, which the engine re-validates on load.
 */
export const MAX_CREST_URI_LENGTH = 300_000;
export const CREST_MIMES = ['image/png', 'image/jpeg', 'image/webp'] as const;
const EXT_MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
const URI_PREFIX_LENGTH = 'data:image/jpeg;base64,'.length; // longest prefix; png/webp are shorter, so this is conservative by <= 2

export interface PickedImage {
  name: string;
  mime: string | null;
  size: number;
  /** null when the file was not read because it is already too big. */
  bytes: Uint8Array | null;
}

export interface CrestClub { id: string; name: string; shortName: string }

export type CrestStatus = 'matched' | 'unmatched' | 'duplicate' | 'tooBig' | 'unsupported';
export interface CrestResult { file: string; status: CrestStatus; clubId?: string; uri?: string }
export interface CrestReport {
  matched: number; unmatched: number; tooBig: number; unsupported: number;
  /** Names of files that matched no club (or matched an already-matched club), for the "not matched" hint. */
  unmatchedFiles: string[];
  tooBigFiles: string[];
}

/** lowercase, accents stripped, every run of non-alphanumerics -> '-', trimmed. */
export function normaliseName(s: string): string {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function stripExtension(file: string): string {
  const base = file.split(/[\\/]/).pop() ?? file;
  const i = base.lastIndexOf('.');
  return i > 0 ? base.slice(0, i) : base;
}

export function mimeOf(file: PickedImage): string | null {
  const m = file.mime?.toLowerCase();
  if (m && (CREST_MIMES as readonly string[]).includes(m)) return m;
  const ext = /\.([A-Za-z0-9]+)$/.exec(file.name)?.[1]?.toLowerCase();
  return ext ? EXT_MIME[ext] ?? null : null;
}

/** Length of the data URI for `size` raw bytes (base64 expands 3 bytes to 4 characters). */
export function dataUriLength(size: number): number {
  return URI_PREFIX_LENGTH + 4 * Math.ceil(size / 3);
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] as number;
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    out += B64[(n >> 18) & 63] as string + (B64[(n >> 12) & 63] as string) + (b === undefined ? '=' : (B64[(n >> 6) & 63] as string)) + (c === undefined ? '=' : (B64[n & 63] as string));
  }
  return out;
}

/**
 * Match files to clubs. A file matches the club whose normalised *name* equals the normalised file name; failing that, the club whose
 * normalised *short name* does, but only when exactly one club has that short name (short codes are not unique). A club gets at most one
 * crest (the first file wins; further files for it count as unmatched).
 */
export function planCrestImport(files: PickedImage[], clubs: CrestClub[]): { results: CrestResult[]; report: CrestReport } {
  const byName = new Map<string, CrestClub[]>();
  const byShort = new Map<string, CrestClub[]>();
  const add = (m: Map<string, CrestClub[]>, key: string, c: CrestClub): void => { if (key) m.set(key, [...(m.get(key) ?? []), c]); };
  for (const c of clubs) { add(byName, normaliseName(c.name), c); add(byShort, normaliseName(c.shortName), c); }
  const taken = new Set<string>();
  const results: CrestResult[] = [];
  const report: CrestReport = { matched: 0, unmatched: 0, tooBig: 0, unsupported: 0, unmatchedFiles: [], tooBigFiles: [] };
  for (const f of files) {
    const mime = mimeOf(f);
    if (!mime) { results.push({ file: f.name, status: 'unsupported' }); report.unsupported++; continue; }
    const key = normaliseName(stripExtension(f.name));
    const nameHits = byName.get(key) ?? [];
    const shortHits = byShort.get(key) ?? [];
    const club = nameHits.length === 1 ? nameHits[0] : nameHits.length === 0 && shortHits.length === 1 ? shortHits[0] : undefined;
    if (!club) { results.push({ file: f.name, status: 'unmatched' }); report.unmatched++; report.unmatchedFiles.push(f.name); continue; }
    if (taken.has(club.id)) { results.push({ file: f.name, status: 'duplicate', clubId: club.id }); report.unmatched++; report.unmatchedFiles.push(f.name); continue; }
    if (!f.bytes || dataUriLength(f.size) > MAX_CREST_URI_LENGTH) { results.push({ file: f.name, status: 'tooBig', clubId: club.id }); report.tooBig++; report.tooBigFiles.push(f.name); continue; }
    const uri = `data:${mime};base64,${bytesToBase64(f.bytes)}`;
    if (uri.length > MAX_CREST_URI_LENGTH) { results.push({ file: f.name, status: 'tooBig', clubId: club.id }); report.tooBig++; report.tooBigFiles.push(f.name); continue; }
    taken.add(club.id);
    results.push({ file: f.name, status: 'matched', clubId: club.id, uri });
    report.matched++;
  }
  return { results, report };
}
