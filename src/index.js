const DAY = 86_400_000;
const pad = (n, w = 2) => String(n).padStart(w, "0");
// Date.UTC treats the years 0 to 99 as 1900 to 1999; this does not.
const utc = (year, month, day) => {
  const d = new Date(0);
  d.setUTCFullYear(year, month, day);
  return d.getTime();
};

/** Parses `"2026-10-17"` (or a Date, read in UTC) into a UTC-midnight timestamp. Throws on anything that is not a real date. */
function toTime(input) {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) throw new TypeError("nl-calendar: invalid Date");
    return utc(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate());
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof input === "string" ? input : "");
  if (!m) throw new TypeError(`nl-calendar: "${input}" is not a date; use "YYYY-MM-DD"`);
  const t = utc(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(t);
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) throw new RangeError(`nl-calendar: "${input}" does not exist`);
  return t;
}
const fromTime = (t) => {
  const d = new Date(t);
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

/** Normalises a date to the form `"YYYY-MM-DD"` (a Date is read in UTC). */
export const toDateString = (input) => fromTime(toTime(input));

/** Easter Sunday of a year (Gregorian calendar), as `"YYYY-MM-DD"`. */
export function easter(year) {
  if (!Number.isInteger(year) || year < 1583 || year > 9999) throw new RangeError("nl-calendar: easter is defined for the years 1583 to 9999");
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

const plus = (isoDate, days) => fromTime(toTime(isoDate) + days * DAY);
const weekdayOf = (t) => new Date(t).getUTCDay();

/**
 * The Dutch holidays of a year: `[{ id, date, name: { nl, en }, official, dayOff }]`, sorted by date.
 * `official` is a national public holiday; `dayOff` is whether most people really have the day off (Liberation Day, 5 May, is a
 * day off only every fifth year; Good Friday is not an official holiday but many companies close). Years 1980 to 2200 (the date of
 * Koningsdag/Koninginnedag changed over time; Queen's Day was 30 April until 2013, 29 April when the 30th was a Sunday).
 */
export function holidays(year) {
  if (!Number.isInteger(year) || year < 1980 || year > 2200) throw new RangeError("nl-calendar: holidays are available for the years 1980 to 2200");
  const e = easter(year);
  const y = pad(year, 4);
  let kings;
  if (year >= 2014) {
    kings = { id: "kings-day", date: `${y}-04-27`, name: { nl: "Koningsdag", en: "King's Day" } };
    if (weekdayOf(toTime(kings.date)) === 0) kings.date = `${y}-04-26`;
  } else {
    kings = { id: "kings-day", date: `${y}-04-30`, name: { nl: "Koninginnedag", en: "Queen's Day" } };
    if (weekdayOf(toTime(kings.date)) === 0) kings.date = `${y}-04-29`;
  }
  const list = [
    { id: "new-year", date: `${y}-01-01`, name: { nl: "Nieuwjaarsdag", en: "New Year's Day" }, official: true, dayOff: true },
    { id: "good-friday", date: plus(e, -2), name: { nl: "Goede Vrijdag", en: "Good Friday" }, official: false, dayOff: false },
    { id: "easter-sunday", date: e, name: { nl: "Eerste Paasdag", en: "Easter Sunday" }, official: true, dayOff: true },
    { id: "easter-monday", date: plus(e, 1), name: { nl: "Tweede Paasdag", en: "Easter Monday" }, official: true, dayOff: true },
    { ...kings, official: true, dayOff: true },
    { id: "liberation-day", date: `${y}-05-05`, name: { nl: "Bevrijdingsdag", en: "Liberation Day" }, official: true, dayOff: year % 5 === 0 },
    { id: "ascension", date: plus(e, 39), name: { nl: "Hemelvaartsdag", en: "Ascension Day" }, official: true, dayOff: true },
    { id: "whit-sunday", date: plus(e, 49), name: { nl: "Eerste Pinksterdag", en: "Whit Sunday" }, official: true, dayOff: true },
    { id: "whit-monday", date: plus(e, 50), name: { nl: "Tweede Pinksterdag", en: "Whit Monday" }, official: true, dayOff: true },
    { id: "christmas", date: `${y}-12-25`, name: { nl: "Eerste Kerstdag", en: "Christmas Day" }, official: true, dayOff: true },
    { id: "boxing-day", date: `${y}-12-26`, name: { nl: "Tweede Kerstdag", en: "Boxing Day" }, official: true, dayOff: true }
  ];
  return list.sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** The holiday on a date, or `null`. By default only the holidays where most people have a day off; `all: true` includes Good Friday and Liberation Day always. */
export function holidayOn(date, { all = false } = {}) {
  const iso = toDateString(date);
  const year = Number(iso.slice(0, 4));
  if (year < 1980 || year > 2200) return null;
  return holidays(year).find((h) => h.date === iso && (all || h.dayOff)) ?? null;
}

export const isWeekend = (date) => [0, 6].includes(weekdayOf(toTime(date)));

/**
 * Whether it is a working day: not a weekend and not a holiday on which people have the day off. Options: `include` (holiday ids to
 * count as days off as well, for example `["good-friday", "liberation-day"]`), `extra` (more days off as dates, such as company
 * closing days), `saturdayIsWorkday` (shops and restaurants).
 */
export function isBusinessDay(date, { include = [], extra = [], saturdayIsWorkday = false } = {}) {
  const t = toTime(date);
  const dow = weekdayOf(t);
  if (dow === 0 || (dow === 6 && !saturdayIsWorkday)) return false;
  const iso = fromTime(t);
  if (extra.some((d) => toDateString(d) === iso)) return false;
  const year = Number(iso.slice(0, 4));
  if (year < 1980 || year > 2200) return true;
  return !holidays(year).some((h) => h.date === iso && (h.dayOff || include.includes(h.id)));
}

/** Moves `n` working days forward (or back when negative) from a date. `addBusinessDays("2026-10-16", 1)` (a Friday) gives Monday. */
export function addBusinessDays(date, n, options) {
  if (!Number.isInteger(n)) throw new TypeError("nl-calendar: n must be a whole number");
  let t = toTime(date);
  const step = n < 0 ? -1 : 1;
  let left = Math.abs(n);
  while (left > 0) {
    t += step * DAY;
    if (isBusinessDay(fromTime(t), options)) left--;
  }
  return fromTime(t);
}

/** The first working day on or after a date. */
export function nextBusinessDay(date, options) {
  let t = toTime(date);
  while (!isBusinessDay(fromTime(t), options)) t += DAY;
  return fromTime(t);
}

/** Working days after `from` up to and including `to` (negative when `to` is earlier). */
export function businessDaysBetween(from, to, options) {
  let a = toTime(from);
  const b = toTime(to);
  const step = b >= a ? 1 : -1;
  let count = 0;
  while (a !== b) {
    a += step * DAY;
    if (isBusinessDay(fromTime(a), options)) count += step;
  }
  return count;
}

/** ISO 8601 week: `{ year, week }`. The week starts on Monday and week 1 is the one with the first Thursday, so early January can belong to the previous year's week 52 or 53. */
export function isoWeek(date) {
  const t = toTime(date);
  const dow = weekdayOf(t) || 7;
  const thursday = t + (4 - dow) * DAY;
  const year = new Date(thursday).getUTCFullYear();
  const week = Math.floor((thursday - utc(year, 0, 1)) / DAY / 7) + 1;
  return { year, week };
}

/** 52 or 53. */
export function isoWeeksInYear(year) {
  return isoWeek(`${pad(year, 4)}-12-28`).week;
}

/** The Monday of the week that contains a date. */
export function weekStart(date) {
  const t = toTime(date);
  return fromTime(t - ((weekdayOf(t) || 7) - 1) * DAY);
}

/** The seven dates (Monday to Sunday) of an ISO week. */
export function weekDates(year, week) {
  if (!Number.isInteger(week) || week < 1 || week > isoWeeksInYear(year)) throw new RangeError(`nl-calendar: ${year} has ${isoWeeksInYear(year)} weeks`);
  const jan4 = toTime(`${pad(year, 4)}-01-04`);
  const monday = jan4 - ((weekdayOf(jan4) || 7) - 1) * DAY + (week - 1) * 7 * DAY;
  return Array.from({ length: 7 }, (_, i) => fromTime(monday + i * DAY));
}

/** The name of the weekday in Dutch (`"zaterdag"`) or another locale. */
export function dayName(date, locale = "nl-NL", style = "long") {
  return new Intl.DateTimeFormat(locale, { weekday: style, timeZone: "UTC" }).format(new Date(toTime(date)));
}

/** Days from one date to another (negative when `to` is earlier). The clock change does not matter: dates are calendar days. */
export function daysBetween(from, to) {
  return Math.round((toTime(to) - toTime(from)) / DAY);
}
