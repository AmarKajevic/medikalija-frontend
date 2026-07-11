// shared/ui/SearchableSelect/SearchableSelect.tsx
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import type { SearchableSelectProps, Option } from "./types";

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
      <input
        value={open ? search : (selected?.label ?? (allowFreeText && value ? value : ""))}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full border px-3 py-2 rounded-md"
      />

      {open && (
        <div className="absolute z-50 w-full bg-white border rounded-md shadow max-h-60 overflow-auto mt-1">
          {filtered.length === 0 && (
            <div className="p-2 text-sm text-gray-500">
              {allowFreeText ? "Unesi novi naziv" : emptyMessage}
            </div>
          )}

          {filtered.map((opt, idx) => (
            <div
              key={opt.value}
              ref={idx === highlightedIndex ? selectedOptionRef : null}
              onMouseDown={(e) => e.preventDefault()} // spreči blur pre klika
              onClick={() => handleOptionClick(opt)}
              className={`p-2 hover:bg-gray-100 cursor-pointer ${
                idx === highlightedIndex ? "bg-gray-100" : ""
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