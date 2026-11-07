import { useEffect, useId, useMemo, useRef, useState } from "react";
import { LuChevronsUpDown, LuSearch } from "react-icons/lu";
import { inputClass } from "@shared/ui/form/Field";
import { formatQty } from "@shared/lib/format";
import { matchesSearch, searchRank } from "@shared/lib/search";
import { transliterate } from "@shared/lib/script";
import { useScript } from "@shared/lib/scriptContext";

export type StockOption = {
  value: string;
  label: string;
  /** stanje doma */
  home: number;
  /** porodično stanje ovog pacijenta */
  family: number;
  price?: number;
};

interface StockComboboxProps {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  options: StockOption[];
  placeholder?: string;
  loading?: boolean;
}


export default function StockCombobox({
  id,
  value,
  onChange,
  options,
  placeholder = "Pretraži po nazivu...",
  loading = false,
}: StockComboboxProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);
  const { script } = useScript();
  const selectedLabel = selected ? transliterate(selected.label, script) : undefined;

  const filtered = useMemo(() => {
    const q = query.trim();
    const list = q ? options.filter((o) => matchesSearch(o.label, q)) : options;
    // Prvo ono što počinje upitom, pa ostalo; unutar toga po abecedi
    return [...list].sort((a, b) => searchRank(a.label, q) - searchRank(b.label, q) || a.label.localeCompare(b.label, "sr"));
  }, [options, query]);

  useEffect(() => setHighlight(0), [query, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    listRef.current?.children[highlight]?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  const choose = (opt: StockOption) => {
    onChange(opt.value);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      if (filtered[highlight]) choose(filtered[highlight]);
    } else if (e.key === "Escape" && open) {
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
          value={open ? query : selectedLabel ?? ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={loading ? "Učitavanje..." : selectedLabel ?? placeholder}
          className={`${inputClass} pl-9 pr-9`}
        />
        <LuChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {open && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
        >
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {loading ? "Učitavanje..." : "Nema rezultata"}
            </li>
          )}
          {filtered.map((o, i) => {
            const out = o.home <= 0 && o.family <= 0;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                  i === highlight ? "bg-gray-100 dark:bg-white/5" : ""
                } ${o.value === value ? "font-medium text-brand-600 dark:text-brand-400" : "text-gray-800 dark:text-white/90"}`}
              >
                <span className={`truncate ${out ? "opacity-50" : ""}`}>{o.label}</span>
                <span className="flex shrink-0 gap-1 text-xs">
                  {o.family > 0 && (
                    <span className="rounded-md bg-success-50 px-1.5 py-0.5 text-success-700 dark:bg-success-500/15 dark:text-success-400">
                      Porodica {formatQty(o.family)}
                    </span>
                  )}
                  <span
                    className={`rounded-md px-1.5 py-0.5 ${
                      o.home > 0
                        ? "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
                        : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
                    }`}
                  >
                    Dom {formatQty(o.home)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
