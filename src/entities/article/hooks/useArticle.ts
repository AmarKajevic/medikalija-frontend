import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/api/api";

export type UsedArticle = {
  _id: string;
  article: { name: string; price: number } | null;
  amount: number;
  createdBy?: { name: string; role: string };
  createdAt: string;
};

// Istorija artikala datih pacijentu
export const usePatientArticles = (patientId: string) =>
  useQuery({
    queryKey: ["usedArticles", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const res = await api.get(`/api/articles/patientArticles/${patientId}`);
      return (res.data.articles ?? []) as UsedArticle[];
    },
  });
