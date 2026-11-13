import { useId, useState } from "react";
import { LuActivity, LuPlus } from "react-icons/lu";
import { Input } from "@shared/ui/form/controls";
import Field from "@shared/ui/form/Field";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { notify } from "@shared/lib/notify";
import { formatRSD } from "@shared/lib/format";
import { physioName, useChargePhysio, usePhysioPrices } from "@features/physio/model";

// Vanredna fizikalna terapija: vrsta iz cenovnika fizioterapije (pravi ga admin), broj puta, dodavanje u specifikaciju.
// Na štampi ide u posebnu tabelu "Vanredna fizikalna terapija", iznad specifikacije troškova.
export default function AddPhysioForm({ patientId, specificationId }: { patientId: string; specificationId?: string }) {
  const timesId = useId();
  const { data: prices = [], isLoading } = usePhysioPrices();
  const charge = useChargePhysio(patientId);
  const [times, setTimes] = useState("1");
  const amount = Number(times.replace(",", "."));
  const validAmount = amount > 0 && amount <= 1000;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }
  if (prices.length === 0) {
    return <EmptyState compact icon={<LuActivity />} title="Nema cenovnika fizioterapije" description="Cene unosi admin u meniju Cene fizioterapije." />;
  }

  return (
    <div className="space-y-3">
      <Field label="Broj puta" htmlFor={timesId} error={validAmount ? undefined : "Unesite broj veći od nule"}>
        <Input id={timesId} inputMode="decimal" value={times} onChange={(e) => setTimes(e.target.value)} className="max-w-[120px]" />
      </Field>
      <ul className="space-y-2">
        {prices.map((p) => {
          const label = physioName(p);
          const noPrice = p.priceRSD == null;
          const adding = charge.isPending && charge.variables?.kind === p.kind;
          return (
            <li key={p.kind} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{label}</p>
                <p className={`mt-0.5 text-xs font-medium ${noPrice ? "text-warning-600 dark:text-warning-400" : "text-gray-600 dark:text-gray-400"}`}>
                  {noPrice ? "Cena nije uneta" : formatRSD(p.priceRSD!)}
                </p>
              </div>
              <button
                type="button"
                disabled={charge.isPending || noPrice}
                onClick={() => {
                  if (!validAmount) return notify.error("Broj puta mora biti veći od nule.");
                  charge.mutate(
                    { kind: p.kind, amount, specificationId },
                    { onSuccess: () => notify.success(`${label}: dodato u specifikaciju.`), onError: (err) => notify.error(err) }
                  );
                }}
                aria-label={`Dodaj ${label}`}
                className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-brand-50 px-2.5 text-xs font-medium text-brand-600 transition hover:bg-brand-100 disabled:opacity-50 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25"
              >
                <LuPlus className="h-3.5 w-3.5" />
                {adding ? "..." : "Dodaj"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
