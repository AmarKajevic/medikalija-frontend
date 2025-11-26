import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { User } from "../../types";
import axios from "axios";
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
  const { token } = useAuth();
  const { patientId } = useParams();
  const queryClient = useQueryClient();

  const getArticles = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const res = await axios.get("http://localhost:5000/api/articles", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
      const { data } = await axios.post(
        "http://localhost:5000/api/articles/add",
        article,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return data;
    },
    onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["articles"] }); // 🔁 automatski refetch
  },
  });

  const deleteArticle = useMutation({
    mutationFn: async (articleId: string) => {
      await axios.delete(`http://localhost:5000/api/articles/${articleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      await axios.put(
        `http://localhost:5000/api/articles/${article.articleId}`,
        article,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
      await axios.post(`http://localhost:5000/api/articles/use`, { articleId, amount, patientId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
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
    const res = await axios.get(
      `http://localhost:5000/api/articles/patientArticles/${patientId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
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
