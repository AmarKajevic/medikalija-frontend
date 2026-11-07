import { describe, expect, it } from "vitest";
import { matchesSearch, searchRank } from "./search";

describe("pretraga po počecima reči", () => {
  it("traži od početka reči, ne slova usred reči", () => {
    expect(matchesSearch("Milica Jovanović", "mil")).toBe(true);
    expect(matchesSearch("Kamila Živković", "mil")).toBe(false);
    expect(matchesSearch("Milica Jovanović", "an")).toBe(false);
    expect(matchesSearch("Andol 100mg", "an")).toBe(true);
  });

  it("više reči u bilo kom redosledu", () => {
    expect(matchesSearch("Milica Jovanović", "jov mil")).toBe(true);
    expect(matchesSearch("Milica Jovanović", "mil kam")).toBe(false);
  });

  it("bez obzira na kvačice i pismo", () => {
    expect(matchesSearch("Kamila Živković", "zivk")).toBe(true);
    expect(matchesSearch("Камила Живковић", "zivk")).toBe(true);
    expect(matchesSearch("Đorđe Petrović", "djo")).toBe(true);
  });

  it("prazan upit prolazi sve", () => {
    expect(matchesSearch("bilo šta", "  ")).toBe(true);
  });

  it("rezultati koji počinju upitom idu prvi", () => {
    expect(searchRank("Milica Jovanović", "mil")).toBe(0);
    expect(searchRank("Jovanović Milica", "mil")).toBe(2);
  });
});
