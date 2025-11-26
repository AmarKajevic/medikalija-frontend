import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";




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
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // Fetch used medicines
  const usedMedicineQuery = useQuery({
    queryKey: ["usedMedicine", patientId],
    queryFn: async () => {
      const { data } = await axios.get(
        `https://medikalija-api.vercel.app/api/medicine/patient/${patientId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // backend vraća data.usedMedicine, default na prazan niz
      return data?.usedMedicine as UsedMedicine[];
    },
  });

  // Add medicine
  const addMedicine = useMutation({
    mutationFn: async (medicine: { medicineId: string; amount: number }) => {
      const { data } = await axios.post(
        `https://medikalija-api.vercel.app/api/medicine/use`,
        { patientId, ...medicine },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usedMedicine", patientId] });
    },
  });

  return { ...usedMedicineQuery, addMedicine };
};
