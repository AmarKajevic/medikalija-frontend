import { LuArrowRight, LuReceipt } from "react-icons/lu";
import Button from "@shared/ui/button/Button";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { addCalendarDays, formatDay, toCalendarDay } from "@shared/lib/calendarDay";
import { formatRSD } from "@shared/lib/format";
import { Specification } from "@features/specification/types/types";
import { CATEGORY_META, categoryOf } from "@features/specification/lib/items";
import { periodProgress } from "@features/specification/lib/period";

interface Props {
  specification: Specification | null | undefined;
  isLoading: boolean;
  onOpen: () => void;
}

export default function SpecificationSummaryCard({ specification: spec, isLoading, onOpen }: Props) {
  if (isLoading) {
    return <Skeleton className="h-56" />;
  }

  if (!spec) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <EmptyState
          icon={<LuReceipt />}
          title="Nema aktivne specifikacije"
          description="Pacijent je otpušten. Ranije specifikacije su u istoriji."
        />
      </div>
    );
  }

  const progress = periodProgress(spec);
  const byCategory = (Object.keys(CATEGORY_META) as Array<keyof typeof CATEGORY_META>)
    .map((key) => {
      const items = spec.items.filter((i) => categoryOf(i) === key);
      return { key, count: items.length, total: items.reduce((s, i) => s + (Number(i.price) || 0), 0) };
    })
    .filter((c) => c.count > 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tekući period</p>
          <p className="mt-0.5 text-base font-semibold text-gray-900 dark:text-white/90">
            {formatDay(spec.startDate)} – {formatDay(spec.endDate)}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">Iznos do sada</p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">{formatRSD(spec.totalPrice)}</p>
        </div>
      </div>

      <div className="px-5">
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${(progress.elapsed / progress.total) * 100}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          Dan {progress.elapsed} od {progress.total}
          {progress.remaining > 0
            ? ` · još ${progress.remaining} ${progress.remaining === 1 ? "dan" : "dana"}`
            : ` · naredni period počinje ${formatDay(addCalendarDays(toCalendarDay(spec.endDate), 1))}`}
        </p>
      </div>

      <div className="mt-4 border-t border-gray-100 px-5 py-4 dark:border-gray-800">
        {byCategory.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Još ništa nije dodato u ovaj period.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {byCategory.map((c) => (
              <li key={c.key} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                  {CATEGORY_META[c.key].icon}
                </span>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {CATEGORY_META[c.key].label} ({c.count})
                  </p>
                  <p className="text-sm font-medium tabular-nums text-gray-800 dark:text-white/90">{formatRSD(c.total)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end border-t border-gray-100 px-5 py-3 dark:border-gray-800">
        <Button variant="ghost" size="sm" onClick={onOpen} endIcon={<LuArrowRight className="h-4 w-4" />}>
          Otvori specifikaciju
        </Button>
      </div>
    </div>
  );
}
