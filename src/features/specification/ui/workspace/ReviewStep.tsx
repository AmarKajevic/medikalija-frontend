import { ReactNode } from "react";
import { LuCircleAlert } from "react-icons/lu";
import Button from "@shared/ui/button/Button";
import { formatDay } from "@shared/lib/calendarDay";
import { formatEUR, formatRSD } from "@shared/lib/format";
import { CATEGORY_META, CATEGORY_ORDER, categoryOf } from "@features/specification/lib/items";
import type { BillingState } from "@features/specification/hooks/useBillingState";
import { Specification } from "@features/specification/types/types";
import type { Step } from "./SpecificationWorkspace";

interface Props {
  specification: Specification;
  billing: BillingState;
  nextPeriodLabel: string;
  onEditStep: (step: Step) => void;
  /** Unosi sestara koji još nisu pregledani (neće biti u PDF-u) */
  pendingCount?: number;
}

function Warning({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning-200 bg-warning-50 p-3 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300">
      <p className="flex gap-2">
        <LuCircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        {children}
      </p>
      {action}
    </div>
  );
}

const Row = ({ label, value, sub, onEdit }: { label: string; value: string; sub?: string; onEdit?: () => void }) => (
  <div className="flex items-baseline justify-between gap-4 py-2.5">
    <dt className="text-sm text-gray-600 dark:text-gray-400">
      {label}
      {onEdit && (
        <button type="button" onClick={onEdit} className="ml-2 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
          izmeni
        </button>
      )}
    </dt>
    <dd className="text-right tabular-nums">
      <span className="text-sm font-medium text-gray-900 dark:text-white/90">{value}</span>
      {sub && <span className="block text-xs text-gray-400">{sub}</span>}
    </dd>
  </div>
);

// Poslednji korak: sve što ide na papir, sa upozorenjima pre štampe.
export default function ReviewStep({ specification: spec, billing, nextPeriodLabel, onEditStep, pendingCount = 0 }: Props) {
  const { result, rates, dirty, saving, saveBilling } = billing;
  const ratesMissing = !(rates.lower > 0 && rates.middle > 0);

  const groups = CATEGORY_ORDER.map((key) => {
    const items = spec.items.filter((i) => categoryOf(i) === key);
    return {
      key,
      label: key === "other" ? "Ostalo" : CATEGORY_META[key].label,
      count: items.length,
      total: items.reduce((s, i) => s + (Number(i.price) || 0), 0),
    };
  }).filter((g) => g.count > 0);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {pendingCount > 0 && (
        <Warning
          action={
            <Button size="sm" variant="outline" onClick={() => onEditStep(1)}>
              Pregledaj
            </Button>
          }
        >
          {pendingCount === 1 ? "1 unos sestre još čeka" : `${pendingCount} unosa sestara još čeka`} odobrenje i nije u specifikaciji.
        </Warning>
      )}
      {dirty && (
        <Warning
          action={
            <Button size="sm" loading={saving} onClick={() => void saveBilling()}>
              Sačuvaj obračun
            </Button>
          }
        >
          Dug ili smeštaj su izmenjeni, ali nisu sačuvani.
        </Warning>
      )}
      {ratesMissing && (
        <Warning
          action={
            <Button size="sm" variant="outline" onClick={() => onEditStep(2)}>
              Unesi kurs
            </Button>
          }
        >
          Kurs evra nije unet, pa iznosi u evrima nisu tačni.
        </Warning>
      )}
      {spec.items.length === 0 && (
        <Warning
          action={
            <Button size="sm" variant="outline" onClick={() => onEditStep(1)}>
              Dodaj stavke
            </Button>
          }
        >
          U specifikaciji još nema stavki.
        </Warning>
      )}

      <section className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-5 py-6 text-center dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ukupno za uplatu · period {formatDay(spec.startDate)} – {formatDay(spec.endDate)}
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-gray-900 dark:text-white">{formatRSD(result.totalRSD)}</p>
          <p className="mt-0.5 text-lg font-medium tabular-nums text-gray-500 dark:text-gray-400">{formatEUR(result.totalEUR)}</p>
        </div>

        <dl className="divide-y divide-gray-100 px-5 pb-2 dark:divide-gray-800">
          {groups.map((g) => (
            <Row key={g.key} label={`${g.label} (${g.count})`} value={formatRSD(g.total)} onEdit={() => onEditStep(1)} />
          ))}
          {groups.length > 1 && <Row label="Specifikacija ukupno" value={formatRSD(result.specTotalRSD)} sub={formatEUR(result.specEUR)} />}
          <Row label="Dug iz prethodnog perioda" value={formatEUR(result.debtEUR)} sub={formatRSD(result.debtRSD)} onEdit={() => onEditStep(2)} />
          <Row
            label={`Smeštaj ${nextPeriodLabel}`}
            value={formatEUR(result.lodgingEUR)}
            sub={formatRSD(result.lodgingRSD)}
            onEdit={() => onEditStep(2)}
          />
        </dl>

      </section>
    </div>
  );
}
