import { useEffect, useRef, useState } from "react";

type Option = {
  value: string;
  label: string;
};

type Props = {
  value?: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
};

const PatientSelect = ({ value, onChange, options, placeholder }: Props) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!open && selected) {
      setSearch(selected.label);
    }
  }, [selected, open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <input
          value={open ? search : selected?.label || ""}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
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
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              Nema rezultata
            </div>
          )}

          {filtered.map((option) => (
            <div
              key={option.value}
              className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              onClick={() => {
                onChange(option.value);
                setSearch(option.label);
                setOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientSelect;