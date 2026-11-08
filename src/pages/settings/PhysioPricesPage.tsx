import { FormEvent, useEffect, useState } from "react";
import { LuActivity, LuCheck } from "react-icons/lu";
import PageHeader from "@shared/ui/page/PageHeader";
import { Card } from "@shared/ui/card/Card";
import { Input } from "@shared/ui/form/controls";
import Button from "@shared/ui/button/Button";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import { formatRSD } from "@shared/lib/format";
import { PHYSIO_KIND_LABEL, type PhysioKind } from "@features/nurse-entries/model";
import { PhysioPrice, usePhysioPrices, useSavePhysioPrice } from "@features/physio/model";

const toNumber = (v: string) => Number(v.replace(",", "."));

// Cene vanredne fizikalne terapije. Admin ih unosi unapred; kad uprava odobri
// vanrednu terapiju, cena se uzima odavde (ne unosi se pri odobravanju).
export default function PhysioPricesPage() {
  const { data = [], isLoading, isError, refetch } = usePhysioPrices();
  return (
    <>
      <PageHeader
        title="Cene fizioterapije"
        description="Cena vanredne fizikalne terapije za svaku vrstu. Redovna terapija se ne naplaćuje. Pri odobravanju vanredne terapije cena se uzima odavde."
      />
      {isError ? (
        <ErrorState message="Cene nisu učitane." onRetry={() => refetch()} />
      ) : (
        <Card>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading
              ? [0, 1, 2].map((i) => (
                  <li key={i} className="p-5">
                    <Skeleton className="h-10" />
                  </li>
                ))
              : data.map((p, i) => <PriceRow key={p.kind} price={p} index={i + 1} />)}
          </ul>
        </Card>
      )}
    </>
  );
}

function PriceRow({ price, index }: { price: PhysioPrice; index: number }) {
  const save = useSavePhysioPrice();
  const [value, setValue] = useState("");
  useEffect(() => setValue(price.priceRSD != null ? String(price.priceRSD).replace(".", ",") : ""), [price.priceRSD]);
  const id = `physio-price-${price.kind}`;
  const label = PHYSIO_KIND_LABEL[price.kind as PhysioKind];
  const n = toNumber(value);
  const invalid = !value.trim() || !(n >= 0);
  const unchanged = price.priceRSD != null && n === price.priceRSD;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (invalid) return notify.error("Unesite cenu (0 ili više).");
    save.mutate({ kind: price.kind, priceRSD: n }, { onSuccess: () => notify.success(`${label}: ${formatRSD(n)}`), onError: (err) => notify.error(err) });
  };

  return (
    <li>
      <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-3 p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <LuActivity className="h-4 w-4" />
        </span>
        <label htmlFor={id} className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-gray-900 dark:text-white/90">
            {index}. {label}
          </span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">
            {price.priceRSD != null ? `Trenutno: ${formatRSD(price.priceRSD)} (vanredna)` : "Cena još nije uneta — vanredna terapija ne može da se odobri."}
          </span>
        </label>
        <div className="w-40">
          <Input id={id} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0,00" trailing="RSD" />
        </div>
        <Button type="submit" size="sm" variant={unchanged ? "outline" : "primary"} loading={save.isPending} disabled={invalid || unchanged} startIcon={<LuCheck className="h-4 w-4" />}>
          Sačuvaj
        </Button>
      </form>
    </li>
  );
}
