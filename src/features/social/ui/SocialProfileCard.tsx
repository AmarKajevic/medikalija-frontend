import { ReactNode, useState } from "react";
import { LuIdCard, LuPencil, LuPhone } from "react-icons/lu";
import { Card, CardBody, CardHeader } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { formatDay } from "@shared/lib/calendarDay";
import { roleLabel } from "@shared/lib/format";
import {
  LEGAL_CAPACITY_LABEL,
  MARITAL_LABEL,
  PAYER_LABEL,
  PENSION_LABEL,
  PLACEMENT_LABEL,
  SEX_LABEL,
  SUPPORT_LEVELS,
  useSocialProfile,
} from "@features/social/dossier";
import SocialProfileDialog from "./SocialProfileDialog";

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="truncate text-sm text-gray-900 dark:text-white/90">{children || <span className="text-gray-400">—</span>}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h4>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">{children}</dl>
    </section>
  );
}

// Socijalni dosije: lični i pravni podaci korisnika, osnov smeštaja i kontakti.
export default function SocialProfileCard({ patientId, canWrite }: { patientId: string; canWrite: boolean }) {
  const { data, isLoading, isError, refetch } = useSocialProfile(patientId);
  const [editing, setEditing] = useState(false);
  const p = data?.profile ?? null;
  const patient = data?.patient;
  const level = SUPPORT_LEVELS.find((l) => l.value === p?.supportLevel);
  const missing = p ? [!p.jmbg && "JMBG", !p.placementBasis && "osnov smeštaja", p.contacts.length === 0 && "kontakt porodice"].filter(Boolean) : [];

  return (
    <Card>
      <CardHeader
        icon={<LuIdCard />}
        title="Lični podaci"
        description="Podaci koji se ponavljaju u dokumentima"
        actions={
          canWrite && (
            <Button size="xs" variant="outline" startIcon={<LuPencil className="h-3.5 w-3.5" />} onClick={() => setEditing(true)} disabled={!data}>
              {p ? "Izmeni" : "Unesi podatke"}
            </Button>
          )
        }
      />
      <CardBody className="space-y-5">
        {isLoading ? (
          <Skeleton className="h-40" />
        ) : isError ? (
          <ErrorState message="Lični podaci nisu učitani." onRetry={() => refetch()} />
        ) : !p ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lični podaci još nisu uneti (JMBG, staratelj, osnov smeštaja, kontakti porodice).
            {canWrite && " Unesite ih jednom — koristiće se u svim dokumentima."}
          </p>
        ) : (
          <>
            {missing.length > 0 && (
              <p className="rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-800 dark:bg-warning-500/10 dark:text-warning-300">Nedostaje: {missing.join(", ")}.</p>
            )}
            <Section title="Lični podaci">
              <Item label="Ime i prezime">
                {patient?.name} {patient?.lastName}
              </Item>
              <Item label="JMBG">{p.jmbg}</Item>
              <Item label="Datum i mesto rođenja">{[formatDay(patient?.dateOfBirth), p.birthPlace].filter(Boolean).join(", ")}</Item>
              <Item label="Ime roditelja">{p.parentName}</Item>
              <Item label="Pol">{SEX_LABEL[p.sex]}</Item>
              <Item label="Bračni status">{MARITAL_LABEL[p.maritalStatus]}</Item>
              <Item label="Adresa prebivališta">{[patient?.address, p.municipality].filter(Boolean).join(", ")}</Item>
              <Item label="Državljanstvo">{p.citizenship}</Item>
              <Item label="Obrazovanje / zanimanje">{[p.education, p.occupation].filter(Boolean).join(" · ")}</Item>
              <Item label="Lična karta">{p.idCardNumber}</Item>
              <Item label="LBO / zdravstvena kartica">{p.healthInsuranceNumber}</Item>
              <Item label="Izabrani lekar">{p.chosenDoctor}</Item>
            </Section>

            <Section title="Smeštaj i prihodi">
              <Item label="Datum prijema">{formatDay(patient?.admissionDate)}</Item>
              <Item label="Osnov smeštaja">{PLACEMENT_LABEL[p.placementBasis]}</Item>
              {p.placementBasis === "contract" && <Item label="Ugovor">{[p.contractNumber, formatDay(p.contractDate)].filter(Boolean).join(" od ")}</Item>}
              {p.placementBasis === "csr" && (
                <>
                  <Item label="Centar za socijalni rad">{p.csrName}</Item>
                  <Item label="Voditelj slučaja">{p.caseManager}</Item>
                  <Item label="Rešenje CSR-a">{[p.csrDecisionNumber, formatDay(p.csrDecisionDate)].filter(Boolean).join(" od ")}</Item>
                </>
              )}
              <Item label="Penzija">{PENSION_LABEL[p.pensionType]}</Item>
              <Item label="Plaća smeštaj">{PAYER_LABEL[p.payer]}</Item>
              <Item label="Stepen podrške">{level ? <span title={level.hint}>{level.label}</span> : "nije procenjen"}</Item>
              <Item label="Zaduženi zaposleni">{p.assignedStaff ? `${p.assignedStaff.name} ${p.assignedStaff.lastName} · ${roleLabel(p.assignedStaff.role)}` : ""}</Item>
            </Section>

            <Section title="Pravni status">
              <Item label="Poslovna sposobnost">{LEGAL_CAPACITY_LABEL[p.legalCapacity]}</Item>
              {p.guardian?.name && (
                <>
                  <Item label="Staratelj">{[p.guardian.name, p.guardian.relation, p.guardian.phone].filter(Boolean).join(" · ")}</Item>
                  <Item label="Rešenje o starateljstvu">{[p.guardian.decisionNumber, formatDay(p.guardian.decisionDate), p.guardian.authority].filter(Boolean).join(" · ")}</Item>
                </>
              )}
              <Item label="Osoba od poverenja">{[p.trustedPerson?.name, p.trustedPerson?.relation, p.trustedPerson?.phone].filter(Boolean).join(" · ")}</Item>
            </Section>

            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Porodica i kontakti</h4>
              {p.contacts.length === 0 ? (
                <p className="text-sm text-gray-400">Nema unetih kontakata.</p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {p.contacts.map((c) => (
                    <li key={c._id ?? c.name} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                      <span className="font-medium text-gray-900 dark:text-white/90">{c.name}</span>
                      {c.relation && <span className="text-gray-500 dark:text-gray-400">{c.relation}</span>}
                      {c.emergency && (
                        <Badge size="sm" color="error">
                          hitni kontakt
                        </Badge>
                      )}
                      {c.phone && (
                        <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="ml-auto flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-400">
                          <LuPhone className="h-3.5 w-3.5" />
                          {c.phone}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </CardBody>
      {canWrite && data && <SocialProfileDialog open={editing} onClose={() => setEditing(false)} patientId={patientId} profile={p} />}
    </Card>
  );
}
