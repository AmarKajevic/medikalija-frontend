import { ReactNode, useMemo, useRef, useState } from "react";
import { LuCircleAlert, LuDownload, LuEye, LuInfo, LuLock, LuLockOpen, LuNotebookPen, LuPrinter, LuTriangleAlert } from "react-icons/lu";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import Dialog, { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import { notify } from "@shared/lib/notify";
import { formatDay } from "@shared/lib/calendarDay";
import { formatEUR, formatRSD } from "@shared/lib/format";
import { getNextPeriodLabel } from "@features/specification/lib/helpers";
import { Specification } from "@features/specification/types/types";
import { itemNameParts, sortSpecItems } from "@features/specification/lib/items";
import { useBillingState } from "@features/specification/hooks/useBillingState";
import { useFacility } from "@entities/facility/facility";
import { useNurseEntries } from "@features/nurse-entries/model";
import EntryReview from "@features/nurse-entries/ui/EntryReview";
import SpecificationItems from "./SpecificationItems";
import { billingRows } from "@features/specification/lib/billingRows";
import { LodgingButton, LodgingDialog, LodgingRows } from "./LodgingBilling";
import PeriodSwitcher from "./PeriodSwitcher";
import PeriodDates from "./PeriodDates";
import EditPeriodDates from "./EditPeriodDates";
import ExchangeRateBox from "./ExchangeRateBox";
import AddItemPanel, { type AddPreset } from "./AddItemPanel";
import PeriodNotes from "./PeriodNotes";
import SpecPreviewDialog from "./SpecPreviewDialog";
import SpecNoteButton, { SpecNoteText } from "./SpecNote";

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

// Visina kolone: ekran bez zaglavlja dijaloga i donje trake sa ukupnim. Kad kolona dođe do
// kraja (ili vrha), skrol prelazi na glavni prozor specifikacije — zato bez overscroll-contain.
const COLUMN_SCROLL = "lg:max-h-[calc(100dvh-13rem)] lg:overflow-y-auto";

const Section = ({ title, description, children }: { title: string; description?: string; children: ReactNode }) => (
  <section className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
    <header className="border-b border-gray-100 px-5 py-3.5 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>}
    </header>
    <div className="p-5">{children}</div>
  </section>
);

export default function SpecificationWorkspace({ specification: spec, patientId, patientName, period = "active", pendingFilter, lodgingPeriod }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"preview" | "download" | "print" | null>(null);
  const [addPreset, setAddPreset] = useState<AddPreset | null>(null);
  const [lodgingOpen, setLodgingOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
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
  const ratesMissing = !(billing.rates.lower > 0 && billing.rates.middle > 0);

  // pdfmake sa fontovima je ~1 MB — učitava se tek kad korisnik zatraži PDF
  const exportPdf = async (mode: "download" | "print" | "preview") => {
    const { generateSpecificationPDF } = await import("@features/specification/lib/generateSpecificationPDF");
    return generateSpecificationPDF({
      mode,
      patientName,
      startDate: spec.startDate,
      endDate: spec.endDate,
      items: sortSpecItems(spec.items).map((item) => ({
        formattedName: itemNameParts(item).text,
        priceList: itemNameParts(item).prices,
        amount: item.amount ?? 1,
        price: item.price ?? 0,
      })),
      ...billing.result,
      nextPeriodLabel,
      facility,
      note: spec.note,
    });
  };
  // Pregled, PDF i štampa idu sa sačuvanim dugom/smeštajem — nesačuvano se čuva usput
  const runExport = async (mode: "download" | "print" | "preview") => {
    if (exporting) return;
    setExporting(mode);
    try {
      if (billing.dirty && !(await billing.saveBilling())) return;
      const url = await exportPdf(mode);
      if (mode === "preview" && url) setPreviewUrl(url);
    } catch (err) {
      notify.error(err, "PDF nije napravljen.");
    } finally {
      setExporting(null);
    }
  };
  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  return (
    <div className="flex min-h-full flex-col gap-5">
      {/* Period i status levo; smeštaj i kurs evra desno (uvek vidljivi, u svakom koraku) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {isBilling ? (
          <>
            <span className="text-base font-medium text-gray-700 dark:text-gray-300">Period</span>
            <PeriodDates start={spec.startDate} end={spec.endDate} />
            <Badge size="sm" color="warning">Period specifikacije</Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400">Istekao period — ovde se pravi obračun za naplatu.</span>
          </>
        ) : isNonStandard ? (
          <>
            <Badge size="sm" color="warning">Vanstandardni period</Badge>
            <PeriodDates start={spec.startDate} end={spec.endDate} />
            <span className="text-xs text-gray-500 dark:text-gray-400">stavke i obračun idu u ovaj period</span>
          </>
        ) : isChosen ? (
          <>
            <Badge size="sm" color="light">Ručno izabran period</Badge>
            <span className="text-xs text-gray-500 dark:text-gray-400">Stavke i obračun idu u ovaj period.</span>
          </>
        ) : canAdd ? (
          <>
            <PeriodSwitcher patientId={patientId} activeSpecification={spec} />
            <Badge size="sm" color="info">Smeštaj za period</Badge>
          </>
        ) : (
          <>
            <span className="text-base font-medium text-gray-700 dark:text-gray-300">Period</span>
            <PeriodDates start={spec.startDate} end={spec.endDate} />
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
          <div className="flex items-stretch gap-2">
            {/* Zabeleške osoblja u posebnom prozoru — ne zauzimaju prostor ispod liste */}
            <Button
              variant="outline"
              startIcon={<LuNotebookPen className="h-4 w-4" />}
              onClick={() => setNotesOpen(true)}
              title="Zabeleške iz ovog perioda: sve što je osoblje upisalo"
              aria-label="Zabeleške iz ovog perioda"
            >
              Zabeleške
            </Button>
            {/* Napomena za štampu (ispod tabela specifikacije) */}
            <SpecNoteButton specification={spec} patientId={patientId} readOnly={!editable} />
            <div className="min-w-0 flex-1">
              <LodgingButton billing={billing} onOpen={() => setLodgingOpen(true)} readOnly={!editable} />
            </div>
          </div>
          <ExchangeRateBox billing={billing} />
        </div>
      </div>

      <div className="flex-1">
        {canAdd && pendingCount > 0 && (
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

        {canAdd && otherPending > 0 && (
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

        {(
          // Dodavanje levo i lista dodatog desno staju na ekran zajedno (svaka kolona ima svoj skrol),
          // pa se posle dodavanja odmah vidi nova stavka bez skrolovanja gore-dole
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
            <div ref={addPanelRef} className={`lg:sticky lg:top-0 ${COLUMN_SCROLL}`}>
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
            <div className={`min-w-0 space-y-5 lg:sticky lg:top-0 ${COLUMN_SCROLL}`}>
              <Section
                title={`Dodato u ovom periodu (${spec.items.length + billingRows(billing, nextPeriodLabel).length})`}
                description={editable ? "Pogrešno uneto? Uklonite stavku ikonicom korpe." : "Zatvorena specifikacija — samo pregled."}
              >
                <LodgingRows billing={billing} nextPeriodLabel={nextPeriodLabel} onEdit={() => setLodgingOpen(true)} readOnly={!editable} />
                {/* Ispod smeštaja i duga: lekovi, artikli, usluge… (kao na odštampanoj specifikaciji) */}
                <h4 className="mb-2 mt-4 border-b border-gray-100 pb-2 text-base font-semibold text-gray-900 first:mt-0 dark:border-gray-800 dark:text-white/90">
                  Specifikacija troškova za period: {formatDay(spec.startDate)} – {formatDay(spec.endDate)}
                </h4>
                <SpecificationItems specification={spec} patientId={patientId} readOnly={!editable} compactEmpty={billingRows(billing, nextPeriodLabel).length > 0} />
                {/* Sačuvana napomena ispod svih stavki — štampa se ispod tabela */}
                <SpecNoteText specification={spec} />
              </Section>
            </div>
          </div>
        )}

      </div>

      <Dialog
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        size="xl"
        title="Zabeleške iz ovog perioda"
        description="Sve što je osoblje upisalo, i ono što ne ulazi u specifikaciju (učinak rada, redovna fizioterapija). Proverite da li nešto treba naplatiti."
      >
        <PeriodNotes
          embedded
          specification={spec}
          patientId={patientId}
          onAddAsCost={
            editable
              ? (label) => {
                  setNotesOpen(false);
                  addAsCost(label);
                }
              : undefined
          }
        />
      </Dialog>

      <SpecPreviewDialog
        url={previewUrl}
        onClose={closePreview}
        onDownload={() => void runExport("download")}
        onPrint={() => void runExport("print")}
        busy={exporting}
        pendingCount={canAdd ? pendingCount : 0}
      />

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

      {/* Ukupno je uvek vidljivo; pregled, PDF i štampa su uvek pri ruci */}
      <div className="sticky bottom-0 z-10 -mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl border border-gray-200 bg-white/95 px-4 py-2.5 sm:py-3 shadow-theme-md backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="min-w-0" aria-live="polite">
          <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white sm:text-base">
            Ukupno: <span className="whitespace-nowrap">{formatRSD(billing.result.totalRSD)}</span>
            <span className="mx-1.5 text-xs font-normal text-gray-400 sm:text-sm">ili</span>
            <span className="whitespace-nowrap">{formatEUR(billing.result.totalEUR)}</span>
          </p>
          {canAdd && pendingCount > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-warning-700 dark:text-warning-400">
              <LuCircleAlert className="h-3.5 w-3.5 shrink-0" />
              {pendingCount === 1 ? "1 unos osoblja još čeka odobrenje" : `${pendingCount} unosa osoblja još čeka odobrenje`} — nije u specifikaciji.
            </p>
          )}
          {ratesMissing && (
            <p className="flex items-center gap-1.5 text-xs text-warning-700 dark:text-warning-400">
              <LuCircleAlert className="h-3.5 w-3.5 shrink-0" />
              Kurs evra nije unet, pa iznosi u evrima nisu tačni.
            </p>
          )}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" startIcon={<LuEye className="h-4 w-4" />} loading={exporting === "preview"} onClick={() => void runExport("preview")}>
            Pregled specifikacije
          </Button>
          <Button variant="outline" startIcon={<LuDownload className="h-4 w-4" />} loading={exporting === "download"} onClick={() => void runExport("download")}>
            Skini PDF
          </Button>
          <Button startIcon={<LuPrinter className="h-4 w-4" />} loading={exporting === "print"} onClick={() => void runExport("print")}>
            Štampaj
          </Button>
        </div>
      </div>
    </div>
  );
}
