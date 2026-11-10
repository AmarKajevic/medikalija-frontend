import { LuCalendarDays } from "react-icons/lu";
import { formatDay } from "@shared/lib/calendarDay";

interface Props {
  start: string | Date;
  end: string | Date;
  className?: string;
}

// Datumi perioda kao plava "dugme" oznaka — uvek uočljivi, na svakom mestu isto.
export default function PeriodDates({ start, end, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-blue-light-300 bg-blue-light-50 px-2.5 py-1 text-sm font-semibold tabular-nums text-blue-light-700 shadow-theme-xs dark:border-blue-light-500/40 dark:bg-blue-light-500/15 dark:text-blue-light-300 ${className}`}
    >
      <LuCalendarDays className="h-4 w-4 shrink-0" />
      {formatDay(start)} – {formatDay(end)}
    </span>
  );
}
