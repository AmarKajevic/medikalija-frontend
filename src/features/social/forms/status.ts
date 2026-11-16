// Stanje obrasca za korisnika — šta je stvarno spremno, a šta mora da uradi socijalni radnik.
// Čista funkcija (bez Reacta): ista pravila za listu obrazaca, paket za prijem i testove.
import type { ApplicantKind, MergeData, SocialDocument } from "@features/social/dossier";
import { formatDay } from "@shared/lib/calendarDay";
import type { SocialForm } from "./catalog";

export type StatusTone = "success" | "warning" | "light" | "info";

export interface FormStatus {
  tone: StatusTone;
  /** Kratko stanje: "spremno", "nacrt 12.09.", "nema upisanih aktivnosti", "važi posle otpusta" */
  label: string;
  /** Šta nedostaje (podaci i izbori iz kartona) */
  missing: string[];
  /** Šta radnik treba da uradi: napiše dokument, upiše aktivnost ili dopuni karton */
  next?: "write" | "activity" | "profile";
  /** Obrazac trenutno ne važi za korisnika (npr. odluka o prestanku dok je na smeštaju) */
  inactive?: boolean;
}

export interface StatusContext {
  data?: MergeData;
  applicant: ApplicantKind;
  /** Poslednji dokument ove vrste (zaključen ima prednost) */
  doc?: SocialDocument | null;
  discharged: boolean;
}

/** Podaci i izbori iz kartona koji nedostaju (opisi za upozorenje) */
export function missingFor(form: SocialForm, data: MergeData | undefined, applicant: ApplicantKind = ""): string[] {
  if (!data) return [];
  const relative = !!applicant && applicant !== "self";
  const fields = [...form.requires, ...(relative ? (form.requiresRelative ?? []) : [])];
  const missing = fields.filter(([key]) => !data.fields[key]?.trim()).map(([, label]) => label);
  for (const choice of form.choices ?? []) if (!choice.flags.some((f) => data.flags?.[f])) missing.push(choice.label);
  return missing;
}

const plural = (n: number, one: string, few: string, many: string) => (n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many);

export function formStatus(form: SocialForm, ctx: StatusContext): FormStatus {
  const { data, doc, discharged } = ctx;
  // Prestanak smeštaja: obrazac važi tek posle otpusta, izjava nakon smrti samo uz taj osnov
  if (form.when === "discharged" && !discharged) return { tone: "light", label: "važi posle otpusta", missing: [], inactive: true };
  if (form.when === "death" && !(discharged && data?.flags?.prestanak_7)) return { tone: "light", label: "samo u slučaju smrti", missing: [], inactive: true };

  const missing = missingFor(form, data, ctx.applicant);

  if (form.source === "document") {
    if (!doc) return { tone: "warning", label: "nije napisano", missing, next: "write" };
    if (doc.status !== "final") return { tone: "warning", label: `nacrt ${formatDay(doc.date)}`, missing, next: "write" };
    return { tone: missing.length ? "warning" : "success", label: `zaključeno ${formatDay(doc.date)}`, missing, next: missing.length ? "profile" : undefined };
  }

  if (form.source === "activities") {
    const count = data?.lists.beleske?.length ?? 0;
    if (!count) return { tone: "warning", label: "nema upisanih aktivnosti", missing, next: "activity" };
    return { tone: missing.length ? "warning" : "info", label: `${count} ${plural(count, "aktivnost", "aktivnosti", "aktivnosti")}`, missing, next: missing.length ? "profile" : "activity" };
  }

  if (!data) return { tone: "light", label: "", missing: [] };
  if (missing.length) return { tone: "warning", label: missing.length === 1 ? `nedostaje ${missing[0]}` : `nedostaje ${missing.length} podatka`, missing, next: "profile" };
  return { tone: "success", label: "spremno", missing: [] };
}
