import { useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateSelectArg, EventClickArg, EventContentArg } from "@fullcalendar/core";
import srLocale from "@fullcalendar/core/locales/sr";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { api } from "@shared/api/api";
import PageHeader from "@shared/ui/page/PageHeader";
import { Card } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import Dialog from "@shared/ui/dialog/Dialog";
import Field from "@shared/ui/form/Field";
import { Input } from "@shared/ui/form/controls";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { notify } from "@shared/lib/notify";
import { EVENT_COLORS, eventColorHex, normalizeEventColor } from "@features/calendar/colors";
import DateInput from "@shared/ui/form/DateInput";

interface CalendarEventDto {
  _id: string;
  title: string;
  start: string;
  end?: string;
  calendar?: string;
}

// Lokalni kalendarski dan (ne toISOString — on bi u Beogradu vratio prethodni dan)
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shiftDay = (key: string, days: number) => {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + days));
};

type Draft = { id?: string; title: string; start: string; end: string; color: string };

export default function CalendarPage() {
  const formId = useId();
  const qc = useQueryClient();
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["calendar"],
    queryFn: async (): Promise<CalendarEventDto[]> => (await api.get("/api/calendar")).data.events ?? [],
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["calendar"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };
  // FullCalendar čuva kraj celodnevnog događaja kao EKSKLUZIVAN (dan posle poslednjeg)
  const toPayload = (d: Draft) => ({ title: d.title.trim(), start: d.start, end: shiftDay(d.end || d.start, 1), calendar: d.color });
  const save = useMutation({
    mutationFn: (d: Draft) => (d.id ? api.put(`/api/calendar/${d.id}`, toPayload(d)) : api.post("/api/calendar", toPayload(d))),
    onSuccess: refresh,
  });
  const remove = useMutation({ mutationFn: (id: string) => api.delete(`/api/calendar/${id}`), onSuccess: refresh });

  const [draft, setDraft] = useState<Draft | null>(null);
  const today = dayKey(new Date());
  const openNew = (start = today, end = start) => setDraft({ title: "", start, end, color: "zelena" });

  const onSelect = (s: DateSelectArg) => openNew(s.startStr.slice(0, 10), shiftDay((s.endStr || s.startStr).slice(0, 10), -1));
  const onEventClick = (c: EventClickArg) => {
    const e = c.event;
    const start = e.start ? dayKey(e.start) : today;
    const end = e.end ? shiftDay(dayKey(e.end), -1) : start;
    setDraft({ id: e.id, title: e.title, start, end: end < start ? start : end, color: normalizeEventColor(e.extendedProps.calendar) });
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!draft) return;
    if (!draft.title.trim()) return notify.error("Unesite naziv događaja.");
    if (draft.end && draft.end < draft.start) return notify.error("Kraj je pre početka.");
    save.mutate(draft, {
      onSuccess: () => {
        notify.success(draft.id ? "Događaj je izmenjen." : "Događaj je dodat.");
        setDraft(null);
      },
      onError: (e) => notify.error(e),
    });
  };

  const renderEvent = (arg: EventContentArg) => (
    <span className="flex min-w-0 items-center gap-1.5 px-1 text-xs">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: eventColorHex(arg.event.extendedProps.calendar) }} />
      <span className="truncate font-medium">{arg.event.title}</span>
    </span>
  );

  return (
    <>
      <PageHeader
        title="Kalendar"
        description="Pregledi, posete i podsetnici. Prevucite preko dana da biste dodali događaj."
        actions={
          <Button size="sm" startIcon={<LuPlus className="h-4 w-4" />} onClick={() => openNew()}>
            Novi događaj
          </Button>
        }
      />

      <Card className="p-4 sm:p-5">
        {isLoading ? (
          <Skeleton className="h-[600px]" />
        ) : (
          <div className="medikalija-calendar">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              locale={{ ...srLocale, code: "sr-Latn" }}
              buttonText={{ today: "Danas", month: "Mesec", week: "Nedelja", day: "Dan" }}
              initialView="dayGridMonth"
              headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek" }}
              height="auto"
              selectable
              select={onSelect}
              eventClick={onEventClick}
              eventContent={renderEvent}
              dayMaxEvents={3}
              events={events.map((e) => ({ id: e._id, title: e.title, start: e.start, end: e.end, allDay: true, extendedProps: { calendar: e.calendar } }))}
            />
          </div>
        )}
      </Card>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        {EVENT_COLORS.map((c) => (
          <span key={c.value} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${c.className}`} /> {c.label}
          </span>
        ))}
      </div>

      <Dialog
        open={!!draft}
        onClose={() => setDraft(null)}
        size="sm"
        title={draft?.id ? "Izmena događaja" : "Novi događaj"}
        footer={
          <>
            {draft?.id && (
              <Button
                variant="ghost"
                size="sm"
                className="mr-auto text-error-600 hover:bg-error-50 dark:text-error-400"
                startIcon={<LuTrash2 className="h-4 w-4" />}
                loading={remove.isPending}
                onClick={() =>
                  remove.mutate(draft.id!, { onSuccess: () => { notify.success("Događaj je obrisan."); setDraft(null); }, onError: (e) => notify.error(e) })
                }
              >
                Obriši
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setDraft(null)}>Otkaži</Button>
            <Button size="sm" type="submit" form={formId} loading={save.isPending}>Sačuvaj</Button>
          </>
        }
      >
        {draft && (
          <form id={formId} onSubmit={submit} className="space-y-4" noValidate>
            <Field label="Naziv" htmlFor={`${formId}-t`}>
              <Input id={`${formId}-t`} autoFocus value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="npr. Pregled kardiologa" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Od" htmlFor={`${formId}-s`}>
                <DateInput id={`${formId}-s`} value={draft.start} onChange={(v) => setDraft({ ...draft, start: v, end: draft.end < v ? v : draft.end })} fromYear={2020} />
              </Field>
              <Field label="Do" htmlFor={`${formId}-e`}>
                <DateInput id={`${formId}-e`} min={draft.start || undefined} value={draft.end} onChange={(v) => setDraft({ ...draft, end: v })} fromYear={2020} />
              </Field>
            </div>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Vrsta</legend>
              <div className="grid grid-cols-2 gap-2">
                {EVENT_COLORS.map((c) => (
                  <label
                    key={c.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      draft.color === c.value ? "border-brand-500 bg-brand-50 text-gray-900 dark:bg-brand-500/10 dark:text-white" : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    <input type="radio" name="event-color" className="sr-only" checked={draft.color === c.value} onChange={() => setDraft({ ...draft, color: c.value })} />
                    <span className={`h-2.5 w-2.5 rounded-full ${c.className}`} />
                    {c.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </form>
        )}
      </Dialog>
    </>
  );
}
