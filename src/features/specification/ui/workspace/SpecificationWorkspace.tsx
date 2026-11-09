import { ReactNode, useMemo, useRef, useState } from "react";
import { LuArrowLeft, LuArrowRight, LuCheck, LuInfo, LuDownload, LuLock, LuLockOpen, LuPrinter, LuTriangleAlert } from "react-icons/lu";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import { notify } from "@shared/lib/notify";
import { formatDay } from "@shared/lib/calendarDay";
import { formatEUR, formatRSD } from "@shared/lib/format";
import { getNextPeriodLabel } from "@features/specification/lib/helpers";
import { Specification } from "@features/specification/types/types";
import { itemDisplayName, sortSpecItems } from "@features/specification/lib/items";
import { useBillingState } from "@features/specification/hooks/useBillingState";
import { useFacility } from "@entities/facility/facility";
import { useNurseEntries } from "@features/nurse-entries/model";
import EntryReview from "@features/nurse-entries/ui/EntryReview";
import SpecificationItems from "./SpecificationItems";
import { billingRows } from "@features/specification/lib/billingRows";
import { LodgingButton, LodgingDialog, LodgingRows } from "./LodgingBilling";
import PeriodSwitcher from "./PeriodSwitcher";
import EditPeriodDates from "./EditPeriodDates";
import ExchangeRateBox from "./ExchangeRateBox";
import AddItemPanel, { type AddPreset } from "./AddItemPanel";
import PeriodNotes from "./PeriodNotes";
import ReviewStep from "./ReviewStep";

export type Step = 1 | 2;

const STEPS: Array<{ n: Step; title: string; hint: string }> = [
  { n: 1, title: "Šta je pacijent dobio", hint: "Stavke, smeštaj i dug" },
  { n: 2, title: "Pregled i štampa", hint: "Ukupno i PDF" },
];

interface Props {
  specification: Specification;
  patientId: string;
  patientName: string;
  /** "billing" = period specifikacije (istekao, u njemu se pravi obračun); "other" = ručno izabran raniji period */
  period?: "active" | "billing" | "other" | "nonstandard";
  /** Koji unosi sestara na čekanju pripadaju ovom periodu (po danu kad je dato) */
  pendingFilter?: (performedAt: string) => boolean;
  /** Period za koji se smeštaj naplaćuje unapred (tekući period); bez njega: 30 dana posle kraja */
  lodgingPeriod?: { start: string; end: string };
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
      <ol className="grid grid-cols-2 gap-2">
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

export default function SpecificationWorkspace({ specification: spec, patientId, patientName, period = "active", pendingFilter, lodgingPeriod }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [addPreset, setAddPreset] = useState<AddPreset | null>(null);
  const [lodgingOpen, setLodgingOpen] = useState(false);
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
  // Unosi raspoređeni po datumu u drugi period (npr. današnji idu u tekući) — ne ulaze u ovu specifikaciju
  const otherPending = pending.length - pendingCount;
  const reviewFilter = useMemo(() => (pendingFilter ? (e: { performedAt: string }) => pendingFilter(e.performedAt) : undefined), [pendingFilter]);
  const nextPeriodLabel = lodgingPeriod ? `${formatDay(lodgingPeriod.start)} — ${formatDay(lodgingPeriod.end)}` : getNextPeriodLabel(spec.endDate);
  const isBilling = period === "billing";
  const isChosen = period === "other";
  const isNonStandard = period === "nonstandard";
  const canAdd = isBilling || isChosen || isNonStandard || !!spec.isActive;
  // Zatvorena specifikacija je samo za pregled; izmene se omogućavaju tek posle upozorenja
  const closed = !canAdd;
  const [unlocked, setUnlocked] = useState(false);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const editable = canAdd || unlocked;
  const current = STEPS[step - 1]!;

  // pdfmake sa fontovima je ~1 MB — učitava se tek kad korisnik zatraži PDF
  const exportPdf = async (mode: "download" | "print") => {
    const { generateSpecificationPDF } = await import("@features/specification/lib/generateSpecificationPDF");
    return generateSpecificationPDF({
      mode,
      patientName,
      startDate: spec.startDate,
      endDate: spec.endDate,
      items: sortSpecItems(spec.items).map((item) => ({
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

  // Na pregled se ne ide sa nesačuvanim dugom/smeštajem — čuva se usput
  const goTo = async (next: Step) => {
    if (next === 2 && billing.dirty && !(await billing.saveBilling())) return;
    setStep(next);
  };
  const editLodging = () => {
    setStep(1);
    setLodgingOpen(true);
  };

  return (
    <div className="flex min-h-full flex-col gap-5">
      {/* Period i status levo; smeštaj i kurs evra desno (uvek vidljivi, u svakom koraku) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {isBilling ? (
          <>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Period {formatDay(spec.startDate)} – {formatDay(spec.endDate)}
            </span>
            <Badge size="sm" color="warning">Period specifikacije</Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400">Istekao period — ovde se pravi obračun za naplatu.</span>
          </>
        ) : isNonStandard ? (
          <>
            <Badge size="sm" color="warning">Vanstandardni period</Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDay(spec.startDate)} – {formatDay(spec.endDate)} · stavke i obračun idu u ovaj period
            </span>
          </>
        ) : isChosen ? (
          <>
            <Badge size="sm" color="light">Ručno izabran period</Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400">Stavke i obračun idu u ovaj period.</span>
          </>
        ) : canAdd ? (
          <>
            <PeriodSwitcher patientId={patientId} activeSpecification={spec} />
            <Badge size="sm" color="success">Smeštaj za period</Badge>
          </>
        ) : (
          <>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Period {formatDay(spec.startDate)} – {formatDay(spec.endDate)}
            </span>
            {unlocked ? (
              <Badge size="sm" color="warning">Zatvoren period · izmene na sopstvenu odgovornost</Badge>
            ) : (
              <Badge size="sm" color="light">Zatvoren period · samo pregled</Badge>
            )}
          </>
        )}
        {/* Ručni unos datuma za svaki period; sledeći periodi se nadovezuju na novi kraj */}
        {editable && <EditPeriodDates specification={spec} patientId={patientId} />}
      </div>
        <div className="flex flex-col items-stretch gap-2">
          <LodgingButton billing={billing} onOpen={() => setLodgingOpen(true)} readOnly={!editable} />
          <ExchangeRateBox billing={billing} />
        </div>
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
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">Unosi osoblja čekaju odobrenje ({pendingCount})</h3>
              <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                Unosi sestara i vanredna fizioterapija. Prihvaćeno ulazi u specifikaciju (lekovi i artikli se skidaju sa stanja, prvo porodično). Odbijeno se ne naplaćuje.
              </p>
            </header>
            <div className="p-5">
              <EntryReview patientId={patientId} filter={reviewFilter} />
            </div>
          </div>
        )}

        {step === 1 && canAdd && otherPending > 0 && (
          <p className="mb-5 flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 text-xs text-gray-600 dark:bg-white/[0.03] dark:text-gray-400">
            <LuInfo className="h-4 w-4 shrink-0 text-gray-400" />
            {otherPending === 1 ? "Još 1 unos čeka" : `Još ${otherPending} unosa čeka`} odobrenje u drugom periodu (po danu kad je urađeno, npr. tekući period) i ne ulazi u ovu specifikaciju.
          </p>
        )}

        {closed && unlocked && (
          <p role="alert" className="mb-5 flex gap-2 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300">
            <LuTriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Menjate zatvorenu specifikaciju. Izmene menjaju već obračunat period i stanje na lageru — radite ih na sopstvenu odgovornost.
          </p>
        )}

        {step === 1 && (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(320px,400px)_1fr]">
            <div ref={addPanelRef} className="lg:sticky lg:top-0">
              {editable ? (
                <Section title="Dodaj u specifikaciju" description="Izaberite šta dodajete, pa popunite polja ispod.">
                  <AddItemPanel specId={spec._id} patientId={patientId} preset={addPreset} />
                </Section>
              ) : (
                <Section title="Zatvorena specifikacija">
                  <div className="space-y-4">
                    <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <LuLock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <p>Ova specifikacija je zatvorena i otvorena je samo za pregled i štampu. Ako je potrebna ispravka, izmene možete omogućiti.</p>
                    </div>
                    <Button variant="outline" size="sm" startIcon={<LuLockOpen className="h-4 w-4" />} onClick={() => setConfirmUnlock(true)}>
                      Omogući izmene
                    </Button>
                  </div>
                </Section>
              )}
            </div>
            <div className="min-w-0 space-y-5">
              <Section
                title={`Dodato u ovom periodu (${spec.items.length + billingRows(billing, nextPeriodLabel).length})`}
                description={editable ? "Pogrešno uneto? Uklonite stavku ikonicom korpe." : "Zatvorena specifikacija — samo pregled."}
              >
                <LodgingRows billing={billing} nextPeriodLabel={nextPeriodLabel} onEdit={() => setLodgingOpen(true)} readOnly={!editable} />
                <SpecificationItems specification={spec} patientId={patientId} readOnly={!editable} compactEmpty={billingRows(billing, nextPeriodLabel).length > 0} />
              </Section>
              <PeriodNotes specification={spec} patientId={patientId} onAddAsCost={editable ? addAsCost : undefined} />
            </div>
          </div>
        )}

        {step === 2 && (
          <ReviewStep
            specification={spec}
            billing={billing}
            nextPeriodLabel={nextPeriodLabel}
            onEditStep={setStep}
            onEditBilling={editLodging}
            pendingCount={canAdd ? pendingCount : 0}
          />
        )}
      </div>

      <LodgingDialog open={lodgingOpen} onClose={() => setLodgingOpen(false)} billing={billing} nextPeriodLabel={nextPeriodLabel} readOnly={!editable} />

      <ConfirmDialog
        open={confirmUnlock}
        onClose={() => setConfirmUnlock(false)}
        onConfirm={() => {
          setUnlocked(true);
          setConfirmUnlock(false);
        }}
        title="Izmena zatvorene specifikacije"
        description={`Specifikacija za period ${formatDay(spec.startDate)} – ${formatDay(spec.endDate)} je zatvorena. Izmene menjaju već obračunat period (i stanje na lageru) i mogu se razlikovati od specifikacije koja je već odštampana ili poslata porodici. Izmene radite na sopstvenu odgovornost.`}
        confirmText="Razumem, omogući izmene"
      />

      {/* Ukupno je uvek vidljivo, a dugmad vode kroz korake */}
      <div className="sticky bottom-0 z-10 -mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl border border-gray-200 bg-white/95 px-4 py-2.5 sm:py-3 shadow-theme-md backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="min-w-0" aria-live="polite">
          <p className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">
            Korak {step} od 2 · {current.title}
          </p>
          <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white sm:text-base">
            Ukupno: <span className="whitespace-nowrap">{formatRSD(billing.result.totalRSD)}</span>
            <span className="ml-2 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">{formatEUR(billing.result.totalEUR)}</span>
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {step > 1 && (
            <Button variant="outline" startIcon={<LuArrowLeft className="h-4 w-4" />} onClick={() => setStep(1)}>
              Nazad
            </Button>
          )}
          {step === 1 ? (
            <Button endIcon={<LuArrowRight className="h-4 w-4" />} loading={billing.saving} onClick={() => void goTo(2)}>
              Dalje: pregled
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
