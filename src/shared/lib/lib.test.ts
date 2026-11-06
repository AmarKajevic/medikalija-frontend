import { describe, expect, it } from "vitest";
import { addCalendarDays, calendarYear, formatDay, getNextPeriod, toCalendarDay } from "./calendarDay";
import { formatEUR, formatQty, formatRSD, initials, roleLabel } from "./format";
import { normalizeSearch } from "./search";
import { getErrorMessage } from "./notify";

const key = (d: Date) => d.toISOString().slice(0, 10);

describe("calendarDay", () => {
  it("stare beogradske ponoći i UTC ponoć daju isti kalendarski dan", () => {
    expect(key(toCalendarDay("2026-06-09T22:00:00.000Z"))).toBe("2026-06-10"); // leto
    expect(key(toCalendarDay("2026-03-14T23:00:00.000Z"))).toBe("2026-03-15"); // zima
    expect(key(toCalendarDay("2026-03-15T00:00:00.000Z"))).toBe("2026-03-15");
  });

  it("formatira latinicom i bez pomeranja dana", () => {
    expect(formatDay("2026-06-09T22:00:00.000Z")).toBe("10.06.2026.");
    expect(formatDay(null)).toBe("");
    expect(formatDay("nije datum")).toBe("");
  });

  it("sledeći period ima 30 dana i preko prolećnog DST prelaza", () => {
    const { start, end } = getNextPeriod("2027-03-27T00:00:00.000Z");
    expect(key(start)).toBe("2027-03-28");
    expect(key(end)).toBe("2027-04-26");
  });

  it("februar prestupne godine", () => {
    expect(key(getNextPeriod("2028-01-31T00:00:00.000Z").end)).toBe("2028-03-01");
    expect(key(getNextPeriod("2027-01-31T00:00:00.000Z").end)).toBe("2027-03-02");
  });

  it("godina za grupisanje i sabiranje dana", () => {
    expect(calendarYear("2026-12-31T23:00:00.000Z")).toBe(2027);
    expect(key(addCalendarDays(toCalendarDay("2026-02-28"), 1))).toBe("2026-03-01");
  });
});

describe("format", () => {
  it("iznosi i količine u srpskom formatu", () => {
    expect(formatRSD(3036.5)).toBe("3.036,50 RSD");
    expect(formatEUR(1325.456)).toBe("1.325,46 €");
    expect(formatQty(0.33)).toBe("0,33");
    expect(formatRSD(undefined)).toBe("0,00 RSD");
  });

  it("inicijali i nazivi uloga", () => {
    expect(initials("Milica", "Jovanović")).toBe("MJ");
    expect(initials("ljubica", "živković")).toBe("LŽ");
    expect(roleLabel("main-nurse")).toBe("Glavna sestra");
    expect(roleLabel("Kitchen")).toBe("Kitchen");
  });
});

describe("search", () => {
  it("ignoriše velika slova i dijakritike", () => {
    expect(normalizeSearch("Živković Đorđe Čačak")).toBe("zivkovic djordje cacak");
    expect(normalizeSearch("ĆEVAPI")).toBe(normalizeSearch("cevapi"));
  });
});

describe("getErrorMessage", () => {
  it("čita poruku iz odgovora API-ja, inače rezervnu", () => {
    expect(getErrorMessage({ response: { data: { message: "Nedovoljno leka" } } })).toBe("Nedovoljno leka");
    expect(getErrorMessage({ response: { data: { error: "Neispravna lozinka" } } })).toBe("Neispravna lozinka");
    expect(getErrorMessage(new Error("mreža"), "Rezerva")).toBe("Rezerva");
  });
});
