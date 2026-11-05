import { useGetArticles } from "@features/articles/hooks/useGetArticles";
import { useGetPatientStockArticles } from "@features/articles/hooks/useGetPatientStockArticles";
import { StockOption } from "@shared/ui/combobox/StockCombobox";

type ArticleDto = { _id: string; name: string; quantity: number; price?: number };
type FamilyStockDto = { _id: string; familyQuantity: number };

export const useArticleOptions = (patientId: string) => {
  const articles = useGetArticles();
  const stock = useGetPatientStockArticles(patientId);

  const options: StockOption[] = ((articles.data ?? []) as ArticleDto[]).map((a) => ({
    value: a._id,
    label: a.name,
    home: a.quantity ?? 0,
    family: ((stock.data ?? []) as FamilyStockDto[]).find((s) => s._id === a._id)?.familyQuantity ?? 0,
    price: a.price ?? 0,
  }));

  return { options, isLoading: articles.isLoading || stock.isLoading };
};
