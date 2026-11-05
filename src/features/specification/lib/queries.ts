import { QueryClient } from "@tanstack/react-query";
import { Specification } from "@features/specification/types/types";

export const specKeys = {
  active: (patientId: string) => ["patientSpecification", patientId] as const,
  history: (patientId: string) => ["specificationHistory", patientId] as const,
  byId: (specId: string) => ["specification", specId] as const,
};

// Sve što se menja kada se nešto doda u specifikaciju ili ukloni iz nje:
// sama specifikacija, istorija, zapisi o potrošnji na profilu i stanja na lageru.
export function refreshAfterSpecChange(qc: QueryClient, patientId: string, spec?: Specification | null) {
  if (spec) {
    qc.setQueryData(specKeys.byId(spec._id), spec);
    if (spec.isActive) qc.setQueryData(specKeys.active(patientId), spec);
  }

  const keys: unknown[][] = [
    ["patientSpecification", patientId],
    ["specificationHistory", patientId],
    ["specification"],
    ["usedMedicine", patientId],
    ["usedArticles", patientId],
    ["usedCombinations", patientId],
    ["patientStock", patientId],
    ["patientStockArticles", patientId],
    ["medicines"],
    ["allMedicines"],
    ["articles"],
    ["dashboard-stats"],
  ];
  keys.forEach((queryKey) => qc.invalidateQueries({ queryKey }));
}
