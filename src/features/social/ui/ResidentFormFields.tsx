import { ReactNode, useId } from "react";
import { LuPlus, LuTrash2, LuWandSparkles } from "react-icons/lu";
import Button from "@shared/ui/button/Button";
import Field from "@shared/ui/form/Field";
import { Checkbox, Input, Select } from "@shared/ui/form/controls";
import DateInput from "@shared/ui/form/DateInput";
import { todayIso } from "@shared/lib/dateText";
import { formatDay } from "@shared/lib/calendarDay";
import { roleLabel } from "@shared/lib/format";
import {
  jmbgCheck,
  jmbgInfo,
  LEGAL_CAPACITY_LABEL,
  MARITAL_LABEL,
  PatientBasics,
  PAYER_LABEL,
  PENSION_LABEL,
  PLACEMENT_LABEL,
  SEX_LABEL,
  SocialContact,
  SocialProfileInput,
  StaffRef,
} from "@features/social/dossier";

export type FormMode = "basic" | "detailed";

interface Props {
  mode: FormMode;
  basics: PatientBasics;
  onBasics: (patch: Partial<PatientBasics>) => void;
  profile: SocialProfileInput;
  onProfile: (patch: Partial<SocialProfileInput>) => void;
  staff: StaffRef[];
  /** Novi korisnik: datum prijema (od njega se računaju periodi) */
  admission?: { value: string; onChange: (v: string) => void };
  /** Greške obaveznih polja posle pokušaja čuvanja */
  errors?: Partial<Record<"name" | "lastName" | "admissionDate", string>>;
}

const EMPTY_CONTACT: SocialContact = { name: "", relation: "", phone: "", email: "", address: "", emergency: false, note: "" };

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <legend className="px-1 text-sm font-semibold text-gray-900 dark:text-white/90">{title}</legend>
      {hint && <p className="-mt-2 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
      {children}
    </fieldset>
  );
}

const options = (labels: Record<string, string>, empty = "Nije uneto") => (
  <>
    <option value="">{empty}</option>
    {Object.entries(labels).map(([value, label]) => (
      <option key={value} value={value}>
        {label}
      </option>
    ))}
  </>
);

// Polja korisnika. "Osnovni podaci" je kratka forma za brz unos; "Detaljni" dodaje sve što treba
// dokumentima (JMBG, staratelj, osnov smeštaja, porodica...). Sve osim imena, prezimena i datuma
// prijema je neobavezno i može se dopuniti kasnije.
export default function ResidentFormFields({ mode, basics, onBasics, profile, onProfile, staff, admission, errors = {} }: Props) {
  const id = useId();
  const f = (key: string) => `${id}-${key}`;
  const text = (key: keyof SocialProfileInput) => ({
    id: f(key),
    value: String(profile[key] ?? ""),
    onChange: (e: { target: { value: string } }) => onProfile({ [key]: e.target.value } as Partial<SocialProfileInput>),
  });
  const setContact = (i: number, patch: Partial<SocialContact>) => onProfile({ contacts: profile.contacts.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  const jmbg = jmbgCheck(profile.jmbg, basics.dateOfBirth);
  // JMBG sadrži datum rođenja i pol: popunjavaju se sami čim je JMBG ispravan
  const onJmbg = (value: string) => {
    const digits = value.replace(/[^\d]/g, "").slice(0, 13);
    const info = jmbgInfo(digits);
    onProfile({ jmbg: digits, ...(info && !profile.sex ? { sex: info.sex } : {}) });
    if (info && !basics.dateOfBirth) onBasics({ dateOfBirth: info.birthDate });
  };
  const needsGuardian = profile.legalCapacity === "partial" || profile.legalCapacity === "none";
  const firstContact = profile.contacts[0] ?? EMPTY_CONTACT;
  const setFirstContact = (patch: Partial<SocialContact>) =>
    onProfile({ contacts: profile.contacts.length ? profile.contacts.map((c, i) => (i === 0 ? { ...c, ...patch } : c)) : [{ ...EMPTY_CONTACT, emergency: true, ...patch }] });

  return (
    <div className="space-y-5">
      <Group title="Osnovni podaci">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ime" htmlFor={f("name")} error={errors.name}>
            <Input id={f("name")} value={basics.name} onChange={(e) => onBasics({ name: e.target.value })} invalid={!!errors.name} autoFocus autoComplete="off" />
          </Field>
          <Field label="Prezime" htmlFor={f("lastName")} error={errors.lastName}>
            <Input id={f("lastName")} value={basics.lastName} onChange={(e) => onBasics({ lastName: e.target.value })} invalid={!!errors.lastName} autoComplete="off" />
          </Field>
          {admission && (
            <Field label="Datum prijema" htmlFor={f("admission")} error={errors.admissionDate} hint="Od njega se računaju 30-dnevni periodi specifikacija.">
              <DateInput id={f("admission")} value={admission.value} onChange={admission.onChange} fromYear={2000} invalid={!!errors.admissionDate} />
            </Field>
          )}
          <Field
            label="JMBG (nije obavezno)"
            htmlFor={f("jmbg")}
            error={jmbg.invalid && profile.jmbg.length === 13 ? "JMBG nije ispravan — proverite cifre." : undefined}
            hint={jmbg.info ? `Rođen/a ${formatDay(jmbg.info.birthDate)}, pol ${SEX_LABEL[jmbg.info.sex]} — popunjeno iz JMBG-a.` : "Datum rođenja i pol se popunjavaju sami iz JMBG-a."}
          >
            <Input id={f("jmbg")} value={profile.jmbg} onChange={(e) => onJmbg(e.target.value)} inputMode="numeric" maxLength={13} placeholder="13 cifara" invalid={jmbg.invalid && profile.jmbg.length === 13} />
          </Field>
          <Field label="Datum rođenja" htmlFor={f("dob")} error={jmbg.mismatch ? "Ne slaže se sa JMBG-om." : undefined}>
            <DateInput id={f("dob")} value={basics.dateOfBirth} onChange={(v) => onBasics({ dateOfBirth: v })} max={todayIso()} fromYear={1900} invalid={jmbg.mismatch} />
            {jmbg.mismatch && jmbg.info && (
              <button
                type="button"
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                onClick={() => onBasics({ dateOfBirth: jmbg.info!.birthDate })}
              >
                <LuWandSparkles className="h-3.5 w-3.5" /> Uzmi iz JMBG-a ({formatDay(jmbg.info.birthDate)})
              </button>
            )}
          </Field>
          <Field label="Pol" htmlFor={f("sex")}>
            <Select {...text("sex")}>{options(SEX_LABEL)}</Select>
          </Field>
          <Field label="Adresa prebivališta" htmlFor={f("address")} className="sm:col-span-2">
            <Input id={f("address")} value={basics.address} onChange={(e) => onBasics({ address: e.target.value })} placeholder="Ulica i broj, mesto" />
          </Field>
        </div>
        {mode === "basic" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Kontakt porodice" htmlFor={f("c0-name")}>
              <Input id={f("c0-name")} value={firstContact.name} onChange={(e) => setFirstContact({ name: e.target.value })} placeholder="Ime i prezime" />
            </Field>
            <Field label="Srodstvo" htmlFor={f("c0-rel")}>
              <Input id={f("c0-rel")} value={firstContact.relation} onChange={(e) => setFirstContact({ relation: e.target.value })} placeholder="npr. sin" />
            </Field>
            <Field label="Telefon" htmlFor={f("c0-phone")}>
              <Input id={f("c0-phone")} value={firstContact.phone} onChange={(e) => setFirstContact({ phone: e.target.value })} inputMode="tel" />
            </Field>
          </div>
        )}
      </Group>

      {mode === "detailed" && (
        <>
          <Group title="Lični podaci">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Ime jednog roditelja" htmlFor={f("parentName")}>
                <Input {...text("parentName")} />
              </Field>
              <Field label="Mesto rođenja" htmlFor={f("birthPlace")}>
                <Input {...text("birthPlace")} />
              </Field>
              <Field label="Opština prebivališta" htmlFor={f("municipality")}>
                <Input {...text("municipality")} />
              </Field>
              <Field label="Državljanstvo" htmlFor={f("citizenship")}>
                <Input {...text("citizenship")} placeholder="npr. Republike Srbije" />
              </Field>
              <Field label="Bračni status" htmlFor={f("maritalStatus")}>
                <Select {...text("maritalStatus")}>{options(MARITAL_LABEL)}</Select>
              </Field>
              <Field label="Obrazovanje" htmlFor={f("education")}>
                <Input {...text("education")} />
              </Field>
              <Field label="Zanimanje" htmlFor={f("occupation")}>
                <Input {...text("occupation")} />
              </Field>
              <Field label="Broj lične karte" htmlFor={f("idCardNumber")}>
                <Input {...text("idCardNumber")} />
              </Field>
              <Field label="LBO / broj zdravstvene kartice" htmlFor={f("healthInsuranceNumber")}>
                <Input {...text("healthInsuranceNumber")} />
              </Field>
              <Field label="Izabrani lekar" htmlFor={f("chosenDoctor")}>
                <Input {...text("chosenDoctor")} />
              </Field>
              <Field label="Maternji jezik" htmlFor={f("language")}>
                <Input {...text("language")} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nacionalnost (nije obavezno)" htmlFor={f("nationality")} hint="Osetljiv podatak — unosi se samo uz pristanak korisnika.">
                <Input {...text("nationality")} />
              </Field>
              <Field label="Veroispovest (nije obavezno)" htmlFor={f("religion")} hint="Osetljiv podatak — unosi se samo uz pristanak korisnika.">
                <Input {...text("religion")} />
              </Field>
            </div>
          </Group>

          <Group title="Smeštaj i prihodi">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Osnov smeštaja" htmlFor={f("placementBasis")}>
                <Select {...text("placementBasis")}>{options(PLACEMENT_LABEL)}</Select>
              </Field>
              <Field label="Penzija" htmlFor={f("pensionType")}>
                <Select {...text("pensionType")}>{options(PENSION_LABEL)}</Select>
              </Field>
              <Field label="Ko plaća smeštaj" htmlFor={f("payer")}>
                <Select {...text("payer")}>{options(PAYER_LABEL)}</Select>
              </Field>
            </div>
            {profile.placementBasis === "contract" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Broj ugovora" htmlFor={f("contractNumber")}>
                  <Input {...text("contractNumber")} />
                </Field>
                <Field label="Datum ugovora" htmlFor={f("contractDate")}>
                  <DateInput id={f("contractDate")} value={profile.contractDate ?? ""} onChange={(v) => onProfile({ contractDate: v || null })} fromYear={2000} />
                </Field>
              </div>
            )}
            {profile.placementBasis === "csr" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Centar za socijalni rad" htmlFor={f("csrName")}>
                  <Input {...text("csrName")} placeholder="npr. GCSR Beograd, odeljenje Zvezdara" />
                </Field>
                <Field label="Voditelj slučaja" htmlFor={f("caseManager")}>
                  <Input {...text("caseManager")} />
                </Field>
                <Field label="Broj rešenja / uputa" htmlFor={f("csrDecisionNumber")}>
                  <Input {...text("csrDecisionNumber")} />
                </Field>
                <Field label="Datum rešenja" htmlFor={f("csrDecisionDate")}>
                  <DateInput id={f("csrDecisionDate")} value={profile.csrDecisionDate ?? ""} onChange={(v) => onProfile({ csrDecisionDate: v || null })} fromYear={2000} />
                </Field>
              </div>
            )}
            <Field label="Napomena o prihodima" htmlFor={f("incomeNote")}>
              <Input {...text("incomeNote")} placeholder="npr. tuđa nega i pomoć" />
            </Field>
          </Group>

          <Group title="Pravni status">
            <Field label="Poslovna sposobnost" htmlFor={f("legalCapacity")}>
              <Select {...text("legalCapacity")}>{options(LEGAL_CAPACITY_LABEL)}</Select>
            </Field>
            {needsGuardian && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Staratelj" htmlFor={f("g-name")}>
                  <Input id={f("g-name")} value={profile.guardian.name} onChange={(e) => onProfile({ guardian: { ...profile.guardian, name: e.target.value } })} />
                </Field>
                <Field label="Odnos sa korisnikom" htmlFor={f("g-relation")}>
                  <Input id={f("g-relation")} value={profile.guardian.relation} onChange={(e) => onProfile({ guardian: { ...profile.guardian, relation: e.target.value } })} placeholder="npr. sin, CSR" />
                </Field>
                <Field label="Telefon staratelja" htmlFor={f("g-phone")}>
                  <Input id={f("g-phone")} value={profile.guardian.phone} onChange={(e) => onProfile({ guardian: { ...profile.guardian, phone: e.target.value } })} />
                </Field>
                <Field label="Organ starateljstva" htmlFor={f("g-authority")}>
                  <Input id={f("g-authority")} value={profile.guardian.authority} onChange={(e) => onProfile({ guardian: { ...profile.guardian, authority: e.target.value } })} />
                </Field>
                <Field label="Broj rešenja" htmlFor={f("g-number")}>
                  <Input id={f("g-number")} value={profile.guardian.decisionNumber} onChange={(e) => onProfile({ guardian: { ...profile.guardian, decisionNumber: e.target.value } })} />
                </Field>
                <Field label="Datum rešenja" htmlFor={f("g-date")}>
                  <DateInput id={f("g-date")} value={profile.guardian.decisionDate ?? ""} onChange={(v) => onProfile({ guardian: { ...profile.guardian, decisionDate: v || null } })} fromYear={1990} />
                </Field>
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">Osoba od poverenja (čl. 10a) — korisnik je sam bira za procenu, plan i ugovor, i može da je promeni.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Osoba od poverenja" htmlFor={f("t-name")}>
                <Input id={f("t-name")} value={profile.trustedPerson.name} onChange={(e) => onProfile({ trustedPerson: { ...profile.trustedPerson, name: e.target.value } })} />
              </Field>
              <Field label="Odnos" htmlFor={f("t-relation")}>
                <Input id={f("t-relation")} value={profile.trustedPerson.relation} onChange={(e) => onProfile({ trustedPerson: { ...profile.trustedPerson, relation: e.target.value } })} />
              </Field>
              <Field label="Telefon" htmlFor={f("t-phone")}>
                <Input id={f("t-phone")} value={profile.trustedPerson.phone} onChange={(e) => onProfile({ trustedPerson: { ...profile.trustedPerson, phone: e.target.value } })} />
              </Field>
            </div>
          </Group>

          <Group title="Porodica i kontakti" hint="Prvi hitni kontakt postaje „kontakt osoba“ korisnika i vidi se svuda u aplikaciji.">
            {profile.contacts.map((c, i) => (
              <div key={c._id ?? i} className="grid gap-3 rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03] sm:grid-cols-[1.2fr_0.8fr_1fr_1fr_auto]">
                <Input aria-label={`Kontakt ${i + 1}: ime i prezime`} value={c.name} onChange={(e) => setContact(i, { name: e.target.value })} placeholder="Ime i prezime" />
                <Input aria-label={`Kontakt ${i + 1}: srodstvo`} value={c.relation} onChange={(e) => setContact(i, { relation: e.target.value })} placeholder="Srodstvo" />
                <Input aria-label={`Kontakt ${i + 1}: telefon`} value={c.phone} onChange={(e) => setContact(i, { phone: e.target.value })} placeholder="Telefon" inputMode="tel" />
                <Input aria-label={`Kontakt ${i + 1}: e-pošta`} value={c.email} onChange={(e) => setContact(i, { email: e.target.value })} placeholder="E-pošta" inputMode="email" />
                <button
                  type="button"
                  onClick={() => onProfile({ contacts: profile.contacts.filter((_, j) => j !== i) })}
                  aria-label={`Ukloni kontakt ${c.name || i + 1}`}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10"
                >
                  <LuTrash2 className="h-4 w-4" />
                </button>
                <Input className="sm:col-span-3" aria-label={`Kontakt ${i + 1}: adresa`} value={c.address} onChange={(e) => setContact(i, { address: e.target.value })} placeholder="Adresa (nije obavezno)" />
                <Checkbox id={f(`c${i}-em`)} className="sm:col-span-2 sm:self-center" label="Hitni kontakt" checked={c.emergency} onChange={(e) => setContact(i, { emergency: e.target.checked })} />
              </div>
            ))}
            <Button size="sm" variant="outline" startIcon={<LuPlus className="h-4 w-4" />} onClick={() => onProfile({ contacts: [...profile.contacts, { ...EMPTY_CONTACT, emergency: profile.contacts.length === 0 }] })}>
              Dodaj kontakt
            </Button>
          </Group>

          <Group title="Zaduženi zaposleni" hint="Prati individualni plan i kontakt sa porodicom (čl. 10 st. 4).">
            <Field label="Zaduženi zaposleni" htmlFor={f("assignedStaff")}>
              <Select id={f("assignedStaff")} value={profile.assignedStaff ?? ""} onChange={(e) => onProfile({ assignedStaff: e.target.value || null })}>
                <option value="">Nije određen</option>
                {staff.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.lastName} · {roleLabel(s.role)}
                  </option>
                ))}
              </Select>
            </Field>
          </Group>
        </>
      )}
    </div>
  );
}
