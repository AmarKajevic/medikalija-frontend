import { describe, expect, it } from "vitest";
import { navigationFor } from "./navigation";
import { isManager, paths } from "./paths";
import { stockStatus } from "@features/inventory/model";
import { eventColorClass, normalizeEventColor } from "@features/calendar/colors";

const labels = (role: string) => navigationFor(role).flatMap((g) => g.items.map((i) => i.label));

describe("navigacija po ulogama", () => {
  it("sestra vidi samo stranice kojima ima pristup", () => {
    expect(labels("nurse")).toEqual(["Početna", "Pacijenti", "Unos nege", "Artikli", "Porodične zalihe"]);
  });

  it("doktor ima isti pristup kao sestra (ranije nije mogao ni da uđe)", () => {
    expect(labels("doctor")).toEqual(labels("nurse"));
  });

  it("uprava vidi sve, uključujući lekove, rezervu i korisnike", () => {
    for (const role of ["admin", "main-nurse"]) {
      expect(labels(role)).toEqual(expect.arrayContaining(["Lekovi", "Rezerva lekova", "Korisnici", "Analize", "Kalendar"]));
    }
  });

  it("odobravanje unosa i katalog usluga vidi samo uprava", () => {
    expect(labels("nurse")).not.toContain("Za odobrenje");
    expect(labels("nurse")).not.toContain("Usluge nege");
    expect(labels("main-nurse")).toEqual(expect.arrayContaining(["Za odobrenje", "Usluge nege", "Unos nege"]));
  });

  it("podešavanja ustanove vidi samo direktor", () => {
    expect(labels("admin")).toContain("Podešavanja");
    expect(labels("main-nurse")).not.toContain("Podešavanja");
  });

  it("nepoznata uloga ne dobija ništa", () => {
    expect(navigationFor("Kitchen")).toEqual([]);
    expect(navigationFor(undefined)).toEqual([]);
  });

  it("prazne grupe se ne prikazuju", () => {
    expect(navigationFor("nurse").map((g) => g.label)).toEqual([undefined, "Zalihe"]);
  });
});

describe("putanje i uloge", () => {
  it("putanje sa parametrom", () => {
    expect(paths.patient("abc")).toBe("/patients/abc");
    expect(paths.patientSpecifications("abc")).toBe("/patients/abc/specifications");
  });

  it("uprava = admin i glavna sestra", () => {
    expect(isManager("admin")).toBe(true);
    expect(isManager("main-nurse")).toBe(true);
    expect(isManager("nurse")).toBe(false);
    expect(isManager(undefined)).toBe(false);
  });
});

describe("pomoćne funkcije domena", () => {
  it("status zalihe", () => {
    expect(stockStatus(0)).toBe("out");
    expect(stockStatus(-1)).toBe("out");
    expect(stockStatus(10)).toBe("low");
    expect(stockStatus(11)).toBe("ok");
  });

  it("boje događaja: stari engleski ključevi daju istu boju kao novi", () => {
    expect(normalizeEventColor("Danger")).toBe("crvena");
    expect(eventColorClass("Danger")).toBe(eventColorClass("crvena"));
    expect(normalizeEventColor("nepoznato")).toBe("zelena");
  });
});
