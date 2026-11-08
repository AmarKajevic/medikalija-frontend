import { LuFlaskConical, LuHeartHandshake, LuPackage, LuPill, LuReceipt } from "react-icons/lu";
import { SpecificationItem } from "@features/specification/types/types";

export const CATEGORY_META = {
  medicine: { label: "Lekovi", icon: <LuPill /> },
  articles: { label: "Artikli", icon: <LuPackage /> },
  combination: { label: "Analize", icon: <LuFlaskConical /> },
  care: { label: "Nega", icon: <LuHeartHandshake /> },
  extra: { label: "Dodatni troškovi", icon: <LuReceipt /> },
} as const;

export type CategoryKey = keyof typeof CATEGORY_META | "other";
// Redosled u specifikaciji i na štampi: analize uvek prve, pa lekovi, pa artikli i ostalo
export const CATEGORY_ORDER: CategoryKey[] = ["combination", "medicine", "articles", "care", "extra", "other"];

export const categoryOf = (item: SpecificationItem): CategoryKey =>
  (item.category && item.category in CATEGORY_META ? item.category : "other") as CategoryKey;

/** Stavke poređane po kategorijama (redosled dodavanja unutar kategorije ostaje) */
export const sortSpecItems = <T extends SpecificationItem>(items: T[]): T[] =>
  items
    .map((item, i) => ({ item, i, rank: CATEGORY_ORDER.indexOf(categoryOf(item)) }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map((x) => x.item);

/** Da li se stavci menja i cena po komadu (nega i dodatni troškovi nemaju cenovnik) */
export const hasEditablePrice = (item: SpecificationItem) => item.category === "care" || item.category === "extra";

// Naziv stavke kako ide u PDF: za kombinacije "KKS + CRP = 200 + 300"
export const itemDisplayName = (item: SpecificationItem) => {
  if (item.category === "combination" && item.analyses?.length) {
    return `${item.analyses.map((a) => a.name).join(" + ")} = ${item.analyses.map((a) => a.price).join(" + ")}`;
  }
  return item.formattedName ?? item.name ?? "Nepoznata stavka";
};
