import { describe, expect, it } from "vitest";
import { lineCount, onLine, textUnits } from "./lines";

describe("vrednosti na linijama obrazaca", () => {
  it("prazno polje je linija iz originala (crtica kraće, da ne pređe u novi red)", () => {
    expect(onLine("", 40)).toBe("_".repeat(39));
  });

  it("kratka vrednost stoji na liniji, a linija se dopunjava do iste dužine", () => {
    const out = onLine("Илић Марко", 40);
    expect(out.startsWith("Илић Марко")).toBe(true);
    const pad = out.length - "Илић Марко".length;
    expect(pad).toBeGreaterThan(20);
    // Vrednost + dopuna nikad nije duža od linije
    expect(textUnits("Илић Марко") + pad).toBeLessThanOrEqual(40);
  });

  it("vrednost duža od linije ili u više redova se ne dopunjuje", () => {
    expect(onLine("средња стручна спрема и још много текста", 12)).toBe("средња стручна спрема и још много текста");
    expect(onLine("1. Prvi cilj\n2. Drugi cilj", 80)).toBe("1. Prvi cilj\n2. Drugi cilj");
  });

  it("broj redova: prelom po rečima i novi redovi", () => {
    expect(lineCount("", 80)).toBe(0);
    expect(lineCount("Kratko.", 80)).toBe(1);
    expect(lineCount("1. Prvi\n2. Drugi\n3. Treći", 80)).toBe(3);
    expect(lineCount(Array(30).fill("reč").join(" "), 40)).toBeGreaterThan(2);
  });
});
