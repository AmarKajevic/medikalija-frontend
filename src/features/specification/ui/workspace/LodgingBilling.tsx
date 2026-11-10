import { LuBedDouble, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import Dialog from "@shared/ui/dialog/Dialog";
import { formatEUR, formatRSD } from "@shared/lib/format";
import type { BillingState } from "@features/specification/hooks/useBillingState";
import { billingRows } from "@features/specification/lib/billingRows";
import BillingPanel from "./BillingPanel";

// Dugme iznad kursa evra: otvara dijalog za smeštaj i dug (nekada drugi korak čarobnjaka)
export function LodgingButton({ billing, onOpen, readOnly }: { billing: BillingState; onOpen: () => void; readOnly?: boolean }) {
  const { fields, result, dirty } = billing;
  const total = result.lodgingEUR + result.earlyLodgingEUR + result.debtEUR;
  const any = fields.includeLodging || fields.includeEarly || fields.includeDebt;
  if (readOnly && !any) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm transition ${
        any
          ? "border-brand-300 bg-brand-50/60 text-brand-700 hover:bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300"
          : "border-dashed border-gray-300 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
      }`}
    >
      <span className="flex items-center gap-1.5 font-medium">
        {any ? <LuBedDouble className="h-4 w-4" /> : <LuPlus className="h-4 w-4" />}
        {any ? "Smeštaj i dug" : "Dodaj smeštaj"}
        {dirty && <span className="text-xs font-normal text-warning-600 dark:text-warning-400">· nesačuvano</span>}
      </span>
      {any && <span className="tabular-nums">{formatEUR(total)}</span>}
    </button>
  );
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  billing: BillingState;
  nextPeriodLabel: string;
  readOnly?: boolean;
}

export function LodgingDialog({ open, onClose, billing, nextPeriodLabel, readOnly }: DialogProps) {
  return (
    <Dialog open={open} onClose={onClose} size="xl" title="Smeštaj i dug" description="Uključeno se dodaje na vrh specifikacije. Ostalo se računa samo.">
      <BillingPanel billing={billing} nextPeriodLabel={nextPeriodLabel} readOnly={readOnly} onSaved={onClose} />
    </Dialog>
  );
}

// Na vrhu liste "Dodato u ovom periodu": smeštaj i dug, sa izmenom (dijalog) i uklanjanjem
export function LodgingRows({ billing, nextPeriodLabel, onEdit, readOnly }: { billing: BillingState; nextPeriodLabel: string; onEdit: () => void; readOnly?: boolean }) {
  const rows = billingRows(billing, nextPeriodLabel);
  if (rows.length === 0) return null;
  return (
    <section className="mb-3 border-b border-gray-100 pb-3 dark:border-gray-800">
      <header className="mb-1 flex items-center justify-between px-1">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          <LuBedDouble className="text-sm" />
          Smeštaj i dug
          <span className="font-normal normal-case tracking-normal text-gray-400">({rows.length})</span>
        </h4>
      </header>
      <ul>
        {rows.map((r) => (
          <li key={r.kind} className="group flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.03]">
            <div className="min-w-0 flex-1">
              <p className="truncate text-base text-gray-800 dark:text-white/90">{r.label}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{r.note}</p>
            </div>
            <span className="w-36 shrink-0 text-right tabular-nums">
              <span className="block text-base font-medium text-gray-800 dark:text-white/90">{formatEUR(r.eur)}</span>
              <span className="block text-xs text-gray-400">ili {formatRSD(r.rsd)}</span>
            </span>
            {!readOnly && (
              <>
                <button
                  type="button"
                  onClick={onEdit}
                  aria-label={`Izmeni ${r.label}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-white/5"
                >
                  <LuPencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={billing.saving}
                  onClick={() => void billing.saveBilling(r.kind)}
                  aria-label={`Ukloni ${r.label}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-error-50 hover:text-error-600 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-error-500/10"
                >
                  <LuTrash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
