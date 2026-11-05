import { toCalendarDay } from "@shared/lib/calendarDay";
import { Specification } from "@features/specification/types/types";

const DAY_MS = 86_400_000;

// Koliko je dana prošlo / ostalo u periodu, po kalendarskim danima
export function periodProgress(spec: Specification) {
  const start = toCalendarDay(spec.startDate).getTime();
  const end = toCalendarDay(spec.endDate).getTime();
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const total = Math.round((end - start) / DAY_MS) + 1;
  const elapsed = Math.min(Math.max(Math.round((today - start) / DAY_MS) + 1, 0), total);
  return { total, elapsed, remaining: total - elapsed };
}
