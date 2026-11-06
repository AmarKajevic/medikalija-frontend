import { useMemo, useState } from "react";
import { Link } from "react-router";
import { LuBellRing, LuCalendarDays, LuHandHeart, LuPlus, LuUsers } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { paths } from "@app/paths";
import PageHeader from "@shared/ui/page/PageHeader";
import StatCard from "@shared/ui/StatCard";
import { Card, CardHeader } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { describeWhen, useCalendarEvents } from "@features/calendar/model";
import { eventColorClass } from "@features/calendar/colors";
import { useDashboardStats } from "@features/dashboard/hooks/useDashboardStats";
import { followUpState, useSocialNotes } from "@features/social/model";
import SocialNotesList from "@features/social/ui/SocialNotesList";
import SocialNoteDialog from "@features/social/ui/SocialNoteDialog";

// Početna za socijalnog radnika: podsetnici, nedavne beleške, termini.
export default function SocialHome({ greeting, today }: { greeting: string; today: string }) {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const followups = useSocialNotes({ followUp: "open", limit: 200 });
  const recent = useSocialNotes({ limit: 5 });
  const stats = useDashboardStats();
  const range = useMemo(() => {
    const now = new Date();
    return { from: now.toISOString(), to: new Date(now.getTime() + 7 * 86_400_000).toISOString() };
  }, []);
  const events = useCalendarEvents(range.from, range.to);

  const open = followups.data ?? [];
  const due = open.filter((n) => {
    const s = followUpState(n.followUp.date);
    return s && s.tone !== "light";
  });

  return (
    <>
      <PageHeader
        title={`${greeting}, ${user?.name ?? ""}`}
        description={<span className="capitalize">{today}</span>}
        actions={
          <Button size="sm" startIcon={<LuPlus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            Nova beleška
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Za danas i kasni" value={due.length} loading={followups.isLoading} icon={<LuBellRing />} tone={due.length ? "warning" : "default"} to={paths.social} />
        <StatCard label="Otvoreni podsetnici" value={open.length} loading={followups.isLoading} icon={<LuHandHeart />} to={paths.social} />
        <StatCard label="Termini (7 dana)" value={events.data?.length ?? "—"} loading={events.isLoading} icon={<LuCalendarDays />} to={paths.calendar} />
        <StatCard label="Pacijenti na smeštaju" value={(stats.data && "activePatients" in stats.data ? stats.data.activePatients : "—")} loading={stats.isLoading} icon={<LuUsers />} to={paths.patients} />
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader title="Podsetnici" description="Najhitniji prvi" icon={<LuBellRing />} actions={<Link to={paths.social} className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">Svi</Link>} />
          <SocialNotesList notes={open.slice(0, 6)} loading={followups.isLoading} showPatient emptyText="Nema otvorenih podsetnika." />
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Narednih 7 dana" icon={<LuCalendarDays />} />
            {(events.data ?? []).length === 0 ? (
              <EmptyState compact title="Nema zakazanih termina" />
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {(events.data ?? []).slice(0, 8).map((o) => (
                  <li key={o.id} className="flex gap-2.5 px-5 py-2.5">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${eventColorClass(o.calendar)}`} />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-gray-900 dark:text-white">
                        {o.title}
                        {o.patient && <span className="text-gray-500"> · {o.patient.name} {o.patient.lastName}</span>}
                      </p>
                      <p className="text-xs text-gray-500 first-letter:uppercase dark:text-gray-400">{describeWhen(o)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title="Nedavne beleške" />
            <SocialNotesList notes={recent.data ?? []} loading={recent.isLoading} showPatient />
          </Card>
        </div>
      </div>

      <SocialNoteDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
