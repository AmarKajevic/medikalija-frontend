// Kalendarski dani (prijem, otpust, periodi specifikacija).
//
// Backend ih čuva kao UTC ponoć (2026-03-15T00:00:00.000Z). Stariji zapisi
// mogu biti sačuvani kao beogradska ponoć (2026-03-14T23:00:00.000Z), pa se
// vrednost uvek zaokružuje na najbližu UTC ponoć i formatira u UTC zoni.
// Tako prikaz i računanje ne zavise od vremenske zone browsera niti od
// letnjeg/zimskog računanja vremena.

const DAY_MS = 24 * 60 * 60 * 1000;
export const SPEC_PERIOD_DAYS = 30;

export const toCalendarDay = (value: string | Date): Date => {
  const time = new Date(value).getTime();
  return new Date(Math.round(time / DAY_MS) * DAY_MS);
};

export const addCalendarDays = (day: Date, days: number): Date =>
  new Date(day.getTime() + days * DAY_MS);

export const formatDay = (value: string | Date | null | undefined): string => {
  if (!value) return "";
  const day = toCalendarDay(value);
  if (isNaN(day.getTime())) return "";
  // Uvek dan.mesec.godina (06.11.2026.), nezavisno od jezika browsera
  const dd = String(day.getUTCDate()).padStart(2, "0");
  const mm = String(day.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${day.getUTCFullYear()}.`;
};

export const calendarYear = (value: string | Date): number =>
  toCalendarDay(value).getUTCFullYear();

// Period koji se nadovezuje na period koji se završava sa `endDate`
// (isto pravilo kao na backendu: dan posle kraja + 30 kalendarskih dana).
export const getNextPeriod = (endDate: string | Date) => {
  const start = addCalendarDays(toCalendarDay(endDate), 1);
  return { start, end: addCalendarDays(start, SPEC_PERIOD_DAYS - 1) };
};
