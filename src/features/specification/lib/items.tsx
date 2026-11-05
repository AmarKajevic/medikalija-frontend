import { LuFlaskConical, LuPackage, LuPill, LuReceipt } from "react-icons/lu";
import { SpecificationItem } from "@features/specification/types/types";

export const CATEGORY_META = {
  medicine: { label: "Lekovi", icon: <LuPill /> },
  articles: { label: "Artikli", icon: <LuPackage /> },
  combination: { label: "Analize", icon: <LuFlaskConical /> },
  extra: { label: "Dodatni troškovi", icon: <LuReceipt /> },
} as const;

export type CategoryKey = keyof typeof CATEGORY_META | "other";
export const CATEGORY_ORDER: CategoryKey[] = ["medicine", "articles", "combination", "extra", "other"];

export const categoryOf = (item: SpecificationItem): CategoryKey =>
  (item.category && item.category in CATEGORY_META ? item.category : "other") as CategoryKey;

// Naziv stavke kako ide u PDF: za kombinacije "KKS + CRP = 200 + 300"
export const itemDisplayName = (item: SpecificationItem) => {
  if (item.category === "combination" && item.analyses?.length) {
    return `${item.analyses.map((a) => a.name).join(" + ")} = ${item.analyses.map((a) => a.price).join(" + ")}`;
  }
  return item.formattedName ?? item.name ?? "Nepoznata stavka";
};
