import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import { InventoryKind, INVENTORY } from "@features/inventory/model";

export interface FamilyMedicineRow {
  _id: string; // PatientMedicine id
  quantity: number;
  medicine: { _id: string; name: string } | null;
}

export const familyKeys = {
  medicines: (patientId: string) => ["familyStockMedicines", patientId],
};

export const useFamilyMedicines = (patientId: string) =>
  useQuery({
    queryKey: familyKeys.medicines(patientId),
    queryFn: async (): Promise<FamilyMedicineRow[]> => {
      const { data } = await api.get(`/api/medicine/patient/${patientId}/medicines`);
      return ((data.patientStock ?? []) as FamilyMedicineRow[]).filter((r) => r.medicine && r.quantity > 0);
    },
    enabled: !!patientId,
  });

const useRefreshFamily = () => {
  const qc = useQueryClient();
  return (patientId: string) => {
    [familyKeys.medicines(patientId), ["patientStock", patientId], ["patientStockArticles", patientId], ["reserve"]].forEach((queryKey) =>
      qc.invalidateQueries({ queryKey })
    );
  };
};

// Unos porodičnih zaliha: uvek vezan za pacijenta, nikad ne menja stanje doma
export const useAddFamilyStock = () => {
  const refresh = useRefreshFamily();
  return useMutation({
    mutationFn: async (v: { kind: InventoryKind; patientId: string; name: string; unitsPerPackage?: number; packages: number; units: number }) => {
      const { data } = await api.post(`${INVENTORY[v.kind].endpoint}/add`, {
        name: v.name,
        fromFamily: true,
        patientId: v.patientId,
        unitsPerPackage: v.unitsPerPackage,
        packages: v.packages,
        quantity: v.units,
      });
      return data;
    },
    onSuccess: (_, v) => refresh(v.patientId),
  });
};

export const useSetFamilyMedicine = () => {
  const refresh = useRefreshFamily();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number; patientId: string }) => api.put(`/api/medicine/patient-stock/${id}`, { quantity }),
    onSuccess: (_, v) => refresh(v.patientId),
  });
};

export const useRemoveFamilyMedicine = () => {
  const refresh = useRefreshFamily();
  return useMutation({
    mutationFn: ({ id }: { id: string; patientId: string }) => api.delete(`/api/medicine/patient-stock/${id}`),
    onSuccess: (_, v) => refresh(v.patientId),
  });
};

export const useMoveToReserve = () => {
  const refresh = useRefreshFamily();
  return useMutation({
    mutationFn: ({ id, amount, patientId }: { id: string; amount: number; patientId: string }) =>
      api.post("/api/medicine-reserve/move", { medicineId: id, amount, source: "family", patientId }),
    onSuccess: (_, v) => refresh(v.patientId),
  });
};
