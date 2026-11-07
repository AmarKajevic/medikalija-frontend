import { useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LuCalendarCog } from "react-icons/lu";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Field from "@shared/ui/form/Field";
import DateInput from "@shared/ui/form/DateInput";
import { notify } from "@shared/lib/notify";
import { addCalendarDays, formatDay, toCalendarDay } from "@shared/lib/calendarDay";
import { changeSpecificationDates } from "@features/specification/api/specificationApi";
import { refreshAfterSpecChange } from "@features/specification/lib/queries";
import { Specification } from "@features/specification/types/types";

const isoDay = (value: string) => value.slice(0, 10);

// Ručni unos datuma perioda (npr. 02.09–25.09 umesto 02.09–01.10).
// Periodi koji se nadovezuju pomeraju se: sledeći počinje dan posle novog kraja.
export default function EditPeriodDates({ specification: spec, patientId }: { specification: Specification; patientId: string }) {
  const ids = { start: useId(), end: useId() };
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(isoDay(spec.startDate));
  const [end, setEnd] = useState(isoDay(spec.endDate));

  const save = useMutation({
    mutationFn: () => changeSpecificationDates(patientId, spec._id, start, end),
    onSuccess: (updated) => {
      refreshAfterSpecChange(qc, patientId, updated);
      notify.success(`Period: ${formatDay(updated.startDate)} – ${formatDay(updated.endDate)}`);
      setOpen(false);
    },
    onError: (e) => notify.error(e, "Datumi nisu izmenjeni."),
  });

  const show = () => {
    setStart(isoDay(spec.startDate));
    setEnd(isoDay(spec.endDate));
    setOpen(true);
  };
  const invalid = !!start && !!end && end < start;
  const unchanged = start === isoDay(spec.startDate) && end === isoDay(spec.endDate);
  const nextStart = end && !invalid ? formatDay(addCalendarDays(toCalendarDay(end), 1)) : "";

  return (
    <>
      <Button size="xs" variant="outline" startIcon={<LuCalendarCog className="h-3.5 w-3.5" />} onClick={show}>
        Izmeni datume
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Datumi perioda"
        description="Ručno podesite početak i kraj ovog perioda."
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Otkaži
            </Button>
            <Button size="sm" loading={save.isPending} disabled={!start || !end || invalid || unchanged} onClick={() => save.mutate()}>
              Sačuvaj datume
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Od" htmlFor={ids.start}>
              <DateInput id={ids.start} value={start} onChange={setStart} fromYear={2000} />
            </Field>
            <Field label="Do" htmlFor={ids.end} error={invalid ? "Kraj je pre početka." : undefined}>
              <DateInput id={ids.end} value={end} onChange={setEnd} min={start || undefined} fromYear={2000} />
            </Field>
          </div>
          {nextStart && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-white/[0.03] dark:text-gray-400">
              Sledeći period će počinjati <strong className="text-gray-800 dark:text-white/90">{nextStart}</strong> — periodi koji se nadovezuju pomeraju se za
              istu razliku.
            </p>
          )}
        </div>
      </Dialog>
    </>
  );
}
