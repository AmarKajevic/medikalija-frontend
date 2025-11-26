import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

interface Analysis {
  _id: string;
  analysis: { _id: string; name: string };
  priceAtTheTime: number;
  assignedAt: string;
  combinationId: string;
}

export interface Combination {
  _id: string;
  combinationId: string;
  assignedAt: string;
  analyses: { name: string; priceAtTheTime: number }[];
  totalPrice: number;
}

export const usePatientCombination = (patientId: string) => {
  const { token } = useAuth();

  return useQuery<Combination[]>({
    queryKey: ["combinations", patientId],
    queryFn: async () => {
      const { data } = await axios.get(
        `https://medikalija-api.vercel.app/api/analysis/patient/${patientId}/assigned-combination`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!data.success) return [];

      const grouped: Record<string, Combination> = {};

      data.usedAnalyses.forEach((ua: Analysis) => {
        // zaokruži assignedAt na sekund da se sve analize iste instance kombinuju
        const assignedDate = new Date(ua.assignedAt);
        const assignedKey = `${ua.combinationId}_${assignedDate.toISOString().slice(0, 19)}`;

        if (!grouped[assignedKey]) {
          grouped[assignedKey] = {
            _id: assignedKey,
            combinationId: ua.combinationId,
            assignedAt: ua.assignedAt,
            analyses: [],
            totalPrice: 0,
          };
        }

        grouped[assignedKey].analyses.push({
          name: ua.analysis.name,
          priceAtTheTime: ua.priceAtTheTime,
        });

        grouped[assignedKey].totalPrice += ua.priceAtTheTime;
      });

      // sort po newest first
      return Object.values(grouped).sort(
        (a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
      );
    },
  });
};
