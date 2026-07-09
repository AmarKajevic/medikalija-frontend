import { useState, useRef, useEffect, useMemo } from "react";

export type Option = {
  value: string;
  label: string;
  home: number;
  family: number;
};

type Props = {
  value?: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
};

export const SelectItemsForm = ({
  value,
  onChange,
  options,
  placeholder = "Izaberi...",
}: Props) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const ref = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const filtered = useMemo(
    () =>
      options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      ),
    [options, search]
  );

  useEffect(() => {
    if (selected) setSearch(selected.label);
  }, [selected]);


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
    <div ref={ref} className="relative">
      <input
        value={open ? search : selected?.label || ""}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full border px-3 py-2 rounded-md"
      />

      {open && (
        <div className="absolute z-50 w-full bg-white border rounded-md shadow max-h-60 overflow-auto mt-1">
          {filtered.length === 0 && (
            <div className="p-2 text-sm text-gray-500">
              Nema rezultata
            </div>
          )}

          {filtered.map((o) => (
            <div
              key={o.value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
                setSearch(o.label);
              }}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              <div className="font-medium">{o.label}</div>
              <div className="text-xs text-gray-500">
                🏥 {o.home} | 👪 {o.family}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};