import { useState } from "react";
import { LuReceipt, LuTrash2 } from "react-icons/lu";
import { CATEGORY_META, CATEGORY_ORDER, categoryOf } from "@features/specification/lib/items";
import { Specification, SpecificationItem } from "@features/specification/types/types";
import { useDeleteSpecificationItem } from "@features/specification/hooks/useDeleteSpecificationItem";
import { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import { formatQty, formatRSD } from "@shared/lib/format";

const deleteHint = (item: SpecificationItem) => {
  const tracked = (item.entries?.length ?? 0) > 0;
  if (item.category === "extra") return "Trošak će biti uklonjen iz specifikacije.";
  if (!tracked) return "Ovo je starija stavka: uklanja se samo trošak, stanje na lageru se NE vraća automatski.";
  if (item.category === "combination") return "Trošak i zapis o urađenim analizama biće uklonjeni.";
  return "Trošak će biti uklonjen, a količina vraćena na stanje (doma i porodično).";
};

interface Props {
  specification: Specification;
  patientId: string;
}

export default function SpecificationItems({ specification: spec, patientId }: Props) {
  const remove = useDeleteSpecificationItem(patientId);
  const [pending, setPending] = useState<SpecificationItem | null>(null);

  const groups = CATEGORY_ORDER.map((key) => {
    const items = spec.items.filter((i) => categoryOf(i) === key);
    return { key, items, subtotal: items.reduce((s, i) => s + (Number(i.price) || 0), 0) };
  }).filter((g) => g.items.length > 0);

  const confirmDelete = () => {
    if (!pending) return;
    remove.mutate(
      { specId: spec._id, itemId: pending._id },
      {
        onSuccess: (res) => {
          (res.fullyReverted ? notify.success : notify.info)(res.message);
          setPending(null);
        },
        onError: (err) => notify.error(err),
      }
    );
  };

  if (spec.items.length === 0) {
    return (
      <EmptyState
        icon={<LuReceipt />}
        title="Specifikacija je prazna"
        description="Dodajte lekove, artikle, analize ili dodatne troškove iz panela sa leve strane."
      />
    );
  }

  return (
    <>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {groups.map((g) => {
          const meta = g.key === "other" ? { label: "Ostalo", icon: <LuReceipt /> } : CATEGORY_META[g.key];
          return (
            <section key={g.key} className="py-3 first:pt-0">
              <header className="mb-1 flex items-center justify-between px-1">
                <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <span className="text-sm">{meta.icon}</span>
                  {meta.label}
                  <span className="font-normal normal-case tracking-normal text-gray-400">({g.items.length})</span>
                </h4>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{formatRSD(g.subtotal)}</span>
              </header>

              <ul>
                {g.items.map((item) => (
                  <li
                    key={item._id}
                    className="group flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gray-800 dark:text-white/90">{item.name}</p>
                      {item.category === "combination" && item.analyses?.length ? (
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {item.analyses.map((a) => a.name).join(", ")}
                        </p>
                      ) : null}
                    </div>
                    <span className="w-16 shrink-0 text-right text-sm tabular-nums text-gray-500 dark:text-gray-400">
                      × {formatQty(item.amount ?? 1)}
                    </span>
                    <span className="w-32 shrink-0 text-right text-sm font-medium tabular-nums text-gray-800 dark:text-white/90">
                      {formatRSD(item.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPending(item)}
                      aria-label={`Ukloni ${item.name}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-error-50 hover:text-error-600 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-error-500/10"
                    >
                      <LuTrash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ukupno za period</span>
        <span className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">{formatRSD(spec.totalPrice)}</span>
      </div>

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        title={`Ukloniti „${pending?.name}“?`}
        description={pending && deleteHint(pending)}
        confirmText="Ukloni stavku"
      />
    </>
  );
}
