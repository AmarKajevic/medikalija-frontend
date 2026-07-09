import { AddFamilyItemForm } from "../../../shared/ui/AddFamilyItemForm/AddFamilyItemForm";
import { useAddArticle } from "../hooks/useAddArticle";
import { useGetArticles } from "../hooks/useGetArticles";
import { usePatients } from "../../patients/hooks/usePatients";
import { buildFamilyArticlePayload } from "../lib/buildFamilyArticlePayload";

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