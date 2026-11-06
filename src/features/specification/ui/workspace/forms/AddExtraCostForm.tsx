import { FormEvent, useId, useState } from "react";
import Field, { inputClass } from "@shared/ui/form/Field";
import Button from "@shared/ui/button/Button";
import { notify } from "@shared/lib/notify";
import { useAddExtraCost } from "@features/specification/hooks/useAddExtraCost";

interface Props {
  specId: string;
  patientId: string;
  /** Opis unapred popunjen (npr. iz učinka sestre); fokus ide na iznos */
  initialLabel?: string;
}

export default function AddExtraCostForm({ specId, patientId, initialLabel = "" }: Props) {
  const ids = { label: useId(), amount: useId() };
  const { mutate, isPending } = useAddExtraCost(specId, patientId);
  const [label, setLabel] = useState(initialLabel);
  const [amount, setAmount] = useState("");

  const value = Number(amount.replace(",", "."));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return notify.error("Unesite opis troška.");
    if (!(value > 0)) return notify.error("Unesite iznos veći od nule.");

    mutate(
      { label: label.trim(), amount: value },
      {
        onSuccess: () => {
          notify.success("Dodatni trošak je dodat.");
          setLabel("");
          setAmount("");
        },
        onError: (err) => notify.error(err),
      }
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Opis" htmlFor={ids.label} hint="Npr. frizer, prevoz, pedikir.">
        <input id={ids.label} value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Iznos (RSD)" htmlFor={ids.amount}>
        <input
          id={ids.amount}
          autoFocus={!!initialLabel}
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          className={inputClass}
        />
      </Field>
      <Button type="submit" className="w-full" loading={isPending}>
        Dodaj trošak
      </Button>
    </form>
  );
}
