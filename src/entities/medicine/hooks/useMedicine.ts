import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";




export interface UsedMedicine {
   _id: string;
  amount: number;
  familyAmount: number;
  homeAmount: number;
  fromFamily: boolean;
  priceAtTheTime: number;
  medicine: {
    _id: string;
    name: string;
    pricePerUnit: number;
  };

  createdBy?: {
    _id: string;
    name: string;
    lastName: string;
    role: string;
  };

  createdAt: string;
}

export const useMedicine = (patientId: string) => {
  const queryClient = useQueryClient();

  // Fetch used medicines
  const usedMedicineQuery = useQuery({
    queryKey: ["usedMedicine", patientId],
    queryFn: async () => {
      const { data } = await api.get(
        `/api/medicine/patient/${patientId}/medicines`
      );
      // backend vraća data.usedMedicine, default na prazan niz
      return data?.usedMedicine as UsedMedicine[];
    },
  });

  // Add medicine
  const addMedicine = useMutation({
    mutationFn: async (medicine: { medicineId: string; amount: number }) => {
      const { data } = await api.post(`/api/medicine/use`, { patientId, ...medicine });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usedMedicine", patientId] });
    },
  });

  return { ...usedMedicineQuery, addMedicine };
};
