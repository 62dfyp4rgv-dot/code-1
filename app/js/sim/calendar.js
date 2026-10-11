// Day-count calendar (proleptic Gregorian). day 0 = start date of the scenario.
const MS = 86400000;
export function ymdToEpochDay(y, m, d) {
  return Math.floor(Date.UTC(y, m - 1, d) / MS);
}
export function epochDayToYmd(e) {
  const dt = new Date(e * MS);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}
export class Calendar {
  constructor(startY, startM, startD) {
    this.base = ymdToEpochDay(startY, startM, startD);
  }
  ymd(day) {
    return epochDayToYmd(this.base + day);
  }
  isMonthStart(day) {
    return this.ymd(day).d === 1;
  }
  isYearStart(day) {
    const t = this.ymd(day);
    return t.d === 1 && t.m === 1;
  }
  format(day) {
    const t = this.ymd(day);
    return `${t.y}-${String(t.m).padStart(2, '0')}-${String(t.d).padStart(2, '0')}`;
  }
  longFormat(day) {
    const t = this.ymd(day);
    return `${t.d} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][t.m - 1]} ${t.y}`;
  }
  year(day) {
    return this.ymd(day).y;
  }
  daysInMonth(day) {
    const t = this.ymd(day);
    return new Date(Date.UTC(t.y, t.m, 0)).getUTCDate();
  }
  dayOf(y, m, d) {
    return ymdToEpochDay(y, m, d) - this.base;
  }
}
