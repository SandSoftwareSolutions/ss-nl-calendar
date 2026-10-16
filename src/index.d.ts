export type DateInput = string | Date;

export interface Holiday {
  id: "new-year" | "good-friday" | "easter-sunday" | "easter-monday" | "kings-day" | "liberation-day" | "ascension" | "whit-sunday" | "whit-monday" | "christmas" | "boxing-day";
  date: string;
  name: { nl: string; en: string };
  /** A national public holiday. */
  official: boolean;
  /** Most people have the day off (Liberation Day: every fifth year only). */
  dayOff: boolean;
}

export interface BusinessOptions {
  /** Holiday ids to count as days off too, such as "good-friday". */
  include?: readonly Holiday["id"][];
  /** More days off, for example company closing days. */
  extra?: readonly DateInput[];
  /** Restaurants and shops work on Saturdays. */
  saturdayIsWorkday?: boolean;
}

export function toDateString(date: DateInput): string;
export function easter(year: number): string;
export function holidays(year: number): Holiday[];
export function holidayOn(date: DateInput, options?: { all?: boolean }): Holiday | null;
export function isWeekend(date: DateInput): boolean;
export function isBusinessDay(date: DateInput, options?: BusinessOptions): boolean;
export function addBusinessDays(date: DateInput, n: number, options?: BusinessOptions): string;
export function nextBusinessDay(date: DateInput, options?: BusinessOptions): string;
export function businessDaysBetween(from: DateInput, to: DateInput, options?: BusinessOptions): number;
export function isoWeek(date: DateInput): { year: number; week: number };
export function isoWeeksInYear(year: number): number;
export function weekStart(date: DateInput): string;
export function weekDates(year: number, week: number): string[];
export function dayName(date: DateInput, locale?: string, style?: "long" | "short" | "narrow"): string;
export function daysBetween(from: DateInput, to: DateInput): number;
