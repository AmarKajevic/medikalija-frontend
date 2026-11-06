import { useMemo, useState } from "react";
import { Link } from "react-router";
import { LuCalendarDays, LuCalendarPlus, LuCheck, LuFilePen, LuFilePlus, LuFileText, LuUsers } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { paths } from "@app/paths";
import PageHeader from "@shared/ui/page/PageHeader";
import StatCard from "@shared/ui/StatCard";
import { Card, CardHeader } from "@shared/ui/card/Card";
import Button, { ButtonLink } from "@shared/ui/button/Button";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { CalendarOccurrence, Draft, newDraft, timeKey, useCalendarEvents } from "@features/calendar/model";
import { eventColorClass } from "@features/calendar/colors";
import EventDialog from "@features/calendar/ui/EventDialog";
import { reportTypeLabel, reportUrlForAppointment, useReports } from "@features/medical-reports/model";
import { useDashboardStats } from "@features/dashboard/hooks/useDashboardStats";

const dayRange = (offsetDays = 0, lengthDays = 1) => {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() + offsetDays);
  const to = new Date(from);
  to.setDate(to.getDate() + lengthDays);
  return { from: from.toISOString(), to: to.toISOString() };
};


// Početna za doktora: današnji pregledi, nedovršeni izveštaji, naredni termini.
export default function DoctorHome({ greeting, today }: { greeting: string; today: string }) {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<Draft | null>(null);
  const todayRange = useMemo(() => dayRange(0, 1), []);
  const weekRange = useMemo(() => dayRange(1, 7), []);
  const monthStart = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  }, []);

  const todayEvents = useCalendarEvents(todayRange.from, todayRange.to);
  const nextEvents = useCalendarEvents(weekRange.from, weekRange.to);
  const drafts = useReports({ mine: true, status: "draft", limit: 50 });
  const recent = useReports({ mine: true, from: monthStart, limit: 500 });
  const stats = useDashboardStats();

  const exams = (todayEvents.data ?? []).filter((e) => e.patient);
  const writtenFor = new Set((recent.data ?? []).filter((r) => r.appointment?.eventId).map((r) => `${r.appointment!.eventId}_${new Date(r.appointment!.occurrenceStart ?? 0).getTime()}`));
  const isWritten = (o: CalendarOccurrence) => writtenFor.has(`${o.eventId}_${new Date(o.occurrenceStart).getTime()}`);
  const signedThisMonth = (recent.data ?? []).filter((r) => r.status === "signed").length;

  return (
    <>
      <PageHeader
        title={`${greeting}, dr ${user?.lastName ?? ""}`}
        description={<span className="capitalize">{today}</span>}
        actions={
          <>
            <Button variant="outline" size="sm" startIcon={<LuCalendarPlus className="h-4 w-4" />} onClick={() => setSchedule({ ...newDraft(), title: "Pregled", calendar: "plava" })}>
              Zakaži pregled
            </Button>
            <ButtonLink to={paths.newReport()} size="sm" startIcon={<LuFilePlus className="h-4 w-4" />}>
              Nov izveštaj
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Današnji pregledi" value={exams.length} loading={todayEvents.isLoading} icon={<LuCalendarDays />} hint={exams.length ? `napisano ${exams.filter(isWritten).length}` : "nema zakazanih"} />
        <StatCard label="Nedovršeni izveštaji" value={drafts.data?.length ?? "—"} loading={drafts.isLoading} icon={<LuFilePen />} tone={drafts.data?.length ? "warning" : "default"} to={`${paths.reports}?f=drafts`} />
        <StatCard label="Potpisano ovog meseca" value={signedThisMonth} loading={recent.isLoading} icon={<LuFileText />} to={paths.reports} />
        <StatCard label="Pacijenti na smeštaju" value={(stats.data && "activePatients" in stats.data ? stats.data.activePatients : "—")} loading={stats.isLoading} icon={<LuUsers />} to={paths.patients} />
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader title="Danas" description="Termini sa pacijentima iz kalendara" icon={<LuCalendarDays />} actions={<Link to={`${paths.calendar}?view=day`} className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">Kalendar</Link>} />
          {todayEvents.isLoading ? (
            <div className="space-y-2 p-5">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : exams.length === 0 ? (
            <EmptyState compact icon={<LuCalendarDays />} title="Danas nema zakazanih pregleda" />
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {exams.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="w-14 shrink-0 text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{o.allDay ? "ceo dan" : timeKey(new Date(o.start))}</span>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${eventColorClass(o.calendar)}`} />
                  <div className="min-w-0 flex-1">
                    <Link to={paths.patient(o.patient!._id)} className="block truncate text-sm font-medium text-gray-900 hover:underline dark:text-white">
                      {o.patient!.name} {o.patient!.lastName}
                    </Link>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {o.title}
                      {o.location && ` · ${o.location}`}
                    </p>
                  </div>
                  {isWritten(o) ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-success-600 dark:text-success-400">
                      <LuCheck className="h-4 w-4" /> Izveštaj napisan
                    </span>
                  ) : (
                    <ButtonLink to={reportUrlForAppointment(o)} size="xs" variant="secondary" startIcon={<LuFilePlus className="h-3.5 w-3.5" />}>
                      Napiši izveštaj
                    </ButtonLink>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Nedovršeni izveštaji" icon={<LuFilePen />} />
            {(drafts.data ?? []).length === 0 ? (
              <EmptyState compact title="Sve je potpisano" />
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {(drafts.data ?? []).slice(0, 6).map((r) => (
                  <li key={r._id}>
                    <Link to={paths.report(r._id)} className="block px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {r.patient.name} {r.patient.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {reportTypeLabel(r.type)} · {new Date(r.visitDate).toLocaleDateString("sr-Latn-RS")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title="Narednih 7 dana" icon={<LuCalendarDays />} />
            {(nextEvents.data ?? []).filter((e) => e.patient).length === 0 ? (
              <EmptyState compact title="Nema zakazanih pregleda" />
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {(nextEvents.data ?? [])
                  .filter((e) => e.patient)
                  .slice(0, 8)
                  .map((o) => (
                    <li key={o.id} className="px-5 py-2.5">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {o.patient!.name} {o.patient!.lastName} <span className="text-gray-500">· {o.title}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(o.allDay ? `${o.start}T00:00:00` : o.start).toLocaleDateString("sr-Latn-RS", { weekday: "short", day: "numeric", month: "short" })}
                        {!o.allDay && ` · ${timeKey(new Date(o.start))}`}
                      </p>
                    </li>
                  ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {schedule && <EventDialog draft={schedule} onClose={() => setSchedule(null)} />}
    </>
  );
}
