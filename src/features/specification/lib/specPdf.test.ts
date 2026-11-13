import { describe, expect, it, vi } from "vitest";

const captured: { doc?: unknown } = {};
vi.mock("pdfmake/build/pdfmake", () => ({ default: { createPdf: (doc: unknown) => { captured.doc = doc; return { getBlob: async () => new Blob(), print: () => {}, download: () => {} }; } } }));
vi.mock("pdfmake/build/vfs_fonts", () => ({ default: {} }));
vi.mock("@shared/lib/loadImageAsBase64", () => ({ loadImageAsBase64: async () => "" }));
vi.stubGlobal("URL", { ...URL, createObjectURL: () => "blob:x" });

import { generateSpecificationPDF } from "./generateSpecificationPDF";

const texts = (node: unknown): string[] =>
  node == null ? [] : typeof node === "string" ? [node] : Array.isArray(node) ? node.flatMap(texts) : typeof node === "object" ? Object.entries(node as Record<string, unknown>).flatMap(([k, v]) => (k === "text" && typeof v === "string" ? [v] : texts(v))) : [];

describe("PDF specifikacije: vanredna fizikalna terapija", () => {
  it("posebna tabela iznad specifikacije troškova i poseban red u obračunu", async () => {
    await generateSpecificationPDF({
      mode: "preview",
      patientName: "Milica Jovanović",
      startDate: "2026-09-25T00:00:00Z",
      endDate: "2026-10-24T00:00:00Z",
      items: [
        { formattedName: "Lab. analize - Kks+Crp", priceList: "420+750", amount: 1, price: 1170 },
        { formattedName: "Individualna aktivna fizikalna terapija (vanredna)", amount: 2, price: 2000, physio: true },
      ],
      debtEUR: 0, debtRSD: 0, lodgingEUR: 0, lodgingRSD: 0,
      specEUR: 31.7, specTotalRSD: 3170, totalRSD: 3170, totalEUR: 31.7,
      nextPeriodLabel: "",
      note: "Uplata do 10.",
      facility: { name: "Test dom", subtitle: "", logo: "" } as never,
    });
    const t = texts((captured.doc as { content: unknown }).content);
    const physioTitle = t.indexOf("Vanredna fizikalna terapija za period: 25.09.2026. – 24.10.2026.");
    const costsTitle = t.findIndex((x) => x.startsWith("Specifikacija troškova za period:"));
    expect(physioTitle).toBeGreaterThan(-1);
    expect(physioTitle).toBeLessThan(costsTitle);
    expect(t.indexOf("Individualna aktivna fizikalna terapija (vanredna)")).toBeLessThan(costsTitle);
    expect(t).toContain("Vanredna fizikalna terapija");
    expect(t).toContain("1.170,00"); // specifikacija troškova bez fizikalne
    expect(t).toContain("3.170,00"); // ukupno
    expect(t).toContain("Uplata do 10.");
    if (process.env.SPEC_PDF_OUT) (await import("node:fs")).writeFileSync(process.env.SPEC_PDF_OUT, JSON.stringify(captured.doc));
  });
});
