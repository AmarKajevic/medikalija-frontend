import { AddFamilyItemForm } from "@shared/ui/AddFamilyItemForm/AddFamilyItemForm";
import { useAddArticle } from "@features/articles/hooks/useAddArticle";
import { useGetArticles } from "@features/articles/hooks/useGetArticles";
import { usePatients } from "@features/patients/hooks/usePatients";
import { buildFamilyArticlePayload } from "@features/articles/lib/buildFamilyArticlePayload";

export const AddArticleFromFamilyFormNew = () => (
  <AddFamilyItemForm
    config={{
      title: "Dodavanje artikala (Porodica)",
      useAddMutation: useAddArticle,
      useGetItems: useGetArticles,
      buildPayload: buildFamilyArticlePayload,
      placeholderUnit: "Broj jedinica po pakovanju",
      itemNameSingular: "artikal",
      usePatients,
    }}
  />
);