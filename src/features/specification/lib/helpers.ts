import { formatDay, getNextPeriod } from "@shared/lib/calendarDay";

export const formatDate = (dateStr: string) => formatDay(dateStr);

export const getNextPeriodLabel = (endDateStr: string) => {
  const { start, end } = getNextPeriod(endDateStr);
  return `${formatDay(start)} — ${formatDay(end)}`;
};
