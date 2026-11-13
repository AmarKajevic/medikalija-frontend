import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import { PHYSIO_KIND_LABEL, type PhysioKind } from "@features/nurse-entries/model";
import { refreshAfterSpecChange } from "@features/specification/lib/queries";
import type { Specification } from "@features/specification/types/types";

// Cenovnik vanredne fizikalne terapije: admin unosi cenu za svaku vrstu unapred;
// pri odobravanju vanredne terapije cena se uzima odavde.
export interface PhysioPrice {
  kind: PhysioKind;
  name: string;
  /** null = još nije uneta */
  priceRSD: number | null;
  /** Vrsta koju je dodao admin (osnovne su "active" | "passive" | "group") */
  custom?: boolean;
}

/** Naziv vrste: iz cenovnika, a za osnovne vrste i ugrađeni naziv */
export const physioName = (p: { kind: string; name?: string }) => p.name || PHYSIO_KIND_LABEL[p.kind] || "Fizikalna terapija";

const KEY = ["physioPrices"] as const;

/** Osnovne vrste — dok se lista ne učita (ili ako nije dostupna) */
const BUILT_IN_KINDS = Object.entries(PHYSIO_KIND_LABEL).map(([kind, name]) => ({ kind, name }));

/** Vrste terapije bez cena (vidi i fizioterapeut). Dok se lista ne učita, ili ako nije dostupna,
 *  nude se bar osnovne vrste — unos terapije ne sme da stane. */
export function usePhysioKinds(): Array<{ kind: PhysioKind; name: string }> {
  const query = useQuery({
    queryKey: [...KEY, "kinds"],
    queryFn: async () => {
      const res = await api.get("/api/physio-prices/kinds");
      return (Array.isArray(res?.data?.kinds) ? res.data.kinds : BUILT_IN_KINDS) as Array<{ kind: PhysioKind; name: string }>;
    },
    retry: false,
  });
  return query.data ?? BUILT_IN_KINDS;
}

export function usePhysioPrices({ enabled = true } = {}) {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get("/api/physio-prices")).data.prices as PhysioPrice[],
    enabled,
  });
}

export function useSavePhysioPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ kind, ...body }: { kind: PhysioKind; priceRSD: number; name?: string }) => (await api.put(`/api/physio-prices/${kind}`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Nova vrsta fizikalne terapije (admin) */
export function useCreatePhysioKind() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; priceRSD: number }) => (await api.post("/api/physio-prices", body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Briše vrstu terapije (i osnovnu) */
export function useDeletePhysioKind() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (kind: PhysioKind) => (await api.delete(`/api/physio-prices/${kind}`)).data as { message: string },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Uprava dodaje vanrednu fizikalnu terapiju direktno u specifikaciju (cena iz cenovnika × broj puta) */
export function useChargePhysio(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { kind: PhysioKind; amount: number; specificationId?: string }) =>
      (await api.post("/api/physio-prices/charge", { patientId, ...body })).data.specification as Specification,
    onSuccess: (spec) => refreshAfterSpecChange(qc, patientId, spec),
  });
}
