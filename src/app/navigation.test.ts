import { describe, expect, it } from "vitest";
import { navigationFor } from "./navigation";
import { isManager, paths } from "./paths";
import { stockStatus } from "@features/inventory/model";
import { eventColorClass, normalizeEventColor } from "@features/calendar/colors";

const labels = (role: string) => navigationFor(role).flatMap((g) => g.items.map((i) => i.label));

describe("navigacija po ulogama", () => {
  it("sestra vidi samo stranice kojima ima pristup", () => {
    expect(labels("nurse")).toEqual(["Početna", "Korisnici", "Unos nege", "Kalendar", "Artikli", "Porodične zalihe"]);
  });

  it("doktor: pacijenti, kalendar i lekarski izveštaji, bez zaliha i nege", () => {
    expect(labels("doctor")).toEqual(["Početna", "Korisnici", "Kalendar", "Lekarski izveštaji", "Socijalni karton"]);
  });

  it("socijalni radnik: pacijenti, kalendar i socijalni karton", () => {
    expect(labels("social-worker")).toEqual(["Početna", "Korisnici", "Kalendar", "Socijalni karton"]);
  });

  it("uprava vidi sve, uključujući lekove, rezervu i osoblje", () => {
    for (const role of ["admin", "main-nurse"]) {
      expect(labels(role)).toEqual(expect.arrayContaining(["Lekovi", "Rezerva lekova", "Osoblje", "Analize", "Kalendar"]));
    }
  });

  it("odobravanje unosa i šablone i cene vidi samo uprava", () => {
    expect(labels("nurse")).not.toContain("Za odobrenje");
    expect(labels("nurse")).not.toContain("Šabloni i cene");
    expect(labels("main-nurse")).toEqual(expect.arrayContaining(["Za odobrenje", "Šabloni i cene", "Unos nege", "Dnevnik nege"]));
    expect(labels("nurse")).not.toContain("Dnevnik nege");
  });

  it("šabloni i cenovnici su jedna stavka menija umesto šest", () => {
    for (const old of ["Šabloni dijagnoza", "Usluge nege", "Cene smeštaja", "Cene fizikalne terapije", "Stručne usluge", "Drugi troškovi"]) {
      expect(labels("admin")).not.toContain(old);
    }
    expect(labels("admin").filter((l) => l === "Šabloni i cene")).toHaveLength(1);
    expect(paths.physioPrices).toBe("/templates/physio");
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
