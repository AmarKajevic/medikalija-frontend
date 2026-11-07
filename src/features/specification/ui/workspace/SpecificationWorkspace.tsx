import { ReactNode, useMemo, useRef, useState } from "react";
import { LuArrowLeft, LuArrowRight, LuCheck, LuDownload, LuLock, LuPrinter } from "react-icons/lu";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import { notify } from "@shared/lib/notify";
import { formatDay } from "@shared/lib/calendarDay";
import { formatEUR, formatRSD } from "@shared/lib/format";
import { getNextPeriodLabel } from "@features/specification/lib/helpers";
import { Specification } from "@features/specification/types/types";
import { itemDisplayName } from "@features/specification/lib/items";
import { useBillingState } from "@features/specification/hooks/useBillingState";
import { useFacility } from "@entities/facility/facility";
import { useNurseEntries } from "@features/nurse-entries/model";
import EntryReview from "@features/nurse-entries/ui/EntryReview";
import SpecificationItems from "./SpecificationItems";
import BillingPanel from "./BillingPanel";
import PeriodSwitcher from "./PeriodSwitcher";
import EditPeriodDates from "./EditPeriodDates";
import AddItemPanel, { type AddPreset } from "./AddItemPanel";
import PeriodNotes from "./PeriodNotes";
import ReviewStep from "./ReviewStep";

export type Step = 1 | 2 | 3;

const STEPS: Array<{ n: Step; title: string; hint: string }> = [
  { n: 1, title: "Šta je pacijent dobio", hint: "Lekovi, artikli, analize, troškovi" },
  { n: 2, title: "Obračun za uplatu", hint: "Dug i smeštaj" },
  { n: 3, title: "Pregled i štampa", hint: "Ukupno i PDF" },
];

interface Props {
  specification: Specification;
  patientId: string;
  patientName: string;
  /** "billing" = period specifikacije (istekao, u njemu se pravi obračun); "other" = ručno izabran raniji period */
  period?: "active" | "billing" | "other";
  /** Koji unosi sestara na čekanju pripadaju ovom periodu (po danu kad je dato) */
  pendingFilter?: (performedAt: string) => boolean;
}

const Section = ({ title, description, children }: { title: string; description?: string; children: ReactNode }) => (
  <section className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
    <header className="border-b border-gray-100 px-5 py-3.5 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>}
    </header>
    <div className="p-5">{children}</div>
  </section>
);

function Stepper({ step, onChange }: { step: Step; onChange: (s: Step) => void }) {
  return (
    <nav aria-label="Koraci">
      <ol className="grid grid-cols-3 gap-2">
        {STEPS.map((s) => {
          const current = s.n === step;
          const done = s.n < step;
          return (
            <li key={s.n}>
              <button
                type="button"
                onClick={() => onChange(s.n)}
                aria-current={current ? "step" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                  current
                    ? "border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10"
                    : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-white/[0.03]"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    current
                      ? "bg-brand-500 text-white"
                      : done
                        ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                        : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
                  }`}
                >
                  {done ? <LuCheck className="h-4 w-4" aria-label="završeno" /> : s.n}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className={`block truncate text-sm font-medium ${current ? "text-brand-700 dark:text-brand-300" : "text-gray-800 dark:text-white/90"}`}>
                    {s.title}
                  </span>
                  <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{s.hint}</span>
                </span>
                <span className="sr-only sm:hidden">{s.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function SpecificationWorkspace({ specification: spec, patientId, patientName, period = "active", pendingFilter }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [addPreset, setAddPreset] = useState<AddPreset | null>(null);
  const addPanelRef = useRef<HTMLDivElement>(null);

  // Iz učinka sestre: otvori "Drugi trošak" sa opisom iz beleške, fokus na iznos
  const addAsCost = (label: string) => {
    setAddPreset({ kind: "extra", label, nonce: Date.now() });
    addPanelRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };
  const billing = useBillingState(spec, patientId);
  const { facility } = useFacility();
  const pending = useNurseEntries({ patientId, status: ["pending"], limit: 500 }).data ?? [];
  const pendingCount = pending.filter((e) => !pendingFilter || pendingFilter(e.performedAt)).length;
  const reviewFilter = useMemo(() => (pendingFilter ? (e: { performedAt: string }) => pendingFilter(e.performedAt) : undefined), [pendingFilter]);
  const nextPeriodLabel = getNextPeriodLabel(spec.endDate);
  const isBilling = period === "billing";
  const isChosen = period === "other";
  const canAdd = isBilling || isChosen || !!spec.isActive;
  const current = STEPS[step - 1]!;

  // pdfmake sa fontovima je ~1 MB — učitava se tek kad korisnik zatraži PDF
  const exportPdf = async (mode: "download" | "print") => {
    const { generateSpecificationPDF } = await import("@features/specification/lib/generateSpecificationPDF");
    return generateSpecificationPDF({
      mode,
      patientName,
      startDate: spec.startDate,
      endDate: spec.endDate,
      items: spec.items.map((item) => ({
        formattedName: itemDisplayName(item),
        amount: item.amount ?? 1,
        price: item.price ?? 0,
      })),
      ...billing.result,
      nextPeriodLabel,
      facility,
    });
  };
  const runExport = (mode: "download" | "print") => exportPdf(mode).catch((err) => notify.error(err, "PDF nije napravljen."));

  // Sa obračuna se ne ide dalje sa nesačuvanim dugom/smeštajem — čuva se usput
  const goTo = async (next: Step) => {
    if (step === 2 && next > 2 && billing.dirty && !(await billing.saveBilling())) return;
    setStep(next);
  };

  return (
    <div className="flex min-h-full flex-col gap-5">
      {/* Period i status */}
      <div className="flex flex-wrap items-center gap-2">
        {isBilling ? (
          <>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Period {formatDay(spec.startDate)} – {formatDay(spec.endDate)}
            </span>
            <Badge size="sm" color="warning">Period specifikacije</Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400">Istekao period — ovde se pravi obračun za naplatu.</span>
          </>
        ) : isChosen ? (
          <>
            <Badge size="sm" color="light">Ručno izabran period</Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400">Stavke i obračun idu u ovaj period.</span>
          </>
        ) : canAdd ? (
          <>
            <PeriodSwitcher patientId={patientId} activeSpecification={spec} />
            <Badge size="sm" color="success">Aktivan period</Badge>
          </>
        ) : (
          <>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Period {formatDay(spec.startDate)} – {formatDay(spec.endDate)}
            </span>
            <Badge size="sm" color="light">Zatvoren period</Badge>
          </>
        )}
        {/* Ručni unos datuma za svaki period; sledeći periodi se nadovezuju na novi kraj */}
        <EditPeriodDates specification={spec} patientId={patientId} />
      </div>

      <div>
        <Stepper step={step} onChange={(s) => void goTo(s)} />
        <p className="mt-2 text-sm font-medium text-gray-800 dark:text-white/90 sm:hidden">
          Korak {step}: {current.title}
        </p>
      </div>

      <div className="flex-1">
        {step === 1 && canAdd && pendingCount > 0 && (
          <div className="mb-5 rounded-xl border border-warning-200 bg-white shadow-theme-xs dark:border-warning-500/30 dark:bg-gray-900">
            <header className="border-b border-warning-100 bg-warning-50 px-5 py-3.5 dark:border-warning-500/20 dark:bg-warning-500/10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">Unosi sestara čekaju odobrenje ({pendingCount})</h3>
              <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                Prihvaćeno ulazi u specifikaciju i skida se sa stanja (prvo porodično). Odbijeno se ne naplaćuje.
              </p>
            </header>
            <div className="p-5">
              <EntryReview patientId={patientId} filter={reviewFilter} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(320px,400px)_1fr]">
            <div ref={addPanelRef} className="lg:sticky lg:top-0">
              {canAdd ? (
                <Section title="Dodaj u specifikaciju" description="Izaberite šta dodajete, pa popunite polja ispod.">
                  <AddItemPanel specId={spec._id} patientId={patientId} preset={addPreset} />
                </Section>
              ) : (
                <Section title="Zatvoren period">
                  <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <LuLock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <p>
                      Nove stavke se dodaju samo u aktivan period, sa profila pacijenta. Ovde možete da uklonite
                      stavku, izmenite obračun ili odštampate specifikaciju.
                    </p>
                  </div>
                </Section>
              )}
            </div>
            <div className="min-w-0 space-y-5">
              <Section title={`Dodato u ovom periodu (${spec.items.length})`} description="Pogrešno uneto? Uklonite stavku ikonicom korpe.">
                <SpecificationItems specification={spec} patientId={patientId} />
              </Section>
              <PeriodNotes specification={spec} patientId={patientId} onAddAsCost={canAdd ? addAsCost : undefined} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mx-auto max-w-3xl">
            <Section title="Obračun za uplatu" description="Unesite dug i smeštaj. Sve ostalo se računa samo.">
              <BillingPanel billing={billing} nextPeriodLabel={nextPeriodLabel} />
            </Section>
          </div>
        )}

        {step === 3 && (
          <ReviewStep
            specification={spec}
            billing={billing}
            nextPeriodLabel={nextPeriodLabel}
            onEditStep={setStep}
            pendingCount={canAdd ? pendingCount : 0}
          />
        )}
      </div>

      {/* Ukupno je uvek vidljivo, a dugmad vode kroz korake */}
      <div className="sticky bottom-0 z-10 -mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl border border-gray-200 bg-white/95 px-4 py-2.5 sm:py-3 shadow-theme-md backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="min-w-0" aria-live="polite">
          <p className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">
            Korak {step} od 3 · {current.title}
          </p>
          <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white sm:text-base">
            Ukupno: <span className="whitespace-nowrap">{formatRSD(billing.result.totalRSD)}</span>
            <span className="ml-2 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">{formatEUR(billing.result.totalEUR)}</span>
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {step > 1 && (
            <Button variant="outline" startIcon={<LuArrowLeft className="h-4 w-4" />} onClick={() => setStep((step - 1) as Step)}>
              Nazad
            </Button>
          )}
          {step < 3 ? (
            <Button endIcon={<LuArrowRight className="h-4 w-4" />} loading={billing.saving} onClick={() => void goTo((step + 1) as Step)}>
              {step === 1 ? "Dalje: obračun" : "Dalje: pregled"}
            </Button>
          ) : (
            <>
              <Button variant="outline" startIcon={<LuDownload className="h-4 w-4" />} onClick={() => runExport("download")}>
                Preuzmi PDF
              </Button>
              <Button startIcon={<LuPrinter className="h-4 w-4" />} onClick={() => runExport("print")}>
                Štampaj specifikaciju
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
