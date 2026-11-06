import { useState } from "react";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import type { Scope } from "@features/calendar/model";

interface Props {
  open: boolean;
  action: "save" | "delete" | "move";
  onPick: (scope: Scope) => void;
  onClose: () => void;
  loading?: boolean;
}

const TITLES = { save: "Izmena događaja koji se ponavlja", delete: "Brisanje događaja koji se ponavlja", move: "Pomeranje događaja koji se ponavlja" };

// Za događaj koji se ponavlja: samo ovaj termin ili ceo niz (kao Google/Outlook).
export default function ScopeDialog({ open, action, onPick, onClose, loading }: Props) {
  const [scope, setScope] = useState<Scope>("occurrence");
  const verb = action === "delete" ? "Obriši" : action === "move" ? "Pomeri" : "Sačuvaj";
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title={TITLES[action]}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button size="sm" variant={action === "delete" ? "danger" : "primary"} loading={loading} onClick={() => onPick(scope)}>
            {verb}
          </Button>
        </>
      }
    >
      <fieldset className="space-y-2">
        <legend className="sr-only">Na šta se odnosi</legend>
        {(
          [
            ["occurrence", "Samo ovaj termin", "Ostali termini ostaju kakvi su."],
            ["series", "Svi termini", action === "delete" ? "Briše se ceo niz." : "Menjaju se svi termini u nizu."],
          ] as const
        ).map(([value, label, hint]) => (
          <label
            key={value}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
              scope === value ? "border-brand-400 bg-brand-50 dark:border-brand-500/50 dark:bg-brand-500/10" : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.03]"
            }`}
          >
            <input type="radio" name="scope" checked={scope === value} onChange={() => setScope(value)} className="mt-0.5 h-4 w-4 accent-brand-600" />
            <span>
              <span className="block text-sm font-medium text-gray-900 dark:text-white">{label}</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">{hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </Dialog>
  );
}
