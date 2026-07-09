import { AddDomItemForm } from "../../../shared/ui/AddDomItemForm/AddDomItemForm";
import { useAddArticle } from "../hooks/useAddArticle";
import { useGetArticles } from "../hooks/useGetArticles";
import { buildArticlePayload } from "../lib/buildArticlePayload";

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