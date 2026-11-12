import { FormEvent, useId, useState } from "react";
import { LuPlus, LuReceipt, LuSearch } from "react-icons/lu";
import Field, { inputClass } from "@shared/ui/form/Field";
import { Input } from "@shared/ui/form/controls";
import Button from "@shared/ui/button/Button";
import Tabs from "@shared/ui/tabs/Tabs";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { notify } from "@shared/lib/notify";
import { formatRSD } from "@shared/lib/format";
import { matchesSearch } from "@shared/lib/search";
import { useAddExtraCost } from "@features/specification/hooks/useAddExtraCost";
import { useExtraCosts, type ExtraCost } from "@features/extra-costs/model";

interface Props {
  specId: string;
  patientId: string;
  /** Opis unapred popunjen (npr. iz učinka sestre); fokus ide na iznos */
  initialLabel?: string;
}

type Mode = "list" | "manual";

// Drugi trošak: iz cenovnika (pravi ga admin u meniju Drugi troškovi) ili ručno unet opis i iznos.
export default function AddExtraCostForm({ specId, patientId, initialLabel = "" }: Props) {
  const costs = useExtraCosts();
  const hasList = (costs.data?.length ?? 0) > 0;
  // Bez cenovnika (ili sa opisom iz beleške) odmah ručni unos
  const [chosen, setChosen] = useState<Mode | null>(initialLabel ? "manual" : null);
  const mode: Mode = chosen ?? (hasList ? "list" : "manual");

  return (
    <div className="space-y-4">
      <Tabs
        variant="pills"
        value={mode}
        onChange={setChosen}
        items={[
          { value: "list", label: "Iz cenovnika" },
          { value: "manual", label: "Unesi ručno" },
        ]}
      />
      {mode === "list" ? (
        <CatalogPicker specId={specId} patientId={patientId} costs={costs.data ?? []} loading={costs.isLoading} onManual={() => setChosen("manual")} />
      ) : (
        <ManualCostForm specId={specId} patientId={patientId} initialLabel={initialLabel} />
      )}
    </div>
  );
}

function CatalogPicker({ specId, patientId, costs, loading, onManual }: { specId: string; patientId: string; costs: ExtraCost[]; loading: boolean; onManual: () => void }) {
  const ids = { search: useId(), times: useId() };
  const { mutate, isPending, variables } = useAddExtraCost(specId, patientId);
  const [query, setQuery] = useState("");
  const [times, setTimes] = useState("1");
  const count = Number(times.replace(",", "."));
  const validCount = count > 0 && count <= 1000;
  const list = costs.filter((c) => !query.trim() || matchesSearch(c.name, query.trim()));

  const add = (cost: ExtraCost) => {
    if (!validCount) return notify.error("Broj puta mora biti veći od nule.");
    const amount = Math.round(cost.priceRSD * count * 100) / 100;
    if (!(amount > 0)) return notify.error("Trošak nema cenu — unesite ga ručno.");
    const label = count === 1 ? cost.name : `${cost.name} × ${String(count).replace(".", ",")}`;
    mutate(
      { label, amount },
      {
        onSuccess: () => notify.success(`${cost.name}: dodato u specifikaciju.`),
        onError: (err) => notify.error(err),
      }
    );
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }
  if (costs.length === 0) {
    return (
      <EmptyState
        compact
        icon={<LuReceipt />}
        title="Cenovnik drugih troškova je prazan"
        description="Cenovnik pravi admin u meniju Drugi troškovi. Trošak možete uneti i ručno."
        action={
          <Button variant="outline" size="sm" onClick={onManual}>
            Unesi ručno
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_96px] gap-2">
        <Field label="Trošak" htmlFor={ids.search}>
          <Input id={ids.search} leading={<LuSearch className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pretraži troškove..." />
        </Field>
        <Field label="Puta" htmlFor={ids.times} error={validCount ? undefined : "> 0"}>
          <Input id={ids.times} inputMode="decimal" value={times} onChange={(e) => setTimes(e.target.value)} />
        </Field>
      </div>
      {list.length === 0 ? (
        <EmptyState compact title="Nema rezultata" />
      ) : (
        <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {list.map((c) => {
            const adding = isPending && variables?.label.startsWith(c.name);
            return (
              <li key={c._id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">{c.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">{formatRSD(c.priceRSD)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => add(c)}
                  disabled={isPending}
                  aria-label={`Dodaj ${c.name}`}
                  className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-brand-50 px-2.5 text-xs font-medium text-brand-600 transition hover:bg-brand-100 disabled:opacity-50 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25"
                >
                  <LuPlus className="h-3.5 w-3.5" />
                  {adding ? "..." : "Dodaj"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ManualCostForm({ specId, patientId, initialLabel }: { specId: string; patientId: string; initialLabel: string }) {
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
