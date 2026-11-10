import { FormEvent, ReactNode, useEffect, useId, useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Field from "@shared/ui/form/Field";
import { Checkbox, Input, Select } from "@shared/ui/form/controls";
import DateInput from "@shared/ui/form/DateInput";
import { notify } from "@shared/lib/notify";
import { roleLabel } from "@shared/lib/format";
import {
  EMPTY_PROFILE,
  isValidJmbg,
  LEGAL_CAPACITY_LABEL,
  MARITAL_LABEL,
  PAYER_LABEL,
  PENSION_LABEL,
  PLACEMENT_LABEL,
  profileToInput,
  SEX_LABEL,
  SocialContact,
  SocialProfile,
  SocialProfileInput,
  useSaveProfile,
  useSocialStaff,
} from "@features/social/dossier";

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string;
  profile: SocialProfile | null;
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

// Lični podaci korisnika koji se ponavljaju u dokumentima (ugovor, procene, plan, dopisi CSR-u).
export default function SocialProfileDialog({ open, onClose, patientId, profile }: Props) {
  const formId = useId();
  const id = useId();
  const save = useSaveProfile(patientId);
  const { data: staff = [] } = useSocialStaff(open);
  const [form, setForm] = useState<SocialProfileInput>(EMPTY_PROFILE);

  useEffect(() => {
    if (open) setForm(profileToInput(profile));
  }, [open, profile]);

  const set = (patch: Partial<SocialProfileInput>) => setForm((f) => ({ ...f, ...patch }));
  const text = (key: keyof SocialProfileInput) => ({
    id: `${id}-${key}`,
    value: String(form[key] ?? ""),
    onChange: (e: { target: { value: string } }) => set({ [key]: e.target.value } as Partial<SocialProfileInput>),
  });
  const setContact = (i: number, patch: Partial<SocialContact>) => set({ contacts: form.contacts.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  const jmbg = form.jmbg.replace(/\s/g, "");
  const jmbgInvalid = jmbg.length > 0 && !isValidJmbg(jmbg);
  const needsGuardian = form.legalCapacity === "partial" || form.legalCapacity === "none";

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (jmbgInvalid) return notify.error("JMBG nije ispravan — proverite cifre.");
    save.mutate(
      { ...form, jmbg },
      {
        onSuccess: () => {
          notify.success("Lični podaci su sačuvani.");
          onClose();
        },
        onError: (err) => notify.error(err),
      }
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title="Lični podaci korisnika"
      description="Podaci koji se ponavljaju u dokumentima: ugovor, procene, individualni plan, dopisi CSR-u."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button size="sm" type="submit" form={formId} loading={save.isPending}>
            Sačuvaj
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-5" noValidate>
        <Group title="Lični podaci">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="JMBG" htmlFor={`${id}-jmbg`} error={jmbgInvalid ? "JMBG nije ispravan (13 cifara)." : undefined}>
              <Input {...text("jmbg")} inputMode="numeric" maxLength={13} invalid={jmbgInvalid} placeholder="13 cifara" />
            </Field>
            <Field label="Ime jednog roditelja" htmlFor={`${id}-parentName`}>
              <Input {...text("parentName")} />
            </Field>
            <Field label="Pol" htmlFor={`${id}-sex`}>
              <Select {...text("sex")}>{options(SEX_LABEL)}</Select>
            </Field>
            <Field label="Mesto rođenja" htmlFor={`${id}-birthPlace`}>
              <Input {...text("birthPlace")} />
            </Field>
            <Field label="Opština prebivališta" htmlFor={`${id}-municipality`}>
              <Input {...text("municipality")} />
            </Field>
            <Field label="Državljanstvo" htmlFor={`${id}-citizenship`}>
              <Input {...text("citizenship")} placeholder="npr. Republike Srbije" />
            </Field>
            <Field label="Bračni status" htmlFor={`${id}-maritalStatus`}>
              <Select {...text("maritalStatus")}>{options(MARITAL_LABEL)}</Select>
            </Field>
            <Field label="Obrazovanje" htmlFor={`${id}-education`}>
              <Input {...text("education")} />
            </Field>
            <Field label="Zanimanje" htmlFor={`${id}-occupation`}>
              <Input {...text("occupation")} />
            </Field>
            <Field label="Broj lične karte" htmlFor={`${id}-idCardNumber`}>
              <Input {...text("idCardNumber")} />
            </Field>
            <Field label="LBO / broj zdravstvene kartice" htmlFor={`${id}-healthInsuranceNumber`}>
              <Input {...text("healthInsuranceNumber")} />
            </Field>
            <Field label="Izabrani lekar" htmlFor={`${id}-chosenDoctor`}>
              <Input {...text("chosenDoctor")} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Maternji jezik (nije obavezno)" htmlFor={`${id}-language`}>
              <Input {...text("language")} />
            </Field>
            <Field label="Nacionalnost (nije obavezno)" htmlFor={`${id}-nationality`} hint="Unosi se samo uz pristanak korisnika.">
              <Input {...text("nationality")} />
            </Field>
            <Field label="Veroispovest (nije obavezno)" htmlFor={`${id}-religion`} hint="Unosi se samo uz pristanak korisnika.">
              <Input {...text("religion")} />
            </Field>
          </div>
        </Group>

        <Group title="Prihodi i plaćanje smeštaja">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Penzija" htmlFor={`${id}-pensionType`}>
              <Select {...text("pensionType")}>{options(PENSION_LABEL)}</Select>
            </Field>
            <Field label="Ko plaća smeštaj" htmlFor={`${id}-payer`}>
              <Select {...text("payer")}>{options(PAYER_LABEL)}</Select>
            </Field>
            <Field label="Napomena o prihodima" htmlFor={`${id}-incomeNote`}>
              <Input {...text("incomeNote")} placeholder="npr. tuđa nega i pomoć" />
            </Field>
          </div>
        </Group>

        <Group title="Osnov smeštaja">
          <Field label="Osnov" htmlFor={`${id}-placementBasis`}>
            <Select {...text("placementBasis")}>{options(PLACEMENT_LABEL)}</Select>
          </Field>
          {form.placementBasis === "contract" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Broj ugovora" htmlFor={`${id}-contractNumber`}>
                <Input {...text("contractNumber")} />
              </Field>
              <Field label="Datum ugovora" htmlFor={`${id}-contractDate`}>
                <DateInput id={`${id}-contractDate`} value={form.contractDate ?? ""} onChange={(v) => set({ contractDate: v || null })} fromYear={2000} />
              </Field>
            </div>
          )}
          {form.placementBasis === "csr" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Centar za socijalni rad" htmlFor={`${id}-csrName`}>
                <Input {...text("csrName")} placeholder="npr. GCSR Beograd, odeljenje Zvezdara" />
              </Field>
              <Field label="Voditelj slučaja" htmlFor={`${id}-caseManager`}>
                <Input {...text("caseManager")} />
              </Field>
              <Field label="Broj rešenja / uputa" htmlFor={`${id}-csrDecisionNumber`}>
                <Input {...text("csrDecisionNumber")} />
              </Field>
              <Field label="Datum rešenja" htmlFor={`${id}-csrDecisionDate`}>
                <DateInput id={`${id}-csrDecisionDate`} value={form.csrDecisionDate ?? ""} onChange={(v) => set({ csrDecisionDate: v || null })} fromYear={2000} />
              </Field>
            </div>
          )}
        </Group>

        <Group title="Pravni status">
          <Field label="Poslovna sposobnost" htmlFor={`${id}-legalCapacity`}>
            <Select {...text("legalCapacity")}>{options(LEGAL_CAPACITY_LABEL)}</Select>
          </Field>
          {needsGuardian && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Staratelj" htmlFor={`${id}-g-name`}>
                <Input id={`${id}-g-name`} value={form.guardian.name} onChange={(e) => set({ guardian: { ...form.guardian, name: e.target.value } })} />
              </Field>
              <Field label="Odnos sa korisnikom" htmlFor={`${id}-g-relation`}>
                <Input id={`${id}-g-relation`} value={form.guardian.relation} onChange={(e) => set({ guardian: { ...form.guardian, relation: e.target.value } })} placeholder="npr. sin, CSR" />
              </Field>
              <Field label="Telefon staratelja" htmlFor={`${id}-g-phone`}>
                <Input id={`${id}-g-phone`} value={form.guardian.phone} onChange={(e) => set({ guardian: { ...form.guardian, phone: e.target.value } })} />
              </Field>
              <Field label="Organ starateljstva" htmlFor={`${id}-g-authority`}>
                <Input id={`${id}-g-authority`} value={form.guardian.authority} onChange={(e) => set({ guardian: { ...form.guardian, authority: e.target.value } })} />
              </Field>
              <Field label="Broj rešenja" htmlFor={`${id}-g-number`}>
                <Input id={`${id}-g-number`} value={form.guardian.decisionNumber} onChange={(e) => set({ guardian: { ...form.guardian, decisionNumber: e.target.value } })} />
              </Field>
              <Field label="Datum rešenja" htmlFor={`${id}-g-date`}>
                <DateInput id={`${id}-g-date`} value={form.guardian.decisionDate ?? ""} onChange={(v) => set({ guardian: { ...form.guardian, decisionDate: v || null } })} fromYear={1990} />
              </Field>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Osoba od poverenja (čl. 10a) — korisnik je sam bira za procenu, plan i ugovor, i može da je promeni.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Osoba od poverenja" htmlFor={`${id}-t-name`}>
              <Input id={`${id}-t-name`} value={form.trustedPerson.name} onChange={(e) => set({ trustedPerson: { ...form.trustedPerson, name: e.target.value } })} />
            </Field>
            <Field label="Odnos" htmlFor={`${id}-t-relation`}>
              <Input id={`${id}-t-relation`} value={form.trustedPerson.relation} onChange={(e) => set({ trustedPerson: { ...form.trustedPerson, relation: e.target.value } })} />
            </Field>
            <Field label="Telefon" htmlFor={`${id}-t-phone`}>
              <Input id={`${id}-t-phone`} value={form.trustedPerson.phone} onChange={(e) => set({ trustedPerson: { ...form.trustedPerson, phone: e.target.value } })} />
            </Field>
          </div>
        </Group>

        <Group title="Porodica i kontakti" hint="Označite koga treba obavestiti u hitnim slučajevima.">
          {form.contacts.map((c, i) => (
            <div key={c._id ?? i} className="grid gap-3 rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03] sm:grid-cols-[1.2fr_0.8fr_1fr_1fr_auto]">
              <Input aria-label={`Kontakt ${i + 1}: ime i prezime`} value={c.name} onChange={(e) => setContact(i, { name: e.target.value })} placeholder="Ime i prezime" />
              <Input aria-label={`Kontakt ${i + 1}: srodstvo`} value={c.relation} onChange={(e) => setContact(i, { relation: e.target.value })} placeholder="Srodstvo" />
              <Input aria-label={`Kontakt ${i + 1}: telefon`} value={c.phone} onChange={(e) => setContact(i, { phone: e.target.value })} placeholder="Telefon" />
              <Input aria-label={`Kontakt ${i + 1}: e-pošta`} value={c.email} onChange={(e) => setContact(i, { email: e.target.value })} placeholder="E-pošta" />
              <button
                type="button"
                onClick={() => set({ contacts: form.contacts.filter((_, j) => j !== i) })}
                aria-label={`Ukloni kontakt ${c.name || i + 1}`}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10"
              >
                <LuTrash2 className="h-4 w-4" />
              </button>
              <Input className="sm:col-span-3" aria-label={`Kontakt ${i + 1}: adresa`} value={c.address} onChange={(e) => setContact(i, { address: e.target.value })} placeholder="Adresa (nije obavezno)" />
              <Checkbox id={`${id}-c-${i}-em`} className="sm:col-span-2 sm:self-center" label="Hitni kontakt" checked={c.emergency} onChange={(e) => setContact(i, { emergency: e.target.checked })} />
            </div>
          ))}
          <Button size="sm" variant="outline" startIcon={<LuPlus className="h-4 w-4" />} onClick={() => set({ contacts: [...form.contacts, { ...EMPTY_CONTACT }] })}>
            Dodaj kontakt
          </Button>
        </Group>

        <Group title="Zaduženi zaposleni" hint="Prati individualni plan i kontakt sa porodicom (čl. 10 st. 4).">
          <Field label="Zaduženi zaposleni" htmlFor={`${id}-assignedStaff`}>
            <Select id={`${id}-assignedStaff`} value={form.assignedStaff ?? ""} onChange={(e) => set({ assignedStaff: e.target.value || null })}>
              <option value="">Nije određen</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.lastName} · {roleLabel(s.role)}
                </option>
              ))}
            </Select>
          </Field>
        </Group>
      </form>
    </Dialog>
  );
}
