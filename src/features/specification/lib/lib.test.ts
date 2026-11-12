import { afterEach, describe, expect, it, vi } from "vitest";
import { computeBilling } from "./billing";
import { periodProgress } from "./period";
import { categoryOf, itemDisplayName, itemNameParts } from "./items";
import type { Specification, SpecificationItem } from "@features/specification/types/types";

describe("computeBilling", () => {
  it("specifikacija po nižem, dug i smeštaj po srednjem kursu", () => {
    const r = computeBilling({ specTotalRSD: 2974, debtEUR: 100, lodgingEUR: 1200, lowerRate: 116.8, middleRate: 117.2 });
    expect(r.specEUR).toBeCloseTo(25.46, 2);
    expect(r.debtRSD).toBeCloseTo(11720, 6);
    expect(r.lodgingRSD).toBeCloseTo(140640, 6);
    expect(r.totalRSD).toBeCloseTo(155334, 6);
    expect(r.totalEUR).toBeCloseTo(1325.46, 2);
  });

  it("bez kursa ne deli nulom", () => {
    const r = computeBilling({ specTotalRSD: 1000, debtEUR: 10, lodgingEUR: 0, lowerRate: 0, middleRate: 0 });
    expect(r.specEUR).toBe(0);
    expect(r.debtRSD).toBe(0);
    expect(Number.isFinite(r.totalEUR)).toBe(true);
  });
});

describe("periodProgress", () => {
  afterEach(() => vi.useRealTimers());
  const spec = { startDate: "2026-10-25T00:00:00.000Z", endDate: "2026-11-23T00:00:00.000Z" } as Specification;

  it("broji kalendarske dane perioda", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 6, 10, 0));
    expect(periodProgress(spec)).toEqual({ total: 30, elapsed: 13, remaining: 17 });
  });

  it("ne izlazi van granica perioda", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 0, 1));
    expect(periodProgress(spec)).toEqual({ total: 30, elapsed: 30, remaining: 0 });
  });
});

describe("stavke specifikacije", () => {
  const item = (over: Partial<SpecificationItem>): SpecificationItem => ({ _id: "1", name: "X", amount: 1, price: 0, ...over });

  it("nepoznata kategorija ide u 'other'", () => {
    expect(categoryOf(item({ category: "medicine" }))).toBe("medicine");
    expect(categoryOf(item({ category: "nesto" }))).toBe("other");
    expect(categoryOf(item({}))).toBe("other");
  });

  it("kombinacija se u PDF-u ispisuje sa analizama i cenama", () => {
    const combo = item({
      category: "combination",
      name: "Upalni",
      analyses: [
        { _id: "a", name: "KKS", price: 450 },
        { _id: "b", name: "CRP", price: 600 },
      ],
    });
    expect(itemDisplayName(combo)).toBe("Upalni - KKS+CRP = 450+600");
    expect(itemDisplayName(item({ name: "Andol" }))).toBe("Andol");
  });

  it("kombinacija: analiza bez cene ne stavlja 0 na početak; decimalne cene sa zarezom", () => {
    const combo = item({
      category: "combination",
      name: "6-Lab analize i patronaža",
      analyses: [
        { _id: "v", name: "Vađenje krvi", price: 0 },
        { _id: "a", name: "KKS", price: 420 },
        { _id: "b", name: "CRP", price: 190.5 },
      ],
    });
    expect(itemDisplayName(combo)).toBe("6-Lab analize i patronaža - Vađenje krvi+KKS+CRP = 420+190,50");
    // Na štampi se cene štampaju posebno (sitnije od naziva)
    expect(itemNameParts(combo)).toEqual({ text: "6-Lab analize i patronaža - Vađenje krvi+KKS+CRP", prices: "420+190,50" });
    expect(itemNameParts(item({ name: "Andol" }))).toEqual({ text: "Andol", prices: "" });
  });
});
