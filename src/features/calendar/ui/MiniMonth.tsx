import { useEffect, useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { MONTHS, WEEKDAYS } from "@shared/lib/dateText";
import { dateKey } from "@features/calendar/model";

interface Props {
  /** Dan koji je trenutno u fokusu velikog kalendara */
  selected: Date;
  /** Opseg koji veliki kalendar prikazuje (za isticanje nedelje) */
  rangeStart?: Date;
  rangeEnd?: Date;
  /** Dani sa bar jednim događajem ("YYYY-MM-DD") */
  busyDays?: Set<string>;
  /** Istakni izabrani dan (prikaz "Dan") */
  highlightSelected?: boolean;
  onSelect: (day: Date) => void;
}

// Mali mesečni kalendar za brzo skakanje na dan (kao u bočnoj traci Google kalendara).
export default function MiniMonth({ selected, rangeStart, rangeEnd, busyDays, highlightSelected = false, onSelect }: Props) {
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  useEffect(() => setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1)), [selected]);

  const first = new Date(month);
  const offset = (first.getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), 1 - offset + i));
  const today = dateKey(new Date());
  const inRange = (d: Date) => !!rangeStart && !!rangeEnd && d >= rangeStart && d < rangeEnd;
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {MONTHS[month.getMonth()]} {month.getFullYear()}.
        </p>
        <div className="flex">
          <button type="button" onClick={() => shift(-1)} aria-label="Prethodni mesec" className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
            <LuChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => shift(1)} aria-label="Sledeći mesec" className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
            <LuChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center" role="grid" aria-label="Mali kalendar">
        {WEEKDAYS.map((w) => (
          <span key={w} className="pb-1 text-[10px] font-medium uppercase text-gray-400">
            {w.slice(0, 2)}
          </span>
        ))}
        {days.map((d) => {
          const key = dateKey(d);
          const other = d.getMonth() !== month.getMonth();
          const isToday = key === today;
          const isSelected = highlightSelected && key === dateKey(selected);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(d)}
              aria-label={`${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}.`}
              aria-current={isToday ? "date" : undefined}
              className={`relative mx-auto my-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs tabular-nums transition ${
                isSelected
                  ? "bg-brand-600 font-semibold text-white"
                  : isToday
                    ? "font-semibold text-brand-700 ring-1 ring-brand-400 dark:text-brand-300"
                    : inRange(d)
                      ? "bg-brand-50 text-gray-800 dark:bg-brand-500/10 dark:text-gray-200"
                      : other
                        ? "text-gray-300 hover:bg-gray-100 dark:text-gray-600 dark:hover:bg-white/5"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              }`}
            >
              {d.getDate()}
              {busyDays?.has(key) && !isSelected && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-brand-500" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
