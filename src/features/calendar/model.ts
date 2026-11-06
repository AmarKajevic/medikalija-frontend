import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import { MONTHS } from "@shared/lib/dateText";

// ---------- tipovi (oblik koji vraća GET /api/calendar) ----------
export type Freq = "daily" | "weekly" | "monthly";

export interface Recurrence {
  freq: Freq;
  interval?: number;
  /** 0 = ponedeljak ... 6 = nedelja */
  byWeekday?: number[];
  until?: string | null;
  count?: number | null;
}

export interface CalendarOccurrence {
  id: string;
  eventId: string;
  title: string;
  description: string;
  location: string;
  calendar: string;
  patient: { _id: string; name: string; lastName: string } | null;
  allDay: boolean;
  /** Celodnevni: "YYYY-MM-DD" (kraj uključiv); po satima: ISO */
  start: string;
  end: string;
  occurrenceStart: string;
  recurring: boolean;
  recurrence: Recurrence | null;
  series: { start: string; end: string } | null;
  isException: boolean;
  createdBy: { _id: string; name: string; lastName: string } | null;
}

// ---------- forma ----------
export type RepeatPreset = "none" | "daily" | "weekdays" | "weekly" | "monthly" | "custom";

export interface Draft {
  /** id događaja/niza; nema ga za novi */
  eventId?: string;
  /** Termin iz niza iz kog je izmena otvorena */
  occurrence?: CalendarOccurrence;
  title: string;
  allDay: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  calendar: string;
  patientId: string;
  location: string;
  description: string;
  repeat: {
    preset: RepeatPreset;
    freq: Freq;
    interval: number;
    byWeekday: number[];
    ends: "never" | "until" | "count";
    until: string;
    count: number;
  };
}

export const WEEKDAY_NAMES = ["ponedeljak", "utorak", "sreda", "četvrtak", "petak", "subota", "nedelja"];
export const WEEKDAY_SHORT = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];

const pad = (n: number) => String(n).padStart(2, "0");
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const timeKey = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const parseKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};
export const shiftKey = (key: string, days: number) => {
  const d = parseKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
};
/** Lokalni datum + vreme → Date */
export const combine = (date: string, time: string) => {
  const d = parseKey(date);
  const [h, mi] = time.split(":").map(Number);
  d.setHours(h || 0, mi || 0, 0, 0);
  return d;
};
export const weekdayIndex = (key: string) => (parseKey(key).getDay() + 6) % 7;
export const minutesBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 60_000);

const defaultRepeat = (startDate: string): Draft["repeat"] => ({
  preset: "none",
  freq: "weekly",
  interval: 1,
  byWeekday: [weekdayIndex(startDate)],
  ends: "never",
  until: "",
  count: 10,
});

/** Nov događaj; bez vremena — naredno puno pola sata, trajanje 1 h */
export function newDraft({ start, end, allDay = false, patientId = "" }: { start?: Date; end?: Date; allDay?: boolean; patientId?: string } = {}): Draft {
  let s = start;
  if (!s) {
    s = new Date();
    s.setMinutes(s.getMinutes() < 30 ? 30 : 60, 0, 0);
  }
  const e = end && end > s ? end : new Date(s.getTime() + 60 * 60_000);
  const startDate = dateKey(s);
  return {
    title: "",
    allDay,
    startDate,
    startTime: timeKey(s),
    endDate: allDay ? dateKey(end ?? s) : dateKey(e),
    endTime: timeKey(e),
    calendar: "plava",
    patientId,
    location: "",
    description: "",
    repeat: defaultRepeat(startDate),
  };
}

export function presetOf(r: Recurrence | null): RepeatPreset {
  if (!r) return "none";
  const interval = r.interval ?? 1;
  const ends = !!(r.until || r.count);
  if (interval !== 1 || ends) return "custom";
  if (r.freq === "daily") return "daily";
  if (r.freq === "monthly") return "monthly";
  const days = [...(r.byWeekday ?? [])].sort().join(",");
  if (days === "0,1,2,3,4") return "weekdays";
  return (r.byWeekday?.length ?? 1) <= 1 ? "weekly" : "custom";
}

/** Draft iz postojećeg termina */
export function draftFrom(o: CalendarOccurrence): Draft {
  const startDate = o.allDay ? o.start : dateKey(new Date(o.start));
  const r = o.recurrence;
  return {
    eventId: o.eventId,
    occurrence: o,
    title: o.title,
    allDay: o.allDay,
    startDate,
    startTime: o.allDay ? "09:00" : timeKey(new Date(o.start)),
    endDate: o.allDay ? o.end : dateKey(new Date(o.end)),
    endTime: o.allDay ? "10:00" : timeKey(new Date(o.end)),
    calendar: o.calendar,
    patientId: o.patient?._id ?? "",
    location: o.location,
    description: o.description,
    repeat: r
      ? {
          preset: presetOf(r),
          freq: r.freq,
          interval: r.interval ?? 1,
          byWeekday: r.byWeekday?.length ? r.byWeekday : [weekdayIndex(startDate)],
          ends: r.until ? "until" : r.count ? "count" : "never",
          until: r.until ? String(r.until).slice(0, 10) : "",
          count: r.count ?? 10,
        }
      : defaultRepeat(startDate),
  };
}

export function recurrenceOf(d: Draft): Recurrence | null {
  const { preset } = d.repeat;
  const wd = weekdayIndex(d.startDate);
  switch (preset) {
    case "none":
      return null;
    case "daily":
      return { freq: "daily", interval: 1 };
    case "weekdays":
      return { freq: "weekly", interval: 1, byWeekday: [0, 1, 2, 3, 4] };
    case "weekly":
      return { freq: "weekly", interval: 1, byWeekday: [wd] };
    case "monthly":
      return { freq: "monthly", interval: 1 };
    case "custom": {
      const r = d.repeat;
      return {
        freq: r.freq,
        interval: Math.max(1, Math.min(99, Math.round(r.interval) || 1)),
        ...(r.freq === "weekly" ? { byWeekday: r.byWeekday.length ? r.byWeekday : [wd] } : {}),
        ...(r.ends === "until" && r.until ? { until: r.until } : {}),
        ...(r.ends === "count" ? { count: Math.max(1, Math.min(500, Math.round(r.count) || 1)) } : {}),
      };
    }
  }
}

/** Opis ponavljanja običnim jezikom ("Svake nedelje: uto, čet · do 31.12.2026.") */
export function describeRecurrence(r: Recurrence | null, startDate?: string): string {
  if (!r) return "Ne ponavlja se";
  const n = r.interval ?? 1;
  let text: string;
  if (r.freq === "daily") text = n === 1 ? "Svaki dan" : `Svakih ${n} dana`;
  else if (r.freq === "monthly") {
    const day = startDate ? parseKey(startDate).getDate() : null;
    text = `${n === 1 ? "Svakog meseca" : `Svakih ${n} meseci`}${day ? `, ${day}.` : ""}`;
  } else {
    const days = (r.byWeekday ?? []).slice().sort();
    const dayText = days.join(",") === "0,1,2,3,4" ? "radnim danima" : days.map((i) => WEEKDAY_SHORT[i]!.toLowerCase()).join(", ");
    text = `${n === 1 ? "Svake nedelje" : `Svake ${n}. nedelje`}${dayText ? `: ${dayText}` : ""}`;
  }
  if (r.until) {
    const [y, m, d] = String(r.until).slice(0, 10).split("-");
    text += ` · do ${d}.${m}.${y}.`;
  } else if (r.count) text += ` · ${r.count} put${r.count === 1 ? "" : "a"}`;
  return text;
}

export function validateDraft(d: Draft): string | null {
  if (!d.title.trim()) return "Unesite naziv događaja.";
  if (!d.startDate || !d.endDate) return "Unesite datum.";
  if (d.allDay) {
    if (d.endDate < d.startDate) return "Kraj je pre početka.";
  } else {
    if (!/^\d{2}:\d{2}$/.test(d.startTime) || !/^\d{2}:\d{2}$/.test(d.endTime)) return "Unesite vreme u obliku SS:MM.";
    if (combine(d.endDate, d.endTime) <= combine(d.startDate, d.startTime)) return "Kraj mora biti posle početka.";
  }
  if (d.repeat.preset === "custom" && d.repeat.ends === "until" && d.repeat.until && d.repeat.until < d.startDate) {
    return "Ponavljanje se završava pre početka događaja.";
  }
  return null;
}

export type Scope = "series" | "occurrence";

/** Telo zahteva. Za "ceo niz" iz termina: pomeraj termina se primenjuje na početak niza. */
export function toPayload(d: Draft, scope: Scope = "series") {
  let { startDate, endDate } = d;
  let start: Date = combine(d.startDate, d.startTime);
  let end: Date = combine(d.endDate, d.endTime);
  const o = d.occurrence;

  if (o?.recurring && o.series && scope === "series") {
    if (d.allDay && o.allDay) {
      const shift = Math.round((parseKey(d.startDate).getTime() - parseKey(o.start).getTime()) / 86_400_000);
      const length = Math.round((parseKey(d.endDate).getTime() - parseKey(d.startDate).getTime()) / 86_400_000);
      startDate = shiftKey(o.series.start, shift);
      endDate = shiftKey(startDate, length);
    } else if (!d.allDay && !o.allDay) {
      const shiftMs = start.getTime() - new Date(o.start).getTime();
      const length = end.getTime() - start.getTime();
      start = new Date(new Date(o.series.start).getTime() + shiftMs);
      end = new Date(start.getTime() + length);
    } else {
      // promena celodnevni ↔ po satima: niz kreće od svog prvog dana
      const firstDay = o.allDay ? o.series.start : dateKey(new Date(o.series.start));
      const dayLen = Math.round((parseKey(d.endDate).getTime() - parseKey(d.startDate).getTime()) / 86_400_000);
      startDate = firstDay;
      endDate = shiftKey(firstDay, dayLen);
      start = combine(firstDay, d.startTime);
      end = combine(endDate, d.endTime);
    }
  }

  return {
    title: d.title.trim(),
    allDay: d.allDay,
    start: d.allDay ? startDate : start.toISOString(),
    end: d.allDay ? endDate : end.toISOString(),
    calendar: d.calendar,
    patientId: d.patientId || null,
    location: d.location.trim(),
    description: d.description.trim(),
    recurrence: scope === "occurrence" ? null : recurrenceOf(d),
    ...(scope === "occurrence" && o ? { scope: "occurrence", occurrenceStart: o.occurrenceStart } : {}),
  };
}

/** "utorak, 10. novembar · 09:30 – 10:30" */
export function describeWhen(o: Pick<CalendarOccurrence, "allDay" | "start" | "end">): string {
  const dayText = (d: Date) => `${WEEKDAY_NAMES[(d.getDay() + 6) % 7]}, ${d.getDate()}. ${MONTHS[d.getMonth()]!.toLowerCase()}`;
  if (o.allDay) {
    const s = parseKey(o.start);
    const e = parseKey(o.end);
    return o.start === o.end ? `${dayText(s)} · ceo dan` : `${dayText(s)} – ${dayText(e)}`;
  }
  const s = new Date(o.start);
  const e = new Date(o.end);
  return dateKey(s) === dateKey(e) ? `${dayText(s)} · ${timeKey(s)} – ${timeKey(e)}` : `${dayText(s)} ${timeKey(s)} – ${dayText(e)} ${timeKey(e)}`;
}

// ---------- API ----------
export const calendarKeys = {
  all: ["calendar"] as const,
  range: (from: string, to: string, patientId?: string) => ["calendar", from, to, patientId ?? ""] as const,
};

export function useCalendarEvents(from: string, to: string, { patientId, enabled = true }: { patientId?: string; enabled?: boolean } = {}) {
  return useQuery({
    queryKey: calendarKeys.range(from, to, patientId),
    queryFn: async () => {
      const p = new URLSearchParams({ from, to });
      if (patientId) p.set("patientId", patientId);
      return (await api.get(`/api/calendar?${p}`)).data.events as CalendarOccurrence[];
    },
    enabled: enabled && !!from && !!to,
    placeholderData: keepPreviousData,
  });
}

function useRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: calendarKeys.all });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };
}

export function useSaveEvent() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ draft, scope }: { draft: Draft; scope: Scope }) => {
      const body = toPayload(draft, scope);
      return draft.eventId ? api.put(`/api/calendar/${draft.eventId}`, body) : api.post("/api/calendar", body);
    },
    onSettled: refresh,
  });
}

export function useDeleteEvent() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ occurrence, scope }: { occurrence: CalendarOccurrence; scope: Scope }) =>
      api.delete(
        `/api/calendar/${occurrence.eventId}${scope === "occurrence" ? `?occurrence=${encodeURIComponent(occurrence.occurrenceStart)}` : ""}`
      ),
    onSettled: refresh,
  });
}
