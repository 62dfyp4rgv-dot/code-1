/**
 * Pure helpers that turn an engine MatchView into a chronological list of "key moments" (goals, cards, half/full time)
 * for the animated match reveal. Goals always come from `mv.goals` (kept even when the full event log is not archived);
 * cards and phase markers come from `mv.events` when present.
 */
import type { MatchView } from '@fu/engine';

export type TLKind = 'kickoff' | 'goal' | 'yellow' | 'red' | 'secondYellow' | 'halftime' | 'fulltime' | 'extraTime';

export interface TLItem {
  key: string;
  kind: TLKind;
  side: 'home' | 'away';
  /** Regulation minute as reported by the engine, plus stoppage minutes. */
  minute: number;
  added: number | null;
  /** Player name (scorer / booked player) or null for phase markers. */
  player: string | null;
  /** Goal kind id (e.g. 'header'), only for goals. */
  detail: string | null;
  /** Running score after this item (goals only update it). */
  score: [number, number];
  /** Playback clock: minute + added (monotone non-decreasing along the list). */
  clock: number;
}

export interface Timeline { items: TLItem[]; endClock: number }

const periodOfMinute = (m: number): number => (m <= 45 ? 1 : m <= 90 ? 2 : m <= 105 ? 3 : 4);

export function buildTimeline(mv: Pick<MatchView, 'goals' | 'events'>): Timeline {
  type Raw = Omit<TLItem, 'key' | 'score' | 'clock'> & { period: number; order: number };
  const raw: Raw[] = [];
  const goalEvents = (mv.events ?? []).filter((e) => e.type === 'goal');
  const pair = goalEvents.length === mv.goals.length;
  mv.goals.forEach((g, i) => {
    const ev = pair ? goalEvents[i] : undefined;
    raw.push({ kind: 'goal', side: g.side, minute: g.minute, added: ev?.added ?? null, player: g.scorer, detail: g.kind, period: ev?.period ?? periodOfMinute(g.minute), order: i });
  });
  (mv.events ?? []).forEach((e, i) => {
    if (e.type === 'card') {
      const m = /^(Yellow card|Red card|Second yellow) for (.+)$/.exec(e.text);
      const kind: TLKind = m?.[1] === 'Red card' ? 'red' : m?.[1] === 'Second yellow' ? 'secondYellow' : 'yellow';
      raw.push({ kind, side: e.side, minute: e.minute, added: e.added, player: m?.[2] ?? null, detail: null, period: e.period, order: 1000 + i });
    } else if (e.type === 'halftime' || e.type === 'fulltime' || e.type === 'extraTimeStart') {
      const kind: TLKind = e.type === 'halftime' ? 'halftime' : e.type === 'fulltime' ? 'fulltime' : 'extraTime';
      raw.push({ kind, side: e.side, minute: e.minute, added: e.added, player: null, detail: null, period: e.period, order: 1000 + i });
    }
  });
  raw.sort((a, b) => a.period - b.period || a.minute + (a.added ?? 0) / 100 - (b.minute + (b.added ?? 0) / 100) || a.order - b.order);
  const items: TLItem[] = [];
  let h = 0;
  let a = 0;
  let clock = 0;
  raw.forEach((r, i) => {
    if (r.kind === 'goal') { if (r.side === 'home') h++; else a++; }
    clock = Math.max(clock, r.minute + (r.added ?? 0));
    items.push({ key: `${i}-${r.kind}-${r.minute}`, kind: r.kind, side: r.side, minute: r.minute, added: r.added, player: r.player, detail: r.detail, score: [h, a], clock });
  });
  const last = items[items.length - 1];
  const endClock = Math.max(90, last?.kind === 'fulltime' ? last.clock : last?.clock ?? 90);
  return { items, endClock };
}

/** Score after the first `visible` items. */
export function scoreAfter(items: readonly TLItem[], visible: number): [number, number] {
  return visible <= 0 ? [0, 0] : (items[Math.min(visible, items.length) - 1]?.score ?? [0, 0]);
}

/** Number of items whose clock is <= `clock` (items are chronological and clocks monotone). */
export function visibleCount(items: readonly TLItem[], clock: number): number {
  let n = 0;
  while (n < items.length && (items[n] as TLItem).clock <= clock) n++;
  return n;
}

export function minuteLabel(i: Pick<TLItem, 'minute' | 'added'>): string {
  return i.added ? `${i.minute}+${i.added}'` : `${i.minute}'`;
}
