import { useMemo, useState } from "react";
import { Link } from "react-router";
import { LuCalendarDays, LuCalendarPlus, LuRepeat } from "react-icons/lu";
import { Card, CardHeader } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { paths } from "@app/paths";
import { CalendarOccurrence, Draft, draftFrom, describeWhen, newDraft, useCalendarEvents } from "@features/calendar/model";
import { eventColorClass } from "@features/calendar/colors";
import EventDialog from "./EventDialog";
import EventDetails from "./EventDetails";

const DAYS_AHEAD = 90;

// Predstojeći termini pacijenta (pregledi, kontrole...) na njegovom profilu.
export default function PatientAppointments({ patientId, canEdit }: { patientId: string; canEdit: boolean }) {
  const range = useMemo(() => {
    const now = new Date();
    return { from: now.toISOString(), to: new Date(now.getTime() + DAYS_AHEAD * 86_400_000).toISOString() };
  }, []);
  const { data = [], isLoading } = useCalendarEvents(range.from, range.to, { patientId });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [details, setDetails] = useState<CalendarOccurrence | null>(null);

  return (
    <Card>
      <CardHeader
        title="Termini"
        description={`Narednih ${DAYS_AHEAD} dana`}
        icon={<LuCalendarDays />}
        actions={
          canEdit && (
            <Button size="xs" variant="outline" startIcon={<LuCalendarPlus className="h-3.5 w-3.5" />} onClick={() => setDraft(newDraft({ patientId }))}>
              Zakaži
            </Button>
          )
        }
      />
      {isLoading ? (
        <div className="space-y-2 p-5">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : data.length === 0 ? (
        <EmptyState compact title="Nema zakazanih termina" />
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.slice(0, 6).map((o) => (
            <li key={o.id}>
              <button type="button" onClick={() => setDetails(o)} className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${eventColorClass(o.calendar)}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-900 dark:text-white/90">
                    {o.title}
                    {o.recurring && <LuRepeat className="ml-1.5 inline h-3 w-3 text-gray-400" aria-label="ponavlja se" />}
                  </span>
                  <span className="block text-xs text-gray-500 first-letter:uppercase dark:text-gray-400">
                    {describeWhen(o)}
                    {o.location && ` · ${o.location}`}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {data.length > 6 && (
            <li className="px-5 py-2.5 text-center">
              <Link to={paths.calendar} className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                Još {data.length - 6} u kalendaru
              </Link>
            </li>
          )}
        </ul>
      )}

      {draft && <EventDialog draft={draft} lockPatient onClose={() => setDraft(null)} />}
      <EventDetails
        occurrence={details}
        canEdit={canEdit}
        onClose={() => setDetails(null)}
        onEdit={(o) => {
          setDetails(null);
          setDraft(draftFrom(o));
        }}
      />
    </Card>
  );
}
