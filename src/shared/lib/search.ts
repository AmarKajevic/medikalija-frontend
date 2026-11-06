import { toLatin } from "@shared/lib/script";

// Pretraga bez obzira na pismo, velika/mala slova i dijakritike:
// "zivkovic", "Živković" i "Живковић" nalaze isto.
export const normalizeSearch = (s: string) =>
  toLatin(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "dj");
