import { KeyboardEvent, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuCalendarDays, LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { inputClass } from "@shared/ui/form/Field";
import { MONTHS, WEEKDAYS, isoToDisplay, maskDateTyping, parseDisplayDate, splitIso, toIsoDate, todayIso } from "@shared/lib/dateText";

interface DateInputProps {
  id?: string;
  /** "YYYY-MM-DD" ili "" */
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  "aria-describedby"?: string;
  /** Godina od koje počinje izbor u kalendaru kad nema `min` (npr. 1900 za datum rođenja) */
  fromYear?: number;
  toYear?: number;
}

const selectClass =
  "h-8 rounded-md border border-gray-200 bg-white px-2 text-sm font-medium text-gray-800 focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white";

// Datum se kuca kao DD.MM.GGGG ili bira iz kalendara sa izborom meseca i godine.
export default function DateInput({
  id,
  value,
  onChange,
  min,
  max,
  invalid,
  disabled,
  autoFocus,
  fromYear,
  toYear,
  ...aria
}: DateInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const gridId = `${inputId}-calendar`;
  const [text, setText] = useState(isoToDisplay(value));
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(isoToDisplay(value));
    setError(null);
  }, [value]);

  const outOfRange = useCallback((iso: string) => (min && iso < min) || (max && iso > max), [min, max]);

  const commitText = (raw: string) => {
    if (!raw.trim()) {
      setError(null);
      if (value) onChange("");
      return;
    }
    const iso = parseDisplayDate(raw);
    if (!iso) return setError("Datum ne postoji. Upišite kao DD.MM.GGGG.");
    if (outOfRange(iso)) {
      return setError(
        min && iso < min ? `Datum ne može biti pre ${isoToDisplay(min)}.` : `Datum ne može biti posle ${isoToDisplay(max)}.`
      );
    }
    setError(null);
    setText(isoToDisplay(iso));
    if (iso !== value) onChange(iso);
  };

  const pick = (iso: string) => {
    setOpen(false);
    setError(null);
    setText(isoToDisplay(iso));
    onChange(iso);
  };

  const showInvalid = invalid || !!error;

  return (
    <div ref={anchorRef} className="relative">
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="DD.MM.GGGG"
        value={text}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-invalid={showInvalid || undefined}
        aria-describedby={[aria["aria-describedby"], error ? `${inputId}-error` : null].filter(Boolean).join(" ") || undefined}
        onChange={(e) => {
          const masked = maskDateTyping(e.target.value);
          setText(masked);
          if (error) setError(null);
          // Čim je datum ceo, odmah se prihvata (ne čeka se izlazak iz polja)
          if (/^\d{2}\.\d{2}\.\d{4}$/.test(masked)) commitText(masked);
        }}
        onBlur={(e) => commitText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && e.altKey) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`${inputClass} pr-10 tabular-nums ${showInvalid ? "border-error-400 focus:border-error-400 focus:ring-error-500/15" : ""}`}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label="Otvori kalendar"
        aria-expanded={open}
        aria-controls={open ? gridId : undefined}
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-white/5 dark:hover:text-white"
      >
        <LuCalendarDays className="h-4 w-4" />
      </button>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-1 text-xs text-error-600 dark:text-error-400">
          {error}
        </p>
      )}
      {open && (
        <CalendarPopover
          id={gridId}
          anchor={anchorRef}
          value={value || parseDisplayDate(text) || ""}
          min={min}
          max={max}
          fromYear={fromYear}
          toYear={toYear}
          onPick={pick}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

interface CalendarProps {
  id: string;
  anchor: React.RefObject<HTMLDivElement | null>;
  value: string;
  min?: string;
  max?: string;
  fromYear?: number;
  toYear?: number;
  onPick: (iso: string) => void;
  onClose: () => void;
}

function CalendarPopover({ id, anchor, value, min, max, fromYear, toYear, onPick, onClose }: CalendarProps) {
  const today = todayIso();
  const initial = splitIso(value) ?? splitIso(today)!;
  const [view, setView] = useState({ y: initial.y, m: initial.m });
  const [focusDay, setFocusDay] = useState(initial.d);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const thisYear = new Date().getFullYear();
  const firstYear = min ? Number(min.slice(0, 4)) : (fromYear ?? thisYear - 110);
  const lastYear = max ? Number(max.slice(0, 4)) : (toYear ?? thisYear + 10);
  const years = useMemo(() => Array.from({ length: lastYear - firstYear + 1 }, (_, i) => lastYear - i), [firstYear, lastYear]);

  // Pozicija ispod polja (iznad ako nema mesta); portal da ga dijalog ne odseče
  useLayoutEffect(() => {
    const place = () => {
      const r = anchor.current?.getBoundingClientRect();
      if (!r) return;
      const height = popRef.current?.offsetHeight ?? 360;
      const below = r.bottom + 6;
      const top = below + height > window.innerHeight && r.top - height - 6 > 0 ? r.top - height - 6 : below;
      setPos({ top, left: Math.min(r.left, window.innerWidth - 300) });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!popRef.current?.contains(t) && !anchor.current?.contains(t)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [anchor, onClose]);

  const daysInMonth = new Date(Date.UTC(view.y, view.m, 0)).getUTCDate();
  const leading = (new Date(Date.UTC(view.y, view.m - 1, 1)).getUTCDay() + 6) % 7; // ponedeljak prvi
  const cells = [...Array<null>(leading).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const clampedFocus = Math.min(focusDay, daysInMonth);

  useEffect(() => {
    popRef.current?.querySelector<HTMLButtonElement>(`[data-day="${clampedFocus}"]`)?.focus();
  }, [view, clampedFocus]);

  const shiftMonth = (delta: number) =>
    setView((v) => {
      const idx = v.y * 12 + (v.m - 1) + delta;
      return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
    });

  const disabledDay = (iso: string) => (min && iso < min) || (max && iso > max);

  const onGridKey = (e: KeyboardEvent) => {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation(); // ne zatvara i dijalog u kom je polje
      onClose();
      return;
    }
    if (e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
      shiftMonth(e.key === "PageUp" ? -1 : 1);
      return;
    }
    const delta = moves[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    const next = clampedFocus + delta;
    if (next < 1) {
      shiftMonth(-1);
      setFocusDay(new Date(Date.UTC(view.y, view.m - 1, 0)).getUTCDate() + next);
    } else if (next > daysInMonth) {
      shiftMonth(1);
      setFocusDay(next - daysInMonth);
    } else setFocusDay(next);
  };

  return createPortal(
    <div
      ref={popRef}
      id={id}
      role="dialog"
      aria-label="Izbor datuma"
      onKeyDown={onGridKey}
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
      className="fixed z-[100000] w-[288px] rounded-xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="mb-2 flex items-center gap-1">
        <button type="button" onClick={() => shiftMonth(-1)} aria-label="Prethodni mesec" className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
          <LuChevronLeft className="h-4 w-4" />
        </button>
        <select aria-label="Mesec" value={view.m} onChange={(e) => setView((v) => ({ ...v, m: Number(e.target.value) }))} className={`${selectClass} flex-1`}>
          {MONTHS.map((name, i) => (
            <option key={name} value={i + 1}>{name}</option>
          ))}
        </select>
        <select aria-label="Godina" value={view.y} onChange={(e) => setView((v) => ({ ...v, y: Number(e.target.value) }))} className={selectClass}>
          {!years.includes(view.y) && <option value={view.y}>{view.y}</option>}
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button type="button" onClick={() => shiftMonth(1)} aria-label="Sledeći mesec" className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
          <LuChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div role="grid" aria-label={`${MONTHS[view.m - 1]} ${view.y}`} className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} role="columnheader" className="py-1 text-[11px] font-medium text-gray-400">{d}</span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />;
          const iso = toIsoDate(view.y, view.m, day);
          const selected = iso === value;
          const isToday = iso === today;
          const off = disabledDay(iso);
          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              data-day={day}
              tabIndex={day === clampedFocus ? 0 : -1}
              disabled={!!off}
              aria-selected={selected}
              aria-label={`${day}. ${MONTHS[view.m - 1]} ${view.y}.`}
              onClick={() => onPick(iso)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (!off) onPick(iso);
                }
              }}
              className={`h-9 rounded-md text-sm tabular-nums transition disabled:cursor-not-allowed disabled:opacity-30 ${
                selected
                  ? "bg-brand-600 font-semibold text-white"
                  : isToday
                    ? "font-semibold text-brand-700 ring-1 ring-inset ring-brand-300 hover:bg-brand-50 dark:text-brand-300"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 dark:border-gray-800">
        <button
          type="button"
          disabled={!!disabledDay(today)}
          onClick={() => onPick(today)}
          className="rounded-md px-2 py-1 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-40 dark:text-brand-300 dark:hover:bg-brand-500/10"
        >
          Danas
        </button>
        <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
          Zatvori
        </button>
      </div>
    </div>,
    document.body
  );
}
