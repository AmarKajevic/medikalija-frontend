// Vrednosti na linijama obrazaca. Linija u originalu je niz crtica ("____"); upisana vrednost stoji na
// liniji, a ostatak linije se dopunjava crticama do dužine iz originala, da red ostane iste dužine.
// Širina se meri u crticama (crtica ≈ pola visine slova u Times New Roman / Calibri).

/**
 * Oznake u šablonu: {polje|linija:N} (vrednost na liniji od N crtica, podvučena),
 * {polje|dopuna:N:R} (ostatak linije običnim crticama; R = odnos slova vrednosti i linije u %)
 * i {#polje|red:K:N} (K-ti red opisnog dela)
 */
export const LINE_TAG = /^(.+)\|linija:(\d+)$/;
export const PAD_TAG = /^(.+)\|dopuna:(\d+):(\d+)$/;
export const ROW_TAG = /^(.+)\|red:(\d+):(\d+)$/;

const NARROW_PUNCT = /[.,:;'!|]/;
const NARROW = /[ilјjtfrIJ1()[\]/\-"„“”]/;
const WIDE_LOWER = /[mwшщжмюфыљњ]/;
const WIDE_UPPER = /[MWШЩЖМЮФЫЉЊ]/;

/** Približna širina teksta u crticama ("_") */
export function textUnits(text: string): number {
  let w = 0;
  for (const ch of text) {
    if (ch === " ") w += 0.5;
    else if (NARROW_PUNCT.test(ch)) w += 0.55;
    else if (NARROW.test(ch)) w += 0.65;
    else if (WIDE_UPPER.test(ch)) w += 1.9;
    else if (WIDE_LOWER.test(ch)) w += 1.5;
    else if (/\p{Lu}/u.test(ch)) w += 1.4;
    else if (/\d/.test(ch)) w += 1;
    else w += 0.93;
  }
  return w;
}

/** Koliko redova zauzima tekst u liniji od `width` crtica (prelom po rečima, kao u Wordu) */
export function lineCount(text: string, width: number): number {
  if (!text.trim()) return 0;
  let lines = 0;
  for (const para of text.split("\n")) {
    let cur = 0;
    lines += 1;
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const w = textUnits(word);
      if (cur > 0 && cur + 0.5 + w > width) {
        lines += 1;
        cur = w;
      } else cur += (cur > 0 ? 0.5 : 0) + w;
    }
  }
  return lines;
}

/**
 * Linija kad podatak nije unet: cela linija iz originala. Upisana vrednost stoji sama (podvučena),
 * bez dopune crticama — popunjen dokument izgleda kao uredno otkucan, a ne kao formular.
 */
export function padFor(text: string, width: number): string {
  return text ? "" : "_".repeat(Math.max(3, width - 1));
}

/** Vrednost na liniji: dopunjena crticama do dužine linije (prazno = cela linija; duže ili više redova = bez dopune) */
export function onLine(text: string, width: number): string {
  if (!text) return "_".repeat(Math.max(3, width - 1)); // crtica kraće: prazna linija nikad ne prelazi u novi red
  if (text.includes("\n") || lineCount(text, width) > 1) return text;
  // Malo kraće od procene, da linija nikad ne pređe u novi red
  const pad = Math.floor(width - textUnits(text)) - 1;
  return pad >= 2 ? text + "_".repeat(pad) : text;
}
