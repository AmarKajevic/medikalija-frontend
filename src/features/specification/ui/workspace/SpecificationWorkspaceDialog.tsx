import { useEffect, useMemo, useRef, useState } from "react";
import { LuBedDouble, LuCalendarClock, LuHistory } from "react-icons/lu";
import Button from "@shared/ui/button/Button";
import Dialog from "@shared/ui/dialog/Dialog";
import Tabs from "@shared/ui/tabs/Tabs";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import EmptyState, { ErrorState } from "@shared/ui/feedback/EmptyState";
import { formatDay } from "@shared/lib/calendarDay";
import { Select } from "@shared/ui/form/controls";
import { usePatientSpecification } from "@features/specification/hooks/usePatientSpecification";
import { useBillingPeriodSpecification } from "@features/specification/hooks/useBillingPeriodSpecification";
import { useOpenPastPeriod, usePastPeriods } from "@features/specification/hooks/usePastPeriods";
import { notify } from "@shared/lib/notify";
import { useSpecification } from "@features/specification/hooks/useSpecification";
import { Specification } from "@features/specification/types/types";
import SpecificationWorkspace from "./SpecificationWorkspace";
import NonStandardPeriodPicker from "./NonStandardPeriodPicker";
import PeriodActionDialogs, { type PeriodAction } from "./PeriodActionDialogs";
import { itemsLabel } from "@features/specification/lib/itemsLabel";

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  /** Sklonjen prozor ostaje u memoriji: posle "Nastavi" sve je kako je ostavljeno */
  keepMounted?: boolean;
}

type PeriodTab = "billing" | "active" | "nonstandard" | "other";

// Lokalni dan iz kalendarskog dana specifikacije ("2026-10-25T00:00Z" → 25.10.)
const dayKey = (iso: string) => iso.slice(0, 10);
const localDayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const inPeriod = (spec: Specification, performedAt: string) => {
  const day = localDayKey(performedAt);
  return day >= dayKey(spec.startDate) && day <= dayKey(spec.endDate);
};

// "Napravi specifikaciju": specifikacija se pravi za period specifikacije (istekao),
// vanstandardni period (ručni datumi) ili ručno izabran raniji period. Smeštaj za period
// (tekući) je samo informacija — za njega se smeštaj naplaćuje unapred; menja se dugmadima
// "Ručno izaberi period" / "Promeni period". U prvom periodu (još nema isteklog)
// radi se u tekućem periodu.
export default function SpecificationWorkspaceDialog({ open, onClose, patientId, patientName, keepMounted = false }: Props) {
  const live = open || keepMounted;
  const active = usePatientSpecification(live ? patientId : "");
  const billing = useBillingPeriodSpecification(live ? patientId : "");
  const past = usePastPeriods(live ? patientId : "");
  const openPast = useOpenPastPeriod(patientId);
  const [tab, setTab] = useState<PeriodTab | null>(null);
  // Izabran raniji period (po danu početka) i zapisi otvoreni u ovom prozoru
  const [otherKey, setOtherKey] = useState("");
  const [opened, setOpened] = useState<Record<string, string>>({});
  const tried = useRef(new Set<string>());
  const [nonStandardId, setNonStandardId] = useState("");
  // Ručni izbor perioda / promena perioda: menjaju smeštaj za period (aktivan period)
  const [periodAction, setPeriodAction] = useState<PeriodAction | null>(null);
  const nonStandard = useSpecification(tab === "nonstandard" ? nonStandardId : "");

  // Podrazumevano period specifikacije — uprava uglavnom obračunava istekao period
  useEffect(() => {
    if (!live) {
      setOtherKey("");
      setNonStandardId("");
      tried.current.clear();
      return setTab(null);
    }
    if (tab === null && !billing.isLoading) setTab(billing.data ? "billing" : "active");
  }, [live, tab, billing.isLoading, billing.data]);

  const billingSpec = billing.data ?? null;
  // Ručni izbor: svi raniji periodi od prijema (bez perioda specifikacije), od najnovijeg
  const otherPeriods = useMemo(
    // Po datumu, ne samo po ID-u: lista može da stigne pre nego što period specifikacije dobije zapis
    () =>
      (past.data ?? []).filter(
        (p) =>
          p.specificationId !== active.data?._id &&
          !(billingSpec && (p.specificationId === billingSpec._id || dayKey(p.startDate) === dayKey(billingSpec.startDate)))
      ),
    [past.data, billingSpec, active.data]
  );
  const chosen = otherPeriods.find((p) => p.startDate === otherKey) ?? otherPeriods[0];
  const chosenId = chosen ? (chosen.specificationId ?? opened[chosen.startDate] ?? "") : "";
  const other = useSpecification(tab === "other" ? chosenId : "");

  // Period koji još nije otvaran dobija zapis tek kad se izabere
  const { mutate: openPeriod } = openPast;
  useEffect(() => {
    if (tab !== "other" || !chosen || chosenId || tried.current.has(chosen.startDate)) return;
    const key = chosen.startDate;
    tried.current.add(key);
    openPeriod(chosen, {
      onSuccess: (spec) => setOpened((o) => ({ ...o, [key]: spec._id })),
      onError: (e) => notify.error(e, "Period nije otvoren."),
    });
  }, [tab, chosen, chosenId, openPeriod]);
  const otherSpec = tab === "other" ? (other.data ?? null) : null;
  const filters = useMemo(
    () => ({
      billing: billingSpec ? (at: string) => inPeriod(billingSpec, at) : undefined,
      // Aktivan period: sve što ne pada u period specifikacije (unosi se raspoređuju po datumu)
      active: billingSpec ? (at: string) => !inPeriod(billingSpec, at) : undefined,
      other: otherSpec ? (at: string) => inPeriod(otherSpec, at) : undefined,
      // U vanstandardni period se unosi sestara ne raspoređuju automatski
      nonstandard: () => false,
    }),
    [billingSpec, otherSpec]
  );

  const loading = active.isLoading || billing.isLoading || tab === null;
  // Kad postoji period specifikacije, tekući period se ne bira (samo se prikazuje)
  const shownTab: PeriodTab | null = tab === "active" && billingSpec ? "billing" : tab;
  const nonStandardSpec = tab === "nonstandard" && nonStandardId ? (nonStandard.data ?? null) : null;
  const current =
    shownTab === "other" ? otherSpec : shownTab === "nonstandard" ? nonStandardSpec : shownTab === "billing" && billingSpec ? billingSpec : active.data;
  const period = shownTab === "other" ? "other" : shownTab === "nonstandard" ? "nonstandard" : shownTab === "billing" && billingSpec ? "billing" : "active";

  return (
    <Dialog open={open} onClose={onClose} size="full" title="Specifikacija" description={patientName} keepMounted={keepMounted}>
      {loading ? (
        <PageLoader label="Učitavanje specifikacije..." />
      ) : active.isError ? (
        <ErrorState message="Specifikacija nije učitana." onRetry={() => active.refetch()} />
      ) : !active.data ? (
        <EmptyState title="Nema aktivne specifikacije" description="Pacijent je otpušten. Ranije specifikacije su dostupne u istoriji." />
      ) : (
        <div className="flex min-h-full flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Tabs
            className="min-w-0"
            value={shownTab ?? "active"}
            onChange={setTab}
            items={[
              ...(billingSpec
                ? [{ value: "billing" as const, label: `Period specifikacije · ${formatDay(billingSpec.startDate)} – ${formatDay(billingSpec.endDate)}` }]
                : // Prvi period: još nema isteklog, pa se radi u tekućem
                  [{ value: "active" as const, label: `Tekući period · ${formatDay(active.data.startDate)} – ${formatDay(active.data.endDate)}` }]),
              { value: "nonstandard", label: "Vanstandardni period" },
              ...(otherPeriods.length > 0 ? [{ value: "other" as const, label: "Izaberi period", count: otherPeriods.length }] : []),
            ]}
          />
            {/* Smeštaj za period: samo informacija (naplaćuje se unapred); dugmad ga menjaju */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600 dark:bg-white/[0.04] dark:text-gray-300"
                title="Za ovaj period se smeštaj naplaćuje unapred (u obračunu: smeštaj za naredni period)"
              >
                <LuBedDouble className="h-3.5 w-3.5 text-gray-400" />
                Smeštaj za period:
                <strong className="font-semibold text-gray-800 dark:text-white/90">
                  {formatDay(active.data.startDate)} – {formatDay(active.data.endDate)}
                </strong>
                <span className="text-gray-400">· naplaćuje se unapred</span>
              </span>
              <Button size="xs" variant="outline" startIcon={<LuCalendarClock className="h-3.5 w-3.5" />} onClick={() => setPeriodAction("manual")}>
                Ručno izaberi period
              </Button>
              <Button size="xs" variant="outline" startIcon={<LuHistory className="h-3.5 w-3.5" />} onClick={() => setPeriodAction("history")}>
                Promeni period
              </Button>
            </div>
          </div>
          <PeriodActionDialogs patientId={patientId} open={periodAction} onClose={() => setPeriodAction(null)} onActivated={() => setTab("billing")} />
          {shownTab === "other" && (
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="spec-period" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Period
              </label>
              <Select id="spec-period" value={chosen?.startDate ?? ""} onChange={(e) => setOtherKey(e.target.value)} className="w-auto min-w-56">
                {otherPeriods.map((p) => (
                  <option key={p.startDate} value={p.startDate}>
                    {formatDay(p.startDate)} – {formatDay(p.endDate)} · {p.itemsCount ? itemsLabel(p.itemsCount) : "bez stavki"}
                  </option>
                ))}
              </Select>
            </div>
          )}
          {shownTab === "nonstandard" && <NonStandardPeriodPicker patientId={patientId} value={nonStandardId} onChange={setNonStandardId} />}
          {shownTab === "nonstandard" && nonStandardId && !nonStandardSpec && nonStandard.isLoading && <PageLoader label="Učitavanje perioda..." />}
          {shownTab === "other" && !otherSpec && (openPast.isPending || other.isLoading) && <PageLoader label="Učitavanje perioda..." />}
          {current && (
            <SpecificationWorkspace
              key={current._id}
              specification={current}
              patientId={patientId}
              patientName={patientName}
              period={period}
              pendingFilter={filters[period]}
              // Smeštaj se naplaćuje unapred za tekući period (tačni datumi, i kad su ručno menjani)
              lodgingPeriod={period === "billing" ? { start: active.data.startDate, end: active.data.endDate } : undefined}
            />
          )}
        </div>
      )}
    </Dialog>
  );
}
