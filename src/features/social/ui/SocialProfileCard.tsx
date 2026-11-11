import { ReactNode, useState } from "react";
import { LuHistory, LuIdCard, LuPencil, LuPhone } from "react-icons/lu";
import { Card, CardBody, CardHeader } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import Dialog from "@shared/ui/dialog/Dialog";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { formatDay } from "@shared/lib/calendarDay";
import { roleLabel } from "@shared/lib/format";
import {
  basicsOf,
  DOSSIER_CHECKS,
  LEGAL_CAPACITY_LABEL,
  MARITAL_LABEL,
  missingInfo,
  PAYER_LABEL,
  PENSION_LABEL,
  PLACEMENT_LABEL,
  profileToInput,
  SEX_LABEL,
  SUPPORT_LEVELS,
  useSocialHistory,
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

const ACTION_LABEL: Record<string, string> = {
  "patient.create": "Korisnik je unet",
  "profile.update": "Izmenjeni podaci",
  "document.create": "Napravljen dokument",
  "document.update": "Izmenjen nacrt",
  "document.finalize": "Zaključen dokument",
  "document.delete": "Obrisan nacrt",
  "template.fill": "Popunjen šablon",
};
const FIELD_LABEL: Record<string, string> = {
  name: "ime",
  lastName: "prezime",
  dateOfBirth: "datum rođenja",
  address: "adresa",
  contactPerson: "kontakt osoba",
  jmbg: "JMBG",
  guardian: "staratelj",
  contacts: "kontakti",
  legalCapacity: "poslovna sposobnost",
  placementBasis: "osnov smeštaja",
  assignedStaff: "zaduženi zaposleni",
  intake: "prijemna procena",
  assessment: "procena",
  reassessment: "ponovna procena",
  plan: "individualni plan",
  plan_review: "pregled plana",
};

function HistoryDialog({ open, onClose, patientId }: { open: boolean; onClose: () => void; patientId: string }) {
  const { data = [], isLoading } = useSocialHistory(patientId, open);
  return (
    <Dialog open={open} onClose={onClose} size="lg" title="Istorija izmena" description="Ko je i kada menjao podatke i dokumente (bez samih vrednosti).">
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : data.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Još nema zabeleženih izmena.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.map((h) => (
            <li key={h._id} className="py-2.5 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-gray-900 dark:text-white/90">{ACTION_LABEL[h.action] ?? h.action}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(h.createdAt).toLocaleString("sr-Latn-RS", { dateStyle: "short", timeStyle: "short" })} · {h.user ? `${h.user.name} ${h.user.lastName}` : "—"}
                </span>
              </div>
              {(h.fields.length > 0 || h.summary) && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{[h.fields.map((f) => FIELD_LABEL[f] ?? f).join(", "), h.summary].filter(Boolean).join(" · ")}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

// Socijalni dosije: lični i pravni podaci korisnika, osnov smeštaja i kontakti.
export default function SocialProfileCard({ patientId, canWrite }: { patientId: string; canWrite: boolean }) {
  const { data, isLoading, isError, refetch } = useSocialProfile(patientId);
  const [editing, setEditing] = useState(false);
  const [history, setHistory] = useState(false);
  const p = data?.profile ?? null;
  const patient = data?.patient;
  const level = SUPPORT_LEVELS.find((l) => l.value === p?.supportLevel);
  const missing = patient ? missingInfo(basicsOf(patient), profileToInput(p)) : [];
  const percent = Math.round(((DOSSIER_CHECKS - missing.length) / DOSSIER_CHECKS) * 100);

  return (
    <Card>
      <CardHeader
        icon={<LuIdCard />}
        title="Podaci korisnika"
        description="Uneto jednom, koristi se u svim dokumentima"
        actions={
          <div className="flex gap-2">
            <Button size="xs" variant="ghost" startIcon={<LuHistory className="h-3.5 w-3.5" />} onClick={() => setHistory(true)} disabled={!data}>
              Istorija
            </Button>
            {canWrite && (
              <Button size="xs" variant="outline" startIcon={<LuPencil className="h-3.5 w-3.5" />} onClick={() => setEditing(true)} disabled={!data}>
                {p ? "Izmeni" : "Dopuni podatke"}
              </Button>
            )}
          </div>
        }
      />
      <CardBody className="space-y-5">
        {isLoading ? (
          <Skeleton className="h-40" />
        ) : isError || !patient ? (
          <ErrorState message="Podaci korisnika nisu učitani." onRetry={() => refetch()} />
        ) : (
          <>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300">Dosije popunjen {percent}%</span>
                {missing.length > 0 && <span className="text-gray-500 dark:text-gray-400">Nedostaje: {missing.join(", ")}</span>}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Popunjenost dosijea">
                <div className={`h-full rounded-full ${percent === 100 ? "bg-success-500" : "bg-brand-500"}`} style={{ width: `${percent}%` }} />
              </div>
            </div>

            <Section title="Lični podaci">
              <Item label="Ime i prezime">
                {patient.name} {patient.lastName}
              </Item>
              <Item label="JMBG">{p?.jmbg}</Item>
              <Item label="Datum i mesto rođenja">{[formatDay(patient.dateOfBirth), p?.birthPlace].filter(Boolean).join(", ")}</Item>
              <Item label="Ime roditelja">{p?.parentName}</Item>
              <Item label="Pol">{SEX_LABEL[p?.sex ?? ""]}</Item>
              <Item label="Bračni status">{MARITAL_LABEL[p?.maritalStatus ?? ""]}</Item>
              <Item label="Adresa prebivališta">{[patient.address, p?.municipality].filter(Boolean).join(", ")}</Item>
              <Item label="Državljanstvo">{p?.citizenship}</Item>
              <Item label="Obrazovanje / zanimanje">{[p?.education, p?.occupation].filter(Boolean).join(" · ")}</Item>
              <Item label="Lična karta">{p?.idCardNumber}</Item>
              <Item label="LBO / zdravstvena kartica">{p?.healthInsuranceNumber}</Item>
              <Item label="Izabrani lekar">{p?.chosenDoctor}</Item>
            </Section>

            <Section title="Smeštaj i prihodi">
              <Item label="Datum prijema">{formatDay(patient.admissionDate)}</Item>
              <Item label="Osnov smeštaja">{PLACEMENT_LABEL[p?.placementBasis ?? ""]}</Item>
              {p?.placementBasis === "contract" && <Item label="Ugovor">{[p.contractNumber, formatDay(p.contractDate)].filter(Boolean).join(" od ")}</Item>}
              {p?.placementBasis === "csr" && (
                <>
                  <Item label="Centar za socijalni rad">{p.csrName}</Item>
                  <Item label="Voditelj slučaja">{p.caseManager}</Item>
                  <Item label="Rešenje CSR-a">{[p.csrDecisionNumber, formatDay(p.csrDecisionDate)].filter(Boolean).join(" od ")}</Item>
                </>
              )}
              <Item label="Penzija">{PENSION_LABEL[p?.pensionType ?? ""]}</Item>
              <Item label="Plaća smeštaj">{PAYER_LABEL[p?.payer ?? ""]}</Item>
              <Item label="Stepen podrške">{level ? <span title={level.hint}>{level.label}</span> : "nije procenjen"}</Item>
              <Item label="Zaduženi zaposleni">{p?.assignedStaff ? `${p.assignedStaff.name} ${p.assignedStaff.lastName} · ${roleLabel(p.assignedStaff.role)}` : ""}</Item>
            </Section>

            <Section title="Pravni status">
              <Item label="Poslovna sposobnost">{LEGAL_CAPACITY_LABEL[p?.legalCapacity ?? ""]}</Item>
              {p?.guardian?.name && (
                <>
                  <Item label="Staratelj">{[p.guardian.name, p.guardian.relation, p.guardian.phone].filter(Boolean).join(" · ")}</Item>
                  <Item label="Rešenje o starateljstvu">{[p.guardian.decisionNumber, formatDay(p.guardian.decisionDate), p.guardian.authority].filter(Boolean).join(" · ")}</Item>
                </>
              )}
              <Item label="Osoba od poverenja">{[p?.trustedPerson?.name, p?.trustedPerson?.relation, p?.trustedPerson?.phone].filter(Boolean).join(" · ")}</Item>
            </Section>

            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Porodica i kontakti</h4>
              {!p?.contacts.length ? (
                <p className="text-sm text-gray-400">{patient.contactPerson || "Nema unetih kontakata."}</p>
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
      {canWrite && patient && <SocialProfileDialog open={editing} onClose={() => setEditing(false)} patient={patient} profile={p} />}
      <HistoryDialog open={history} onClose={() => setHistory(false)} patientId={patientId} />
    </Card>
  );
}
