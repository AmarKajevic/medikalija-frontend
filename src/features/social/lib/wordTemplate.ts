// Word šabloni: provera polja u .docx fajlu i popunjavanje podacima korisnika (u pregledaču).
// docxtemplater se učitava tek kad zatreba. Polja u Wordu: {ime_prezime}, {jmbg}…; red tabele
// sa {#kontakti}{kontakt_ime} … {/kontakti} ponavlja se za svaki kontakt.
import type { MergeData, MergeField, MergeList } from "@features/social/dossier";

export interface TemplateCheck {
  /** Polja koja aplikacija zna da popuni */
  known: string[];
  /** Polja koja ne postoje u aplikaciji (verovatno greška u kucanju) — ostaće prazna */
  unknown: string[];
  /** Greške koje sprečavaju popunjavanje (npr. nezatvorena zagrada) */
  errors: string[];
}

const load = async () => {
  const [{ default: PizZip }, { default: Docxtemplater }] = await Promise.all([import("pizzip"), import("docxtemplater")]);
  return { PizZip, Docxtemplater };
};

/** Poruke docxtemplater grešaka na srpskom, sa nazivom polja gde je moguće */
function explain(err: unknown): string[] {
  const e = err as { properties?: { errors?: Array<{ properties?: { id?: string; xtag?: string; explanation?: string } }> }; message?: string };
  const list = e.properties?.errors ?? [];
  if (!list.length) return [e.message ?? "Šablon nije ispravan Word dokument."];
  return list.map(({ properties: p }) => {
    const tag = p?.xtag ? ` „${p.xtag}”` : "";
    switch (p?.id) {
      case "unopened_tag":
        return `Polje${tag} nema otvorenu zagradu „{”.`;
      case "unclosed_tag":
        return `Polje${tag} nema zatvorenu zagradu „}”.`;
      case "unclosed_loop":
      case "closing_tag_does_not_match_opening_tag":
        return `Tabela${tag} nije zatvorena kako treba — na kraju reda mora stajati {/${p?.xtag ?? "naziv"}}.`;
      case "duplicate_open_tag":
      case "duplicate_close_tag":
        return `Dupla zagrada kod polja${tag} — koristite jednu: {naziv}.`;
      default:
        return p?.explanation ?? "Greška u šablonu.";
    }
  });
}

/** Polja iz teksta dokumenta; polja unutar tabele dobijaju prefiks tabele ("kontakti.kontakt_ime") */
function tagsOf(text: string): string[] {
  const tags: string[] = [];
  const loops: string[] = [];
  for (const [, mark, raw] of text.matchAll(/\{([#/^]?)\s*([^{}]+?)\s*\}/g)) {
    const name = raw!;
    if (mark === "/") {
      loops.pop();
      continue;
    }
    tags.push(loops.length ? `${loops.join(".")}.${name}` : name);
    if (mark === "#" || mark === "^") loops.push(name);
  }
  return [...new Set(tags)];
}

/** Koja polja šablon koristi i da li ih aplikacija poznaje */
export async function checkTemplate(file: ArrayBuffer, catalog: { fields: MergeField[]; lists: MergeList[] }): Promise<TemplateCheck> {
  const { PizZip, Docxtemplater } = await load();
  let zip: InstanceType<typeof PizZip>;
  try {
    zip = new PizZip(file);
  } catch {
    return { known: [], unknown: [], errors: ["Fajl nije Word dokument (.docx)."] };
  }
  let text: string;
  try {
    text = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true }).getFullText();
  } catch (err) {
    return { known: [], unknown: [], errors: explain(err) };
  }
  const valid = new Set([...catalog.fields.map((f) => f.key), ...catalog.lists.flatMap((l) => [l.key, ...l.fields.map((f) => `${l.key}.${f.key}`)])]);
  const tags = tagsOf(text);
  return { known: tags.filter((t) => valid.has(t)), unknown: tags.filter((t) => !valid.has(t)).map((t) => t.split(".").pop()!), errors: [] };
}

/** Popunjen .docx (prazna polja ostaju prazna, ne "undefined") */
export async function fillTemplate(file: ArrayBuffer, data: MergeData): Promise<Blob> {
  const { PizZip, Docxtemplater } = await load();
  const zip = new PizZip(file);
  try {
    new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, nullGetter: () => "" }).render({ ...data.fields, ...data.lists });
  } catch (err) {
    throw new Error(explain(err).join(" "));
  }
  return zip.generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

/** Fajl iz pregledača → base64 (za slanje na server) */
export const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error ?? new Error("Fajl nije pročitan."));
    reader.readAsDataURL(file);
  });

/** Preuzimanje fajla bez dodatnih biblioteka */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "Ugovor o smeštaju" + "Petar Petrović" → "Ugovor o smeštaju - Petar Petrović.docx" */
export const filledFileName = (templateName: string, personName: string) => `${`${templateName} - ${personName}`.replace(/[\\/:*?"<>|]+/g, " ").trim()}.docx`;
