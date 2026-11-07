/** 1 stavka, 2–4 stavke, 5+ stavki (11–14 stavki) */
export function itemsLabel(n: number): string {
  const tens = n % 100;
  const word = n % 10 === 1 && tens !== 11 ? "stavka" : n % 10 >= 2 && n % 10 <= 4 && (tens < 12 || tens > 14) ? "stavke" : "stavki";
  return `${n} ${word}`;
}
