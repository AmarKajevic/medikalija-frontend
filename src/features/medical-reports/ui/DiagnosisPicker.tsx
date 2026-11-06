import { useId, useState } from "react";
import { LuPlus, LuX } from "react-icons/lu";
import SearchSelect from "@shared/ui/combobox/SearchSelect";
import { Input } from "@shared/ui/form/controls";
import Button from "@shared/ui/button/Button";
import { notify } from "@shared/lib/notify";
import { COMMON_DIAGNOSES, Diagnosis, MKB_PATTERN } from "@features/medical-reports/model";

interface Props {
  value: Diagnosis[];
  onChange: (value: Diagnosis[]) => void;
  disabled?: boolean;
}

const OPTIONS = COMMON_DIAGNOSES.map((d) => ({ value: d.code, label: `${d.code} · ${d.name}` }));

// Dijagnoze sa MKB-10 šifrom: brz izbor iz čestih ili sopstveni unos.
export default function DiagnosisPicker({ value, onChange, disabled }: Props) {
  const ids = { pick: useId(), code: useId(), name: useId() };
  const [custom, setCustom] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const add = (d: Diagnosis) => {
    if (value.some((x) => (d.code && x.code === d.code) || x.name.toLowerCase() === d.name.toLowerCase())) return notify.info("Dijagnoza je već dodata.");
    onChange([...value, d]);
  };

  const addCustom = () => {
    const c = code.trim().toUpperCase();
    if (!name.trim()) return notify.error("Unesite naziv dijagnoze.");
    if (c && !MKB_PATTERN.test(c)) return notify.error("Šifra mora biti u MKB-10 obliku, npr. I10 ili N39.0.");
    add({ code: c, name: name.trim() });
    setCode("");
    setName("");
    setCustom(false);
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Izabrane dijagnoze">
          {value.map((d, i) => (
            <li key={`${d.code}-${d.name}`} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 py-1 pl-2.5 pr-1 text-sm dark:border-gray-700 dark:bg-white/[0.04]">
              {d.code && <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{d.code}</span>}
              <span className="text-gray-700 dark:text-gray-300">{d.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  aria-label={`Ukloni ${d.name}`}
                  className="ml-0.5 flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-white/10"
                >
                  <LuX className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!disabled && (
        <>
          <SearchSelect
            id={ids.pick}
            aria-label="Dodaj dijagnozu"
            value=""
            onChange={(c) => {
              const d = COMMON_DIAGNOSES.find((x) => x.code === c);
              if (d) add(d);
            }}
            options={OPTIONS}
            placeholder="Kucajte šifru ili naziv (npr. I10, hipertenzija)..."
          />
          {custom ? (
            <div className="grid gap-2 sm:grid-cols-[110px_1fr_auto]">
              <Input id={ids.code} aria-label="MKB-10 šifra" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Šifra" maxLength={10} />
              <Input
                id={ids.name}
                aria-label="Naziv dijagnoze"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  addCustom();
                }}
                placeholder="Naziv dijagnoze"
                maxLength={200}
              />
              <Button type="button" size="md" variant="outline" onClick={addCustom}>
                Dodaj
              </Button>
            </div>
          ) : (
            <button type="button" onClick={() => setCustom(true)} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
              <LuPlus className="h-3.5 w-3.5" /> Dijagnoza koje nema na listi
            </button>
          )}
        </>
      )}
    </div>
  );
}
