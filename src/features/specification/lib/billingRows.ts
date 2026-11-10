import type { BillingState } from "@features/specification/hooks/useBillingState";

type Kind = "debt" | "lodging" | "early";

/** Uključeni smeštaj i dug, redom kako idu na specifikaciju */
export function billingRows(billing: BillingState, nextPeriodLabel: string) {
  const { fields, result } = billing;
  const rows: Array<{ kind: Kind; label: string; note: string; eur: number; rsd: number }> = [];
  if (fields.includeLodging)
    rows.push({ kind: "lodging", label: `Smeštaj za naredni period${fields.lodgingOption ? ` · ${fields.lodgingOption}` : ""}`, note: nextPeriodLabel, eur: result.lodgingEUR, rsd: result.lodgingRSD });
  if (fields.includeEarly)
    rows.push({ kind: "early", label: `Vanstandardni period smeštaja${fields.earlyOption ? ` · ${fields.earlyOption}` : ""}`, note: [result.earlyPeriodLabel, fields.earlyNote].filter(Boolean).join(" · ") || "van redovnog perioda", eur: result.earlyLodgingEUR, rsd: result.earlyLodgingRSD });
  if (fields.includeDebt) rows.push({ kind: "debt", label: "Dug iz prethodnog perioda", note: "nije plaćeno do sada", eur: result.debtEUR, rsd: result.debtRSD });
  return rows;
}
