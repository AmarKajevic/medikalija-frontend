// shared/ui/SearchableSelect/SearchableSelect.tsx
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import type { SearchableSelectProps, Option } from "@shared/ui/SearchableSelect/types";

export const SearchableSelect = <T extends Option>({
  value,
  onChange,
  options,
  placeholder = "Izaberi...",
  renderOption,
  className = "",
  optionClassName = "",
  emptyMessage = "Nema rezultata",
  allowFreeText = false, // novi prop
}: SearchableSelectProps<T> & { allowFreeText?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOptionRef = useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const selected = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filtered = useMemo(
    () =>
      options.filter((opt) =>
        opt.label.toLowerCase().startsWith(search.toLowerCase())
      ),
    [options, search]
  );

  // Sinhronizacija search polja sa value i selected
  useEffect(() => {
    if (selected) {
      setSearch(selected.label);
    } else if (allowFreeText && value) {
      // Ako je free text i imamo vrednost koja nije u opcijama, prikaži je
      setSearch(value);
    } else {
      setSearch("");
    }
  }, [selected, value, allowFreeText]);

  // Zatvaranje na klik van
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlight na promenu filtera ili otvaranje
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filtered, open]);

  // Scroll do highlightovane opcije
  useEffect(() => {
    if (highlightedIndex >= 0 && selectedOptionRef.current) {
      selectedOptionRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // --- Handleri ---
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setOpen(true);
  }, []);

  const handleFocus = useCallback(() => setOpen(true), []);

  const handleOptionClick = useCallback(
    (opt: T) => {
      onChange(opt.value);
      setOpen(false);
      setSearch(opt.label);
    },
    [onChange]
  );

  // Funkcija za "potvrdu" slobodnog unosa (free text)
  const commitFreeText = useCallback(() => {
    if (allowFreeText && search.trim() !== "") {
      // Proveri da li postoji tačan match (case-insensitive)
      const exactMatch = options.find(
        (opt) => opt.label.toLowerCase() === search.trim().toLowerCase()
      );
      if (exactMatch) {
        // Ako postoji, ponašaj se kao da je selektovan
        onChange(exactMatch.value);
        setOpen(false);
        setSearch(exactMatch.label);
      } else {
        // Inače prosledi tekst kao vrednost (free text)
        onChange(search.trim());
        setOpen(false);
      }
    }
  }, [allowFreeText, search, options, onChange]);

  // Keyboard navigacija
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          setOpen(true);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          setHighlightedIndex((prev) =>
            prev < filtered.length - 1 ? prev + 1 : prev
          );
          e.preventDefault();
          break;
        case "ArrowUp":
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          e.preventDefault();
          break;
        case "Enter":
          if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
            // Ako je highlightovana opcija, biramo nju
            handleOptionClick(filtered[highlightedIndex]);
          } else if (allowFreeText) {
            // Ako nema highlight-a, a dozvoljen je free text, potvrdi unos
            commitFreeText();
          }
          e.preventDefault();
          break;
        case "Escape":
          setOpen(false);
          e.preventDefault();
          break;
      }
    },
    [open, filtered, highlightedIndex, handleOptionClick, allowFreeText, commitFreeText]
  );

  // Blur – potvrdi free text ako je dozvoljen i nije selektovana opcija
  const handleBlur = useCallback(() => {
    if (allowFreeText && !selected) {
      commitFreeText();
    }
    // Ne zatvaramo odmah jer bi blur mogao da se desi pre klika na opciju – ali pošto koristimo mousedown prevenciju, možemo
    // Zatvaramo nakon kratkog odlaganja da bi klik na opciju stigao
    setTimeout(() => setOpen(false), 150);
  }, [allowFreeText, selected, commitFreeText]);

  const defaultRenderOption = useCallback(
    (opt: T) => <div className="font-medium">{opt.label}</div>,
    []
  );

  const renderOptionFn = renderOption || defaultRenderOption;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          value={open ? search : (selected?.label ?? (allowFreeText && value ? value : ""))}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-9 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
        />
        <svg
          className={`pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              {allowFreeText ? "Unesi novi naziv" : emptyMessage}
            </div>
          )}

          {filtered.map((opt, idx) => (
            <div
              key={opt.value}
              ref={idx === highlightedIndex ? selectedOptionRef : null}
              onMouseDown={(e) => e.preventDefault()} // spreči blur pre klika
              onClick={() => handleOptionClick(opt)}
              className={`cursor-pointer px-3 py-2 text-sm text-gray-700 dark:text-gray-300 ${
                idx === highlightedIndex
                  ? "bg-brand-50 dark:bg-brand-500/10"
                  : "hover:bg-gray-50 dark:hover:bg-white/5"
              } ${optionClassName}`}
            >
              {renderOptionFn(opt)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};