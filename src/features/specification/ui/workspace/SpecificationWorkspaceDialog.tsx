import { useEffect, useMemo, useRef, useState } from "react";
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

// "Napravi specifikaciju": period specifikacije (istekao, u njemu se pravi obračun),
// smeštaj za period (tekući), vanstandardni period (ručni datumi) i ručno izabran raniji
// period — sve sa istim mogućnostima.
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
  const nonStandardSpec = tab === "nonstandard" && nonStandardId ? (nonStandard.data ?? null) : null;
  const current =
    tab === "other" ? otherSpec : tab === "nonstandard" ? nonStandardSpec : tab === "billing" && billingSpec ? billingSpec : active.data;
  const period = tab === "other" ? "other" : tab === "nonstandard" ? "nonstandard" : tab === "billing" && billingSpec ? "billing" : "active";

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
          <Tabs
            value={tab ?? "active"}
            onChange={setTab}
            items={[
              ...(billingSpec
                ? [{ value: "billing" as const, label: `Period specifikacije · ${formatDay(billingSpec.startDate)} – ${formatDay(billingSpec.endDate)}` }]
                : []),
              { value: "active", label: `Smeštaj za period · ${formatDay(active.data.startDate)} – ${formatDay(active.data.endDate)}` },
              { value: "nonstandard", label: "Vanstandardni period" },
              ...(otherPeriods.length > 0 ? [{ value: "other" as const, label: "Izaberi period", count: otherPeriods.length }] : []),
            ]}
          />
          {tab === "other" && (
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
          {tab === "nonstandard" && <NonStandardPeriodPicker patientId={patientId} value={nonStandardId} onChange={setNonStandardId} />}
          {tab === "nonstandard" && nonStandardId && !nonStandardSpec && nonStandard.isLoading && <PageLoader label="Učitavanje perioda..." />}
          {tab === "other" && !otherSpec && (openPast.isPending || other.isLoading) && <PageLoader label="Učitavanje perioda..." />}
          {current && (
            <SpecificationWorkspace
              key={current._id}
              specification={current}
              patientId={patientId}
              patientName={patientName}
              period={period}
              pendingFilter={filters[period]}
            />
          )}
        </div>
      )}
    </Dialog>
  );
}
