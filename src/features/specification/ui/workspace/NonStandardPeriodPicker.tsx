import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LuCalendarPlus } from "react-icons/lu";
import Button from "@shared/ui/button/Button";
import Field from "@shared/ui/form/Field";
import DateInput from "@shared/ui/form/DateInput";
import { Select } from "@shared/ui/form/controls";
import { notify } from "@shared/lib/notify";
import { formatDay } from "@shared/lib/calendarDay";
import { fetchNonStandardPeriods, openNonStandardPeriod } from "@features/specification/api/specificationApi";
import { specKeys } from "@features/specification/lib/queries";
import { itemsLabel } from "@features/specification/lib/itemsLabel";

interface Props {
  patientId: string;
  value: string;
  onChange: (specId: string) => void;
}

// Vanstandardni period: Od/Do se biraju ručno (kao kod ručnog izbora perioda).
// Ne pomera redovne periode; prethodno otvoreni vanstandardni periodi biraju se iz liste.
export default function NonStandardPeriodPicker({ patientId, value, onChange }: Props) {
  const ids = { list: useId(), start: useId(), end: useId() };
  const qc = useQueryClient();
  const list = useQuery({ queryKey: specKeys.nonStandard(patientId), queryFn: () => fetchNonStandardPeriods(patientId), enabled: !!patientId });
  const periods = useMemo(() => list.data ?? [], [list.data]);
  const [creating, setCreating] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  // Prvi put: najnoviji postojeći, a bez njih odmah forma za nove datume
  useEffect(() => {
    if (list.isLoading || value) return;
    if (periods[0]) onChange(periods[0]._id);
    else setCreating(true);
  }, [list.isLoading, periods, value, onChange]);

  const create = useMutation({
    mutationFn: () => openNonStandardPeriod(patientId, start, end),
    onSuccess: (spec) => {
      qc.setQueryData(specKeys.byId(spec._id), spec);
      qc.invalidateQueries({ queryKey: specKeys.nonStandard(patientId) });
      notify.success(`Vanstandardni period: ${formatDay(spec.startDate)} – ${formatDay(spec.endDate)}`);
      setCreating(false);
      setStart("");
      setEnd("");
      onChange(spec._id);
    },
    onError: (e) => notify.error(e, "Period nije otvoren."),
  });

  const invalid = !!start && !!end && end < start;
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!start || !end || invalid) return;
    create.mutate();
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
      {periods.length > 0 && !creating && (
        <>
          <div className="min-w-56">
            <label htmlFor={ids.list} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Vanstandardni period
            </label>
            <Select id={ids.list} value={value} onChange={(e) => onChange(e.target.value)}>
              {periods.map((p) => (
                <option key={p._id} value={p._id}>
                  {formatDay(p.startDate)} – {formatDay(p.endDate)} · {p.items.length ? itemsLabel(p.items.length) : "bez stavki"}
                </option>
              ))}
            </Select>
          </div>
          <Button size="sm" variant="outline" startIcon={<LuCalendarPlus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            Novi vanstandardni period
          </Button>
        </>
      )}
      {creating && (
        <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
          <Field label="Od" htmlFor={ids.start}>
            <DateInput id={ids.start} value={start} onChange={setStart} fromYear={2000} />
          </Field>
          <Field label="Do" htmlFor={ids.end} error={invalid ? "Kraj je pre početka." : undefined}>
            <DateInput id={ids.end} value={end} onChange={setEnd} min={start || undefined} fromYear={2000} />
          </Field>
          <Button type="submit" size="sm" loading={create.isPending} disabled={!start || !end || invalid}>
            Otvori period
          </Button>
          {periods.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setCreating(false)}>
              Otkaži
            </Button>
          )}
          <p className="w-full text-xs text-gray-500 dark:text-gray-400">Ručno izabrani datumi, van redovnih perioda — redovni periodi se ne pomeraju.</p>
        </form>
      )}
    </div>
  );
}
