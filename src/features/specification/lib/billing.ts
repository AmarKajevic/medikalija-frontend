// Obračun naplate. Specifikacija je u RSD i u EUR se preračunava po NIŽEM
// kursu; dug i smeštaj su u EUR i u RSD se preračunavaju po SREDNJEM kursu.
// Ista pravila koristi i backend (saveBillingForSpecification).
export interface BillingInput {
  specTotalRSD: number;
  debtEUR: number;
  lodgingEUR: number;
  lowerRate: number;
  middleRate: number;
}

export function computeBilling({ specTotalRSD, debtEUR, lodgingEUR, lowerRate, middleRate }: BillingInput) {
  const specEUR = lowerRate > 0 ? specTotalRSD / lowerRate : 0;
  const debtRSD = middleRate > 0 ? debtEUR * middleRate : 0;
  const lodgingRSD = middleRate > 0 ? lodgingEUR * middleRate : 0;

  return {
    specTotalRSD,
    specEUR,
    debtEUR,
    debtRSD,
    lodgingEUR,
    lodgingRSD,
    totalRSD: specTotalRSD + debtRSD + lodgingRSD,
    totalEUR: specEUR + debtEUR + lodgingEUR,
  };
}

export type BillingResult = ReturnType<typeof computeBilling>;
