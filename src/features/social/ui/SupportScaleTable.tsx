import { Select } from "@shared/ui/form/controls";
import { SCALE_GROUPS, SCALE_POINTS, scaleSummary, ScaleScore, SUPPORT_LEVELS } from "@features/social/dossier";

interface Props {
  value: Record<string, ScaleScore>;
  onChange: (next: Record<string, ScaleScore>) => void;
  readOnly?: boolean;
}

const roman = (n: number) => ["", "I", "II", "III", "IV"][n] ?? "";

// Skala za procenu stepena podrške (obrazac 11): 25 stavki × stanje na prijemu (TS) i očekivani
// ishod. Zbirovi po oblastima, ukupno i stepen podrške računaju se uživo, kao u obrascu.
export default function SupportScaleTable({ value, onChange, readOnly = false }: Props) {
  const summary = scaleSummary(value);
  const level = SUPPORT_LEVELS.find((l) => l.value === summary.level);
  const set = (key: string, col: keyof ScaleScore, raw: string) => {
    const row = { now: value[key]?.now ?? null, expected: value[key]?.expected ?? null, [col]: raw ? Number(raw) : null };
    onChange({ ...value, [key]: row });
  };
  const cell = (key: string, col: keyof ScaleScore, label: string) => (
    <Select
      aria-label={label}
      value={value[key]?.[col] ? String(value[key]![col]) : ""}
      onChange={(e) => set(key, col, e.target.value)}
      disabled={readOnly}
      className="h-9 min-w-[4.5rem] py-1 text-sm"
    >
      <option value="">—</option>
      {SCALE_POINTS.map((p) => (
        <option key={p.value} value={p.value}>
          {p.value}
        </option>
      ))}
    </Select>
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white/90">Skala za procenu stepena podrške</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">{SCALE_POINTS.map((p) => `${p.value} = ${p.label}`).join(" · ")}</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Stavka</th>
              <th className="w-28 px-3 py-2 text-left font-medium">Stanje na prijemu (TS)</th>
              <th className="w-28 px-3 py-2 text-left font-medium">Očekivani ishod</th>
            </tr>
          </thead>
          {SCALE_GROUPS.map((g) => {
            const sums = summary.groups.find((x) => x.key === g.key)!;
            return (
              <tbody key={g.key} className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr className="bg-gray-50/60 dark:bg-white/[0.02]">
                  <th colSpan={3} className="px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    {g.label}
                  </th>
                </tr>
                {g.items.map(([key, label]) => (
                  <tr key={key}>
                    <td className="px-3 py-1.5 text-gray-800 dark:text-gray-200">{label}</td>
                    <td className="px-3 py-1.5">{cell(key, "now", `${label}: stanje na prijemu`)}</td>
                    <td className="px-3 py-1.5">{cell(key, "expected", `${label}: očekivani ishod`)}</td>
                  </tr>
                ))}
                <tr className="text-xs text-gray-500 dark:text-gray-400">
                  <td className="px-3 py-1.5 text-right">Zbir</td>
                  <td className="px-3 py-1.5 font-semibold tabular-nums text-gray-800 dark:text-gray-200">{sums.now || "—"}</td>
                  <td className="px-3 py-1.5 font-semibold tabular-nums text-gray-800 dark:text-gray-200">{sums.expected || "—"}</td>
                </tr>
              </tbody>
            );
          })}
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-brand-50 px-4 py-3 text-sm dark:bg-brand-500/10" aria-live="polite">
        <span>
          Ukupno: <strong className="tabular-nums">{summary.totalNow || "—"}</strong>
          <span className="text-gray-500"> (ocenjeno {summary.rated}/{summary.of})</span>
        </span>
        <span>
          Stepen podrške: <strong>{summary.level ? `${roman(summary.level)} stepen` : "—"}</strong>
          {level && <span className="text-gray-500"> · {level.hint}</span>}
        </span>
      </div>
    </section>
  );
}
