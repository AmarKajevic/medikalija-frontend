import { useGetArticles } from "@features/articles/hooks/useGetArticles";
import { useGetPatientStockArticles } from "@features/articles/hooks/useGetPatientStockArticles";
import { StockOption } from "@shared/ui/combobox/StockCombobox";

type ArticleDto = { _id: string; name: string; quantity: number; price?: number; volume?: number | null };
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
    volume: Number(a.volume) > 0 ? Number(a.volume) : null,
  }));

  return { options, isLoading: articles.isLoading || stock.isLoading };
};
