import { LuActivity, LuBriefcaseMedical, LuFlaskConical, LuHeartHandshake, LuPackage, LuPill, LuReceipt, LuSyringe } from "react-icons/lu";
import { SpecificationItem } from "@features/specification/types/types";

export const CATEGORY_META = {
  medicine: { label: "Lekovi — tablete, kapsule", icon: <LuPill /> },
  medicineParenteral: { label: "Lekovi — ampule, rastvori, sol", icon: <LuSyringe /> },
  articles: { label: "Artikli", icon: <LuPackage /> },
  professional: { label: "Stručne usluge", icon: <LuBriefcaseMedical /> },
  combination: { label: "Analize", icon: <LuFlaskConical /> },
  care: { label: "Nega", icon: <LuHeartHandshake /> },
  physio: { label: "Fizikalna terapija", icon: <LuActivity /> },
  extra: { label: "Dodatni troškovi", icon: <LuReceipt /> },
} as const;

export type CategoryKey = keyof typeof CATEGORY_META | "other";
// Redosled u specifikaciji i na štampi: analize, lekovi (tablete, kapsule), lekovi (ampule,
// rastvori, sol), artikli, stručne usluge, pa sve ostalo
export const CATEGORY_ORDER: CategoryKey[] = ["combination", "medicine", "medicineParenteral", "articles", "professional", "care", "physio", "extra", "other"];

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
export const hasEditablePrice = (item: SpecificationItem) =>
  item.category === "care" || item.category === "extra" || item.category === "physio" || item.category === "professional";

const priceText = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ","));

// Naziv stavke kako ide u PDF. Kombinacija: naziv, pa analize spojene sa "+" i njihove cene:
// "Lab analize - KKS+CRP+Urea = 420+190+190". Analize bez cene (npr. uključene u paket)
// ne dodaju "0" na početak spiska cena.
/** Naziv stavke u dva dela: tekst i (za analize) spisak cena "420+750+190" — na štampi su cene sitnije */
export const itemNameParts = (item: SpecificationItem): { text: string; prices: string } => {
  if (item.category === "combination" && item.analyses?.length) {
    const names = item.analyses.map((a) => a.name.trim()).filter(Boolean).join("+");
    const prices = item.analyses.map((a) => Number(a.price) || 0).filter((p) => p > 0).map(priceText).join("+");
    const title = item.name?.trim();
    return { text: `${title ? `${title} - ` : ""}${names}`, prices };
  }
  return { text: item.formattedName ?? item.name ?? "Nepoznata stavka", prices: "" };
};

export const itemDisplayName = (item: SpecificationItem) => {
  const { text, prices } = itemNameParts(item);
  return prices ? `${text} = ${prices}` : text;
};
