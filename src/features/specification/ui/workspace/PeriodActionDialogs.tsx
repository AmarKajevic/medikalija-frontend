import { useEffect, useId, useState } from "react";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import Field from "@shared/ui/form/Field";
import DateInput from "@shared/ui/form/DateInput";
import { notify } from "@shared/lib/notify";
import { formatDay } from "@shared/lib/calendarDay";
import { formatRSD } from "@shared/lib/format";
import { useActivateSpecificationPeriod } from "@features/specification/hooks/useActivateSpecificationPeriod";
import { useActivateExistingSpecification } from "@features/specification/hooks/useActivateExistingSpecification";
import { useSelectablePeriods } from "@features/specification/hooks/usePastPeriods";
import type { SelectablePeriod } from "@features/specification/api/specificationApi";
import { Specification } from "@features/specification/types/types";
import { itemsLabel } from "@features/specification/lib/itemsLabel";

export type PeriodAction = "manual" | "history";

interface Props {
  patientId: string;
  open: PeriodAction | null;
  onClose: () => void;
  /** Posle aktiviranja (npr. prozor specifikacije prelazi na "Smeštaj za period") */
  onActivated?: (spec: Specification) => void;
}

// Ručni izbor perioda (Od/Do) i promena perioda (raniji, današnji ili unapred) — oba postavljaju aktivan period
// (smeštaj za period). Koriste ih meni perioda i dugmad u prozoru specifikacije.
export default function PeriodActionDialogs({ patientId, open, onClose, onActivated }: Props) {
  const ids = { start: useId(), end: useId() };
  const manual = useActivateSpecificationPeriod(patientId);
  const existing = useActivateExistingSpecification(patientId);
  const { data: periods = [] } = useSelectablePeriods(open === "history" ? patientId : "");
  const currentPeriod = periods.find((p) => p.isCurrent);
  // Posle današnjeg (po serveru, ne po satu računara)
  const isAhead = (p: SelectablePeriod) => !!currentPeriod && p.startDate > currentPeriod.startDate;
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const busy = manual.isPending || existing.isPending;

  useEffect(() => {
    if (open !== "manual") return;
    setStart("");
    setEnd("");
  }, [open]);

  const done = {
    onSuccess: (spec: Specification) => {
      notify.success(`Smeštaj za period: ${formatDay(spec.startDate)} – ${formatDay(spec.endDate)}`);
      onClose();
      onActivated?.(spec);
    },
    onError: (e: unknown) => notify.error(e),
  };
  // Neotvaran period (bez zapisa) se pravi pri aktiviranju
  const activatePeriod = (p: SelectablePeriod) => {
    if (p.specificationId) existing.mutate(p.specificationId, done);
    else manual.mutate({ startDate: p.startDate.slice(0, 10), endDate: p.endDate.slice(0, 10) }, done);
  };

  return (
    <>
      <Dialog
        open={open === "manual"}
        onClose={onClose}
        title="Ručni izbor perioda"
        description="Koristite ako period nije napravljen na vreme. Postaje smeštaj za period — nove stavke idu u njega."
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={onClose}>
              Otkaži
            </Button>
            <Button size="sm" loading={manual.isPending} disabled={!start || !end || end < start} onClick={() => manual.mutate({ startDate: start, endDate: end }, done)}>
              Aktiviraj period
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
        title="Promena perioda"
        description="Svi periodi od prijema do današnjeg i jedan unapred, od najnovijeg. Aktivirani period postaje smeštaj za period (nove stavke idu u njega)."
        size="md"
      >
        {currentPeriod && !currentPeriod.isActive && (
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-brand-50 px-3 py-2.5 dark:bg-brand-500/10">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Današnji period: <strong className="font-semibold">{formatDay(currentPeriod.startDate)} – {formatDay(currentPeriod.endDate)}</strong>
            </p>
            <Button size="xs" disabled={busy} onClick={() => activatePeriod(currentPeriod)}>
              Vrati na današnji period
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
                    {p.isActive && <Badge size="sm" color="success">Aktivan</Badge>}
                    {p.isCurrent && <Badge size="sm" color="primary">Današnji</Badge>}
                    {isAhead(p) && <Badge size="sm" color="light">Unapred</Badge>}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {p.itemsCount ? `${itemsLabel(p.itemsCount)} · ${formatRSD(p.totalPrice)}` : "Bez stavki"}
                  </p>
                </div>
                <Button size="xs" variant="outline" disabled={busy || p.isActive} onClick={() => activatePeriod(p)}>
                  {p.isActive ? "Aktivan" : "Aktiviraj"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Dialog>
    </>
  );
}
