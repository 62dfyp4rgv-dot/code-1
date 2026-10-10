/**
 * Build a data pack from two CSV files you have the right to use.
 *   npx tsx tools/pack-from-csv.ts --clubs clubs.csv --players players.csv --out my.pack.json --id my-pack --name "My pack" --source "where the data came from" --licence "your rights"
 * clubs.csv   : league,club,short,city,colors,crest,manager,managerNationality,managerBirthYear   (rows in strongest-first order per league; colors like #aa0000|#ffffff)
 * players.csv : league,club,player,position,nationality,birthYear,overall                         (overall optional: your own estimate, 1-99)
 * The output is validated with the same parser the app uses, so errors name the offending row.
 */
import fs from 'node:fs';
import { parseDataPack, type DataPack, type PackClub } from '../src';

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i] as string;
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.some((c) => c !== '')) rows.push(row); row = []; }
    else cur += ch;
  }
  row.push(cur); if (row.some((c) => c !== '')) rows.push(row);
  const head = (rows.shift() ?? []).map((h) => h.trim());
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}

export function buildPack(clubsCsv: string, playersCsv: string | null, meta: { id: string; name: string; source: string; licence: string }): DataPack {
  const leagues: Record<string, PackClub[]> = {};
  const byKey = new Map<string, PackClub>();
  for (const r of parseCsv(clubsCsv)) {
    const c: Record<string, unknown> = { name: r.club };
    if (r.short) c.shortName = r.short;
    if (r.city) c.city = r.city;
    if (r.colors) c.colors = r.colors.split('|');
    if (r.crest) c.crest = r.crest;
    if (r.manager) c.manager = { name: r.manager, ...(r.managerNationality ? { nationality: r.managerNationality } : {}), ...(r.managerBirthYear ? { birthYear: Number(r.managerBirthYear) } : {}) };
    (leagues[r.league as string] ??= []).push(c as unknown as PackClub);
    byKey.set(`${r.league}|${r.club}`, c as unknown as PackClub);
  }
  if (playersCsv) {
    for (const r of parseCsv(playersCsv)) {
      const club = byKey.get(`${r.league}|${r.club}`);
      if (!club) throw new Error(`players.csv: club "${r.club}" in league ${r.league} is not listed in clubs.csv`);
      (club.players ??= []).push({
        name: r.player as string, position: r.position as never,
        ...(r.nationality ? { nationality: r.nationality } : {}), ...(r.birthYear ? { birthYear: Number(r.birthYear) } : {}), ...(r.overall ? { overall: Number(r.overall) } : {}),
      });
    }
  }
  return parseDataPack({ format: 'football-universe-data-pack', version: 1, ...meta, leagues });
}

if (process.argv[1]?.endsWith('pack-from-csv.ts')) {
  const arg = (k: string): string | undefined => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : undefined; };
  const need = (k: string): string => arg(k) ?? (() => { throw new Error(`missing --${k}`); })();
  const pack = buildPack(fs.readFileSync(need('clubs'), 'utf8'), arg('players') ? fs.readFileSync(need('players'), 'utf8') : null, { id: need('id'), name: need('name'), source: need('source'), licence: need('licence') });
  fs.writeFileSync(need('out'), JSON.stringify(pack, null, 1));
  console.log(`wrote ${need('out')}: ${Object.values(pack.leagues).flat().length} clubs`);
}
