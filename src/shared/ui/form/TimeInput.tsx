import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { inputClass } from "@shared/ui/form/Field";
import { durationLabel, parseTime, toMinutes } from "@shared/lib/timeText";

// Vreme u 24-časovnom obliku SS:MM, nezavisno od jezika sistema (ugrađeni
// <input type="time"> na engleskom Windows-u prikazuje AM/PM). Kuca se slobodno
// ("930", "9.30", "14") ili bira sa liste na 15 minuta.

const pad = (n: number) => String(n).padStart(2, "0");
interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Za polje "do": pored vremena prikazuje trajanje od ovog vremena */
  durationFrom?: string;
  disabled?: boolean;
  "aria-label"?: string;
  invalid?: boolean;
}

const STEP = 15;
const OPTIONS = Array.from({ length: (24 * 60) / STEP }, (_, i) => `${pad(Math.floor((i * STEP) / 60))}:${pad((i * STEP) % 60)}`);

export default function TimeInput({ id, value, onChange, durationFrom, disabled, invalid, ...rest }: Props) {
  const listId = useId();
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setText(value);
    setError(false);
  }, [value]);

  // Za "do": lista počinje od početnog vremena (kao u Google kalendaru)
  const options = useMemo(() => {
    if (!durationFrom) return OPTIONS;
    const from = toMinutes(durationFrom);
    return OPTIONS.filter((o) => toMinutes(o) > from);
  }, [durationFrom]);

  const nearest = () => {
    const target = toMinutes(parseTime(text) ?? value ?? "09:00");
    const idx = options.findIndex((o) => toMinutes(o) >= target);
    return idx < 0 ? options.length - 1 : idx;
  };

  useEffect(() => {
    if (!open) return;
    const idx = nearest();
    setActive(idx);
    // scrollIntoView nije u jsdom-u
    listRef.current?.querySelector<HTMLElement>(`[data-index="${idx}"]`)?.scrollIntoView?.({ block: "center" });
    const onDown = (e: MouseEvent) => !wrapRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const commit = (raw = text) => {
    const parsed = parseTime(raw);
    if (parsed) {
      setText(parsed);
      setError(false);
      if (parsed !== value) onChange(parsed);
    } else if (raw.trim()) setError(true);
    else setText(value);
  };

  const pick = (t: string) => {
    setText(t);
    setError(false);
    setOpen(false);
    if (t !== value) onChange(t);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      const next = Math.max(0, Math.min(options.length - 1, active + (e.key === "ArrowDown" ? 1 : -1)));
      setActive(next);
      listRef.current?.querySelector<HTMLElement>(`[data-index="${next}"]`)?.scrollIntoView?.({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Otkucano vreme ima prednost; inače se uzima istaknuto sa liste
      const typed = text !== value && parseTime(text);
      if (!typed && open && options[active]) pick(options[active]!);
      else {
        commit();
        setOpen(false);
      }
    } else if (e.key === "Escape" && open) {
      // Zatvara samo listu, ne i dijalog oko polja
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={error || invalid || undefined}
        aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
        inputMode="numeric"
        autoComplete="off"
        placeholder="SS:MM"
        disabled={disabled}
        value={text}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          setText(e.target.value.replace(/[^\d:.,]/g, "").slice(0, 5));
          setError(false);
        }}
        onBlur={() => commit()}
        onKeyDown={onKeyDown}
        className={`${inputClass} tabular-nums ${error || invalid ? "border-error-400 focus:border-error-400" : ""}`}
        {...rest}
      />
      {error && (
        <p role="alert" className="mt-1 text-xs text-error-600 dark:text-error-400">
          Vreme u obliku SS:MM, npr. 09:30
        </p>
      )}
      {open && !disabled && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Vreme"
          className="absolute left-0 z-[100001] mt-1 max-h-56 w-full min-w-[9rem] overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
        >
          {options.map((o, i) => (
            <li
              key={o}
              id={`${listId}-${i}`}
              data-index={i}
              role="option"
              aria-selected={o === value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(o)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer justify-between gap-3 px-3 py-1.5 text-sm tabular-nums ${
                i === active ? "bg-gray-100 dark:bg-white/[0.06]" : ""
              } ${o === value ? "font-semibold text-brand-700 dark:text-brand-300" : "text-gray-700 dark:text-gray-300"}`}
            >
              {o}
              {durationFrom && <span className="text-xs font-normal text-gray-400">{durationLabel(toMinutes(o) - toMinutes(durationFrom))}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
