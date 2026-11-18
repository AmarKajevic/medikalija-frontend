// Obrasci doma: popuna pravih šablona (public/social-forms) — pismo, rod, izbor, prazne linije.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import PizZip from "pizzip";
import type { MergeData } from "@features/social/dossier";
import { admissionPackage, formById, formsFor, SOCIAL_FORMS } from "./catalog";
import { BLANK, fillFormBuffer as fillForm, toFormScript } from "./fillForm";
import { formStatus, missingFor } from "./status";
import type { SocialDocument } from "@features/social/dossier";

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

  it("zahtev srodnika (1.1): ćirilica, padež i rod korisnice, potpisnik; prazno ostaje linija", async () => {
    const form = formById("f11-zahtev-srodnik")!;
    const out = await textOf(
      await fillForm(
        form,
        template(form.id),
        data({ ime_prezime_akuz: "Milicu Jovanović", k_moga: "moju", K_rodjen: "Rođena", k_mu: "joj", k_njegovom: "njenom", datum_rodjenja: "07.08.1947.", podnosilac: "Stevan Jovanović", podnosilac_lk: "009876543" })
      )
    );
    expect(out).toContain("моју Милицу Јовановић"); // akuzativ
    expect(out).toContain("Рођена је");
    expect(out).toContain("Стеван Јовановић");
    expect(out).toContain("009876543");
    expect(out).toContain(BLANK); // adresa nije uneta
    expect(out).not.toMatch(/\{|\}/);
  });

  it("ugovor (latinica): izabrana soba i kategorija su označene, ostale ne; obveznik samo kad postoji", async () => {
    const form = formById("f900-ugovor-o-smestaju")!;
    const xml = async (flags: Record<string, boolean>) => {
      const zip = new PizZip(await fillForm(form, template(form.id), data({ ime: "Milica", obveznik_ime: "Stevan", obveznik_jmbg: "1203975710018" }, flags)));
      return zip.file("word/document.xml")!.asText();
    };
    const marked = await xml({ soba_2: true, kat_3: true, obveznik_postoji: true });
    const text = marked.replace(/<[^>]+>/g, "");
    expect(text.match(/Dvokrevetnoj sobi\./g)).toHaveLength(1);
    expect(text).toContain("Stevan");
    expect(text.match(/1203975710018/g)).toHaveLength(2); // kolona obveznika i potpis "2.Srodnik"
    expect(text).toContain("PIB:106082895");
    // Izabrano je podebljano i podvučeno, ostale stavke nisu
    const para = (needle: string) => marked.split("</w:p>").find((p) => p.replace(/<[^>]+>/g, "").includes(needle)) ?? "";
    expect(para("Dvokrevetnoj sobi.")).toContain("<w:b/>");
    expect(para("Dvokrevetnoj sobi.")).toContain('<w:u w:val="single"/>');
    expect(para("Jednokrevetnoj sobi.")).not.toContain("<w:b/>");
    const self = (await xml({ obveznik_postoji: false })).replace(/<[^>]+>/g, "");
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

describe("stanje obrasca — šta je stvarno spremno", () => {
  const full = (extra: Record<string, string> = {}) => ({ broj_dosijea: "SR-1", ...extra });
  const doc = (status: "draft" | "final") => ({ _id: "d", type: "intake", status, date: "2026-09-02T00:00:00.000Z" }) as SocialDocument;

  it("list praćenja nije spreman dok radnik ne upiše aktivnosti", () => {
    const form = formById("f00-list-pracenja")!;
    expect(formStatus(form, { data: data(full()), applicant: "", discharged: false })).toMatchObject({ tone: "warning", label: "nema upisanih aktivnosti", next: "activity" });
    const withNotes = data(full(), {}, { beleske: [{ beleska_datum: "05.09.2026.", beleska_tekst: "Prijem" }, { beleska_datum: "06.09.2026.", beleska_tekst: "Razgovor" }] });
    expect(formStatus(form, { data: withNotes, applicant: "", discharged: false })).toMatchObject({ tone: "info", label: "2 aktivnosti" });
  });

  it("stručni dokument: nije napisano → nacrt → zaključeno", () => {
    const form = formById("f20-prijemna-procena")!;
    const d = data({ ime_roditelja: "Marko", datum_rodjenja: "1.1.1940.", datum_prijema: "5.9.2026." });
    expect(formStatus(form, { data: d, applicant: "", doc: null, discharged: false })).toMatchObject({ label: "nije napisano", next: "write" });
    expect(formStatus(form, { data: d, applicant: "", doc: doc("draft"), discharged: false }).label).toBe("nacrt 02.09.2026.");
    expect(formStatus(form, { data: d, applicant: "", doc: doc("final"), discharged: false })).toMatchObject({ tone: "success", label: "zaključeno 02.09.2026." });
  });

  it("ugovor: soba i kategorija moraju biti izabrane; podaci obveznika samo kad obveznik postoji", () => {
    const form = formById("f900-ugovor-o-smestaju")!;
    const d = data({ jmbg: "1", broj_licne_karte: "2", adresa: "Beograd", cena_eur: "900" });
    expect(missingFor(form, d)).toEqual(["kategorija sobe (čl. 2)", "kategorija korisnika (čl. 3)"]);
    expect(missingFor(form, data(d.fields, { soba_1: true, kat_2: true }))).toEqual([]);
    expect(missingFor(form, data(d.fields, { soba_1: true, kat_2: true, obveznik_postoji: true }))).toEqual([
      "ime i prezime obveznika",
      "JMBG obveznika",
      "lična karta obveznika",
      "adresa obveznika",
      "telefon obveznika",
    ]);
  });

  it("prestanak smeštaja: odluka važi tek posle otpusta, izjava nakon smrti samo uz taj osnov", () => {
    const decision = formById("f140-odluka-o-prestanku")!;
    const death = formById("f150-izjava-nakon-smrti")!;
    expect(formStatus(decision, { data: data({}), applicant: "", discharged: false })).toMatchObject({ inactive: true, label: "važi posle otpusta" });
    expect(formStatus(decision, { data: data({ datum_otpusta: "1.11.2026." }), applicant: "", discharged: true }).missing).toEqual(["osnov prestanka smeštaja"]);
    expect(formStatus(death, { data: data({ datum_otpusta: "1.11.2026." }, { prestanak_6: true }), applicant: "", discharged: true }).inactive).toBe(true);
    expect(formStatus(death, { data: data({ datum_otpusta: "1.11.2026." }, { prestanak_7: true }), applicant: "", discharged: true })).toMatchObject({ tone: "success", label: "spremno" });
  });
});
