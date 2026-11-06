// Srpska latinica ⇄ ćirilica. Preslovljavanje je jednoznačno (lj, nj, dž su jedno
// slovo), pa se ceo interfejs prikazuje u izabranom pismu bez posebnih prevoda.
//
// Reči koje nisu srpske ostaju kako jesu: sa q, w, x, y (npr. "Maximum", "Wi-Fi"),
// e-mail adrese, linkovi.

export type Script = "latin" | "cyrillic";

const LAT_TO_CYR: Record<string, string> = {
  a: "а", b: "б", c: "ц", č: "ч", ć: "ћ", d: "д", đ: "ђ", e: "е", f: "ф", g: "г", h: "х", i: "и", j: "ј", k: "к",
  l: "л", m: "м", n: "н", o: "о", p: "п", r: "р", s: "с", š: "ш", t: "т", u: "у", v: "в", z: "з", ž: "ж",
  A: "А", B: "Б", C: "Ц", Č: "Ч", Ć: "Ћ", D: "Д", Đ: "Ђ", E: "Е", F: "Ф", G: "Г", H: "Х", I: "И", J: "Ј", K: "К",
  L: "Л", M: "М", N: "Н", O: "О", P: "П", R: "Р", S: "С", Š: "Ш", T: "Т", U: "У", V: "В", Z: "З", Ž: "Ж",
};
const DIGRAPHS: Record<string, string> = {
  lj: "љ", Lj: "Љ", LJ: "Љ", nj: "њ", Nj: "Њ", NJ: "Њ", dž: "џ", Dž: "Џ", DŽ: "Џ",
};

const CYR_TO_LAT: Record<string, string> = {};
for (const [lat, cyr] of Object.entries(LAT_TO_CYR)) CYR_TO_LAT[cyr] = lat;
Object.assign(CYR_TO_LAT, { љ: "lj", Љ: "Lj", њ: "nj", Њ: "Nj", џ: "dž", Џ: "Dž" });
const CYR_DIGRAPH_UPPER: Record<string, string> = { Љ: "LJ", Њ: "NJ", Џ: "DŽ" };

const FOREIGN = /[qwxyQWXY]|@|:\/\/|^www\./;
const HAS_LATIN = /[a-zA-ZčćđšžČĆĐŠŽ]/;
const HAS_CYRILLIC = /[Ѐ-ӿ]/;

function wordToCyrillic(word: string): string {
  if (!HAS_LATIN.test(word) || FOREIGN.test(word)) return word;
  let out = "";
  for (let i = 0; i < word.length; i++) {
    const two = word.slice(i, i + 2);
    if (DIGRAPHS[two]) {
      out += DIGRAPHS[two];
      i++;
    } else out += LAT_TO_CYR[word[i]!] ?? word[i];
  }
  return out;
}

function wordToLatin(word: string): string {
  if (!HAS_CYRILLIC.test(word)) return word;
  // "ЉУБИЦА" → "LJUBICA", ali "Љубица" → "Ljubica"
  const letters = word.replace(/[^\p{L}]/gu, "");
  const allCaps = letters.length > 1 && letters === letters.toUpperCase();
  let out = "";
  for (const ch of word) out += (allCaps && CYR_DIGRAPH_UPPER[ch]) || (CYR_TO_LAT[ch] ?? ch);
  return out;
}

const eachWord = (text: string, fn: (w: string) => string) => text.replace(/\S+/g, fn);

export const toCyrillic = (text: string) => (HAS_LATIN.test(text) ? eachWord(text, wordToCyrillic) : text);
export const toLatin = (text: string) => (HAS_CYRILLIC.test(text) ? eachWord(text, wordToLatin) : text);
export const transliterate = (text: string, script: Script) => (script === "cyrillic" ? toCyrillic(text) : toLatin(text));

// Trenutno pismo i za kod van React-a (npr. PDF)
const STORAGE_KEY = "script";
export function getScript(): Script {
  try {
    return localStorage.getItem(STORAGE_KEY) === "cyrillic" ? "cyrillic" : "latin";
  } catch {
    return "latin";
  }
}
export function storeScript(script: Script) {
  try {
    localStorage.setItem(STORAGE_KEY, script);
  } catch {
    // privatni režim — pismo važi do zatvaranja kartice
  }
}
