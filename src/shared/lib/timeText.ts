// Vreme dana "SS:MM" (24 h) — kucanje, poređenje i trajanje.
const pad = (n: number) => String(n).padStart(2, "0");

/** "930" → "09:30", "9" → "09:00", "14.5" → "14:05"; null ako nije ispravno */
export function parseTime(raw: string): string | null {
  const t = raw.trim().replace(/[.,h\s]/g, ":");
  let h: number;
  let m: number;
  const sep = /^(\d{1,2}):(\d{1,2})$/.exec(t);
  const digits = /^\d{1,4}$/.exec(t);
  if (sep) [h, m] = [Number(sep[1]), Number(sep[2])];
  else if (digits) {
    const s = t;
    if (s.length <= 2) [h, m] = [Number(s), 0];
    else if (s.length === 3) [h, m] = [Number(s.slice(0, 1)), Number(s.slice(1))];
    else [h, m] = [Number(s.slice(0, 2)), Number(s.slice(2))];
  } else return null;
  if (h > 23 || m > 59) return null;
  return `${pad(h)}:${pad(m)}`;
}

export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const durationLabel = (minutes: number) => {
  if (minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
};
