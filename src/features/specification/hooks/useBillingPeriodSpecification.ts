import { useQuery } from "@tanstack/react-query";
import { fetchBillingPeriod } from "@features/specification/api/specificationApi";

/** Period specifikacije (pre aktivnog) — u njemu se uglavnom pravi obračun */
export const useBillingPeriodSpecification = (patientId: string) =>
  useQuery({
    queryKey: ["billingPeriodSpecification", patientId],
    queryFn: () => fetchBillingPeriod(patientId),
    enabled: !!patientId,
  });
