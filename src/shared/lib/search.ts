import { toLatin } from "@shared/lib/script";

// Pretraga bez obzira na pismo, velika/mala slova i dijakritike:
// "zivkovic", "Živković" i "Живковић" nalaze isto.
export const normalizeSearch = (s: string) =>
  toLatin(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "dj");

const words = (s: string) => normalizeSearch(s).split(/[^a-z0-9]+/).filter(Boolean);

/**
 * Pretraga po počecima reči: svaka otkucana reč mora biti POČETAK neke reči u tekstu
 * ("mil" nalazi "Milica", ali ne "Kamila"; "an jov" nalazi "Ana Jovanović").
 * Redosled otkucanih reči nije bitan.
 */
export function matchesSearch(text: string, query: string): boolean {
  const q = words(query);
  if (q.length === 0) return true;
  const t = words(text);
  return q.every((w) => t.some((tw) => tw.startsWith(w)));
}

/** Za ređanje rezultata: 0 = tekst počinje upitom, 1 = prva reč se poklapa, 2 = ostalo */
export function searchRank(text: string, query: string): number {
  const q = words(query);
  const t = words(text);
  if (q.length === 0) return 0;
  if (q.every((w, i) => t[i]?.startsWith(w))) return 0;
  return t[0]?.startsWith(q[0]!) ? 1 : 2;
}
