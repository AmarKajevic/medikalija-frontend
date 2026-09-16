import { AddDomItemForm } from "@shared/ui/AddDomItemForm/AddDomItemForm";
import { useAddArticle } from "@features/articles/hooks/useAddArticle";
import { useGetArticles } from "@features/articles/hooks/useGetArticles";
import { buildArticlePayload } from "@features/articles/lib/buildArticlePayload";

export const AddArticleFormNew = () => (
  <AddDomItemForm
    config={{
      title: "Dodavanje artikala (Dom)",
      useAddMutation: useAddArticle,
      useGetItems: useGetArticles,
      buildPayload: buildArticlePayload,
      priceFieldName: "price",
      placeholderPrice: "Cena po jedinici (€)",
      placeholderUnit: "Broj jedinica po pakovanju",
      itemNameSingular: "artikal",
    }}
  />
);