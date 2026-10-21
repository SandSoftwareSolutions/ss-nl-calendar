# @sandsoftwaresolutions/nl-calendar

[![CI](https://github.com/SandSoftwareSolutions/ss-nl-calendar/actions/workflows/ci.yml/badge.svg)](https://github.com/SandSoftwareSolutions/ss-nl-calendar/actions/workflows/ci.yml)

Dutch holidays, working days and ISO week numbers, without an online service and without time zone surprises. For rosters, delivery dates, "is the shop open on Monday". No dependencies.

## Install

```bash
npm install @sandsoftwaresolutions/nl-calendar
```

Works with `import` and `require()`, and ships TypeScript types for both.

## Usage

```js
import { holidays, holidayOn, isBusinessDay, addBusinessDays, isoWeek, weekDates, easter } from "@sandsoftwaresolutions/nl-calendar";

holidays(2026);                       // [{ id: "new-year", date: "2026-01-01", name: { nl: "Nieuwjaarsdag", en: "New Year's Day" }, official: true, dayOff: true }, ...]
holidayOn("2026-12-25");              // { id: "christmas", ... } or null
easter(2026);                         // "2026-04-05"

isBusinessDay("2026-04-06");          // false: Easter Monday
addBusinessDays("2026-12-24", 1);     // "2026-12-28": over Christmas, Boxing Day and the weekend
addBusinessDays("2026-10-16", 5, { include: ["good-friday"], extra: ["2026-10-19"] });   // your own days off too

isoWeek("2026-10-17");                // { year: 2026, week: 42 }
weekDates(2026, 42);                  // ["2026-10-12", ..., "2026-10-18"]  (Monday to Sunday)
```

## Dates

Dates are `"YYYY-MM-DD"` strings (a `Date` is read in UTC). That keeps everything free of time zones and daylight saving: `"2026-03-29"` is the same day in Amsterdam and in Auckland. Impossible dates (`2026-02-30`) throw.

## Holidays

The holidays have `official` (a national public holiday) and `dayOff` (most people really have the day off):

| Holiday | Rule |
| --- | --- |
| Nieuwjaarsdag | 1 January |
| Goede Vrijdag | 2 days before Easter. **Not official**, so not a day off by default; many companies close |
| Eerste en Tweede Paasdag | Easter Sunday and Monday |
| Koningsdag | 27 April, or 26 April when the 27th is a Sunday (Koninginnedag on 30 April, or 29 April, before 2014) |
| Bevrijdingsdag | 5 May, a day off **only every fifth year** (2025, 2030, ...) for most people |
| Hemelvaartsdag | 39 days after Easter |
| Eerste en Tweede Pinksterdag | 49 and 50 days after Easter |
| Eerste en Tweede Kerstdag | 25 and 26 December |

`isBusinessDay` counts the days where `dayOff` is true as holidays; add Good Friday or Liberation Day with `include`, and your own closing days with `extra`. Restaurants and shops can set `saturdayIsWorkday`.

Years 1980 to 2200. School holidays are not included: they are set per region each year.

## Weeks

`isoWeek` follows ISO 8601: weeks start on Monday and week 1 contains the first Thursday, so 1 January can be in week 52 or 53 of the previous year (`2021-01-03` is 2020-W53). Also `isoWeeksInYear`, `weekStart`, `dayName(date, "nl-NL")` and `daysBetween`.
