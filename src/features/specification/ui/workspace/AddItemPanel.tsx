import { ReactNode, useEffect, useState } from "react";
import { LuBriefcaseMedical, LuFlaskConical, LuHeartHandshake, LuPackage, LuPill, LuReceipt } from "react-icons/lu";
import ConsumeItemForm from "./forms/ConsumeItemForm";
import AddCombinationForm from "./forms/AddCombinationForm";
import AddExtraCostForm from "./forms/AddExtraCostForm";
import AddProfessionalServiceForm from "./forms/AddProfessionalServiceForm";
import CareTaskPicker from "@features/nurse-entries/ui/CareTaskPicker";

export type Kind = "medicine" | "article" | "professional" | "combination" | "care" | "extra";

/** Spolja zadat izbor (npr. "Dodaj kao trošak" iz učinka sestre); nonce ponavlja isti izbor */
export interface AddPreset {
  kind: Kind;
  label?: string;
  nonce: number;
}

const KINDS: Array<{ value: Kind; label: string; hint: string; icon: ReactNode; tone: string }> = [
  { value: "medicine", label: "Lek", hint: "Tablete, kapi, ampule", icon: <LuPill />, tone: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400" },
  { value: "article", label: "Artikal", hint: "Pelene, rukavice, materijal", icon: <LuPackage />, tone: "bg-orange-100 text-orange-500 dark:bg-orange-500/15 dark:text-orange-300" },
  { value: "professional", label: "Stručne usluge", hint: "Iz cenovnika, sa cenom", icon: <LuBriefcaseMedical />, tone: "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400" },
  { value: "combination", label: "Analize", hint: "Laboratorija", icon: <LuFlaskConical />, tone: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300" },
  { value: "care", label: "Nega", hint: "Kupanje, previjanje, presvlačenje", icon: <LuHeartHandshake />, tone: "bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300" },
  { value: "extra", label: "Drugi trošak", hint: "Frizer, prevoz, pedikir", icon: <LuReceipt />, tone: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400" },
];

// Izbor vrste stavke: kompaktna dugmad u jednom-dva reda, da forma za dodavanje
// stane na ekran pored liste dodatog (bez skrolovanja gore-dole).
export default function AddItemPanel({ specId, patientId, preset }: { specId: string; patientId: string; preset?: AddPreset | null }) {
  const [kind, setKind] = useState<Kind>("medicine");
  useEffect(() => {
    if (preset) setKind(preset.kind);
  }, [preset]);

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Šta dodajete" className="grid grid-cols-3 gap-1.5">
        {KINDS.map((k) => {
          const active = kind === k.value;
          return (
            <button
              key={k.value}
              type="button"
              aria-pressed={active}
              title={k.hint}
              onClick={() => setKind(k.value)}
              className={`flex min-w-0 items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition focus:outline-hidden focus-visible:ring-3 focus-visible:ring-brand-500/30 ${
                active
                  ? "border-brand-400 bg-brand-50 ring-1 ring-brand-400 dark:border-brand-500/60 dark:bg-brand-500/10 dark:ring-brand-500/60"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
              }`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-base ${active ? "bg-brand-500 text-white" : k.tone}`}>{k.icon}</span>
              <span className="min-w-0 text-sm font-semibold leading-tight text-gray-900 dark:text-white/90">{k.label}</span>
            </button>
          );
        })}
      </div>

      {kind === "medicine" && <ConsumeItemForm key="medicine" kind="medicine" patientId={patientId} specificationId={specId} />}
      {kind === "article" && <ConsumeItemForm key="article" kind="article" patientId={patientId} specificationId={specId} />}
      {kind === "professional" && <AddProfessionalServiceForm patientId={patientId} specificationId={specId} />}
      {kind === "combination" && <AddCombinationForm patientId={patientId} specificationId={specId} />}
      {kind === "care" && <CareTaskPicker key="care" patientId={patientId} specificationId={specId} />}
      {kind === "extra" && (
        <AddExtraCostForm key={preset?.kind === "extra" ? preset.nonce : "extra"} specId={specId} patientId={patientId} initialLabel={preset?.kind === "extra" ? preset.label : undefined} />
      )}
    </div>
  );
}
