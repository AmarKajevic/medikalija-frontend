import { getScript, transliterate } from "@shared/lib/script";

// CSV koji Excel u Srbiji otvara ispravno: separator ";" (decimalni zarez),
// UTF-8 sa BOM-om (č, ć, ž, ćirilica). Tekst je u pismu koje je korisnik izabrao.
export function toCsv(rows: Array<Array<string | number | null | undefined>>): string {
  const script = getScript();
  const cell = (v: string | number | null | undefined) => {
    const s = typeof v === "number" ? String(v).replace(".", ",") : transliterate(v ?? "", script);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(cell).join(";")).join("\r\n");
}

export function downloadCsv(filename: string, rows: Parameters<typeof toCsv>[0]) {
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
