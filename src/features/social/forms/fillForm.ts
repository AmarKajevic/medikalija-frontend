// Popuna obrazaca doma u pregledaču (docxtemplater, učitava se tek kad zatreba).
// Pravila: vrednosti se preslovljavaju u pismo obrasca; prazan podatak ostaje prazna linija
// (za ručni upis); oznake izbora ({#soba_1}…) su netačne dok nisu postavljene.
import { toCyrillic, toLatin } from "@shared/lib/script";
import type { MergeData } from "@features/social/dossier";
import type { SocialForm } from "./catalog";
import { LINE_TAG, lineCount, PAD_TAG, padFor, ROW_TAG } from "./lines";

/** Prazna linija za ručni upis kad podatak nije unet (datumi kraća, da raspored ostane kao u originalu) */
export const BLANK = "______________________";
export const BLANK_DATE = "______________";
const isDateField = (key: string) => /(^|_)(datum|danas)/.test(key) || /_datum$|_evaluacija$|_ponovna$/.test(key);

/** Polja koja se nikad ne preslovljavaju (brojevi, adrese e-pošte, oznake) */
const KEEP_SCRIPT = /email|viber|_lk$|jmbg|racun|broj_dosijea|broj_licne_karte/;
/** Rimski brojevi ("II stepen") ostaju latinicom i u ćiriličnom obrascu */
const ROMAN = /^[IVX]+\.?$/;

export function toFormScript(value: string, script: SocialForm["script"]) {
  if (script === "latin") return toLatin(value);
  return value
    .split(/(\s+)/)
    .map((w) => (ROMAN.test(w) ? w : toCyrillic(w)))
    .join("");
}

const loadLibs = async () => {
  const [{ default: PizZip }, { default: Docxtemplater }] = await Promise.all([import("pizzip"), import("docxtemplater")]);
  return { PizZip, Docxtemplater };
};

/** Fajl obrasca (statički, iz /public) */
export async function fetchFormTemplate(form: SocialForm): Promise<ArrayBuffer> {
  const res = await fetch(`/social-forms/${form.id}.docx`);
  if (!res.ok) throw new Error(`Obrazac „${form.title}” nije učitan.`);
  return res.arrayBuffer();
}

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Popunjen obrazac (.docx) za pregled i preuzimanje */
export async function fillForm(form: SocialForm, template: ArrayBuffer, data: MergeData): Promise<Blob> {
  return new Blob([await fillFormBuffer(form, template, data)], { type: DOCX_TYPE });
}

/** Popunjen obrazac kao bajtovi (paket, testovi) */
export async function fillFormBuffer(form: SocialForm, template: ArrayBuffer, data: MergeData): Promise<ArrayBuffer> {
  const { PizZip, Docxtemplater } = await loadLibs();
  const zip = new PizZip(template);
  const scope = { ...data.fields, ...data.lists, ...(data.flags ?? {}) };
  const parser = (tag: string) => {
    // {polje|linija:N} — vrednost na liniji od N crtica; {#polje|red:K:N} — K-ti red opisnog dela
    const line = LINE_TAG.exec(tag);
    const row = ROW_TAG.exec(tag);
    const pad = PAD_TAG.exec(tag);
    const key = line?.[1] ?? row?.[1] ?? pad?.[1] ?? tag;
    const script = (v: string) => (KEEP_SCRIPT.test(key) ? v : toFormScript(v, form.script));
    return {
      get(ctxScope: Record<string, unknown> | undefined, context?: { meta?: { part?: { module?: string } } }) {
        const value = key === "." ? ctxScope : ctxScope?.[key];
        if (context?.meta?.part?.module === "loop") {
          // Prazna linija opisnog dela ostaje dok tekst zauzima manje redova od nje
          if (row) return lineCount(typeof value === "string" ? script(value) : "", Number(row[3])) < Number(row[2]);
          // Uslov ili lista: nepostavljena oznaka je "netačno" (inače bi prazna linija bila "tačno")
          return value ?? false;
        }
        // Vrednost na liniji (podvučena) i posebno ostatak linije običnim crticama, kao u originalu
        if (line) return typeof value === "string" ? script(value) : "";
        if (pad) return padFor(typeof value === "string" ? script(value) : "", Number(pad[2]));
        if (value === undefined || value === null || value === "") return isDateField(key) ? BLANK_DATE : BLANK;
        if (typeof value !== "string") return value;
        return script(value);
      },
    };
  };
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, parser, nullGetter: () => BLANK });
  doc.render(scope);
  return zip.generate({ type: "arraybuffer", compression: "DEFLATE" });
}

/** Naziv fajla: "1.1 Zahtev za prijem — srodnik - Milica Jovanović.docx" */
export const formFileName = (form: SocialForm, personName: string) => `${`${/^\d/.test(form.number) ? `${form.number} ` : ""}${form.title} - ${personName}`.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim()}.docx`;

/** Više obrazaca u jednom .zip fajlu (paket za prijem) */
export async function fillPackage(forms: SocialForm[], data: MergeData, personName: string): Promise<Blob> {
  const { PizZip } = await loadLibs();
  const out = new PizZip();
  for (const form of forms) {
    out.file(formFileName(form, personName), await fillFormBuffer(form, await fetchFormTemplate(form), data));
  }
  return out.generate({ type: "blob", mimeType: "application/zip" });
}
