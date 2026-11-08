// PDF rasporeda obračunskih perioda za JEDNU godinu. Učitava se tek na zahtev (pdfmake je velik).
import pdfMake from "pdfmake/build/pdfmake";
import vfsFonts from "pdfmake/build/vfs_fonts";
import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { loadImageAsBase64 } from "@shared/lib/loadImageAsBase64";
import { getScript } from "@shared/lib/script";
import { inScript } from "@shared/lib/pdfScript";
import { formatDay } from "@shared/lib/calendarDay";
import { type Facility, facilityContactLine } from "@entities/facility/facility";

(pdfMake as unknown as { vfs: unknown }).vfs = vfsFonts;

export interface SchedulePeriod {
  index: number;
  startDate: string;
  endDate: string;
  isPast: boolean;
  isCurrent: boolean;
}

export async function generateSchedulePDF({
  patientName,
  year,
  periods,
  facility,
  mode = "download",
}: {
  patientName: string;
  year: string | number;
  periods: SchedulePeriod[];
  facility: Facility;
  mode?: "download" | "print";
}) {
  let logo = "";
  if (facility.logo) logo = await loadImageAsBase64(facility.logo).catch(() => "");
  const contact = facilityContactLine(facility);

  const doc: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [40, 50, 40, 50],
    content: [
      {
        columns: [
          {
            width: "*",
            stack: [
              ...(logo ? [{ image: logo, fit: [150, 50] as [number, number], margin: [0, 0, 0, 4] as [number, number, number, number] }] : []),
              { text: facility.name, bold: true, fontSize: 12 },
              ...(facility.subtitle ? [{ text: facility.subtitle, fontSize: 9, color: "#555" }] : []),
              ...(contact ? [{ text: contact, fontSize: 8, color: "#666" }] : []),
            ],
          },
          { width: "auto", text: patientName, bold: true, fontSize: 14, alignment: "right" },
        ],
        margin: [0, 0, 0, 16],
      },
      { text: `Raspored obračunskih perioda — ${year}. godina`, fontSize: 13, bold: true, margin: [0, 0, 0, 4] },
      { text: "Periodi od 30 kalendarskih dana (prestupne godine su uračunate).", fontSize: 9, color: "#666", margin: [0, 0, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: [40, "*", "*", 70],
          body: [
            [
              { text: "#", bold: true },
              { text: "Početak", bold: true },
              { text: "Kraj", bold: true },
              { text: "", bold: true },
            ],
            ...periods.map((p) => [
              { text: String(p.index), color: "#666" },
              { text: formatDay(p.startDate), bold: p.isCurrent },
              { text: formatDay(p.endDate), bold: p.isCurrent },
              { text: p.isCurrent ? "Tekući" : p.isPast ? "Prošao" : "", fontSize: 9, color: p.isCurrent ? "#2c712e" : "#888" },
            ]),
          ],
        },
        layout: {
          hLineWidth: () => 0.4,
          vLineWidth: () => 0,
          hLineColor: () => "#ccc",
          fillColor: (row: number) => (row === 0 ? "#f3f4f6" : null),
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
      },
    ],
    footer: (page, pages) => ({ text: `${facility.name} · ${patientName} · ${year}. · strana ${page}/${pages}`, fontSize: 7, color: "#888", alignment: "center", margin: [40, 20, 40, 0] }),
    defaultStyle: { fontSize: 10 },
  };

  const pdf = pdfMake.createPdf(inScript(doc, getScript()));
  if (mode === "print") pdf.print();
  else pdf.download(`raspored-perioda-${patientName.replace(/\s+/g, "-")}-${year}.pdf`);
}
