// Popunjen socijalni karton (struktura kao kod ustanove) → šablon → popunjen za drugog korisnika.
import { describe, expect, it } from "vitest";
import PizZip from "pizzip";
import { autoTemplate, norm } from "./autoTemplate";
import { fillTemplate } from "./wordTemplate";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const p = (text: string, opts: { bold?: boolean; style?: string } = {}) =>
  `<w:p>${opts.style ? `<w:pPr><w:pStyle w:val="${opts.style}"/></w:pPr>` : ""}<w:r>${opts.bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
// Oznaka podebljana, vrednost u posebnom run-u — kao kad se kuca u Wordu
const labeled = (label: string, value: string) =>
  `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${esc(label)}: </w:t></w:r><w:r><w:t xml:space="preserve">${esc(value)}</w:t></w:r></w:p>`;
const h = (text: string) => p(text, { style: "Heading2" });
const row = (...cells: string[]) => `<w:tr>${cells.map((c) => `<w:tc>${p(c)}</w:tc>`).join("")}</w:tr>`;
const table = (...rows: string[][]) => `<w:tbl>${rows.map((r) => row(...r)).join("")}</w:tbl>`;

function docx(body: string, header?: string) {
  const zip = new PizZip();
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/></Types>'
  );
  zip.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  const ns = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8"?><w:document ${ns}><w:body>${body}</w:body></w:document>`);
  if (header) zip.file("word/header1.xml", `<?xml version="1.0" encoding="UTF-8"?><w:hdr ${ns}>${p(header)}</w:hdr>`);
  return zip.generate({ type: "arraybuffer" });
}

const xmlOf = (buf: ArrayBuffer, part = "word/document.xml") => new PizZip(buf).file(part)!.asText();
const textOf = (buf: ArrayBuffer, part = "word/document.xml") =>
  xmlOf(buf, part)
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&");
const blobToBuffer = (blob: Blob) =>
  new Promise<ArrayBuffer>((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.readAsArrayBuffer(blob);
  });

// Isti raspored kao "Socijalni karton korisnika" ustanove (podaci su izmišljeni)
const KARTON = docx(
  [
    p("SOCIJALNI KARTON KORISNIKA", { bold: true }),
    table(["Broj dosijea", "SR-2026/087"], ["Datum otvaranja kartona", "14.03.2026."], ["Socijalni radnik", "Jelena Marković, dipl. soc. radnik"], ["Datum poslednje izmene", "05.11.2026."]),
    h("1. Osnovni podaci o korisniku"),
    table(
      ["Ime i prezime", "Milica Jovanović (rođ. Petrović)"],
      ["Datum i mesto rođenja", "22.07.1941., Kraljevo"],
      ["JMBG", "2207941XXXXXX"],
      ["Pol", "Ženski"],
      ["Bračno stanje", "Udovica (suprug preminuo 2019.)"],
      ["Zanimanje pre penzije", "Knjigovođa"],
      ["Adresa pre prijema", "Ul. Primer 12/4, Beograd"],
      ["Smeštaj", "Odeljenje B, soba 214"],
      ["Osnov smeštaja", "Ugovor o smeštaju br. 112/2026"],
      ["Omiljeno jelo", "Sarma"]
    ),
    h("2. Srodnici i kontakt osobe"),
    table(["Ime i prezime", "Srodstvo", "Telefon", "Napomena"], ["Nikola Jovanović", "Sin", "06X", "Primarna kontakt osoba"], ["Ana Ilić", "Ćerka", "+49", "Nemačka"]),
    h("3. Socijalna anamneza"),
    p("Korisnica je rođena i odrasla u Kraljevu, kao starija od dve ćerke u radničkoj porodici, i radila je kao knjigovođa."),
    p("Do 2019. godine živela je sa suprugom u sopstvenom stanu, a nakon njegove smrti sama, uz podršku sina."),
    h("4. Funkcionalni status (socijalni aspekt)"),
    table(["Pokretljivost", "Kreće se uz hodalicu"], ["Lična higijena i oblačenje", "Delimično samostalna"], ["Ishrana", "Samostalna"], ["Raspoloženje na prijemu", "Povremeno povučena"]),
    p("Napomena: zdravstveni podaci vode se u medicinskoj dokumentaciji Doma."),
    h("5. Procena potreba i snaga"),
    p("Snage korisnice:", { bold: true }),
    p("Očuvane kognitivne sposobnosti i dobra komunikacija"),
    p("Podržavajuća porodica i redovne posete sina"),
    p("Identifikovane potrebe:", { bold: true }),
    p("Lakša adaptacija na život u kolektivnom smeštaju"),
    h("6. Individualni plan usluga"),
    table(["Oblast", "Cilj", "Aktivnosti", "Nosilac", "Rok"], ["Adaptacija", "Oseća se sigurno", "Razgovori 1× nedeljno", "Soc. radnik", "06/2026"], ["Slobodno vreme", "Aktivnosti", "Radionica", "Radni terapeut", "Kontinuirano"]),
    h("7. Službene beleške"),
    table(["Datum", "Beleška"], ["14.03.2026.", "Prijem korisnice u pratnji sina."], ["21.03.2026.", "Individualni razgovor."]),
    h("8. Lična dokumenta i prava"),
    table(["Dokument / pravo", "Status", "Napomena"], ["Lična karta", "Važeća", "Kopija u dosijeu"]),
    h("9. Zaključak socijalnog radnika"),
    p("Korisnica se uspešno adaptirala na uslove smeštaja i uključena je u aktivnosti Doma, uz redovne posete porodice."),
    p("______________________________"),
    p("Korisnica / zakonski zastupnik"),
    p("Milica Jovanović"),
    p("Jelena Marković, dipl. soc. radnik"),
    labeled("Mesto i datum", "U Beogradu, 05.11.2026."),
    p("U Beogradu, 05.11.2026.        M.P."),
  ].join(""),
  "POVERLJIVO – Socijalni karton br. SR-2026/087"
);

describe("autoTemplate", () => {
  it("oznake se prepoznaju bez obzira na kvačice, brojeve naslova i dvotačku", () => {
    expect(norm("3. Socijalna anamneza:")).toBe("socijalna anamneza");
    expect(norm("Bračno  stanje")).toBe("bracno stanje");
    expect(norm("Đorđe")).toBe("djordje");
  });

  it("prepoznaje podatke, tabele, poglavlja i ponavljanja imena; nepoznato ostaje i prijavljuje se", () => {
    const { detections, unrecognized, output } = autoTemplate(KARTON);
    const byLabel = Object.fromEntries(detections.map((d) => [d.label, d.field]));
    expect(byLabel).toMatchObject({
      "Broj dosijea": "broj_dosijea",
      "Datum otvaranja kartona": "datum_prijema",
      "Socijalni radnik": "socijalni_radnik",
      "Datum poslednje izmene": "danas",
      "Ime i prezime": "ime_prezime",
      "Datum i mesto rođenja": "datum_i_mesto_rodjenja",
      JMBG: "jmbg",
      "Bračno stanje": "bracni_status",
      "Zanimanje pre penzije": "zanimanje",
      "Adresa pre prijema": "adresa",
      Smeštaj: "smestaj",
      "Osnov smeštaja": "osnov_smestaja_opis",
      "Srodnici i kontakt osobe": "kontakti",
      "3. Socijalna anamneza": "anamneza",
      "4. Funkcionalni status (socijalni aspekt)": "briga_o_sebi,psihicko_stanje,komunikacija",
      "5. Procena potreba i snaga": "snage,potrebe",
      "Individualni plan (ciljevi)": "ciljevi",
      "Službene beleške": "beleske",
      "9. Zaključak socijalnog radnika": "zakljucak",
    });
    expect(unrecognized).toEqual(['Red „Omiljeno jelo”', "Tabela „dokument / pravo | status | napomena”"]);

    const text = textOf(output);
    expect(text).not.toMatch(/Milica|2207941|Knjigovođa|Kraljevu|Nikola Jovanović|hodalicu|Podržavajuća|Oseća se sigurno|Prijem korisnice/);
    expect(text).toContain("Sarma"); // nepoznat red ostaje
    expect(text).toContain("Lična karta"); // nepoznata tabela ostaje
    expect(text).toContain("Korisnica / zakonski zastupnik"); // potpisi ostaju
    expect(text).toContain("U Beogradu, {danas}        M.P."); // datum ispod potpisa postaje današnji
    expect(text).toContain("Napomena: zdravstveni podaci"); // opšta napomena ostaje
    expect(textOf(output, "word/header1.xml")).toContain("Socijalni karton br. {broj_dosijea}");
    expect(xmlOf(output)).toContain("{#kontakti}{kontakt_ime}");
    expect(xmlOf(output)).toContain("{kontakt_napomena}{/kontakti}");
    expect(xmlOf(output)).toContain("{#ciljevi}{oblast}");
    expect(xmlOf(output)).toContain("{rok}{/ciljevi}");
    expect(xmlOf(output)).toMatch(/<w:b\/><\/w:rPr><w:t xml:space="preserve">Mesto i datum: </); // oznaka zadržava format
  });

  it("korisnik može da isključi zamenu ili izabere drugo polje", () => {
    const first = autoTemplate(KARTON);
    const opening = first.detections.find((d) => d.label === "Datum otvaranja kartona")!;
    const name = first.detections.find((d) => d.label === "Ime i prezime")!;
    const { output, detections } = autoTemplate(KARTON, { [opening.id]: null, [name.id]: "prezime" });
    expect(detections.find((d) => d.id === opening.id)!.field).toBeNull();
    expect(textOf(output)).toContain("14.03.2026.");
    expect(textOf(output)).toContain("{prezime}");
  });

  it("šablon se popunjava podacima drugog korisnika: tabele dobijaju onoliko redova koliko korisnik ima", async () => {
    const { output } = autoTemplate(KARTON);
    const filled = await fillTemplate(output, {
      fields: {
        ime_prezime: "Petar Petrović",
        broj_dosijea: "SR-2026/101",
        jmbg: "0101940710015",
        anamneza: "Rođen u Nišu.",
        snage: "Vedar.",
        potrebe: "Društvo.",
        briga_o_sebi: "Samostalan.",
        socijalni_radnik: "Vesna Socijalna",
        danas: "11.11.2026.",
      },
      lists: {
        kontakti: [{ kontakt_ime: "Marko Petrović", kontakt_srodstvo: "sin", kontakt_telefon: "064", kontakt_napomena: "" }],
        ciljevi: [],
        beleske: [{ beleska_datum: "01.11.2026.", beleska_naslov: "", beleska: "Prijem." }],
      },
    });
    const buf = await blobToBuffer(filled);
    const text = textOf(buf);
    expect(text).toContain("Petar Petrović");
    expect(text).toContain("Rođen u Nišu.");
    expect(text).toContain("Marko Petrović");
    expect(text).toContain("Snage korisnika:");
    expect(text).not.toContain("Milica");
    expect(textOf(buf, "word/header1.xml")).toContain("SR-2026/101");
    expect(text).not.toMatch(/\{[a-z_#/]+\}/); // nijedno polje nije ostalo nepopunjeno
  });

  it("odbija fajl koji nije Word dokument", () => {
    const zip = new PizZip();
    zip.file("nesto.txt", "x");
    expect(() => autoTemplate(zip.generate({ type: "arraybuffer" }))).toThrow(/nije Word/);
  });
});
