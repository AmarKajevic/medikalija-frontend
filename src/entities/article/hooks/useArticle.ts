import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/types/index";
import { api } from "@shared/api/api";
import { useParams } from "react-router";

export type Articles = {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  familyQuantity: number;
  unitsPerPackage?: number;
  packageCount?: number;
  familyPackageCount?: number;
  createBy: User;
};

export type UsedArticle = {
  _id: string;
  article: { name: string; price: number };
  amount: number;
  createdBy: { name: string; role: string };
  createdAt: string;
};

export default function useArticles() {
  const { patientId } = useParams();
  const queryClient = useQueryClient();

  const getArticles = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const res = await api.get("/api/articles");
      return res.data.articles as Articles[];
    },
  });

  const addArticles = useMutation({
    mutationFn: async (article: {
      name: string;
      price: number;
      packages?: number;
      unitsPerPackage?: number;
      quantity?: number;
      fromFamily?: boolean;
    }) => {
      const { data } = await api.post("/api/articles/add", article);
      return data;
    },
    onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["articles"] }); // 🔁 automatski refetch
  },
  });

  const deleteArticle = useMutation({
    mutationFn: async (articleId: string) => {
      await api.delete(`/api/articles/${articleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Greška pri brisanju artikla");
    },
  });

  const editArticle = useMutation({
    mutationFn: async (article: {
      articleId: string;
      price?: number;
      quantity?: number;
      addQuantity?: number;
      packages?: number;
      unitsPerPackage?: number;
      fromFamily?: boolean;
    }) => {
      await api.put(`/api/articles/${article.articleId}`, article);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Greška pri izmeni artikla");
    },
  });

  const addArticleToPatient = useMutation({
    mutationFn: async (params: {
      patientId: string;
      articleId: string;
      amount: number;
    }) => {
      const { patientId, articleId, amount } = params;
      await api.post(`/api/articles/use`, { articleId, amount, patientId });
    },
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["usedArticles", patientId] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Greška pri dodavanju artikla");
    },
  });

  const getPatientArticles = useQuery({
  queryKey: ["usedArticles", patientId],
  enabled: !!patientId, // ✅ osiguraj da se ne šalje kad je undefined
  queryFn: async () => {
    const res = await api.get(`/api/articles/patientArticles/${patientId}`);
    return res.data.articles as UsedArticle[];
  },
});

  return {
    getArticles,
    ...addArticles,
    deleteArticle,
    editArticle,
    addArticleToPatient,
    getPatientArticles,
  };
}
