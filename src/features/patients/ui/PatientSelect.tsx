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
      <input
        value={open ? search : selected?.label || ""}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        className="w-full px-2 py-2 border rounded-md"
      />

      {open && (
        <div className="absolute top-full left-0 right-0 bg-white border rounded-md z-10 max-h-60 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-2 py-2 text-gray-400">
              Nema rezultata
            </div>
          )}

          {filtered.map((option) => (
            <div
              key={option.value}
              className="px-2 py-2 hover:bg-gray-100 cursor-pointer"
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