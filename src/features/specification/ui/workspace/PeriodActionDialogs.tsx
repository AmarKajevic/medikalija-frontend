import { useEffect, useId, useState } from "react";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import Field from "@shared/ui/form/Field";
import DateInput from "@shared/ui/form/DateInput";
import { notify } from "@shared/lib/notify";
import { formatDay } from "@shared/lib/calendarDay";
import { formatRSD } from "@shared/lib/format";
import { useSetBillingPeriod } from "@features/specification/hooks/useSetBillingPeriod";
import { useSelectablePeriods } from "@features/specification/hooks/usePastPeriods";
import type { SelectablePeriod } from "@features/specification/api/specificationApi";
import { Specification } from "@features/specification/types/types";
import { itemsLabel } from "@features/specification/lib/itemsLabel";

export type PeriodAction = "manual" | "history";

interface Props {
  patientId: string;
  open: PeriodAction | null;
  onClose: () => void;
  /** Posle izbora (npr. prozor specifikacije prelazi na period specifikacije) */
  onActivated?: (billing: Specification) => void;
}

// Ručni izbor perioda (Od/Do) i promena perioda — oba biraju PERIOD SPECIFIKACIJE.
// Smeštaj za period se ne bira: to je uvek period posle izabranog (naplaćuje se unapred).
export default function PeriodActionDialogs({ patientId, open, onClose, onActivated }: Props) {
  const ids = { start: useId(), end: useId() };
  const choose = useSetBillingPeriod(patientId);
  const { data: all = [] } = useSelectablePeriods(open === "history" ? patientId : "");
  const currentPeriod = all.find((p) => p.isCurrent);
  // Period specifikacije ne može biti u budućnosti: najkasnije današnji (smeštaj tada ide unapred)
  const periods = currentPeriod ? all.filter((p) => p.startDate <= currentPeriod.startDate) : all;
  // Podrazumevano: period specifikacije je onaj pre današnjeg (lista je od najnovijeg)
  const defaultBilling = currentPeriod ? periods[periods.indexOf(currentPeriod) + 1] : undefined;
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    if (open !== "manual") return;
    setStart("");
    setEnd("");
  }, [open]);

  const done = {
    onSuccess: ({ billing, active }: { billing: Specification; active: Specification }) => {
      notify.success(
        `Period specifikacije: ${formatDay(billing.startDate)} – ${formatDay(billing.endDate)}. Smeštaj za period: ${formatDay(active.startDate)} – ${formatDay(active.endDate)}.`
      );
      onClose();
      onActivated?.(billing);
    },
    onError: (e: unknown) => notify.error(e),
  };
  // Neotvaran period (bez zapisa) se pravi pri izboru
  const pick = (p: SelectablePeriod) =>
    choose.mutate(p.specificationId ? { specificationId: p.specificationId } : { startDate: p.startDate.slice(0, 10), endDate: p.endDate.slice(0, 10) }, done);

  return (
    <>
      <Dialog
        open={open === "manual"}
        onClose={onClose}
        title="Ručni izbor perioda specifikacije"
        description="Datumi perioda za koji se pravi specifikacija. Smeštaj za period se ne menja ručno — to je sledećih 30 dana, od dana posle kraja."
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={onClose}>
              Otkaži
            </Button>
            <Button size="sm" loading={choose.isPending} disabled={!start || !end || end < start} onClick={() => choose.mutate({ startDate: start, endDate: end }, done)}>
              Postavi period specifikacije
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Od" htmlFor={ids.start}>
            <DateInput id={ids.start} value={start} onChange={setStart} fromYear={2000} />
          </Field>
          <Field label="Do" htmlFor={ids.end} error={start && end && end < start ? "Kraj je pre početka." : undefined}>
            <DateInput id={ids.end} value={end} onChange={setEnd} min={start || undefined} fromYear={2000} />
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={open === "history"}
        onClose={onClose}
        title="Promena perioda specifikacije"
        description="Izaberite period za koji se pravi specifikacija (od prijema do današnjeg). Smeštaj za period se pomera sam — period posle izabranog."
        size="md"
      >
        {defaultBilling && !defaultBilling.isBilling && (
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-brand-50 px-3 py-2.5 dark:bg-brand-500/10">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Uobičajeno (period pre današnjeg):{" "}
              <strong className="font-semibold">
                {formatDay(defaultBilling.startDate)} – {formatDay(defaultBilling.endDate)}
              </strong>
            </p>
            <Button size="xs" disabled={choose.isPending} onClick={() => pick(defaultBilling)}>
              Vrati na uobičajeno
            </Button>
          </div>
        )}
        {periods.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">Nema drugih perioda.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {periods.map((p) => (
              <li key={`${p.startDate}-${p.endDate}`} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-800 dark:text-white/90">
                    {formatDay(p.startDate)} – {formatDay(p.endDate)}
                    {p.isBilling && <Badge size="sm" color="warning">Period specifikacije</Badge>}
                    {p.isActive && <Badge size="sm" color="light">Smeštaj za period</Badge>}
                    {p.isCurrent && <Badge size="sm" color="primary">Današnji</Badge>}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {p.itemsCount ? `${itemsLabel(p.itemsCount)} · ${formatRSD(p.totalPrice)}` : "Bez stavki"}
                  </p>
                </div>
                <Button size="xs" variant="outline" disabled={choose.isPending || p.isBilling} onClick={() => pick(p)}>
                  {p.isBilling ? "Izabran" : "Izaberi"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Dialog>
    </>
  );
}
