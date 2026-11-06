// Datum kako ga korisnik kuca (dan.mesec.godina) ⇄ ISO "YYYY-MM-DD" koji šaljemo API-ju.
// Ne zavisi od jezika browsera/OS-a (ugrađeni <input type="date"> na engleskom
// Windows-u prikazuje MM/DD/YYYY).

const pad = (n: number) => String(n).padStart(2, "0");

export const toIsoDate = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

export function isRealDate(y: number, m: number, d: number): boolean {
  if (y < 1000 || y > 9999 || m < 1 || m > 12 || d < 1) return false;
  return d <= new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** "2026-11-06" → "06.11.2026" (prazan string za prazno/neispravno) */
export function isoToDisplay(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
}

export function splitIso(iso: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) } : null;
}

/**
 * Formatira kucanje u masku DD.MM.GGGG. Cifre koje ne staju u dan prelaze u mesec,
 * pa u godinu (kucanje "03051921" bez tačaka daje "03.05.1921"). Kad korisnik sam
 * otkuca razdvajač posle jedne cifre ("6."), dopunjava se nulom ("06.").
 */
export function maskDateTyping(raw: string): string {
  const segs = ["", "", ""];
  let i = 0;
  for (const ch of raw) {
    if (/\d/.test(ch)) {
      if (i < 2 && segs[i]!.length === 2) i += 1;
      if (i === 2 && segs[2]!.length === 4) continue;
      segs[i] += ch;
    } else if (/[./\-\s]/.test(ch) && i < 2 && segs[i]!.length > 0) {
      if (segs[i]!.length === 1) segs[i] = `0${segs[i]}`;
      i += 1;
    }
  }
  return segs.slice(0, i + 1).join(".");
}

/**
 * Tumači otkucan datum: "06.11.2026", "6.11.2026", "6/11/2026", "06112026", "6-11-2026".
 * Vraća ISO ili null ako datum ne postoji (npr. 31.02.).
 */
export function parseDisplayDate(text: string): string | null {
  const t = text.trim();
  let d: number, m: number, y: number;
  const sep = /^(\d{1,2})\D+(\d{1,2})\D+(\d{4})\.?$/.exec(t);
  const compact = /^(\d{2})(\d{2})(\d{4})$/.exec(t);
  if (sep) [d, m, y] = [Number(sep[1]), Number(sep[2]), Number(sep[3])];
  else if (compact) [d, m, y] = [Number(compact[1]), Number(compact[2]), Number(compact[3])];
  else return null;
  return isRealDate(y, m, d) ? toIsoDate(y, m, d) : null;
}

/** ISO datum današnjeg dana po lokalnom kalendaru korisnika */
export const todayIso = () => {
  const n = new Date();
  return toIsoDate(n.getFullYear(), n.getMonth() + 1, n.getDate());
};

export const MONTHS = ["Januar", "Februar", "Mart", "April", "Maj", "Jun", "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar"];
export const WEEKDAYS = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];
