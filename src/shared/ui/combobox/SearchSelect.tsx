import { KeyboardEvent, ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { LuCheck, LuChevronsUpDown, LuSearch, LuX } from "react-icons/lu";
import { inputClass } from "@shared/ui/form/Field";
import { matchesSearch, searchRank } from "@shared/lib/search";
import { transliterate } from "@shared/lib/script";
import { useScript } from "@shared/lib/scriptContext";

export interface SearchOption {
  value: string;
  label: string;
  /** Drugi red (npr. soba, datum rođenja) — pretražuje se i on */
  description?: string;
  /** Ikonica/avatar levo */
  icon?: ReactNode;
}

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchOption[];
  placeholder?: string;
  /** Tekst za praznu vrednost; ako postoji, izbor može da se obriše */
  emptyLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  "aria-label"?: string;
}

const MAX_SHOWN = 100;

// Izbor sa pretragom (pacijent, korisnik...): kuca se deo imena, bilo kojim pismom.
export default function SearchSelect({ id, value, onChange, options, placeholder = "Pretraži...", emptyLabel, disabled, loading, ...rest }: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const selected = options.find((o) => o.value === value);
  // Izabrana stavka se u polju prikazuje u izabranom pismu (vrednost polja se ne preslovljava sama)
  const { script } = useScript();
  const selectedLabel = selected ? transliterate(selected.label, script) : "";

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return options.slice(0, MAX_SHOWN);
    // Svaka reč upita je početak neke reči ("mil jov" nalazi "Jovanović Milica"; "an" ne nalazi "Jovanović")
    return options
      .map((o) => ({ o, text: `${o.label} ${o.description ?? ""}` }))
      .filter(({ text }) => matchesSearch(text, q))
      .sort((a, b) => searchRank(a.o.label, q) - searchRank(b.o.label, q))
      .map(({ o }) => o)
      .slice(0, MAX_SHOWN);
  }, [options, query]);

  useEffect(() => setActive(0), [query, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && close();
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView?.({ block: "nearest" });
  }, [active]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const choose = (v: string) => {
    onChange(v);
    close();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      if (filtered[active]) choose(filtered[active]!.value);
    } else if (e.key === "Escape" && open) {
      // Zatvara samo listu, ne i dijalog oko polja
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") close();
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-gray-400">
          {selected?.icon && !open ? selected.icon : <LuSearch className="h-4 w-4" />}
        </span>
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          disabled={disabled}
          value={open ? query : selectedLabel}
          placeholder={loading ? "Učitavanje..." : open && selected ? selectedLabel : (emptyLabel ?? placeholder)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={`${inputClass} pl-9 ${selected && emptyLabel ? "pr-16" : "pr-9"}`}
          {...rest}
        />
        {selected && emptyLabel && !disabled && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            aria-label="Obriši izbor"
            className="absolute right-8 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10"
          >
            <LuX className="h-3.5 w-3.5" />
          </button>
        )}
        <LuChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {open && !disabled && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute z-[100001] mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-gray-500">Nema rezultata za „{query}”.</li>
          ) : (
            filtered.map((o, i) => (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={o.value === value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o.value)}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm ${i === active ? "bg-gray-100 dark:bg-white/[0.06]" : ""}`}
              >
                {o.icon}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-gray-900 dark:text-white/90">{o.label}</span>
                  {o.description && <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{o.description}</span>}
                </span>
                {o.value === value && <LuCheck className="h-4 w-4 shrink-0 text-brand-600" />}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
