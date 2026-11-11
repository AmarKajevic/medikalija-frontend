// Popunjen Word dokument (npr. socijalni karton jednog korisnika) → šablon za sve korisnike.
//
// Prepoznaje:
//  - parove "Oznaka | vrednost" u tabelama i redove "Oznaka: vrednost" u tekstu (Ime i prezime, JMBG…)
//  - tabele sa više redova po zaglavlju (srodnici, ciljevi plana, službene beleške) → red se ponavlja
//  - poglavlja sa opisom (Socijalna anamneza, Procena potreba i snaga, Funkcionalni status, Zaključak)
//  - dalja pojavljivanja imena, JMBG-a i broja dosijea (potpis, zaglavlje strane)
// Ono što nije prepoznato ostaje kao u originalu i prikazuje se kao napomena za proveru.
import PizZip from "pizzip";

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

export type DetectionKind = "value" | "list" | "section" | "text";

export interface Detection {
  id: string;
  kind: DetectionKind;
  /** Oznaka iz dokumenta ("Ime i prezime", "Socijalna anamneza", "Srodnici…") */
  label: string;
  /** Vrednost iz originala (skraćeno), da se vidi šta se menja */
  sample: string;
  /** Polje ili tabela iz aplikacije; null = ne menja se */
  field: string | null;
}

export interface AutoTemplateResult {
  detections: Detection[];
  /** Delovi koji nisu prepoznati i ostaju kao u originalu */
  unrecognized: string[];
  /** Gotov šablon (.docx) sa izabranim zamenama */
  output: ArrayBuffer;
}

// ── Rečnik oznaka ───────────────────────────────────────────────────────

/** mala slova, bez kvačica i interpunkcije na krajevima */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^\s*\d+[.)]\s*/, "")
    .replace(/[:.*\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

const LABELS: Array<[string[], string]> = [
  [["ime i prezime", "ime i prezime korisnika", "ime i prezime korisnice", "prezime i ime", "korisnik", "korisnica"], "ime_prezime"],
  [["ime"], "ime"],
  [["prezime"], "prezime"],
  [["jmbg", "maticni broj", "jedinstveni maticni broj gradjana"], "jmbg"],
  [["datum rodjenja"], "datum_rodjenja"],
  [["datum i mesto rodjenja"], "datum_i_mesto_rodjenja"],
  [["mesto rodjenja"], "mesto_rodjenja"],
  [["ime roditelja", "ime jednog roditelja", "ime oca", "ime majke"], "ime_roditelja"],
  [["pol"], "pol"],
  [["bracno stanje", "bracni status"], "bracni_status"],
  [["obrazovanje", "strucna sprema", "skolska sprema"], "obrazovanje"],
  [["zanimanje", "zanimanje pre penzije"], "zanimanje"],
  [["prihodi", "izvor prihoda", "primanja"], "prihodi"],
  [["penzija", "vrsta penzije"], "penzija"],
  [["adresa", "adresa pre prijema", "adresa prebivalista", "prebivaliste", "adresa stanovanja"], "adresa"],
  [["opstina", "opstina prebivalista"], "opstina"],
  [["drzavljanstvo"], "drzavljanstvo"],
  [["broj licne karte", "licna karta broj", "br. licne karte"], "broj_licne_karte"],
  [["lbo", "broj zdravstvene knjizice", "broj zdravstvene kartice", "zdravstvena knjizica"], "lbo"],
  [["izabrani lekar"], "izabrani_lekar"],
  [["datum prijema", "datum prijema u dom", "datum prijema u ustanovu", "datum otvaranja kartona", "datum otvaranja dosijea"], "datum_prijema"],
  [["smestaj", "soba", "odeljenje", "smestaj u domu"], "smestaj"],
  [["stepen podrske", "kategorija", "kategorija korisnika"], "stepen_podrske"],
  [["osnov smestaja", "osnov prijema"], "osnov_smestaja_opis"],
  [["broj dosijea", "broj kartona", "broj socijalnog kartona", "dosije broj"], "broj_dosijea"],
  [["socijalni radnik", "strucni radnik"], "socijalni_radnik"],
  [["datum poslednje izmene", "datum izrade", "datum sastavljanja"], "danas"],
  [["poslovna sposobnost"], "poslovna_sposobnost"],
  [["staratelj", "zakonski zastupnik"], "staratelj"],
  [["osoba od poverenja"], "osoba_od_poverenja"],
  [["centar za socijalni rad", "csr", "nadlezni csr"], "csr"],
  [["voditelj slucaja"], "voditelj_slucaja"],
  [["zaduzeni zaposleni", "zaduzeni radnik"], "zaduzeni_zaposleni"],
  [["kontakt osoba", "primarna kontakt osoba"], "kontakt_osoba"],
  [["hitni kontakt"], "hitni_kontakt"],
  [["ustanova", "naziv ustanove"], "ustanova"],
];
const LABEL_FIELD = new Map(LABELS.flatMap(([names, field]) => names.map((n) => [n, field] as const)));

/** Poglavlja sa opisom: tekst ispod naslova postaje polje iz poslednje procene */
type SectionRule = { kind: "prose"; field: string } | { kind: "lines"; lines: Array<{ label: string; field: string }> };
const SECTIONS: Array<[string[], SectionRule]> = [
  [["socijalna anamneza", "anamneza"], { kind: "prose", field: "anamneza" }],
  [["zakljucak", "zakljucak socijalnog radnika", "zakljucak procene", "misljenje socijalnog radnika"], { kind: "prose", field: "zakljucak" }],
  [
    ["procena potreba i snaga", "procena snaga i potreba", "snage i potrebe"],
    { kind: "lines", lines: [{ label: "Snage korisnika:", field: "snage" }, { label: "Identifikovane potrebe:", field: "potrebe" }] },
  ],
  [
    ["funkcionalni status", "funkcionalni status (socijalni aspekt)", "funkcionalna sposobnost"],
    {
      kind: "lines",
      lines: [
        { label: "Briga o sebi", field: "briga_o_sebi" },
        { label: "Kognitivno i psihičko stanje", field: "psihicko_stanje" },
        { label: "Komunikacija", field: "komunikacija" },
      ],
    },
  ],
  [["rizici", "procena rizika"], { kind: "prose", field: "rizici" }],
  [["porodica i socijalne veze", "socijalne veze"], { kind: "prose", field: "porodica_i_veze" }],
];
const SECTION_RULE = new Map(SECTIONS.flatMap(([names, rule]) => names.map((n) => [n, rule] as const)));

/** Tabele sa više redova: prepoznaju se po zaglavlju, a kolone po nazivu */
const LISTS: Array<{ key: string; label: string; match: (h: string[]) => boolean; columns: Array<[RegExp, string]> }> = [
  {
    key: "kontakti",
    label: "Srodnici i kontakt osobe",
    match: (h) => h.some((c) => /^(ime|ime i prezime|clan porodice|srodnik)$/.test(c)) && h.some((c) => /srodstvo|telefon|odnos/.test(c)),
    columns: [
      [/srodstvo|odnos/, "kontakt_srodstvo"],
      [/telefon|tel/, "kontakt_telefon"],
      [/e-?mail|e-?posta/, "kontakt_email"],
      [/adresa/, "kontakt_adresa"],
      [/napomena/, "kontakt_napomena"],
      [/ime/, "kontakt_ime"],
    ],
  },
  {
    key: "ciljevi",
    label: "Individualni plan (ciljevi)",
    match: (h) => h.some((c) => /^cilj/.test(c)) && h.some((c) => /aktivnost|rok|nosilac|odgovor/.test(c)),
    columns: [
      [/^(r\.? ?b|#|redni)/, "rb"],
      [/oblast/, "oblast"],
      [/ishod/, "ishod"],
      [/aktivnost/, "aktivnosti"],
      [/nosilac|odgovor|zaduzen/, "odgovorni"],
      [/rok/, "rok"],
      [/cilj/, "cilj"],
    ],
  },
  {
    key: "beleske",
    label: "Službene beleške",
    match: (h) => h.some((c) => /beleska|zabeleska|opis/.test(c)) && h.some((c) => /datum/.test(c)),
    columns: [
      [/datum/, "beleska_datum"],
      [/naslov|vrsta/, "beleska_naslov"],
      [/beleska|zabeleska|opis/, "beleska"],
    ],
  },
];

/** Polja čija se vrednost traži i u ostatku teksta (potpis, zaglavlje strane) */
const REPEATED = new Set(["ime_prezime", "jmbg", "broj_dosijea", "socijalni_radnik"]);
const NAME_FIELDS = new Set(["ime_prezime", "socijalni_radnik"]);

// ── Rad sa Word XML-om ──────────────────────────────────────────────────

const kids = (el: Element, local: string) => Array.from(el.childNodes).filter((n): n is Element => n.nodeType === 1 && (n as Element).localName === local);
const all = (el: Element | Document, local: string) => Array.from(el.getElementsByTagNameNS(W, local));
const textOf = (el: Element) =>
  all(el, "p")
    .map((p) => all(p, "t").map((t) => t.textContent ?? "").join(""))
    .join("\n")
    .trim();
const paraText = (p: Element) => all(p, "t").map((t) => t.textContent ?? "").join("");
const short = (s: string, max = 70) => (s.length > max ? `${s.slice(0, max - 1)}…` : s).replace(/\s+/g, " ");

function makeRun(doc: Document, text: string, rPr?: Element | null) {
  const r = doc.createElementNS(W, "w:r");
  if (rPr) r.appendChild(rPr.cloneNode(true));
  const t = doc.createElementNS(W, "w:t");
  t.setAttribute("xml:space", "preserve");
  t.textContent = text;
  r.appendChild(t);
  return r;
}

/** Ceo pasus dobija novi tekst, sa formatom prvog dela teksta (podebljano, font…) */
function setParagraphText(p: Element, text: string) {
  const firstRun = all(p, "r").find((r) => all(r, "t").length) ?? all(p, "r")[0];
  const rPr = firstRun ? kids(firstRun, "rPr")[0] : null;
  for (const child of Array.from(p.childNodes)) if ((child as Element).localName !== "pPr") p.removeChild(child);
  p.appendChild(makeRun(p.ownerDocument, text, rPr));
}

/** Ćelija tabele dobija tekst u prvom pasusu; ostali pasusi se brišu */
function setCellText(tc: Element, text: string) {
  const paras = kids(tc, "p");
  if (!paras.length) {
    const p = tc.ownerDocument.createElementNS(W, "w:p");
    tc.appendChild(p);
    paras.push(p);
  }
  setParagraphText(paras[0]!, text);
  for (const extra of paras.slice(1)) tc.removeChild(extra);
}

/** "Oznaka: vrednost" u pasusu → oznaka ostaje (sa svojim formatom), vrednost postaje polje */
function setValueAfterColon(p: Element, placeholder: string) {
  const runs = all(p, "r");
  let seen = "";
  for (let i = 0; i < runs.length; i++) {
    const ts = all(runs[i]!, "t");
    const text = ts.map((t) => t.textContent ?? "").join("");
    const at = text.indexOf(":");
    if (at >= 0 && !seen.includes(":")) {
      // Ovaj run: zadrži do dvotačke, a vrednost ide u novi run sa formatom sledećeg dela
      const valueRun = runs[i + 1] ?? runs[i]!;
      const rPr = kids(valueRun, "rPr")[0] ?? null;
      ts.forEach((t, j) => (t.textContent = j === 0 ? `${text.slice(0, at + 1)} ` : ""));
      for (const r of runs.slice(i + 1)) r.parentNode?.removeChild(r);
      p.appendChild(makeRun(p.ownerDocument, placeholder, rPr));
      return;
    }
    seen += text;
  }
}

/** Zameni sva pojavljivanja vrednosti u pasusu; u jednom run-u čuva format, inače prepisuje pasus */
function replaceInParagraph(p: Element, sample: string, placeholder: string): boolean {
  const full = paraText(p);
  if (!full.includes(sample)) return false;
  let done = false;
  for (const t of all(p, "t")) {
    if ((t.textContent ?? "").includes(sample)) {
      t.textContent = (t.textContent ?? "").split(sample).join(placeholder);
      t.setAttribute("xml:space", "preserve");
      done = true;
    }
  }
  if (!done || paraText(p).includes(sample)) setParagraphText(p, full.split(sample).join(placeholder));
  return true;
}

const isHeading = (p: Element) => {
  const style = kids(p, "pPr")[0]?.getElementsByTagNameNS(W, "pStyle")[0]?.getAttributeNS(W, "val") ?? "";
  const text = paraText(p).trim();
  return /heading|naslov/i.test(style) || (/^\d+[.)]\s+\S/.test(text) && text.length < 90);
};

// ── Glavna funkcija ─────────────────────────────────────────────────────

/**
 * Pravi šablon od popunjenog dokumenta. `overrides`: id prepoznavanja → drugo polje ili null (ne menjaj).
 * Isti ulaz i isti `overrides` uvek daju iste id-jeve, pa se izbor korisnika može ponovo primeniti.
 */
export function autoTemplate(file: ArrayBuffer, overrides: Record<string, string | null> = {}): AutoTemplateResult {
  const zip = new PizZip(file);
  const parts = Object.keys(zip.files).filter((n) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(n));
  if (!parts.includes("word/document.xml")) throw new Error("Fajl nije Word dokument (.docx).");

  const detections: Detection[] = [];
  const unrecognized: string[] = [];
  const repeated: Array<{ id: string; sample: string }> = [];
  let counter = 0;
  const detect = (kind: DetectionKind, label: string, sample: string, field: string) => {
    const id = `${kind}-${counter++}`;
    const chosen = id in overrides ? overrides[id]! : field;
    detections.push({ id, kind, label, sample: short(sample), field: chosen });
    return chosen;
  };

  const docs = new Map(parts.map((name) => [name, new DOMParser().parseFromString(zip.file(name)!.asText(), "application/xml")]));
  const body = docs.get("word/document.xml")!.getElementsByTagNameNS(W, "body")[0]!;

  const blocks = () => Array.from(body.childNodes).filter((n): n is Element => n.nodeType === 1 && ((n as Element).localName === "p" || (n as Element).localName === "tbl"));
  const handledTables = new Set<Element>();

  // 1) Poglavlja: naslov + tekst ispod (anamneza, procena, funkcionalni status, zaključak)
  const list0 = blocks();
  for (let i = 0; i < list0.length; i++) {
    const heading = list0[i]!;
    if (heading.localName !== "p" || !heading.parentNode) continue;
    const title = paraText(heading).trim();
    const rule = isHeading(heading) || title.length < 60 ? SECTION_RULE.get(norm(title)) : undefined;
    if (!rule) continue;
    const content: Element[] = [];
    for (let j = i + 1; j < list0.length && !(list0[j]!.localName === "p" && isHeading(list0[j]!)); j++) content.push(list0[j]!);

    if (rule.kind === "prose") {
      // Opis: uzastopni duži pasusi (potpisi i kratki redovi ispod ostaju)
      const prose: Element[] = [];
      for (const el of content) {
        const t = el.localName === "p" ? paraText(el).trim() : "";
        if (el.localName !== "p" || (t && t.length < 40)) break;
        prose.push(el);
      }
      const filled = prose.filter((p) => paraText(p).trim());
      if (!filled.length) continue;
      const field = detect("section", title, filled.map(paraText).join(" "), rule.field);
      if (field) {
        setParagraphText(filled[0]!, `{${field}}`);
        for (const p of prose) if (p !== filled[0]) p.parentNode?.removeChild(p);
      }
      continue;
    }

    const tableAt = content.findIndex((el) => el.localName === "tbl");
    const table = tableAt >= 0 ? content[tableAt]! : null;
    const paras = (tableAt >= 0 ? content.slice(0, tableAt) : content).filter((el) => el.localName === "p" && paraText(el).trim());
    const sample = table ? textOf(table) : paras.map(paraText).join(" ");
    if (!sample) continue;
    if (table) handledTables.add(table);
    const field = detect("section", title, sample, rule.lines.map((l) => l.field).join(","));
    if (!field) continue;
    const lines = field.split(",").map((f) => rule.lines.find((l) => l.field === f) ?? { label: f, field: f });
    if (table) {
      // Tabela "oznaka | opis": prvi redovi dobijaju oznake i polja, ostali se brišu
      const rows = kids(table, "tr");
      lines.forEach((line, k) => {
        let tr = rows[k];
        if (!tr) {
          tr = rows[0]!.cloneNode(true) as Element;
          table.appendChild(tr);
        }
        const cells = kids(tr, "tc");
        setCellText(cells[0]!, line.label);
        if (cells[1]) setCellText(cells[1], `{${line.field}}`);
      });
      for (const extra of rows.slice(lines.length)) table.removeChild(extra);
    } else {
      // Pasusi: "Oznaka:" (format prvog pasusa) pa polje (format drugog); stari pasusi se brišu
      const labelTpl = paras[0]!;
      const valueTpl = paras[1] ?? paras[0]!;
      for (const line of lines) {
        const l = labelTpl.cloneNode(true) as Element;
        setParagraphText(l, line.label);
        const v = valueTpl.cloneNode(true) as Element;
        setParagraphText(v, `{${line.field}}`);
        labelTpl.parentNode!.insertBefore(l, labelTpl);
        labelTpl.parentNode!.insertBefore(v, labelTpl);
      }
      for (const p of paras) p.parentNode?.removeChild(p);
    }
  }

  // 2) Tabele: liste po zaglavlju (redovi se ponavljaju), ili parovi "oznaka | vrednost"
  for (const tbl of all(body, "tbl")) {
    if (handledTables.has(tbl)) continue;
    const rows = kids(tbl, "tr");
    if (!rows.length) continue;
    const header = kids(rows[0]!, "tc").map((c) => norm(textOf(c)));
    const list = LISTS.find((l) => l.match(header));
    if (list && rows.length >= 2) {
      const field = detect("list", list.label, `${rows.length - 1} red(ova): ${textOf(rows[1]!)}`, list.key);
      if (field) {
        const cells = kids(rows[1]!, "tc");
        cells.forEach((tc, i) => {
          const col = list.columns.find(([re]) => re.test(header[i] ?? ""))?.[1];
          const inner = col ? `{${col}}` : "";
          setCellText(tc, `${i === 0 ? `{#${field}}` : ""}${inner}${i === cells.length - 1 ? `{/${field}}` : ""}`);
        });
        for (const extra of rows.slice(2)) tbl.removeChild(extra);
      }
      continue;
    }
    let matched = 0;
    const leftovers: string[] = [];
    for (const tr of rows) {
      const cells = kids(tr, "tc");
      if (cells.length < 2) continue;
      const label = textOf(cells[0]!);
      const key = LABEL_FIELD.get(norm(label));
      if (!key) {
        if (label) leftovers.push(label);
        continue;
      }
      matched++;
      const sample = textOf(cells[1]!);
      const field = detect("value", label, sample, key);
      if (field) {
        setCellText(cells[1]!, `{${field}}`);
        for (const extra of cells.slice(2)) setCellText(extra, "");
        if (REPEATED.has(field) && sample) repeated.push({ id: field, sample });
      }
    }
    if (!matched) unrecognized.push(`Tabela „${short(header.filter(Boolean).join(" | ") || textOf(rows[0]!), 60)}”`);
    else unrecognized.push(...leftovers.map((l) => `Red „${short(l, 40)}”`));
  }

  // 3) Redovi "Oznaka: vrednost" u tekstu
  for (const block of blocks()) {
    if (block.localName !== "p") continue;
    const m = /^([^:]{2,40}):\s*(\S.*)$/.exec(paraText(block).trim());
    const key = m ? LABEL_FIELD.get(norm(m[1]!)) : undefined;
    if (!m || !key) continue;
    const field = detect("value", m[1]!.trim(), m[2]!, key);
    if (field) {
      setValueAfterColon(block, `{${field}}`);
      if (REPEATED.has(field)) repeated.push({ id: field, sample: m[2]!.trim() });
    }
  }

  // 4) Red "U Beogradu, 05.11.2026." (mesto i datum ispod potpisa) → današnji datum
  for (const d of docs.values()) {
    for (const p of all(d, "p")) {
      const m = /^\s*[Uu]\s+[^,\d]{2,30},\s*(\d{1,2}\.\s?\d{1,2}\.\s?\d{4}\.?)/.exec(paraText(p));
      if (!m) continue;
      const field = detect("text", "Mesto i datum", m[1]!, "danas");
      if (field) replaceInParagraph(p, m[1]!, `{${field}}`);
    }
  }

  // 5) Ista vrednost u ostatku dokumenta (potpis, zaglavlje strane): ime, JMBG, broj dosijea
  const seen = new Set<string>();
  for (const { id: field, sample } of repeated) {
    // "Milica Jovanović (rođ. Petrović)" → "Milica Jovanović"; "Jelena Marković, dipl. soc. radnik" → "Jelena Marković"
    const core = NAME_FIELDS.has(field) ? sample.split(/[,(]/)[0]!.trim().split(/\s+/).slice(0, 2).join(" ") : sample.trim();
    if (core.length < 4 || seen.has(core)) continue;
    seen.add(core);
    const hits: Element[] = [];
    for (const d of docs.values()) for (const p of all(d, "p")) if (paraText(p).includes(core)) hits.push(p);
    if (!hits.length) continue;
    const chosen = detect("text", `Dalje u tekstu (${hits.length}×)`, core, field);
    if (chosen) for (const p of hits) replaceInParagraph(p, core, `{${chosen}}`);
  }

  const serializer = new XMLSerializer();
  for (const [name, d] of docs) zip.file(name, serializer.serializeToString(d));
  return { detections, unrecognized, output: zip.generate({ type: "arraybuffer" }) };
}
