// Pretraga bez obzira na velika/mala slova i dijakritike: "zivkovic" nalazi "Živković".
export const normalizeSearch = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "dj");
