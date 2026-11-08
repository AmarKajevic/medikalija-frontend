import { useEffect, useId, useState } from "react";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Field from "@shared/ui/form/Field";
import DateInput from "@shared/ui/form/DateInput";
import { notify } from "@shared/lib/notify";
import { formatDay } from "@shared/lib/calendarDay";
import { formatRSD } from "@shared/lib/format";
import { useActivateSpecificationPeriod } from "@features/specification/hooks/useActivateSpecificationPeriod";
import { useActivateExistingSpecification } from "@features/specification/hooks/useActivateExistingSpecification";
import { usePastPeriods } from "@features/specification/hooks/usePastPeriods";
import type { PastPeriod } from "@features/specification/api/specificationApi";
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

// Ručni izbor perioda (Od/Do) i povratak na raniji period — oba postavljaju aktivan period
// (smeštaj za period). Koriste ih meni perioda i dugmad u prozoru specifikacije.
export default function PeriodActionDialogs({ patientId, open, onClose, onActivated }: Props) {
  const ids = { start: useId(), end: useId() };
  const manual = useActivateSpecificationPeriod(patientId);
  const existing = useActivateExistingSpecification(patientId);
  const { data: pastPeriods = [] } = usePastPeriods(open === "history" ? patientId : "");
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
  // Svi periodi od prijema do aktivnog (od najnovijeg); neotvaran period se pravi pri aktiviranju
  const activatePast = (p: PastPeriod) => {
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
        title="Raniji periodi"
        description="Svi periodi od prijema do trenutnog, od najnovijeg. Aktivirani period postaje smeštaj za period (nove stavke idu u njega)."
        size="md"
      >
        {pastPeriods.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">Nema ranijih perioda — pacijent je u prvom periodu.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {pastPeriods.map((p) => (
              <li key={p.startDate} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {formatDay(p.startDate)} – {formatDay(p.endDate)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {p.itemsCount ? `${itemsLabel(p.itemsCount)} · ${formatRSD(p.totalPrice)}` : "Bez stavki"}
                  </p>
                </div>
                <Button size="xs" variant="outline" disabled={busy} onClick={() => activatePast(p)}>
                  Aktiviraj
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Dialog>
    </>
  );
}
