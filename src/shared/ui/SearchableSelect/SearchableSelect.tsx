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
}: SearchableSelectProps<T>) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOptionRef = useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Pronalazi selektovanu opciju
  const selected = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Filtrira opcije na osnovu search teksta
  const filtered = useMemo(
    () =>
      options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      ),
    [options, search]
  );

  // Kada se promeni selektovana vrednost, update-ujemo search polje
  useEffect(() => {
    if (selected) setSearch(selected.label);
    else setSearch("");
  }, [selected]);

  // Zatvaranje na klik van komponente
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlight kad se promeni filter ili otvori lista
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filtered, open]);

  // Scrolluje do highlightovane opcije
  useEffect(() => {
    if (highlightedIndex >= 0 && selectedOptionRef.current) {
      selectedOptionRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // --- Handleri sa useCallback ---
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
            handleOptionClick(filtered[highlightedIndex]);
          }
          e.preventDefault();
          break;
        case "Escape":
          setOpen(false);
          e.preventDefault();
          break;
      }
    },
    [open, filtered, highlightedIndex, handleOptionClick]
  );

  // Default render opcije (ako nije prosleđen custom render)
  const defaultRenderOption = useCallback(
    (opt: T) => <div className="font-medium">{opt.label}</div>,
    []
  );

  const renderOptionFn = renderOption || defaultRenderOption;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        value={open ? search : selected?.label || ""}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full border px-3 py-2 rounded-md"
      />

      {open && (
        <div className="absolute z-50 w-full bg-white border rounded-md shadow max-h-60 overflow-auto mt-1">
          {filtered.length === 0 && (
            <div className="p-2 text-sm text-gray-500">{emptyMessage}</div>
          )}

          {filtered.map((opt, idx) => (
            <div
              key={opt.value}
              ref={idx === highlightedIndex ? selectedOptionRef : null}
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