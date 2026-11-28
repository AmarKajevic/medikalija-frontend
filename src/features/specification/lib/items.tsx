import { LuActivity, LuBriefcaseMedical, LuDroplet, LuDroplets, LuFlaskConical, LuFlaskRound, LuHeartHandshake, LuPackage, LuPill, LuPillBottle, LuReceipt, LuSyringe, LuTestTube } from "react-icons/lu";
import { formatQty } from "@shared/lib/format";
import { SpecificationItem } from "@features/specification/types/types";
import { withoutExtraTag } from "@features/physio/name";

export const CATEGORY_META = {
  medicine: { label: "Lekovi — tablete, kapsule", icon: <LuPill /> },
  medicineParenteral: { label: "Lekovi — ampule", icon: <LuSyringe /> },
  medicineOintment: { label: "Lekovi — masti", icon: <LuPillBottle /> },
  medicineGel: { label: "Lekovi — gelovi", icon: <LuDroplet /> },
  medicineSyrup: { label: "Lekovi — sirupi", icon: <LuFlaskRound /> },
  medicineSolution: { label: "Lekovi — rastvori", icon: <LuDroplets /> },
  medicineSuppository: { label: "Lekovi — supozitorije", icon: <LuTestTube /> },
  articles: { label: "Potrošni materijal", icon: <LuPackage /> },
  professional: { label: "Stručne usluge", icon: <LuBriefcaseMedical /> },
  combination: { label: "Analize", icon: <LuFlaskConical /> },
  care: { label: "Nega", icon: <LuHeartHandshake /> },
  physio: { label: "Fizikalna terapija", icon: <LuActivity /> },
  extra: { label: "Dodatni troškovi", icon: <LuReceipt /> },
} as const;

export type CategoryKey = keyof typeof CATEGORY_META | "other";
// Redosled u specifikaciji i na štampi: analize, lekovi po grupama (tablete, ampule, masti,
// gelovi, sirupi, rastvori, supozitorije), potrošni materijal, stručne usluge, pa sve ostalo
export const CATEGORY_ORDER: CategoryKey[] = [
  "combination",
  "medicine",
  "medicineParenteral",
  "medicineOintment",
  "medicineGel",
  "medicineSyrup",
  "medicineSolution",
  "medicineSuppository",
  "articles",
  "professional",
  "care",
  "physio",
  "extra",
  "other",
];

const MEDICINE_GROUP: Record<string, CategoryKey> = {
  parenteral: "medicineParenteral",
  ointment: "medicineOintment",
  gel: "medicineGel",
  syrup: "medicineSyrup",
  solution: "medicineSolution",
  suppository: "medicineSuppository",
};

// Lekovi se dele po vrsti zapamćenoj na stavci (starije stavke bez vrste su tablete)
export const categoryOf = (item: SpecificationItem): CategoryKey => {
  if (item.category === "medicine") return MEDICINE_GROUP[item.form ?? ""] ?? "medicine";
  return (item.category && item.category in CATEGORY_META ? item.category : "other") as CategoryKey;
};

/**
 * Količina kako se prikazuje i štampa. Stavka sa zapreminom (npr. fiziološki 1000 ml) se
 * vodi u komadima (0,3), a prikazuje u ml ("300 ml"); ostalo kao broj komada.
 */
export const amountLabel = (item: Pick<SpecificationItem, "amount" | "volume">): string => {
  const amount = item.amount ?? 1;
  return item.volume && item.volume > 0 ? `${formatQty(amount * item.volume)} ml` : formatQty(amount);
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
  return { text: withoutExtraTag(item.formattedName ?? item.name ?? "Nepoznata stavka"), prices: "" };
};

export const itemDisplayName = (item: SpecificationItem) => {
  const { text, prices } = itemNameParts(item);
  return prices ? `${text} = ${prices}` : text;
};
