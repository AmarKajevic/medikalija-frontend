import { ReactNode, useEffect, useState } from "react";
import { LuFlaskConical, LuPackage, LuPill, LuReceipt } from "react-icons/lu";
import ConsumeItemForm from "./forms/ConsumeItemForm";
import AddCombinationForm from "./forms/AddCombinationForm";
import AddExtraCostForm from "./forms/AddExtraCostForm";

export type Kind = "medicine" | "article" | "combination" | "extra";

/** Spolja zadat izbor (npr. "Dodaj kao trošak" iz učinka sestre); nonce ponavlja isti izbor */
export interface AddPreset {
  kind: Kind;
  label?: string;
  nonce: number;
}

const KINDS: Array<{ value: Kind; label: string; hint: string; icon: ReactNode }> = [
  { value: "medicine", label: "Lek", hint: "Tablete, kapi, ampule", icon: <LuPill /> },
  { value: "article", label: "Artikal", hint: "Pelene, rukavice, materijal", icon: <LuPackage /> },
  { value: "combination", label: "Analize", hint: "Laboratorija", icon: <LuFlaskConical /> },
  { value: "extra", label: "Drugi trošak", hint: "Frizer, prevoz, pedikir", icon: <LuReceipt /> },
];

// Izbor vrste stavke kao velika dugmad sa objašnjenjem umesto sitnih tabova.
export default function AddItemPanel({ specId, patientId, preset }: { specId: string; patientId: string; preset?: AddPreset | null }) {
  const [kind, setKind] = useState<Kind>("medicine");
  useEffect(() => {
    if (preset) setKind(preset.kind);
  }, [preset]);

  return (
    <div className="space-y-5">
      <div role="group" aria-label="Šta dodajete" className="grid grid-cols-2 gap-2">
        {KINDS.map((k) => {
          const active = kind === k.value;
          return (
            <button
              key={k.value}
              type="button"
              aria-pressed={active}
              onClick={() => setKind(k.value)}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition focus:outline-hidden focus-visible:ring-3 focus-visible:ring-brand-500/30 ${
                active
                  ? "border-brand-400 bg-brand-50 ring-1 ring-brand-400 dark:border-brand-500/60 dark:bg-brand-500/10 dark:ring-brand-500/60"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${
                  active ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
                }`}
              >
                {k.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-900 dark:text-white/90">{k.label}</span>
                <span className="block text-xs leading-snug text-gray-500 dark:text-gray-400">{k.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      {kind === "medicine" && <ConsumeItemForm key="medicine" kind="medicine" patientId={patientId} />}
      {kind === "article" && <ConsumeItemForm key="article" kind="article" patientId={patientId} />}
      {kind === "combination" && <AddCombinationForm patientId={patientId} />}
      {kind === "extra" && (
        <AddExtraCostForm key={preset?.kind === "extra" ? preset.nonce : "extra"} specId={specId} patientId={patientId} initialLabel={preset?.kind === "extra" ? preset.label : undefined} />
      )}
    </div>
  );
}
