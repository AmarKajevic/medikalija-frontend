import { useState } from "react";
import { LuCalendarClock, LuCalendarRange, LuChevronDown, LuHistory, LuSkipForward } from "react-icons/lu";
import ActionMenu from "@shared/ui/menu/ActionMenu";
import { notify } from "@shared/lib/notify";
import { formatDay, getNextPeriod } from "@shared/lib/calendarDay";
import { useActivateNextSpecificationPeriod } from "@features/specification/hooks/useActivateNextSpecificationPeriod";
import { Specification } from "@features/specification/types/types";
import PeriodActionDialogs, { type PeriodAction } from "./PeriodActionDialogs";

interface Props {
  patientId: string;
  activeSpecification: Specification;
}

// Meni aktivnog perioda: sledeći period, ručni izbor, promena perioda (napred ili nazad)
export default function PeriodSwitcher({ patientId, activeSpecification }: Props) {
  const next = useActivateNextSpecificationPeriod(patientId);
  const [dialog, setDialog] = useState<PeriodAction | null>(null);
  const nextPeriod = getNextPeriod(activeSpecification.endDate);

  return (
    <>
      <ActionMenu
        align="left"
        trigger={({ toggle }) => (
          <button
            type="button"
            onClick={toggle}
            disabled={next.isPending}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-blue-light-300 bg-blue-light-50 px-3 text-sm shadow-theme-xs transition hover:bg-blue-light-100 disabled:opacity-50 dark:border-blue-light-500/40 dark:bg-blue-light-500/15 dark:hover:bg-blue-light-500/25"
          >
            <LuCalendarRange className="h-4 w-4 text-blue-light-600 dark:text-blue-light-400" />
            <span className="font-semibold tabular-nums text-blue-light-700 dark:text-blue-light-300">
              {formatDay(activeSpecification.startDate)} – {formatDay(activeSpecification.endDate)}
            </span>
            <LuChevronDown className="h-4 w-4 text-blue-light-600 dark:text-blue-light-400" />
          </button>
        )}
        items={[
          {
            label: `Sledeći period (${formatDay(nextPeriod.start)} – ${formatDay(nextPeriod.end)})`,
            icon: <LuSkipForward />,
            onClick: () =>
              next.mutate(undefined, {
                onSuccess: (spec) => notify.success(`Smeštaj za period: ${formatDay(spec.startDate)} – ${formatDay(spec.endDate)}`),
                onError: (e) => notify.error(e),
              }),
          },
          { label: "Ručno izaberi period…", icon: <LuCalendarClock />, onClick: () => setDialog("manual") },
          { label: "Promeni period…", icon: <LuHistory />, onClick: () => setDialog("history") },
        ]}
      />
      <PeriodActionDialogs patientId={patientId} open={dialog} onClose={() => setDialog(null)} />
    </>
  );
}
