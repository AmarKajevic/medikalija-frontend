import { useEffect, useMemo, useState } from "react";
import Dialog from "@shared/ui/dialog/Dialog";
import Tabs from "@shared/ui/tabs/Tabs";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import EmptyState, { ErrorState } from "@shared/ui/feedback/EmptyState";
import { formatDay } from "@shared/lib/calendarDay";
import { usePatientSpecification } from "@features/specification/hooks/usePatientSpecification";
import { useBillingPeriodSpecification } from "@features/specification/hooks/useBillingPeriodSpecification";
import { Specification } from "@features/specification/types/types";
import SpecificationWorkspace from "./SpecificationWorkspace";

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

type PeriodTab = "billing" | "active";

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

// "Napravi specifikaciju": period specifikacije (istekao, u njemu se pravi obračun)
// i aktivan period (tekući), sa istim mogućnostima.
export default function SpecificationWorkspaceDialog({ open, onClose, patientId, patientName }: Props) {
  const active = usePatientSpecification(open ? patientId : "");
  const billing = useBillingPeriodSpecification(open ? patientId : "");
  const [tab, setTab] = useState<PeriodTab | null>(null);

  // Podrazumevano period specifikacije — uprava uglavnom obračunava istekao period
  useEffect(() => {
    if (!open) return setTab(null);
    if (tab === null && !billing.isLoading) setTab(billing.data ? "billing" : "active");
  }, [open, tab, billing.isLoading, billing.data]);

  const billingSpec = billing.data ?? null;
  const filters = useMemo(
    () => ({
      billing: billingSpec ? (at: string) => inPeriod(billingSpec, at) : undefined,
      // Aktivan period: sve što ne pada u period specifikacije (unosi se raspoređuju po datumu)
      active: billingSpec ? (at: string) => !inPeriod(billingSpec, at) : undefined,
    }),
    [billingSpec]
  );

  const loading = active.isLoading || billing.isLoading || tab === null;
  const current = tab === "billing" && billingSpec ? billingSpec : active.data;

  return (
    <Dialog open={open} onClose={onClose} size="full" title="Specifikacija" description={patientName}>
      {loading ? (
        <PageLoader label="Učitavanje specifikacije..." />
      ) : active.isError ? (
        <ErrorState message="Specifikacija nije učitana." onRetry={() => active.refetch()} />
      ) : !active.data ? (
        <EmptyState title="Nema aktivne specifikacije" description="Pacijent je otpušten. Ranije specifikacije su dostupne u istoriji." />
      ) : (
        <div className="flex min-h-full flex-col gap-4">
          {billingSpec && (
            <Tabs
              value={tab ?? "active"}
              onChange={setTab}
              items={[
                { value: "billing", label: `Period specifikacije · ${formatDay(billingSpec.startDate)} – ${formatDay(billingSpec.endDate)}` },
                { value: "active", label: `Aktivan period · ${formatDay(active.data.startDate)} – ${formatDay(active.data.endDate)}` },
              ]}
            />
          )}
          {current && (
            <SpecificationWorkspace
              key={current._id}
              specification={current}
              patientId={patientId}
              patientName={patientName}
              period={tab === "billing" && billingSpec ? "billing" : "active"}
              pendingFilter={tab === "billing" ? filters.billing : filters.active}
            />
          )}
        </div>
      )}
    </Dialog>
  );
}
