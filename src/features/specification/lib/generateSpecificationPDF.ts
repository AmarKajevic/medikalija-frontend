// features/specification/lib/generateSpecificationPDF.ts
import pdfMake from "pdfmake/build/pdfmake";
import vfsFonts from "pdfmake/build/vfs_fonts";
import { loadImageAsBase64 } from "@shared/lib/loadImageAsBase64";
import logoUrl from "../../../../public/images/logo/logo-medikalija.webp"
import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { formatDay } from "@shared/lib/calendarDay";
import { getScript } from "@shared/lib/script";
import { inScript } from "@shared/lib/pdfScript";

// Iznosi kao u aplikaciji: 5.860,00 (sr-Latn-RS)
const money = new Intl.NumberFormat("sr-Latn-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qtyFmt = new Intl.NumberFormat("sr-Latn-RS", { maximumFractionDigits: 2 });
import { DEFAULT_FACILITY, type Facility, facilityContactLine } from "@entities/facility/facility";

(pdfMake as unknown as { vfs: unknown }).vfs = vfsFonts;

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
  earlyLodgingEUR?: number;
  earlyLodgingRSD?: number;
  specEUR: number;
  specTotalRSD: number;
  totalRSD: number;
  totalEUR: number;
  nextPeriodLabel: string;
  /** Dug i smeštaj su opcioni: ono što nije uključeno se ne štampa */
  includeDebt?: boolean;
  includeLodging?: boolean;
  includeEarlyLodging?: boolean;
  /** Nazivi izabranih cena smeštaja (npr. "30 dana") */
  lodgingOption?: string;
  earlyLodgingOption?: string;
  /** Ustanova iz Podešavanja: logo, naziv i kontakt u zaglavlju */
  facility?: Facility;
  /** "print" otvara dijalog za štampu umesto preuzimanja fajla */
  mode?: "download" | "print";
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
    earlyLodgingEUR = 0,
    earlyLodgingRSD = 0,
    specEUR,
    specTotalRSD,
    totalRSD,
    totalEUR,
    nextPeriodLabel,
    mode = "download",
    facility = DEFAULT_FACILITY,
    includeDebt = debtEUR > 0,
    includeLodging = lodgingEUR > 0,
    includeEarlyLodging = earlyLodgingEUR > 0,
    lodgingOption = "",
    earlyLodgingOption = "",
  } = params;

  const formatDate = (dateStr: string) => formatDay(dateStr);
  const periodText = `${formatDate(startDate)} – ${formatDate(endDate)}`;

  // Logo ustanove; ugrađeni logo samo za postojeću instalaciju koja nije postavila svoj.
  // Sve ide kroz canvas → PNG jer pdfmake ne podržava WebP.
  const logoSource = facility.logo || (facility.name === DEFAULT_FACILITY.name ? logoUrl : "");
  let logoBase64 = "";
  if (logoSource) {
    try {
      logoBase64 = await loadImageAsBase64(logoSource);
    } catch {
      console.warn("Logo nije učitan");
    }
  }
  const contactLine = facilityContactLine(facility);

  // Redovi duga, smeštaja i vanstandardnog perioda smeštaja — samo uključeni (isti u prvoj i završnoj tabeli)
  const extraRows = [
    ...(includeDebt
      ? [[{ text: "Dug iz prethodnog perioda" }, { text: money.format(debtRSD), alignment: "right" }, { text: money.format(debtEUR), alignment: "right" }]]
      : []),
    ...(includeLodging
      ? [[{ text: lodgingOption ? `Smeštaj za naredni period – ${lodgingOption} (${nextPeriodLabel})` : `Smeštaj za narednih 30 dana (${nextPeriodLabel})` }, { text: money.format(lodgingRSD), alignment: "right" }, { text: money.format(lodgingEUR), alignment: "right" }]]
      : []),
    ...(includeEarlyLodging
      ? [[{ text: earlyLodgingOption ? `Vanstandardni period smeštaja – ${earlyLodgingOption}` : "Vanstandardni period smeštaja" }, { text: money.format(earlyLodgingRSD), alignment: "right" }, { text: money.format(earlyLodgingEUR), alignment: "right" }]]
      : []),
  ];
  const extraTitles = [includeDebt && "Dug", includeLodging && "Smeštaj", includeEarlyLodging && "Vanstandardni period smeštaja"].filter(Boolean);
  const extraTitle =
    extraTitles.length > 1
      ? `${extraTitles.join(" + ")} (EUR/RSD)`
      : includeDebt
        ? "Dug iz prethodnog perioda (EUR/RSD)"
        : includeLodging
          ? "Smeštaj za naredni period (EUR/RSD)"
          : "Vanstandardni period smeštaja (EUR/RSD)";
  const extraRSD = (includeDebt ? debtRSD : 0) + (includeLodging ? lodgingRSD : 0) + (includeEarlyLodging ? earlyLodgingRSD : 0);
  const extraEUR = (includeDebt ? debtEUR : 0) + (includeLodging ? lodgingEUR : 0) + (includeEarlyLodging ? earlyLodgingEUR : 0);

  // ✅ ZAJEDNIČKE ŠIRINE KOLONA za sve tri tabele
  // Prva kolona fleksibilna, druga fiksna 70, treća fiksna 70 (možeš prilagoditi)
  const colWidths = ["*", 70, 70];

  // pdfmake tipovi zahtevaju literalne tipove (npr. alignment: "right") za svaku ćeliju;
  // struktura je proverena ručno, pa se tip dodeljuje jednom na kraju.
  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 50, 40, 50],
    content: [
      // Red: logo levo, ime pacijenta desno
      {
        columns: [
          {
            width: 250,
            stack: [
              logoBase64
                ? { image: logoBase64, fit: [170, 60], alignment: "left", margin: [0, 0, 0, 4] }
                : { text: facility.name, style: "facilityName" },
              logoBase64 ? { text: facility.name, bold: true, fontSize: 9 } : { text: facility.subtitle, fontSize: 9, color: "#555" },
              contactLine ? { text: contactLine, fontSize: 8, color: "#666", margin: [0, 2, 0, 0] } : { text: "" },
            ],
          },
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
      

      // Tabela 1 – dug i/ili smeštaj (samo ono što je uključeno)
      ...(extraRows.length > 0
        ? [
            {
              text: extraTitle,
              style: "subheader",
              margin: [0, 10, 0, 5],
            },
            {
              table: {
                widths: colWidths,
                body: [
                  [
                    { text: "", bold: true },
                    { text: "RSD", bold: true, alignment: "right" },
                    { text: "EUR", bold: true, alignment: "right" },
                  ],
                  ...extraRows,
                  ...(extraRows.length > 1
                    ? [
                        [
                          { text: "UKUPNO", bold: true },
                          { text: money.format(extraRSD), bold: true, alignment: "right" },
                          { text: money.format(extraEUR), bold: true, alignment: "right" },
                        ],
                      ]
                    : []),
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
          ]
        : []),

      // Tabela 2 – Specifikacija
     { text: `Specifikacija troškova za period: ${periodText}`,bold:true, alignment: "left", margin: [0, 0, 0, 5] },
      {
        table: {
          widths: colWidths,
          body: [
            [
              { text: "NAZIV", bold: true },
              { text: "KOLIČINA", bold: true, alignment: "center" },
              { text: "RSD", bold: true, alignment: "right" },
            ],
            ...items.map((item) => [
              { text: item.formattedName },
              { text: qtyFmt.format(item.amount), alignment: "center" },
              { text: money.format(item.price), alignment: "right" },
            ]),
            [
              { text: "" },
              { text: "Ukupno", bold: true, alignment: "right" },
              { text: money.format(specTotalRSD), bold: true, alignment: "right" },
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
              { text: money.format(specTotalRSD), alignment: "right" },
              { text: money.format(specEUR), alignment: "right" },
            ],
            ...extraRows,
            [
              { text: "UKUPNO ZA NAPLATU", bold: true },
              { text: money.format(totalRSD), bold: true, alignment: "right" },
              { text: money.format(totalEUR), bold: true, alignment: "right" },
            ],
          ],
        },
        layout: {
          hLineWidth: (i: number) => (i === 0 || i === 2 + extraRows.length ? 0.5 : 0.2),
          vLineWidth: () => 0.5,
          hLineColor: () => "#aaa",
          vLineColor: () => "#aaa",
        },
        margin: [0, 0, 0, 15],
      },
    ],
    footer: facility.bankAccount
      ? { text: `Uplata na račun: ${facility.bankAccount} · ${facility.name}`, fontSize: 8, color: "#666", alignment: "center", margin: [40, 20, 40, 0] }
      : undefined,
    styles: {
      facilityName: { fontSize: 13, bold: true },
      patientName: { fontSize: 14, bold: true },
      subheader: { fontSize: 12, bold: true },
    },
  } as unknown as TDocumentDefinitions;

  const pdf = pdfMake.createPdf(inScript(docDefinition, getScript()));
  if (mode === "print") {
    pdf.print();
  } else {
    pdf.download(`specifikacija-${patientName}-${periodText.replace(/[^a-z0-9]/gi, "_")}.pdf`);
  }
};
