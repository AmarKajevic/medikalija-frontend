import { useState } from "react";
import { Link } from "react-router";
import { LuCalendarClock } from "react-icons/lu";
import Badge from "@shared/ui/badge/Badge";
import Avatar from "@shared/ui/avatar/Avatar";
import { Checkbox } from "@shared/ui/form/controls";
import EmptyState, { ErrorState } from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { formatDay } from "@shared/lib/calendarDay";
import { paths } from "@app/paths";
import { DEADLINE_LABEL, daysUntil, deadlineState, useSocialDeadlines } from "@features/social/dossier";

const SOON_DAYS = 30;

// Rokovi socijalnog radnika: procena (10 dana od prijema), individualni plan (10 dana od
// procene) i ponovni pregled plana (rok iz plana, najkasnije 12 meseci).
export default function SocialDeadlinesList() {
  const { data = [], isLoading, isError, refetch } = useSocialDeadlines();
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? data : data.filter((d) => daysUntil(d.due) <= SOON_DAYS);
  const overdue = data.filter((d) => daysUntil(d.due) < 0).length;

  if (isLoading) return <Skeleton className="m-5 h-32" />;
  if (isError) return <ErrorState message="Rokovi nisu učitani." onRetry={() => refetch()} />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {overdue > 0 ? <span className="font-medium text-error-600 dark:text-error-400">{overdue === 1 ? "1 rok je prošao" : `${overdue} rokova je prošlo`}. </span> : null}
          Sledeći korak za svakog korisnika na smeštaju, po Pravilniku o standardima usluga.
        </p>
        <Checkbox id="social-deadlines-all" label={`Prikaži i rokove posle ${SOON_DAYS} dana`} checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
      </div>
      {shown.length === 0 ? (
        <EmptyState compact icon={<LuCalendarClock />} title="Nema rokova u narednih 30 dana" description="Sve procene i planovi su urađeni na vreme." />
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {shown.map((d) => {
            const state = deadlineState(d.due);
            return (
              <li key={`${d.patient._id}-${d.kind}`}>
                <Link
                  to={`${paths.patient(d.patient._id)}?tab=social`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 transition hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                >
                  <Avatar name={d.patient.name} lastName={d.patient.lastName} size="xs" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white/90">
                    {d.patient.lastName} {d.patient.name}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{DEADLINE_LABEL[d.kind]}</span>
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    rok {formatDay(d.due)} · {d.basis}
                  </span>
                  <Badge size="sm" color={state.tone}>
                    {state.label}
                  </Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
