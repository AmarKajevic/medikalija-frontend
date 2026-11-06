import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, DatesSetArg, EventClickArg, EventContentArg, EventDropArg, EventInput } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import srLocale from "@fullcalendar/core/locales/sr";
import { LuChevronLeft, LuChevronRight, LuPlus, LuRepeat } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { isManager } from "@app/paths";
import { Card } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import { notify } from "@shared/lib/notify";
import { toLatin } from "@shared/lib/script";
import { EVENT_COLORS } from "@features/calendar/colors";
import {
  CalendarOccurrence,
  dateKey,
  describeWhen,
  Draft,
  draftFrom,
  newDraft,
  parseKey,
  Scope,
  shiftKey,
  timeKey,
  useCalendarEvents,
  useSaveEvent,
} from "@features/calendar/model";
import EventDialog from "@features/calendar/ui/EventDialog";
import EventDetails from "@features/calendar/ui/EventDetails";
import ScopeDialog from "@features/calendar/ui/ScopeDialog";
import MiniMonth from "@features/calendar/ui/MiniMonth";

type ViewKey = "month" | "week" | "day" | "list";
const FC_VIEW: Record<ViewKey, string> = { month: "dayGridMonth", week: "timeGridWeek", day: "timeGridDay", list: "listWeek" };
const VIEWS: Array<[ViewKey, string, string]> = [
  ["month", "Mesec", "m"],
  ["week", "Nedelja", "n"],
  ["day", "Dan", "d"],
  ["list", "Lista", "l"],
];
const HIDDEN_KEY = "calendar.hidden";
const isMobile = () => typeof window !== "undefined" && window.matchMedia?.("(max-width: 639px)").matches;

// FullCalendar kraj celodnevnog događaja čuva kao ekskluzivan (dan posle poslednjeg)
const toFcEvent = (o: CalendarOccurrence): EventInput => ({
  id: o.id,
  title: o.title,
  start: o.start,
  end: o.allDay ? shiftKey(o.end, 1) : o.end,
  allDay: o.allDay,
  classNames: [`ev-${o.calendar}`],
  extendedProps: { occurrence: o },
});

// Podešavanja kao konstante: novi objekat pri svakom renderu tera FullCalendar da
// ponovo javi datesSet → setState → render → beskonačna petlja.
const LOCALE = { ...srLocale, code: "sr-Latn" };
const PLUGINS = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin];
const TIME_FORMAT = { hour: "2-digit", minute: "2-digit", hour12: false } as const;
const VIEW_OPTIONS = {
  dayGridMonth: { dayHeaderFormat: { weekday: "short" } },
  timeGrid: { dayHeaderFormat: { weekday: "short", day: "numeric", month: "numeric", omitCommas: true } },
  listWeek: { listDayFormat: { weekday: "long", day: "numeric", month: "long" }, listDaySideFormat: false },
} as const;
const moreLinkText = (n: number) => `još ${n}`;

const occOf = (e: { extendedProps: Record<string, unknown> }) => e.extendedProps.occurrence as CalendarOccurrence | undefined;

export default function CalendarPage() {
  const { user } = useAuth();
  const canEdit = isManager(user?.role);
  const calRef = useRef<FullCalendar>(null);
  const [params, setParams] = useSearchParams();
  const initialView = (params.get("view") as ViewKey) || (isMobile() ? "list" : "week");
  const initialDate = params.get("date") || undefined;

  const [view, setView] = useState<ViewKey>(FC_VIEW[initialView] ? initialView : "week");
  const [title, setTitle] = useState("");
  const [range, setRange] = useState<{ from: string; to: string; start: Date; end: Date } | null>(null);
  const [focusDay, setFocusDay] = useState<Date>(initialDate ? parseKey(initialDate) : new Date());
  const [hidden, setHidden] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "[]");
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [details, setDetails] = useState<CalendarOccurrence | null>(null);
  const [pendingMove, setPendingMove] = useState<{ draft: Draft; revert: () => void } | null>(null);

  const { data: events = [], isFetching } = useCalendarEvents(range?.from ?? "", range?.to ?? "");
  const save = useSaveEvent();

  // Predstojeće (14 dana) za bočnu traku — nezavisno od prikazanog opsega
  const upcomingRange = useMemo(() => {
    const now = new Date();
    return { from: now.toISOString(), to: new Date(now.getTime() + 14 * 86_400_000).toISOString() };
    // jednom po otvaranju stranice
  }, []);
  const { data: upcoming = [] } = useCalendarEvents(upcomingRange.from, upcomingRange.to);

  useEffect(() => localStorage.setItem(HIDDEN_KEY, JSON.stringify(hidden)), [hidden]);

  const visible = useMemo(() => events.filter((e) => !hidden.includes(e.calendar)), [events, hidden]);
  const fcEvents = useMemo(() => visible.map(toFcEvent), [visible]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of events) c[e.calendar] = (c[e.calendar] ?? 0) + 1;
    return c;
  }, [events]);
  const busyDays = useMemo(() => {
    const s = new Set<string>();
    for (const e of visible) s.add(e.allDay ? e.start : dateKey(new Date(e.start)));
    return s;
  }, [visible]);

  const api = () => calRef.current?.getApi();

  const onDatesSet = (arg: DatesSetArg) => {
    setTitle(arg.view.title);
    setRange({ from: arg.start.toISOString(), to: arg.end.toISOString(), start: arg.start, end: arg.end });
    const current = arg.view.currentStart;
    setFocusDay((prev) => (prev >= arg.view.currentStart && prev < arg.view.currentEnd ? prev : current));
    const key = (Object.keys(FC_VIEW) as ViewKey[]).find((k) => FC_VIEW[k] === arg.view.type) ?? "week";
    setView(key);
    setParams({ view: key, date: dateKey(current) }, { replace: true });
  };

  const changeView = useCallback((v: ViewKey) => api()?.changeView(FC_VIEW[v]), []);
  const goTo = (d: Date) => {
    setFocusDay(d);
    api()?.gotoDate(d);
  };

  // ---------- novi događaj ----------
  const openNew = useCallback(
    (opts?: Parameters<typeof newDraft>[0]) => {
      if (!canEdit) return;
      setDraft(newDraft(opts));
    },
    [canEdit]
  );

  const onSelect = (s: DateSelectArg) => {
    api()?.unselect();
    if (s.allDay) {
      const lastDay = new Date(s.end.getTime() - 86_400_000);
      const singleMonthClick = s.view.type === "dayGridMonth" && dateKey(lastDay) === dateKey(s.start);
      // Klik na dan u mesecu: termin u 09:00 (najčešći slučaj); prevlačenje preko više dana: celodnevni
      if (singleMonthClick) {
        const start = new Date(s.start);
        start.setHours(9, 0, 0, 0);
        return openNew({ start });
      }
      return openNew({ start: s.start, end: lastDay, allDay: true });
    }
    // Običan klik u satnici: početak polja (:00 / :30) i trajanje 1 h, kao Google
    const minutes = (s.end.getTime() - s.start.getTime()) / 60_000;
    if (minutes <= 30) {
      const start = new Date(s.start);
      start.setMinutes(start.getMinutes() < 30 ? 0 : 30, 0, 0);
      return openNew({ start, end: new Date(start.getTime() + 60 * 60_000) });
    }
    openNew({ start: s.start, end: s.end });
  };

  // ---------- pomeranje i promena trajanja ----------
  const onMove = (info: EventDropArg | EventResizeDoneArg) => {
    const o = occOf(info.event);
    const e = info.event;
    if (!e.start || !o) return info.revert();
    const base = draftFrom(o);
    let moved: Draft;
    if (e.allDay) {
      const endEx = e.end ?? new Date(e.start.getTime() + 86_400_000);
      moved = { ...base, allDay: true, startDate: dateKey(e.start), endDate: dateKey(new Date(endEx.getTime() - 86_400_000)) };
    } else {
      const end = e.end ?? new Date(e.start.getTime() + 60 * 60_000);
      moved = { ...base, allDay: false, startDate: dateKey(e.start), startTime: timeKey(e.start), endDate: dateKey(end), endTime: timeKey(end) };
    }
    if (o.recurring && !o.isException) return setPendingMove({ draft: moved, revert: info.revert });
    persistMove(moved, "series", info.revert);
  };

  const persistMove = (d: Draft, scope: Scope, revert: () => void) =>
    save.mutate(
      { draft: d, scope },
      {
        onSuccess: () => {
          notify.success("Događaj je pomeren.");
          setPendingMove(null);
        },
        onError: (err) => {
          revert();
          setPendingMove(null);
          notify.error(err);
        },
      }
    );

  // ---------- prečice na tastaturi ----------
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement;
      if (ev.ctrlKey || ev.metaKey || ev.altKey || /INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable) return;
      if (document.querySelector("[data-dialog-panel]")) return;
      // I sa ćiriličnim rasporedom tastature (taster M daje "м")
      const k = toLatin(ev.key).toLowerCase();
      const v = VIEWS.find(([, , key]) => key === k);
      if (v) changeView(v[0]);
      else if (k === "t") api()?.today();
      else if (k === "c" && canEdit) openNew();
      else if (ev.key === "ArrowLeft") api()?.prev();
      else if (ev.key === "ArrowRight") api()?.next();
      else return;
      ev.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [canEdit, changeView, openNew]);

  const renderEvent = (arg: EventContentArg) => {
    const o = occOf(arg.event);
    const timed = !arg.event.allDay;
    // Senka pri označavanju vremena (selectMirror) nema podatke termina
    if (!o) {
      return <div className="px-1.5 py-0.5 text-xs font-medium tabular-nums leading-tight">{arg.timeText || "Novi događaj"}</div>;
    }
    if (arg.view.type.startsWith("list")) {
      return (
        <span className="flex min-w-0 flex-wrap items-center gap-x-2">
          <span className="font-medium text-gray-900 dark:text-white">{o.title}</span>
          {o.patient && <span className="text-gray-500">· {o.patient.name} {o.patient.lastName}</span>}
          {o.location && <span className="text-gray-400">· {o.location}</span>}
          {o.recurring && <LuRepeat className="h-3 w-3 text-gray-400" aria-label="ponavlja se" />}
        </span>
      );
    }
    const compact = arg.view.type === "dayGridMonth";
    return (
      <div className={`flex h-full min-w-0 ${compact ? "items-center gap-1" : "flex-col"} overflow-hidden px-1.5 py-0.5 leading-tight`}>
        {compact && <span className="ev-dot h-1.5 w-1.5 shrink-0 rounded-full" />}
        {timed && compact && <span className="shrink-0 tabular-nums opacity-70">{arg.timeText}</span>}
        <span className="truncate font-medium">
          {o.title}
          {o.recurring && !compact && <LuRepeat className="ml-1 inline h-3 w-3 opacity-60" aria-label="ponavlja se" />}
        </span>
        {!compact && timed && <span className="truncate tabular-nums opacity-70">{arg.timeText}</span>}
        {!compact && o.patient && <span className="truncate opacity-70">{o.patient.name} {o.patient.lastName}</span>}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Traka sa navigacijom */}
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="sr-only">Kalendar</h1>
        <Button variant="outline" size="sm" onClick={() => api()?.today()} title="Danas (T)">
          Danas
        </Button>
        <div className="flex">
          <button type="button" onClick={() => api()?.prev()} aria-label="Prethodno" title="Prethodno (←)" className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5">
            <LuChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => api()?.next()} aria-label="Sledeće" title="Sledeće (→)" className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5">
            <LuChevronRight className="h-5 w-5" />
          </button>
        </div>
        <p className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight text-gray-900 first-letter:uppercase dark:text-white sm:text-xl" aria-live="polite">
          {title}
          {isFetching && <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-brand-400 align-middle" aria-label="učitavanje" />}
        </p>
        <div role="tablist" aria-label="Prikaz" className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-white/[0.06]">
          {VIEWS.map(([key, label, shortcut]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => changeView(key)}
              title={`${label} (${shortcut.toUpperCase()})`}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm ${
                view === key ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white" : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {canEdit && (
          <Button size="sm" startIcon={<LuPlus className="h-4 w-4" />} onClick={() => openNew()} title="Novi događaj (C)">
            <span className="hidden sm:inline">Novi događaj</span>
            <span className="sm:hidden">Novi</span>
          </Button>
        )}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[260px_1fr]">
        {/* Bočna traka */}
        <aside className="hidden space-y-4 lg:block" aria-label="Kalendar — pomoćni panel">
          <Card className="p-4">
            <MiniMonth
              selected={focusDay}
              rangeStart={view === "week" ? range?.start : undefined}
              rangeEnd={view === "week" ? range?.end : undefined}
              highlightSelected={view === "day"}
              busyDays={busyDays}
              onSelect={goTo}
            />
          </Card>
          <Card className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Vrste</p>
            <ul className="space-y-1">
              {EVENT_COLORS.map((c) => {
                const on = !hidden.includes(c.value);
                return (
                  <li key={c.value}>
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.03]">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => setHidden((h) => (on ? [...h, c.value] : h.filter((x) => x !== c.value)))}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: c.hex }}
                      />
                      <span className="flex-1">{c.label}</span>
                      <span className="text-xs tabular-nums text-gray-400">{counts[c.value] ?? 0}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Narednih 14 dana</p>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-500">Nema zakazanih događaja.</p>
            ) : (
              <ul className="space-y-2.5">
                {upcoming.slice(0, 6).map((o) => (
                  <li key={o.id}>
                    <button type="button" onClick={() => setDetails(o)} className="flex w-full gap-2.5 text-left">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ev-dot-${o.calendar}`} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-800 hover:underline dark:text-gray-200">{o.title}</span>
                        <span className="block text-xs text-gray-500 first-letter:uppercase dark:text-gray-400">{describeWhen(o)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <p className="px-1 text-[11px] leading-relaxed text-gray-400">
            Prečice: <kbd>T</kbd> danas · <kbd>←</kbd> <kbd>→</kbd> · <kbd>M</kbd> <kbd>N</kbd> <kbd>D</kbd> <kbd>L</kbd> prikaz
            {canEdit && (
              <>
                {" "}
                · <kbd>C</kbd> novi
              </>
            )}
          </p>
        </aside>

        <Card className="overflow-hidden p-0">
          <div className="medikalija-calendar h-[calc(100dvh-11rem)] min-h-[560px]">
            <FullCalendar
              ref={calRef}
              plugins={PLUGINS}
              locale={LOCALE}
              views={VIEW_OPTIONS}
              firstDay={1}
              initialView={FC_VIEW[view]}
              initialDate={initialDate}
              headerToolbar={false}
              height="100%"
              events={fcEvents}
              datesSet={onDatesSet}
              eventContent={renderEvent}
              eventClick={(c: EventClickArg) => {
                c.jsEvent.preventDefault();
                setDetails(occOf(c.event) ?? null);
              }}
              // Unos po satima
              allDaySlot
              allDayText="Ceo dan"
              slotDuration="00:30:00"
              snapDuration="00:15:00"
              scrollTime="07:00:00"
              scrollTimeReset={false}
              slotLabelFormat={TIME_FORMAT}
              eventTimeFormat={TIME_FORMAT}
              nowIndicator
              dayMaxEvents
              moreLinkText={moreLinkText}
              noEventsText="Nema događaja u ovom periodu."
              navLinks
              navLinkDayClick={(d) => {
                setFocusDay(d);
                api()?.changeView("timeGridDay", d);
              }}
              // Izmena prevlačenjem (samo uprava)
              selectable={canEdit}
              selectMirror
              select={onSelect}
              editable={canEdit}
              eventDrop={onMove}
              eventResize={onMove}
              longPressDelay={350}
            />
          </div>
        </Card>
      </div>

      {draft && <EventDialog draft={draft} onClose={() => setDraft(null)} />}
      <EventDetails
        occurrence={details}
        canEdit={canEdit}
        onClose={() => setDetails(null)}
        onEdit={(o) => {
          setDetails(null);
          setDraft(draftFrom(o));
        }}
      />
      <ScopeDialog
        open={!!pendingMove}
        action="move"
        loading={save.isPending}
        onClose={() => {
          pendingMove?.revert();
          setPendingMove(null);
        }}
        onPick={(scope) => pendingMove && persistMove(pendingMove.draft, scope, pendingMove.revert)}
      />
    </div>
  );
}
