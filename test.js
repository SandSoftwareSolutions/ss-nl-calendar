import assert from "node:assert/strict";
import { test } from "node:test";

import { addBusinessDays, businessDaysBetween, dayName, daysBetween, easter, holidayOn, holidays, isBusinessDay, isoWeek, isoWeeksInYear, isWeekend, nextBusinessDay, toDateString, weekDates, weekStart } from "./src/index.js";

test("Easter matches the known dates", () => {
  const known = { 1999: "1999-04-04", 2000: "2000-04-23", 2008: "2008-03-23", 2016: "2016-03-27", 2019: "2019-04-21", 2024: "2024-03-31", 2025: "2025-04-20", 2026: "2026-04-05", 2027: "2027-03-28", 2038: "2038-04-25" };
  for (const [year, date] of Object.entries(known)) assert.equal(easter(Number(year)), date, year);
  assert.throws(() => easter(1500), RangeError);
});

test("the holidays of 2026", () => {
  const list = holidays(2026).map((h) => [h.id, h.date, h.dayOff]);
  assert.deepEqual(list, [
    ["new-year", "2026-01-01", true], ["good-friday", "2026-04-03", false], ["easter-sunday", "2026-04-05", true], ["easter-monday", "2026-04-06", true],
    ["kings-day", "2026-04-27", true], ["liberation-day", "2026-05-05", false], ["ascension", "2026-05-14", true], ["whit-sunday", "2026-05-24", true],
    ["whit-monday", "2026-05-25", true], ["christmas", "2026-12-25", true], ["boxing-day", "2026-12-26", true]
  ]);
  assert.equal(holidays(2026)[0].name.nl, "Nieuwjaarsdag");
  assert.equal(holidays(2026)[4].name.en, "King's Day");
});

test("King's Day moves back to Saturday when 27 April is a Sunday; Queen's Day before 2014", () => {
  assert.equal(holidays(2025).find((h) => h.id === "kings-day").date, "2025-04-26");
  assert.equal(holidays(2014).find((h) => h.id === "kings-day").date, "2014-04-26");
  assert.equal(holidays(2013).find((h) => h.id === "kings-day").date, "2013-04-30");
  assert.equal(holidays(2013).find((h) => h.id === "kings-day").name.nl, "Koninginnedag");
  assert.equal(holidays(2008).find((h) => h.id === "kings-day").date, "2008-04-30");
  assert.equal(holidays(2003).find((h) => h.id === "kings-day").date, "2003-04-30");
  assert.equal(holidays(2008 + 0).length, 11);
  assert.throws(() => holidays(1900), RangeError);
});

test("Liberation Day is a day off every fifth year", () => {
  for (const year of [2020, 2025, 2030]) assert.equal(holidays(year).find((h) => h.id === "liberation-day").dayOff, true, String(year));
  for (const year of [2026, 2027, 2028, 2029]) assert.equal(holidays(year).find((h) => h.id === "liberation-day").dayOff, false, String(year));
});

test("holidayOn", () => {
  assert.equal(holidayOn("2026-12-25").id, "christmas");
  assert.equal(holidayOn("2026-04-03"), null);
  assert.equal(holidayOn("2026-04-03", { all: true }).id, "good-friday");
  assert.equal(holidayOn(new Date(Date.UTC(2026, 11, 26))).id, "boxing-day");
  assert.equal(holidayOn("2026-10-17"), null);
  assert.equal(holidayOn("1950-12-25"), null);
});

test("working days", () => {
  assert.equal(isWeekend("2026-10-17"), true); // Saturday
  assert.equal(isWeekend("2026-10-19"), false);
  assert.equal(isBusinessDay("2026-10-16"), true);
  assert.equal(isBusinessDay("2026-10-17"), false);
  assert.equal(isBusinessDay("2026-04-06"), false); // Easter Monday
  assert.equal(isBusinessDay("2026-04-03"), true); // Good Friday: not official
  assert.equal(isBusinessDay("2026-04-03", { include: ["good-friday"] }), false);
  assert.equal(isBusinessDay("2026-10-19", { extra: ["2026-10-19"] }), false);
  assert.equal(isBusinessDay("2026-10-17", { saturdayIsWorkday: true }), true);
  assert.equal(isBusinessDay("2026-10-18", { saturdayIsWorkday: true }), false);
});

test("add and count working days across weekends and holidays", () => {
  assert.equal(addBusinessDays("2026-10-16", 1), "2026-10-19"); // Friday -> Monday
  assert.equal(addBusinessDays("2026-10-16", 5), "2026-10-23");
  assert.equal(addBusinessDays("2026-10-19", -1), "2026-10-16");
  assert.equal(addBusinessDays("2026-04-02", 1), "2026-04-03"); // Thursday -> Good Friday counts as working
  assert.equal(addBusinessDays("2026-04-03", 1), "2026-04-07"); // over Easter weekend and Easter Monday
  assert.equal(addBusinessDays("2026-12-24", 1), "2026-12-28"); // over Christmas, Boxing Day and the weekend
  assert.equal(addBusinessDays("2026-10-16", 0), "2026-10-16");
  assert.equal(nextBusinessDay("2026-10-17"), "2026-10-19");
  assert.equal(nextBusinessDay("2026-10-19"), "2026-10-19");
  assert.equal(businessDaysBetween("2026-10-16", "2026-10-23"), 5);
  assert.equal(businessDaysBetween("2026-10-23", "2026-10-16"), -5);
  assert.equal(businessDaysBetween("2026-10-16", "2026-10-16"), 0);
  assert.equal(businessDaysBetween("2026-04-03", "2026-04-07"), 1);
  assert.throws(() => addBusinessDays("2026-10-16", 1.5), TypeError);
});

test("ISO weeks", () => {
  const cases = { "2026-01-01": [2026, 1], "2024-12-30": [2025, 1], "2021-01-03": [2020, 53], "2020-12-31": [2020, 53], "2026-10-17": [2026, 42], "2018-12-31": [2019, 1], "2016-01-01": [2015, 53], "2026-12-31": [2026, 53] };
  for (const [date, [year, week]] of Object.entries(cases)) assert.deepEqual(isoWeek(date), { year, week }, date);
  assert.equal(isoWeeksInYear(2020), 53);
  assert.equal(isoWeeksInYear(2025), 52);
  assert.equal(isoWeeksInYear(2026), 53);
});

test("week start and week dates", () => {
  assert.equal(weekStart("2026-10-17"), "2026-10-12");
  assert.equal(weekStart("2026-10-18"), "2026-10-12");
  assert.equal(weekStart("2026-10-12"), "2026-10-12");
  assert.deepEqual(weekDates(2026, 42), ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"]);
  assert.deepEqual(weekDates(2025, 1)[0], "2024-12-30");
  assert.throws(() => weekDates(2025, 53), RangeError);
  for (const [y, w] of [[2026, 1], [2026, 53], [2020, 53], [2027, 10]]) assert.deepEqual(isoWeek(weekDates(y, w)[3]), { year: y, week: w });
});

test("dates are strict and time zones do not matter", () => {
  assert.equal(toDateString(new Date(Date.UTC(2026, 0, 31, 23, 30))), "2026-01-31");
  for (const bad of ["2026-02-30", "2026-13-01", "26-01-01", "2026-1-1", "", null, 5, new Date("x")]) assert.throws(() => toDateString(bad), /date|exist|invalid/i, String(bad));
  assert.equal(daysBetween("2026-03-28", "2026-03-30"), 2); // over the clock change
  assert.equal(daysBetween("2026-10-17", "2026-10-10"), -7);
  assert.equal(dayName("2026-10-17"), "zaterdag");
  assert.equal(dayName("2026-10-17", "en-GB"), "Saturday");
  assert.equal(dayName("2026-10-19", "nl-NL", "short"), "ma");
});
