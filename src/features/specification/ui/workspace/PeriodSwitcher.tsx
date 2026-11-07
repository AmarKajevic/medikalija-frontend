import { useId, useState } from "react";
import { LuCalendarClock, LuCalendarRange, LuChevronDown, LuHistory, LuSkipForward } from "react-icons/lu";
import ActionMenu from "@shared/ui/menu/ActionMenu";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Field from "@shared/ui/form/Field";
import { notify } from "@shared/lib/notify";
import { formatDay, getNextPeriod } from "@shared/lib/calendarDay";
import { formatRSD } from "@shared/lib/format";
import { useActivateNextSpecificationPeriod } from "@features/specification/hooks/useActivateNextSpecificationPeriod";
import { useActivateSpecificationPeriod } from "@features/specification/hooks/useActivateSpecificationPeriod";
import { useActivateExistingSpecification } from "@features/specification/hooks/useActivateExistingSpecification";
import { useSpecificationHistory } from "@features/specification/hooks/useSpecificationHistory";
import { Specification } from "@features/specification/types/types";
import DateInput from "@shared/ui/form/DateInput";

interface Props {
  patientId: string;
  activeSpecification: Specification;
}

export default function PeriodSwitcher({ patientId, activeSpecification }: Props) {
  const ids = { start: useId(), end: useId() };
  const next = useActivateNextSpecificationPeriod(patientId);
  const manual = useActivateSpecificationPeriod(patientId);
  const existing = useActivateExistingSpecification(patientId);
  const { data: history } = useSpecificationHistory(patientId);

  const [dialog, setDialog] = useState<"manual" | "history" | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const nextPeriod = getNextPeriod(activeSpecification.endDate);
  // Samo periodi koji su počeli pre aktivnog, od najbližeg ka starijim
  const activeStart = activeSpecification.startDate.slice(0, 10);
  const pastPeriods = ((history?.history ?? []) as Specification[])
    .filter((s) => s.startDate.slice(0, 10) < activeStart)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  const busy = next.isPending || manual.isPending || existing.isPending;

  const onActivated = (spec: Specification) => {
    notify.success(`Aktivan period: ${formatDay(spec.startDate)} – ${formatDay(spec.endDate)}`);
    setDialog(null);
  };

  return (
    <>
      <ActionMenu
        align="left"
        trigger={({ toggle }) => (
          <button
            type="button"
            onClick={toggle}
            disabled={busy}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-theme-xs transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.04]"
          >
            <LuCalendarRange className="h-4 w-4 text-gray-400" />
            <span className="font-medium">
              {formatDay(activeSpecification.startDate)} – {formatDay(activeSpecification.endDate)}
            </span>
            <LuChevronDown className="h-4 w-4 text-gray-400" />
          </button>
        )}
        items={[
          {
            label: `Sledeći period (${formatDay(nextPeriod.start)} – ${formatDay(nextPeriod.end)})`,
            icon: <LuSkipForward />,
            onClick: () => next.mutate(undefined, { onSuccess: onActivated, onError: (e) => notify.error(e) }),
          },
          { label: "Ručno izaberi period…", icon: <LuCalendarClock />, onClick: () => setDialog("manual") },
          {
            label: "Vrati se na raniji period…",
            icon: <LuHistory />,
            onClick: () => setDialog("history"),
            disabled: pastPeriods.length === 0,
          },
        ]}
      />

      <Dialog
        open={dialog === "manual"}
        onClose={() => setDialog(null)}
        title="Ručni izbor perioda"
        description="Koristite ako period nije napravljen na vreme. Nove stavke će ići u ovaj period."
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialog(null)}>
              Otkaži
            </Button>
            <Button
              size="sm"
              loading={manual.isPending}
              disabled={!start || !end || end < start}
              onClick={() =>
                manual.mutate({ startDate: start, endDate: end }, { onSuccess: onActivated, onError: (e) => notify.error(e) })
              }
            >
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
        open={dialog === "history"}
        onClose={() => setDialog(null)}
        title="Raniji periodi"
        description="Periodi pre trenutnog, od najnovijeg. Aktivirani period postaje aktivan za nove stavke."
        size="md"
      >
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {pastPeriods.map((s) => (
            <li key={s._id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {formatDay(s.startDate)} – {formatDay(s.endDate)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {s.items?.length ?? 0} stavki · {formatRSD(s.totalPrice)}
                </p>
              </div>
              <Button
                size="xs"
                variant="outline"
                disabled={existing.isPending}
                onClick={() => existing.mutate(s._id, { onSuccess: onActivated, onError: (e) => notify.error(e) })}
              >
                Aktiviraj
              </Button>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}
