import { ReactNode, useId } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import Button from "@shared/ui/button/Button";
import { Input, Select, Textarea } from "@shared/ui/form/controls";
import DateInput from "@shared/ui/form/DateInput";
import { todayIso } from "@shared/lib/dateText";
import {
  jmbgCheck,
  jmbgInfo,
  LEGAL_CAPACITY_LABEL,
  MARITAL_LABEL,
  PatientBasics,
  PENSION_LABEL,
  SocialContact,
  SocialHealth,
  SocialProfileInput,
} from "@features/social/dossier";

interface Props {
  basics: PatientBasics;
  onBasics: (patch: Partial<PatientBasics>) => void;
  profile: SocialProfileInput;
  onProfile: (patch: Partial<SocialProfileInput>) => void;
  errors?: Partial<Record<"name" | "lastName" | "admissionDate", string>>;
}

const EMPTY_CONTACT: SocialContact = { name: "", relation: "", phone: "", email: "", address: "", emergency: false, note: "" };

/** Deo lista (I. OPŠTI PODACI, II. ZDRAVSTVENO STANJE…) — naslov kao u obrascu */
function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 underline underline-offset-4 dark:text-white/90">{title}</h3>
      {children}
    </section>
  );
}

/** Stavka lista: tekst iz obrasca (sa brojem) i polja za upis */
function Item({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-800 dark:text-gray-200">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
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

// Socijalno-zdravstveni podaci: obrazac 4 (list o socijalno-anamnestičkim podacima) redom, sa istim
// brojevima i tekstom stavki. Opšti podaci (deo I) su isti podaci kao u "Detaljnim podacima" — menjaju
// se na oba mesta; delovi II–V se čuvaju u kartonu i pune obrazac 4.
export default function SocialHealthFields({ basics, onBasics, profile, onProfile, errors = {} }: Props) {
  const id = useId();
  const f = (key: string) => `${id}-${key}`;
  const text = (key: keyof SocialProfileInput) => ({
    id: f(key),
    value: String(profile[key] ?? ""),
    onChange: (e: { target: { value: string } }) => onProfile({ [key]: e.target.value } as Partial<SocialProfileInput>),
  });
  const health = profile.socialHealth;
  const h = (key: Exclude<keyof SocialHealth, "date">) => ({
    id: f(`sh-${key}`),
    value: health[key],
    onChange: (e: { target: { value: string } }) => onProfile({ socialHealth: { ...health, [key]: e.target.value } }),
  });
  const setGuardian = (patch: Partial<SocialProfileInput["guardian"]>) => onProfile({ guardian: { ...profile.guardian, ...patch } });
  const setSpouse = (patch: Partial<SocialProfileInput["spouse"]>) => onProfile({ spouse: { ...profile.spouse, ...patch } });
  const setContact = (i: number, patch: Partial<SocialContact>) => onProfile({ contacts: profile.contacts.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const emergency = profile.contacts.findIndex((c) => c.emergency);

  const jmbg = jmbgCheck(profile.jmbg, basics.dateOfBirth);
  const onJmbg = (value: string) => {
    const digits = value.replace(/[^\d]/g, "").slice(0, 13);
    const info = jmbgInfo(digits);
    onProfile({ jmbg: digits, ...(info && !profile.sex ? { sex: info.sex } : {}) });
    if (info && !basics.dateOfBirth) onBasics({ dateOfBirth: info.birthDate });
  };

  return (
    <div className="space-y-5">
      <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-white/[0.03] dark:text-gray-400">
        Redom kao obrazac 4 — List o socijalno-anamnestičkim podacima korisnika (DS-2). Opšti podaci su isti kao u „Detaljnim podacima“.
      </p>

      <Part title="I. Opšti podaci:">
        <Item label="1. Prezime i ime korisnika (za žene i devojačko prezime):" htmlFor={f("lastName")}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input id={f("lastName")} placeholder="Prezime" value={basics.lastName} onChange={(e) => onBasics({ lastName: e.target.value })} invalid={!!errors.lastName} aria-label="Prezime" />
            <Input id={f("name")} placeholder="Ime" value={basics.name} onChange={(e) => onBasics({ name: e.target.value })} invalid={!!errors.name} aria-label="Ime" />
            <Input {...text("maidenName")} placeholder="Devojačko prezime" aria-label="Devojačko prezime" />
          </div>
        </Item>
        <Item label="2. Prezime i ime oca:" htmlFor={f("fatherName")}>
          <Input {...text("fatherName")} />
        </Item>
        <Item label="3. Prezime i ime majke i njeno devojačko prezime:" htmlFor={f("motherName")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input {...text("motherName")} placeholder="Prezime i ime majke" />
            <Input {...text("motherMaidenName")} placeholder="Devojačko prezime majke" aria-label="Devojačko prezime majke" />
          </div>
        </Item>
        <Item label="4. Datum i mesto rođenja:" htmlFor={f("dob")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <DateInput id={f("dob")} value={basics.dateOfBirth} onChange={(v) => onBasics({ dateOfBirth: v })} max={todayIso()} fromYear={1900} invalid={jmbg.mismatch} />
            <Input {...text("birthPlace")} placeholder="Mesto rođenja" aria-label="Mesto rođenja" />
          </div>
        </Item>
        <div className="grid gap-4 sm:grid-cols-2">
          <Item label="5. Državljanstvo:" htmlFor={f("citizenship")}>
            <Input {...text("citizenship")} />
          </Item>
          <Item label="JMBG:" htmlFor={f("jmbg")} hint={jmbg.invalid && profile.jmbg.length === 13 ? "JMBG nije ispravan — proverite cifre." : undefined}>
            <Input id={f("jmbg")} value={profile.jmbg} onChange={(e) => onJmbg(e.target.value)} inputMode="numeric" maxLength={13} invalid={jmbg.invalid && profile.jmbg.length === 13} />
          </Item>
        </div>
        <Item label="6. Mesto i adresa boravka pre dolaska u dom:" htmlFor={f("address")}>
          <Input id={f("address")} value={basics.address} onChange={(e) => onBasics({ address: e.target.value })} />
        </Item>
        <div className="grid gap-4 sm:grid-cols-2">
          <Item label="7. Nacionalnost:" htmlFor={f("nationality")}>
            <Input {...text("nationality")} />
          </Item>
          <Item label="Versko opredeljenje:" htmlFor={f("religion")}>
            <Input {...text("religion")} />
          </Item>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Item label="8. Bračno stanje:" htmlFor={f("maritalStatus")}>
            <Select {...text("maritalStatus")}>{options(MARITAL_LABEL)}</Select>
          </Item>
          <div className="sm:col-span-2">
            <Item label="Prezime i ime bračnog druga (za žene devojačko prezime) i adresa:" htmlFor={f("sp-name")}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input id={f("sp-name")} value={profile.spouse.name} onChange={(e) => setSpouse({ name: e.target.value })} placeholder="Prezime i ime" />
                <Input value={profile.spouse.maidenName} onChange={(e) => setSpouse({ maidenName: e.target.value })} placeholder="Devojačko prezime" aria-label="Devojačko prezime bračnog druga" />
                <Input value={profile.spouse.address} onChange={(e) => setSpouse({ address: e.target.value })} placeholder="Adresa" aria-label="Adresa bračnog druga" />
              </div>
            </Item>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Item label="9. Školska sprema:" htmlFor={f("education")}>
            <Input {...text("education")} />
          </Item>
          <Item label="Zanimanje u aktivnom periodu života:" htmlFor={f("occupation")}>
            <Input {...text("occupation")} />
          </Item>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Item label="10. Socijalni status:" htmlFor={f("socialStatus")}>
            <Input {...text("socialStatus")} placeholder="npr. penzioner" />
          </Item>
          <Item label="Redovna lična primanja:" htmlFor={f("pensionType")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select {...text("pensionType")}>{options(PENSION_LABEL, "Penzija — nije uneto")}</Select>
              <Input {...text("incomeNote")} placeholder="npr. tuđa nega i pomoć" aria-label="Ostala primanja" />
            </div>
          </Item>
        </div>
        <Item label="11. Zdravstveno osiguranje-osnov:" htmlFor={f("insuranceBasis")}>
          <Input {...text("insuranceBasis")} />
        </Item>
        <Item label="12. Podaci o imovini koju poseduje:" htmlFor={f("property")}>
          <Input {...text("property")} />
        </Item>

        <Item label="PREZIME I IME SRODNIKA I DRUGIH LICA KOJA ĆE KORISNIKA POSEĆIVATI:">
          <div className="space-y-2">
            {profile.contacts.map((c, i) => (
              <div key={i} className="grid items-start gap-2 sm:grid-cols-[1.3fr_0.8fr_1.4fr_1fr_auto]">
                <Input value={c.name} onChange={(e) => setContact(i, { name: e.target.value })} placeholder="Prezime i ime" aria-label={`Posetilac ${i + 1} — prezime i ime`} />
                <Input value={c.relation} onChange={(e) => setContact(i, { relation: e.target.value })} placeholder="Srodstvo" aria-label={`Posetilac ${i + 1} — srodstvo`} />
                <Input value={c.address} onChange={(e) => setContact(i, { address: e.target.value })} placeholder="Adresa" aria-label={`Posetilac ${i + 1} — adresa`} />
                <Input value={c.phone} onChange={(e) => setContact(i, { phone: e.target.value })} placeholder="Telefon" inputMode="tel" aria-label={`Posetilac ${i + 1} — telefon`} />
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`Ukloni posetioca ${i + 1}`}
                  onClick={() => onProfile({ contacts: profile.contacts.filter((_, j) => j !== i) })}
                  startIcon={<LuTrash2 className="h-4 w-4" />}
                />
              </div>
            ))}
            <Button variant="outline" size="sm" startIcon={<LuPlus className="h-4 w-4" />} onClick={() => onProfile({ contacts: [...profile.contacts, { ...EMPTY_CONTACT }] })}>
              Dodaj lice
            </Button>
          </div>
        </Item>
        <Item label="Koga obavestiti u slučaju bolesti-smrti:" htmlFor={f("emergency")} hint={profile.contacts.length ? undefined : "Prvo dodajte lice iznad."}>
          <Select
            id={f("emergency")}
            value={emergency >= 0 ? String(emergency) : ""}
            disabled={!profile.contacts.length}
            onChange={(e) => {
              const k = e.target.value === "" ? -1 : Number(e.target.value);
              onProfile({ contacts: profile.contacts.map((c, j) => ({ ...c, emergency: j === k })) });
            }}
          >
            <option value="">Nije izabrano</option>
            {profile.contacts.map((c, i) => (
              <option key={i} value={i}>
                {[c.name || `Lice ${i + 1}`, c.relation, c.phone].filter(Boolean).join(", ")}
              </option>
            ))}
          </Select>
        </Item>
      </Part>

      <Part title="II. Zdravstveno stanje:">
        <Item label="1. Pokretljivost:" htmlFor={f("sh-mobility")}>
          <Input {...h("mobility")} />
        </Item>
        <Item label="2. Sposobnost za brigu o sebi:" htmlFor={f("sh-selfCare")}>
          <Textarea {...h("selfCare")} rows={2} />
        </Item>
        <Item label="3. Sposobnost komunikacije:" htmlFor={f("sh-communication")}>
          <Input {...h("communication")} />
        </Item>
        <Item label="4. Hronične bolesti:" htmlFor={f("sh-chronicIllness")}>
          <Input {...h("chronicIllness")} />
        </Item>
        <Item label="5. Ostalo:" htmlFor={f("sh-healthOther")}>
          <Input {...h("healthOther")} />
        </Item>
      </Part>

      <Part title="III. Porodično stanje:">
        <Item label="1. Porodica i porodični odnosi:" htmlFor={f("sh-family")}>
          <Textarea {...h("family")} rows={4} />
        </Item>
        <Item label="5. Da li je korisnik lišen poslovne sposobnosti, čijom odlukom i broj rešenja:" htmlFor={f("legalCapacity")}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Select {...text("legalCapacity")}>{options(LEGAL_CAPACITY_LABEL)}</Select>
            <Input value={profile.guardian.authority} onChange={(e) => setGuardian({ authority: e.target.value })} placeholder="Čijom odlukom (organ)" aria-label="Čijom odlukom" />
            <Input value={profile.guardian.decisionNumber} onChange={(e) => setGuardian({ decisionNumber: e.target.value })} placeholder="Broj rešenja" aria-label="Broj rešenja" />
          </div>
        </Item>
        <Item label="6. Prezime, ime i adresa staraoca:" htmlFor={f("g-name")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input id={f("g-name")} value={profile.guardian.name} onChange={(e) => setGuardian({ name: e.target.value })} placeholder="Prezime i ime" />
            <Input value={profile.guardian.address} onChange={(e) => setGuardian({ address: e.target.value })} placeholder="Adresa" aria-label="Adresa staraoca" />
          </div>
        </Item>
        <Item label="7. Ostalo:" htmlFor={f("sh-familyOther")}>
          <Textarea {...h("familyOther")} rows={2} />
        </Item>
      </Part>

      <Part title="IV. Podaci u vezi smeštaja u dom:">
        <Item label="1. Po čijem zahtevu je tražen smeštaj u dom:" htmlFor={f("sh-requestedBy")}>
          <Input {...h("requestedBy")} />
        </Item>
        <Item label="2. Razlozi smeštaja:" htmlFor={f("sh-reasons")}>
          <Input {...h("reasons")} />
        </Item>
        <Item label="3. Stav stare osobe o smeštaju:" htmlFor={f("sh-userAttitude")}>
          <Input {...h("userAttitude")} />
        </Item>
        <Item label="4. Stav najbližih srodnika o smeštaju:" htmlFor={f("sh-relativesAttitude")}>
          <Input {...h("relativesAttitude")} />
        </Item>
        <Item label="5. Posebne okolnosti (u vezi sa lečenjem, režimom života, navikama i dr.) koje treba imati u vidu prilikom smeštaja:" htmlFor={f("sh-circumstances")}>
          <Textarea {...h("circumstances")} rows={2} />
        </Item>
        <Item label="6. Ko snosi troškove smeštaja:" htmlFor={f("payerNote")}>
          <Input {...text("payerNote")} placeholder="npr. svojom penzijom i sin" />
        </Item>
      </Part>

      <Part title="V. Mišljenje i odluka komisije za prijem:">
        <Item label="Mišljenje i odluka komisije" htmlFor={f("sh-commission")}>
          <Textarea {...h("commission")} rows={4} />
        </Item>
        <Item label="U Beogradu, dana:" htmlFor={f("sh-date")} hint="Ako se ne upiše, u obrazac ide datum prijema.">
          <div className="max-w-xs">
            <DateInput id={f("sh-date")} value={health.date ?? ""} onChange={(v) => onProfile({ socialHealth: { ...health, date: v || null } })} fromYear={2000} />
          </div>
        </Item>
      </Part>
    </div>
  );
}
