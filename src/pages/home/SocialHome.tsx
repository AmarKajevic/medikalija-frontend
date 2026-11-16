import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  LuArrowRight,
  LuBellRing,
  LuCalendarDays,
  LuCheck,
  LuClipboardCheck,
  LuFileText,
  LuFolderOpen,
  LuHandHeart,
  LuNotebookPen,
  LuPlus,
  LuTriangleAlert,
  LuUserPlus,
  LuUsers,
} from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { paths } from "@app/paths";
import PageHeader from "@shared/ui/page/PageHeader";
import StatCard from "@shared/ui/StatCard";
import { Card, CardHeader } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import Tabs from "@shared/ui/tabs/Tabs";
import Avatar from "@shared/ui/avatar/Avatar";
import SearchSelect, { SearchOption } from "@shared/ui/combobox/SearchSelect";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { notify } from "@shared/lib/notify";
import { formatDay } from "@shared/lib/calendarDay";
import { describeWhen, useCalendarEvents } from "@features/calendar/model";
import { eventColorClass } from "@features/calendar/colors";
import { usePatients } from "@features/patients/hooks/usePatients";
import { useFollowUpDone, useSocialNotes } from "@features/social/model";
import { DEADLINE_LABEL, useSocialDeadlines } from "@features/social/dossier";
import { buildSocialTasks, daysFrom, filterTasks, SocialTask, TaskFilter } from "@features/social/lib/tasks";
import SocialNotesList from "@features/social/ui/SocialNotesList";
import SocialNoteDialog from "@features/social/ui/SocialNoteDialog";
import NewResidentDialog from "@features/social/ui/NewResidentDialog";

type PatientRow = { _id: string; name: string; lastName: string; admissionDate: string; dischargeDate?: string | null };

/** Profil korisnika na socijalnoj sekciji (dokumentacija, karton ili beleške) */
const socialLink = (id: string, section: "documents" | "profile" | "notes" = "documents") => `${paths.patient(id)}?tab=social&social=${section}`;

const dueLabel = (days: number) => (days < 0 ? `kasni ${-days} ${-days === 1 ? "dan" : "dana"}` : days === 0 ? "danas" : days === 1 ? "sutra" : `za ${days} dana`);
const dueTone = (days: number) => (days < 0 ? "error" : days <= 2 ? "warning" : "light") as "error" | "warning" | "light";

// Početna za socijalnog radnika: šta kasni i šta je sledeće (rokovi po Pravilniku i podsetnici u
// jednoj radnoj listi), novi korisnici i njihova dokumentacija, brzo otvaranje kartona i prečice.
export default function SocialHome({ greeting, today }: { greeting: string; today: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [showAll, setShowAll] = useState(false);

  const followups = useSocialNotes({ followUp: "open", limit: 300 });
  const recent = useSocialNotes({ limit: 5 });
  const deadlines = useSocialDeadlines();
  const patientsQuery = usePatients();
  const done = useFollowUpDone();
  const range = useMemo(() => {
    const now = new Date();
    return { from: now.toISOString(), to: new Date(now.getTime() + 7 * 86_400_000).toISOString() };
  }, []);
  const events = useCalendarEvents(range.from, range.to);

  const patients = (patientsQuery.data?.patients ?? []) as PatientRow[];
  const active = patients.filter((p) => !p.dischargeDate);
  // Novi prijemi: poslednjih 30 dana (najnoviji prvi), sa sledećim korakom iz rokova
  const newcomers = active
    .filter((p) => daysFrom(p.admissionDate) >= -30 && daysFrom(p.admissionDate) <= 0)
    .sort((a, b) => b.admissionDate.localeCompare(a.admissionDate));
  const nextStep = new Map((deadlines.data ?? []).map((d) => [d.patient._id, d]));

  const tasks = useMemo(() => buildSocialTasks(deadlines.data ?? [], followups.data ?? [], DEADLINE_LABEL), [deadlines.data, followups.data]);
  const overdue = tasks.filter((t) => t.days < 0).length;
  const thisWeek = tasks.filter((t) => t.days >= 0 && t.days <= 7).length;
  const shown = filterTasks(tasks, filter);
  const visible = showAll ? shown : shown.slice(0, 8);
  const tasksLoading = deadlines.isLoading || followups.isLoading;

  const patientOptions: SearchOption[] = useMemo(
    () =>
      active
        .slice()
        .sort((a, b) => `${a.lastName} ${a.name}`.localeCompare(`${b.lastName} ${b.name}`, "sr"))
        .map((p) => ({ value: p._id, label: `${p.lastName} ${p.name}`, description: `prijem ${formatDay(p.admissionDate)}`, icon: <Avatar name={p.name} lastName={p.lastName} size="xs" /> })),
    [active]
  );

  const completeFollowUp = (t: SocialTask) =>
    t.noteId &&
    done.mutate({ id: t.noteId, done: true }, { onSuccess: () => notify.success("Podsetnik je završen."), onError: (err) => notify.error(err) });

  return (
    <>
      <PageHeader
        title={`${greeting}, ${user?.name ?? ""}`}
        description={<span className="capitalize">{today}</span>}
        actions={
          <>
            <Button size="sm" variant="outline" startIcon={<LuUserPlus className="h-4 w-4" />} onClick={() => setAdding(true)}>
              Novi korisnik
            </Button>
            <Button size="sm" startIcon={<LuPlus className="h-4 w-4" />} onClick={() => setCreating(true)}>
              Nova beleška
            </Button>
          </>
        }
      />

      {/* Brzo otvaranje kartona: kucanje imena → dokumentacija korisnika */}
      <div className="mb-6 max-w-xl">
        <label htmlFor="social-home-open" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Otvori karton korisnika
        </label>
        <SearchSelect id="social-home-open" value="" onChange={(id) => id && navigate(socialLink(id))} options={patientOptions} loading={patientsQuery.isLoading} placeholder="Kucajte ime ili prezime..." />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Kasni" value={overdue} loading={tasksLoading} icon={<LuTriangleAlert />} tone={overdue ? "danger" : "default"} hint="rokovi i podsetnici" />
        <StatCard label="U narednih 7 dana" value={thisWeek} loading={tasksLoading} icon={<LuBellRing />} tone={thisWeek ? "warning" : "default"} hint="rokovi i podsetnici" />
        <StatCard label="Novi prijemi (30 dana)" value={newcomers.length} loading={patientsQuery.isLoading} icon={<LuUserPlus />} hint="papirologija za prijem" />
        <StatCard label="Na smeštaju" value={active.length} loading={patientsQuery.isLoading} icon={<LuUsers />} to={paths.patients} />
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          {/* Radna lista: rokovi po Pravilniku + podsetnici, po hitnosti */}
          <Card>
            <CardHeader
              icon={<LuClipboardCheck />}
              title="Za uraditi"
              description="Procene, individualni planovi, pregledi plana i podsetnici — najhitnije prvo"
              actions={
                <Link to={`${paths.social}?view=deadlines`} className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                  Svi rokovi
                </Link>
              }
            />
            <div className="border-b border-gray-100 px-5 py-2.5 dark:border-gray-800 sm:px-6">
              <Tabs
                variant="pills"
                value={filter}
                onChange={(v) => {
                  setFilter(v);
                  setShowAll(false);
                }}
                items={[
                  { value: "all", label: `Sve (${tasks.length})` },
                  { value: "overdue", label: `Kasni (${overdue})` },
                  { value: "week", label: "Ova nedelja" },
                ]}
              />
            </div>
            {tasksLoading ? (
              <div className="space-y-2 p-5">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : shown.length === 0 ? (
              <EmptyState compact icon={<LuCheck />} title={filter === "overdue" ? "Ništa ne kasni" : "Sve je urađeno"} description="Novi rokovi se pojavljuju sami posle prijema, procene i plana." />
            ) : (
              <>
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {visible.map((t) => (
                    <li key={t.id} className="group flex items-center gap-3 px-5 py-3 sm:px-6">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          t.kind === "deadline" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400" : "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
                        }`}
                        title={t.kind === "deadline" ? "Rok po Pravilniku" : "Podsetnik iz beleške"}
                      >
                        {t.kind === "deadline" ? <LuFileText className="h-4 w-4" /> : <LuBellRing className="h-4 w-4" />}
                      </span>
                      <Link to={socialLink(t.patient._id, t.kind === "deadline" ? "documents" : "notes")} className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 group-hover:text-brand-700 dark:text-white/90 dark:group-hover:text-brand-300">
                          {t.title} · {t.patient.lastName} {t.patient.name}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          rok {formatDay(t.due.toISOString())}
                          {t.detail && ` · ${t.detail}`}
                        </p>
                      </Link>
                      <Badge size="sm" color={dueTone(t.days)}>
                        {dueLabel(t.days)}
                      </Badge>
                      {t.kind === "followup" && (
                        <button
                          type="button"
                          onClick={() => completeFollowUp(t)}
                          disabled={done.isPending}
                          aria-label={`Završi podsetnik: ${t.title}`}
                          title="Označi kao završeno"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-success-50 hover:text-success-600 dark:hover:bg-success-500/10"
                        >
                          <LuCheck className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {shown.length > visible.length && (
                  <button type="button" onClick={() => setShowAll(true)} className="w-full border-t border-gray-100 px-5 py-2.5 text-sm font-medium text-brand-600 hover:bg-gray-50 dark:border-gray-800 dark:text-brand-400 dark:hover:bg-white/[0.03]">
                    Prikaži još {shown.length - visible.length}
                  </button>
                )}
              </>
            )}
          </Card>

          {/* Novi korisnici: papirologija za prijem i sledeći korak */}
          <Card>
            <CardHeader icon={<LuUserPlus />} title="Novi korisnici" description="Primljeni u poslednjih 30 dana — paket za prijem i procena" />
            {patientsQuery.isLoading ? (
              <div className="p-5">
                <Skeleton className="h-16" />
              </div>
            ) : newcomers.length === 0 ? (
              <EmptyState compact icon={<LuUsers />} title="Nema novih prijema u poslednjih 30 dana" />
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {newcomers.map((p) => {
                  const step = nextStep.get(p._id);
                  return (
                    <li key={p._id} className="flex flex-wrap items-center gap-3 px-5 py-3 sm:px-6">
                      <Avatar name={p.name} lastName={p.lastName} size="sm" />
                      {/* Na uskom ekranu tekst zadržava širinu, a oznaka i dugmad prelaze u novi red */}
                      <div className="min-w-0 flex-1 basis-48">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white/90">
                          {p.lastName} {p.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          prijem {formatDay(p.admissionDate)}
                          {step && ` · sledeće: ${DEADLINE_LABEL[step.kind].toLowerCase()} do ${formatDay(step.due)}`}
                        </p>
                      </div>
                      {step && (
                        <Badge size="sm" color={dueTone(daysFrom(step.due))}>
                          {dueLabel(daysFrom(step.due))}
                        </Badge>
                      )}
                      <span className="flex gap-1.5">
                        <Link to={socialLink(p._id, "profile")} className="rounded-lg px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/5">
                          Karton
                        </Link>
                        <Link to={socialLink(p._id)} className="flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300">
                          Dokumentacija <LuArrowRight className="h-3 w-3" />
                        </Link>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* Prečice */}
          <Card>
            <CardHeader title="Brzi pristup" />
            <div className="grid grid-cols-2 gap-2 p-4">
              {[
                { to: `${paths.social}?view=forms`, label: "Obrasci doma", hint: "prazni obrasci", icon: <LuFolderOpen /> },
                { to: `${paths.social}?view=deadlines`, label: "Rokovi", hint: "svi korisnici", icon: <LuClipboardCheck /> },
                { to: `${paths.social}?view=all`, label: "Sve beleške", hint: "socijalni karton", icon: <LuNotebookPen /> },
                { to: paths.patients, label: "Korisnici", hint: "lista i karton", icon: <LuUsers /> },
                { to: `${paths.social}?view=templates`, label: "Sopstveni šabloni", hint: "Word", icon: <LuFileText /> },
                { to: paths.calendar, label: "Kalendar", hint: "termini", icon: <LuCalendarDays /> },
              ].map((l) => (
                <Link key={l.label} to={l.to} className="group flex items-center gap-2.5 rounded-xl border border-gray-200 p-3 transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-gray-800 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 group-hover:bg-brand-100 group-hover:text-brand-700 dark:bg-white/[0.06] dark:text-gray-300">{l.icon}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-900 dark:text-white/90">{l.label}</span>
                    <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{l.hint}</span>
                  </span>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Narednih 7 dana" icon={<LuCalendarDays />} actions={<Link to={paths.calendar} className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">Kalendar</Link>} />
            {(events.data ?? []).length === 0 ? (
              <EmptyState compact title="Nema zakazanih termina" />
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {(events.data ?? []).slice(0, 6).map((o) => (
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
            <CardHeader title="Nedavne beleške" icon={<LuHandHeart />} actions={<Link to={`${paths.social}?view=all`} className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">Sve</Link>} />
            <SocialNotesList notes={recent.data ?? []} loading={recent.isLoading} showPatient />
          </Card>
        </div>
      </div>

      <SocialNoteDialog open={creating} onClose={() => setCreating(false)} />
      <NewResidentDialog open={adding} onClose={() => setAdding(false)} />
    </>
  );
}
