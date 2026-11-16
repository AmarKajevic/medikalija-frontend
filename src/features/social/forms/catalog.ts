// Obrasci doma u postupku smeštaja (Word šabloni u /public/social-forms, napravljeni od originala doma).
// Jedan registar: redosled, grupa, pismo obrasca, koji podaci su potrebni i koji stručni dokument ga puni.
import type { ApplicantKind, DocType } from "@features/social/dossier";

export type FormGroup = "admission" | "professional" | "end";

export const FORM_GROUPS: Record<FormGroup, { label: string; hint: string }> = {
  admission: { label: "Prijem", hint: "Zahtev, odluka, izjave, saglasnosti i ugovor" },
  professional: { label: "Stručni rad", hint: "Procene, individualni plan i praćenje" },
  end: { label: "Prestanak smeštaja", hint: "Odluka o prestanku i izjava" },
};

export interface SocialForm {
  id: string;
  /** Broj obrasca kao u dokumentaciji doma */
  number: string;
  title: string;
  group: FormGroup;
  /** Pismo obrasca: vrednosti se preslovljavaju u njega */
  script: "cyrillic" | "latin";
  /** Ko podnosi zahtev: obrazac za korisnika (self) ili za srodnika/staratelja (relative) */
  variant?: "self" | "relative";
  /** Stručni dokument iz kog se obrazac puni (sadržaj se piše u aplikaciji) */
  docType?: DocType;
  /** Podaci bez kojih obrazac ostaje sa praznom linijom: [polje, opis] */
  requires: Array<[string, string]>;
}

const IDENTITY: Array<[string, string]> = [
  ["datum_rodjenja", "datum rođenja"],
  ["datum_prijema", "datum prijema"],
];
const APPLICANT: Array<[string, string]> = [
  ["podnosilac", "podnosilac zahteva"],
  ["podnosilac_lk", "broj lične karte podnosioca"],
];

export const SOCIAL_FORMS: SocialForm[] = [
  {
    id: "f10-zahtev-korisnik",
    number: "1.0",
    title: "Zahtev za prijem — korisnik",
    group: "admission",
    script: "cyrillic",
    variant: "self",
    requires: [["datum_zahteva", "datum zahteva"], ["datum_rodjenja", "datum rođenja"], ["adresa", "adresa"], ["placa_smestaj_tekst", "ko snosi troškove"], ["podnosilac_lk", "broj lične karte"]],
  },
  {
    id: "f11-zahtev-srodnik",
    number: "1.1",
    title: "Zahtev za prijem — srodnik, staratelj",
    group: "admission",
    script: "cyrillic",
    variant: "relative",
    requires: [["datum_zahteva", "datum zahteva"], ["datum_rodjenja", "datum rođenja"], ["adresa", "adresa korisnika"], ["placa_smestaj_tekst", "ko snosi troškove"], ...APPLICANT],
  },
  { id: "f20-prijemna-procena", number: "2", title: "Prijemna procena", group: "admission", script: "cyrillic", docType: "intake", requires: [["ime_roditelja", "ime jednog roditelja"], ...IDENTITY] },
  {
    id: "f30-odluka-o-smestaju",
    number: "3",
    title: "Odluka o smeštaju korisnika",
    group: "admission",
    script: "cyrillic",
    requires: [["mesto_dolaska", "odakle dolazi (opština ili adresa)"], ["datum_prijema", "datum prijema"], ["podnosilac", "podnosilac zahteva"], ["datum_zahteva", "datum zahteva"]],
  },
  {
    id: "f40-socijalno-anamnesticki-list",
    number: "4",
    title: "List o socijalno-anamnestičkim podacima",
    group: "admission",
    script: "cyrillic",
    docType: "anamnesis",
    requires: [["otac", "ime oca"], ["majka", "ime majke"], ["datum_i_mesto_rodjenja", "datum i mesto rođenja"], ["jmbg", "JMBG"], ["bracni_status", "bračni status"], ["obrazovanje", "školska sprema"], ["socijalni_status", "socijalni status"], ["osiguranje_osnov", "osnov osiguranja"]],
  },
  {
    id: "f41-opsti-podaci",
    number: "4.1",
    title: "Opšti podaci o korisniku",
    group: "admission",
    script: "cyrillic",
    requires: [["otac", "ime oca"], ["majka", "ime majke"], ["datum_i_mesto_rodjenja", "datum i mesto rođenja"], ["jmbg", "JMBG"], ["drzavljanstvo", "državljanstvo"], ["bracni_status", "bračni status"], ["obrazovanje", "školska sprema"], ["zanimanje", "zanimanje"]],
  },
  { id: "f50-izjava-volje-korisnik", number: "5.0", title: "Izjava volje korisnika", group: "admission", script: "cyrillic", variant: "self", requires: [["datum_zahteva", "datum zahteva"], ["broj_licne_karte", "broj lične karte"]] },
  { id: "f51-izjava-srodnika", number: "5.1", title: "Izjava srodnika — staratelja", group: "admission", script: "cyrillic", variant: "relative", requires: [["datum_zahteva", "datum zahteva"], ["dijagnoza", "bolest korisnika"], ...APPLICANT] },
  { id: "f60-saglasnost-podaci-korisnik", number: "6.0", title: "Saglasnost za obradu podataka — korisnik", group: "admission", script: "cyrillic", variant: "self", requires: [] },
  { id: "f61-saglasnost-podaci-srodnik", number: "6.1", title: "Saglasnost za obradu podataka — srodnik", group: "admission", script: "cyrillic", variant: "relative", requires: [["podnosilac", "podnosilac (srodnik)"]] },
  { id: "f70-izjava-medicinska-mera", number: "7", title: "Izjava — naziv medicinske mere", group: "admission", script: "latin", requires: [["podnosilac", "potpisnik ugovora"]] },
  { id: "f80-saglasnost-nadzor-fotografije", number: "8", title: "Saglasnost — video nadzor, fotografije, pravila doma", group: "admission", script: "cyrillic", requires: APPLICANT },
  {
    id: "f900-ugovor-o-smestaju",
    number: "Ugovor",
    title: "Ugovor o smeštaju",
    group: "admission",
    script: "latin",
    requires: [["jmbg", "JMBG korisnika"], ["broj_licne_karte", "broj lične karte korisnika"], ["cena_eur", "cena smeštaja (EUR)"], ["podnosilac_jmbg", "JMBG obveznika"], ["podnosilac_lk", "lična karta obveznika"], ["podnosilac_telefon", "telefon obveznika"]],
  },
  { id: "f00-list-pracenja", number: "0", title: "List praćenja rada na zaštiti korisnika", group: "professional", script: "cyrillic", requires: [["broj_dosijea", "broj dosijea"]] },
  { id: "f100-procena", number: "10", title: "Procena", group: "professional", script: "cyrillic", docType: "assessment", requires: [["ime_roditelja", "ime jednog roditelja"], ...IDENTITY] },
  { id: "f110-stepen-podrske", number: "11", title: "Određivanje stepena potrebne podrške", group: "professional", script: "cyrillic", docType: "support_scale", requires: IDENTITY },
  { id: "f120-individualni-plan", number: "12", title: "Individualni plan usluge", group: "professional", script: "cyrillic", docType: "plan", requires: [...IDENTITY, ["stepen", "stepen podrške (obrazac 11)"]] },
  { id: "f130-ponovni-pregled", number: "13", title: "Ponovni pregled — realizacija individualnog plana", group: "professional", script: "cyrillic", docType: "plan_review", requires: [...IDENTITY, ["ip_datum", "individualni plan (obrazac 12)"]] },
  { id: "f140-odluka-o-prestanku", number: "14", title: "Odluka o prestanku smeštaja", group: "end", script: "cyrillic", requires: [["datum_otpusta", "datum prestanka smeštaja (otpust)"]] },
  { id: "f150-izjava-nakon-smrti", number: "15", title: "Izjava nakon smrti", group: "end", script: "cyrillic", requires: [["datum_otpusta", "datum (otpust)"]] },
];

export const formById = (id: string) => SOCIAL_FORMS.find((f) => f.id === id);
export const formForDoc = (type: DocType) => SOCIAL_FORMS.find((f) => f.docType === type);

/** Obrasci koji važe za korisnika: varijanta po podnosiocu (dok nije poznat — obe) */
export function formsFor(applicant: ApplicantKind) {
  const who = applicant === "self" ? "self" : applicant ? "relative" : null;
  return SOCIAL_FORMS.filter((f) => !f.variant || !who || f.variant === who);
}

/** Paket za prijem: obrasci 1–8 i ugovor (bez stručnih procena koje se pišu posebno) */
export const admissionPackage = (applicant: ApplicantKind) => formsFor(applicant).filter((f) => f.group === "admission");
