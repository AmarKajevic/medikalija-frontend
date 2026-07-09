// features/specification/lib/generateSpecificationPDF.ts
import pdfMake from "pdfmake/build/pdfmake";
import vfsFonts from "pdfmake/build/vfs_fonts";
import { loadImageAsBase64 } from "../../../shared/lib/loadImageAsBase64";
import logoUrl from "../../../../public/images/logo/logo-medikalija.webp"

(pdfMake as any).vfs = vfsFonts;

interface GeneratePDFParams {
  patientName: string;
  startDate: string;
  endDate: string;
  items: Array<{
    formattedName: string;
    amount: number;
    price: number;
  }>;
  debtEUR: number;
  debtRSD: number;
  lodgingEUR: number;
  lodgingRSD: number;
  specEUR: number;
  specTotalRSD: number;
  totalRSD: number;
  totalEUR: number;
  nextPeriodLabel: string;
}

export const generateSpecificationPDF = async (params: GeneratePDFParams) => {
  const {
    patientName,
    startDate,
    endDate,
    items,
    debtEUR,
    debtRSD,
    lodgingEUR,
    lodgingRSD,
    specEUR,
    specTotalRSD,
    totalRSD,
    totalEUR,
    nextPeriodLabel,
  } = params;

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("sr-RS");
  const periodText = `${formatDate(startDate)} – ${formatDate(endDate)}`;

  // Učitaj logo
  let logoBase64 = "";
  try {
    logoBase64 = await loadImageAsBase64(logoUrl);
  } catch (err) {
    console.warn("Logo nije učitan");
  }

  // ✅ ZAJEDNIČKE ŠIRINE KOLONA za sve tri tabele
  // Prva kolona fleksibilna, druga fiksna 70, treća fiksna 70 (možeš prilagoditi)
  const colWidths = ["*", 70, 70];

  const docDefinition: any = {
    pageSize: "A4",
    pageMargins: [40, 50, 40, 50],
    content: [
      // Red: logo levo, ime pacijenta desno
      {
        columns: [
          logoBase64
            ? {
                width: 170,
                image: logoBase64,
                alignment: "left",
              }
            : { width: 100, text: "" },
          {
            width: "*",
            text: patientName,
            style: "patientName",
            alignment: "right",
          },
        ],
        margin: [0, 0, 0, 10],
      },
      // Period (centriran)
      

      // Tabela 1 – Dug + Smeštaj (EUR/RSD)
      { text: "Dug + Smeštaj (EUR/RSD)", style: "subheader", margin: [0, 10, 0, 5] },
      {
        table: {
          widths: colWidths,
          body: [
            [
              { text: "", bold: true },
              { text: "RSD", bold: true, alignment: "right" },
              { text: "EUR", bold: true, alignment: "right" },
            ],
            [
              { text: "Dug iz prethodnog perioda" },
              { text: debtRSD.toFixed(2), alignment: "right" },
              { text: debtEUR.toFixed(2), alignment: "right" },
            ],
            [
              { text: `Smeštaj za narednih 30 dana (${nextPeriodLabel})` },
              { text: lodgingRSD.toFixed(2), alignment: "right" },
              { text: lodgingEUR.toFixed(2), alignment: "right" },
            ],
            [
              { text: "UKUPNO", bold: true },
              { text: (debtRSD + lodgingRSD).toFixed(2), bold: true, alignment: "right" },
              { text: (debtEUR + lodgingEUR).toFixed(2), bold: true, alignment: "right" },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#aaa",
          vLineColor: () => "#aaa",
        },
        margin: [0, 0, 0, 15],
      },

      // Tabela 2 – Specifikacija
     { text: `Specifikacija troškova za period: ${periodText}`,bold:true, alignment: "left", margin: [0, 0, 0, 5] },
      {
        table: {
          widths: colWidths,
          body: [
            [
              { text: "NAZIV LEKA", bold: true },
              { text: "KOMADA", bold: true, alignment: "center" },
              { text: "VREDNOST", bold: true, alignment: "right" },
            ],
            ...items.map((item) => [
              { text: item.formattedName },
              { text: item.amount.toString(), alignment: "center" },
              { text: item.price.toFixed(2), alignment: "right" },
            ]),
            [
              { text: "" },
              { text: "Ukupno", bold: true, alignment: "right" },
              { text: specTotalRSD.toFixed(2), bold: true, alignment: "right" },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#aaa",
          vLineColor: () => "#aaa",
        },
        margin: [0, 0, 0, 15],
      },

      // Tabela 3 – Konačan obračun
      { text: "Konačan obračun", style: "subheader", margin: [0, 10, 0, 5] },
      {
        table: {
          widths: colWidths,
          body: [
            [
              { text: "", bold: true },
              { text: "RSD", bold: true, alignment: "right" },
              { text: "EUR", bold: true, alignment: "right" },
            ],
            [
              { text: "Specifikacija troškova " },
              { text: specTotalRSD.toFixed(2), alignment: "right" },
              { text: specEUR.toFixed(2), alignment: "right" },
            ],
            [
              { text: "Dug iz prethodnog perioda" },
              { text: debtRSD.toFixed(2), alignment: "right" },
              { text: debtEUR.toFixed(2), alignment: "right" },
            ],
            [
              { text: `Smeštaj za narednih 30 dana (${nextPeriodLabel})` },
              { text: lodgingRSD.toFixed(2), alignment: "right" },
              { text: lodgingEUR.toFixed(2), alignment: "right" },
            ],
            [
              { text: "UKUPNO ZA NAPLATU", bold: true },
              { text: totalRSD.toFixed(2), bold: true, alignment: "right" },
              { text: totalEUR.toFixed(2), bold: true, alignment: "right" },
            ],
          ],
        },
        layout: {
          hLineWidth: (i: number) => (i === 0 || i === 4 ? 0.5 : 0.2),
          vLineWidth: () => 0.5,
          hLineColor: () => "#aaa",
          vLineColor: () => "#aaa",
        },
        margin: [0, 0, 0, 15],
      },
    ],
    styles: {
      patientName: { fontSize: 14, bold: true },
      subheader: { fontSize: 12, bold: true },
    },
  };

  pdfMake.createPdf(docDefinition).download(
    `specifikacija-${patientName}-${periodText.replace(/[^a-z0-9]/gi, "_")}.pdf`
  );
};