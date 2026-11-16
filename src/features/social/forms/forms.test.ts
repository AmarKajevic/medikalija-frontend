// Obrasci doma: popuna pravih šablona (public/social-forms) — pismo, rod, izbor, prazne linije.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import PizZip from "pizzip";
import type { MergeData } from "@features/social/dossier";
import { admissionPackage, formById, formsFor, SOCIAL_FORMS } from "./catalog";
import { BLANK, fillFormBuffer as fillForm, missingFor, toFormScript } from "./fillForm";

const template = (id: string) => {
  const buf = readFileSync(resolve(__dirname, "../../../../public/social-forms", `${id}.docx`));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
};
/** Čist tekst popunjenog dokumenta */
const textOf = async (buf: ArrayBuffer) => {
  const zip = new PizZip(buf);
  return zip.file("word/document.xml")!.asText().replace(/<[^>]+>/g, "");
};

const data = (fields: Record<string, string>, flags: Record<string, boolean> = {}, lists: MergeData["lists"] = {}): MergeData => ({ fields, flags, lists });

describe("katalog obrazaca", () => {
  it("svaki obrazac iz kataloga postoji kao šablon", () => {
    for (const f of SOCIAL_FORMS) expect(() => template(f.id), f.id).not.toThrow();
  });

  it("varijante po podnosiocu: korisnik dobija 1.0/5.0/6.0, srodnik 1.1/5.1/6.1; dok nije izabrano — obe", () => {
    const self = formsFor("self").map((f) => f.number);
    expect(self).toEqual(expect.arrayContaining(["1.0", "5.0", "6.0"]));
    expect(self).not.toContain("1.1");
    const relative = formsFor("relative").map((f) => f.number);
    expect(relative).toEqual(expect.arrayContaining(["1.1", "5.1", "6.1"]));
    expect(relative).not.toContain("5.0");
    expect(formsFor("").map((f) => f.number)).toEqual(expect.arrayContaining(["1.0", "1.1"]));
    expect(admissionPackage("relative").every((f) => f.group === "admission")).toBe(true);
  });

  it("nedostajući podaci", () => {
    const form = formById("f30-odluka-o-smestaju")!;
    expect(missingFor(form, data({ mesto_dolaska: "Beograd", datum_prijema: "05.09.2026." }))).toEqual(["podnosilac zahteva", "datum zahteva"]);
  });
});

describe("popuna", () => {
  it("pismo obrasca: ćirilica, a rimski brojevi i e-adrese ostaju", () => {
    expect(toFormScript("Milica Jovanović", "cyrillic")).toBe("Милица Јовановић");
    expect(toFormScript("II stepen", "cyrillic")).toBe("II степен");
    expect(toFormScript("Милица", "latin")).toBe("Milica");
  });

  it("zahtev srodnika (1.1): ćirilica, rod korisnice, potpisnik; prazno ostaje linija", async () => {
    const form = formById("f11-zahtev-srodnik")!;
    const out = await textOf(
      await fillForm(
        form,
        template(form.id),
        data({ ime_prezime: "Milica Jovanović", k_moga: "moju", K_rodjen: "Rođena", k_mu: "joj", k_njegovom: "njenom", datum_rodjenja: "07.08.1947.", podnosilac: "Stevan Jovanović", podnosilac_lk: "009876543" })
      )
    );
    expect(out).toContain("моју Милица Јовановић");
    expect(out).toContain("Рођена је");
    expect(out).toContain("Стеван Јовановић");
    expect(out).toContain("009876543");
    expect(out).toContain(BLANK); // adresa nije uneta
    expect(out).not.toMatch(/\{|\}/);
  });

  it("ugovor (latinica): izabrana soba i kategorija su označene, ostale ne; obveznik samo kad je srodnik", async () => {
    const form = formById("f900-ugovor-o-smestaju")!;
    const xml = async (flags: Record<string, boolean>) => {
      const zip = new PizZip(await fillForm(form, template(form.id), data({ ime: "Milica", podnosilac_ime: "Stevan" }, flags)));
      return zip.file("word/document.xml")!.asText();
    };
    const marked = await xml({ soba_2: true, kat_3: true, podnosilac_srodnik: true });
    const text = marked.replace(/<[^>]+>/g, "");
    expect(text.match(/Dvokrevetnoj sobi\./g)).toHaveLength(1);
    expect(text).toContain("Stevan");
    expect(text).toContain("PIB:106082895");
    // Izabrano je podebljano i podvučeno, ostale stavke nisu
    const para = (needle: string) => marked.split("</w:p>").find((p) => p.replace(/<[^>]+>/g, "").includes(needle)) ?? "";
    expect(para("Dvokrevetnoj sobi.")).toContain("<w:b/>");
    expect(para("Dvokrevetnoj sobi.")).toContain('<w:u w:val="single"/>');
    expect(para("Jednokrevetnoj sobi.")).not.toContain("<w:b/>");
    const self = (await xml({ podnosilac_srodnik: false })).replace(/<[^>]+>/g, "");
    expect(self).not.toContain("Stevan");
  });

  it("list praćenja (0): beleške kao redovi tabele, broj dosijea ostaje latinicom", async () => {
    const form = formById("f00-list-pracenja")!;
    const out = await textOf(
      await fillForm(form, template(form.id), data({ broj_dosijea: "SR-2026/087", ime_prezime: "Milica Jovanović" }, {}, { beleske: [{ beleska_datum: "05.09.2026.", beleska_tekst: "Prijem" }, { beleska_datum: "20.09.2026.", beleska_tekst: "Adaptacija" }] }))
    );
    expect(out).toContain("SR-2026/087");
    expect(out).toContain("05.09.2026.Пријем");
    expect(out).toContain("20.09.2026.Адаптација");
  });

  it("svi obrasci se popunjavaju bez greške i bez zaostalih oznaka, i kad podaci nisu uneti", async () => {
    for (const form of SOCIAL_FORMS) {
      const out = await textOf(await fillForm(form, template(form.id), data({})));
      expect(out, form.id).not.toMatch(/\{[#/^]?[a-zA-Z_]+\}/);
    }
  });
});
