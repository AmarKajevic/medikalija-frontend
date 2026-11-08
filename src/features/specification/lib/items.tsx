import { LuActivity, LuFlaskConical, LuHeartHandshake, LuPackage, LuPill, LuReceipt, LuSyringe } from "react-icons/lu";
import { SpecificationItem } from "@features/specification/types/types";

export const CATEGORY_META = {
  medicine: { label: "Lekovi — tablete, kapsule", icon: <LuPill /> },
  medicineParenteral: { label: "Lekovi — ampule, rastvori, sol", icon: <LuSyringe /> },
  articles: { label: "Artikli", icon: <LuPackage /> },
  combination: { label: "Analize", icon: <LuFlaskConical /> },
  care: { label: "Nega", icon: <LuHeartHandshake /> },
  physio: { label: "Fizikalna terapija", icon: <LuActivity /> },
  extra: { label: "Dodatni troškovi", icon: <LuReceipt /> },
} as const;

export type CategoryKey = keyof typeof CATEGORY_META | "other";
// Redosled u specifikaciji i na štampi: analize, lekovi (tablete, kapsule), lekovi (ampule,
// rastvori, sol), artikli, pa sve ostalo
export const CATEGORY_ORDER: CategoryKey[] = ["combination", "medicine", "medicineParenteral", "articles", "care", "physio", "extra", "other"];

// Lekovi se dele po vrsti zapamćenoj na stavci (starije stavke bez vrste su tablete)
export const categoryOf = (item: SpecificationItem): CategoryKey => {
  if (item.category === "medicine" && item.form === "parenteral") return "medicineParenteral";
  return (item.category && item.category in CATEGORY_META ? item.category : "other") as CategoryKey;
};

/** Stavke poređane po kategorijama (redosled dodavanja unutar kategorije ostaje) */
export const sortSpecItems = <T extends SpecificationItem>(items: T[]): T[] =>
  items
    .map((item, i) => ({ item, i, rank: CATEGORY_ORDER.indexOf(categoryOf(item)) }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map((x) => x.item);

/** Da li se stavci menja i cena po komadu (nega i dodatni troškovi nemaju cenovnik) */
export const hasEditablePrice = (item: SpecificationItem) => item.category === "care" || item.category === "extra" || item.category === "physio";

// Naziv stavke kako ide u PDF: za kombinacije "KKS + CRP = 200 + 300"
export const itemDisplayName = (item: SpecificationItem) => {
  if (item.category === "combination" && item.analyses?.length) {
    return `${item.analyses.map((a) => a.name).join(" + ")} = ${item.analyses.map((a) => a.price).join(" + ")}`;
  }
  return item.formattedName ?? item.name ?? "Nepoznata stavka";
};
