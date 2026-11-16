// Obrasci doma u postupku smeštaja (Word šabloni u /public/social-forms, napravljeni od originala doma).
// Jedan registar: redosled, grupa, pismo obrasca, odakle dolazi sadržaj, koji podaci su potrebni i kada obrazac važi.
import type { ApplicantKind, DocType } from "@features/social/dossier";

export type FormGroup = "admission" | "professional" | "end";

export const FORM_GROUPS: Record<FormGroup, { label: string; hint: string }> = {
  admission: { label: "Prijem", hint: "Zahtev, odluka, izjave, saglasnosti i ugovor" },
  professional: { label: "Stručni rad", hint: "Procene, individualni plan i praćenje" },
  end: { label: "Prestanak smeštaja", hint: "Odluka o prestanku i izjava" },
};

/**
 * Odakle dolazi sadržaj obrasca:
 *  data       — sve iz kartona (obrazac je spreman kad su podaci uneti)
 *  document   — tekst piše socijalni radnik u aplikaciji (procene, plan…)
 *  activities — redovi su aktivnosti koje radnik upisuje kao beleške (list praćenja)
 */
export type FormSource = "data" | "document" | "activities";

export interface SocialForm {
  id: string;
  /** Broj obrasca kao u dokumentaciji doma */
  number: string;
  title: string;
  group: FormGroup;
  /** Pismo obrasca: vrednosti se preslovljavaju u njega */
  script: "cyrillic" | "latin";
  source: FormSource;
  /** Ko podnosi zahtev: obrazac za korisnika (self) ili za srodnika/staratelja (relative) */
  variant?: "self" | "relative";
  /** Stručni dokument iz kog se obrazac puni */
  docType?: DocType;
  /** Podaci bez kojih obrazac ostaje sa praznom linijom: [polje, opis] */
  requires: Array<[string, string]>;
  /** Podaci obveznika — traže se samo kad zahtev podnosi srodnik/staratelj/drugo lice */
  requiresRelative?: Array<[string, string]>;
  /** Izbor u obrascu: bar jedna oznaka mora biti postavljena (npr. soba u ugovoru) */
  choices?: Array<{ flags: string[]; label: string }>;
  /** Kada obrazac važi: uvek, posle otpusta ili samo u slučaju smrti */
  when?: "discharged" | "death";
  /** Šta se dopisuje rukom posle štampe (prikazuje se kao napomena) */
  byHand?: string;
}

const IDENTITY: Array<[string, string]> = [
  ["datum_rodjenja", "datum rođenja"],
  ["datum_prijema", "datum prijema"],
];
const APPLICANT: Array<[string, string]> = [
  ["podnosilac", "podnosilac zahteva"],
  ["podnosilac_lk", "broj lične karte podnosioca"],
];
const flags = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);

export const SOCIAL_FORMS: SocialForm[] = [
  {
    id: "f10-zahtev-korisnik",
    number: "1.0",
    title: "Zahtev za prijem — korisnik",
    group: "admission",
    script: "cyrillic",
    source: "data",
    variant: "self",
    // Potpisuje sam korisnik: njegovo ime i lična karta (ne podnosilac iz kartona)
    requires: [["datum_zahteva", "datum zahteva"], ["datum_rodjenja", "datum rođenja"], ["adresa", "adresa"], ["placa_smestaj_tekst", "ko snosi troškove"], ["broj_licne_karte", "broj lične karte"]],
    byHand: "potpis podnosioca",
  },
  {
    id: "f11-zahtev-srodnik",
    number: "1.1",
    title: "Zahtev za prijem — srodnik, staratelj",
    group: "admission",
    script: "cyrillic",
    source: "data",
    variant: "relative",
    requires: [["datum_zahteva", "datum zahteva"], ["datum_rodjenja", "datum rođenja"], ["adresa", "adresa korisnika"], ["placa_smestaj_tekst", "ko snosi troškove"], ...APPLICANT],
    byHand: "potpis podnosioca",
  },
  { id: "f20-prijemna-procena", number: "2", title: "Prijemna procena", group: "admission", script: "cyrillic", source: "document", docType: "intake", requires: [["ime_roditelja", "ime jednog roditelja"], ...IDENTITY] },
  {
    id: "f30-odluka-o-smestaju",
    number: "3",
    title: "Odluka o smeštaju korisnika",
    group: "admission",
    script: "cyrillic",
    source: "data",
    requires: [["mesto_dolaska", "odakle dolazi (opština ili adresa)"], ["datum_prijema", "datum prijema"], ["podnosilac", "podnosilac zahteva"], ["datum_zahteva", "datum zahteva"]],
    byHand: "potpisi komisije",
  },
  {
    id: "f40-socijalno-anamnesticki-list",
    number: "4",
    title: "List o socijalno-anamnestičkim podacima",
    group: "admission",
    script: "cyrillic",
    source: "document",
    docType: "anamnesis",
    requires: [
      ["otac", "ime oca"],
      ["majka", "ime majke"],
      ["datum_i_mesto_rodjenja", "datum i mesto rođenja"],
      ["jmbg", "JMBG"],
      ["bracni_status", "bračni status"],
      ["obrazovanje", "školska sprema"],
      ["socijalni_status", "socijalni status"],
      ["osiguranje_osnov", "osnov osiguranja"],
      ["hitni_kontakt", "koga obavestiti (hitni kontakt)"],
    ],
  },
  {
    id: "f41-opsti-podaci",
    number: "4.1",
    title: "Opšti podaci o korisniku",
    group: "admission",
    script: "cyrillic",
    source: "data",
    requires: [["otac", "ime oca"], ["majka", "ime majke"], ["datum_i_mesto_rodjenja", "datum i mesto rođenja"], ["jmbg", "JMBG"], ["drzavljanstvo", "državljanstvo"], ["bracni_status", "bračni status"], ["obrazovanje", "školska sprema"], ["zanimanje", "zanimanje"]],
  },
  {
    id: "f50-izjava-volje-korisnik",
    number: "5.0",
    title: "Izjava volje korisnika",
    group: "admission",
    script: "cyrillic",
    source: "data",
    variant: "self",
    requires: [["datum_zahteva", "datum zahteva"], ["adresa", "adresa"], ["broj_licne_karte", "broj lične karte"]],
    byHand: "potpisi",
  },
  {
    id: "f51-izjava-srodnika",
    number: "5.1",
    title: "Izjava srodnika — staratelja",
    group: "admission",
    script: "cyrillic",
    source: "data",
    variant: "relative",
    requires: [["datum_zahteva", "datum zahteva"], ["dijagnoza", "bolest korisnika"], ...APPLICANT, ["podnosilac_adresa", "adresa podnosioca"]],
    byHand: "potpisi",
  },
  { id: "f60-saglasnost-podaci-korisnik", number: "6.0", title: "Saglasnost za obradu podataka — korisnik", group: "admission", script: "cyrillic", source: "data", variant: "self", requires: [], byHand: "potpisi" },
  { id: "f61-saglasnost-podaci-srodnik", number: "6.1", title: "Saglasnost za obradu podataka — srodnik", group: "admission", script: "cyrillic", source: "data", variant: "relative", requires: [["podnosilac", "podnosilac (srodnik)"]], byHand: "potpisi" },
  {
    id: "f70-izjava-medicinska-mera",
    number: "7",
    title: "Izjava — naziv medicinske mere",
    group: "admission",
    script: "latin",
    source: "data",
    requires: [["podnosilac", "potpisnik ugovora"]],
    byHand: "ordinirajući lekar upisuje i potpisuje",
  },
  { id: "f80-saglasnost-nadzor-fotografije", number: "8", title: "Saglasnost — video nadzor, fotografije, pravila doma", group: "admission", script: "cyrillic", source: "data", requires: APPLICANT, byHand: "potpis" },
  {
    id: "f900-ugovor-o-smestaju",
    number: "Ugovor",
    title: "Ugovor o smeštaju",
    group: "admission",
    script: "latin",
    source: "data",
    requires: [["jmbg", "JMBG korisnika"], ["broj_licne_karte", "broj lične karte korisnika"], ["adresa", "adresa korisnika"], ["cena_eur", "cena smeštaja (EUR)"]],
    requiresRelative: [["podnosilac_jmbg", "JMBG obveznika"], ["podnosilac_lk", "lična karta obveznika"], ["podnosilac_adresa", "adresa obveznika"], ["podnosilac_telefon", "telefon obveznika"]],
    choices: [
      { flags: flags("soba_", 3), label: "kategorija sobe (čl. 2)" },
      { flags: flags("kat_", 10), label: "kategorija korisnika (čl. 3)" },
    ],
    byHand: "potpisi ugovornih strana",
  },
  {
    id: "f00-list-pracenja",
    number: "0",
    title: "List praćenja rada na zaštiti korisnika",
    group: "professional",
    script: "cyrillic",
    source: "activities",
    requires: [["broj_dosijea", "broj dosijea"]],
    byHand: "potpis stručnog radnika uz svaku aktivnost",
  },
  { id: "f100-procena", number: "10", title: "Procena", group: "professional", script: "cyrillic", source: "document", docType: "assessment", requires: [["ime_roditelja", "ime jednog roditelja"], ...IDENTITY] },
  { id: "f110-stepen-podrske", number: "11", title: "Određivanje stepena potrebne podrške", group: "professional", script: "cyrillic", source: "document", docType: "support_scale", requires: [["ime_roditelja", "ime jednog roditelja"], ...IDENTITY] },
  {
    id: "f120-individualni-plan",
    number: "12",
    title: "Individualni plan usluge",
    group: "professional",
    script: "cyrillic",
    source: "document",
    docType: "plan",
    requires: [["ime_roditelja", "ime jednog roditelja"], ...IDENTITY, ["stepen", "stepen podrške (zaključen obrazac 11)"]],
  },
  {
    id: "f130-ponovni-pregled",
    number: "13",
    title: "Ponovni pregled — realizacija individualnog plana",
    group: "professional",
    script: "cyrillic",
    source: "document",
    docType: "plan_review",
    requires: [["ime_roditelja", "ime jednog roditelja"], ...IDENTITY, ["stepen", "stepen podrške"], ["ip_datum", "individualni plan (obrazac 12)"]],
  },
  {
    id: "f140-odluka-o-prestanku",
    number: "14",
    title: "Odluka o prestanku smeštaja",
    group: "end",
    script: "cyrillic",
    source: "data",
    when: "discharged",
    requires: [["datum_otpusta", "datum prestanka smeštaja"]],
    choices: [{ flags: flags("prestanak_", 7), label: "osnov prestanka smeštaja" }],
    byHand: "potpis",
  },
  {
    id: "f150-izjava-nakon-smrti",
    number: "15",
    title: "Izjava nakon smrti",
    group: "end",
    script: "cyrillic",
    source: "data",
    when: "death",
    requires: [["datum_otpusta", "datum (otpust)"]],
    byHand: "ko je preuzeo stvari i potpisi",
  },
];

export const formById = (id: string) => SOCIAL_FORMS.find((f) => f.id === id);
export const formForDoc = (type: DocType) => SOCIAL_FORMS.find((f) => f.docType === type);

/** Obrasci koji važe za korisnika: varijanta po podnosiocu (dok nije poznat — obe) */
export function formsFor(applicant: ApplicantKind) {
  const who = applicant === "self" ? "self" : applicant ? "relative" : null;
  return SOCIAL_FORMS.filter((f) => !f.variant || !who || f.variant === who);
}

/** Paket za prijem: obrasci za prijem (zahtev, odluka, izjave, saglasnosti, ugovor…) */
export const admissionPackage = (applicant: ApplicantKind) => formsFor(applicant).filter((f) => f.group === "admission");
