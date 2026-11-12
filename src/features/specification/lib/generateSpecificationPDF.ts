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
    /** Cene analiza "420+750+190" — štampaju se sitnije od naziva */
    priceList?: string;
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
  /** Napomena uz vanstandardni smeštaj (u istom redu) */
  earlyLodgingNote?: string;
  /** Datumi vanstandardnog perioda, npr. "01.10.2026. — 05.10.2026." */
  earlyPeriodLabel?: string;
  /** Ustanova iz Podešavanja: logo, naziv i kontakt u zaglavlju */
  facility?: Facility;
  /** Napomena uprave — štampa se ispod tabela */
  note?: string;
  /** "print" otvara dijalog za štampu, "preview" vraća adresu PDF-a za pregled u aplikaciji */
  mode?: "download" | "print" | "preview";
}

export const generateSpecificationPDF = async (params: GeneratePDFParams): Promise<string | undefined> => {
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
    earlyLodgingNote = "",
    earlyPeriodLabel = "",
    note = "",
  } = params;

  const formatDate = (dateStr: string) => formatDay(dateStr);
  const periodText = `${formatDate(startDate)} – ${formatDate(endDate)}`;
  const noteText = note.trim();

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

  // Red sa iznosom u RSD i EUR
  const moneyRow = (label: string, rsd: number, eur: number, bold = false) => [
    { text: label, bold },
    { text: money.format(rsd), bold, alignment: "center" },
    { text: money.format(eur), bold, alignment: "center" },
  ];
  // Zaglavlje "RSD ili EUR" u jednoj ćeliji (bez linije između): porodica plaća u jednoj ili drugoj valuti.
  // "ili" je na granici kolona, a RSD i EUR centrirani tačno iznad svojih (centriranih) iznosa.
  const moneyHeader = [
    { text: "" },
    {
      colSpan: 2,
      columns: [
        { width: "*", text: "RSD", bold: true, alignment: "center" },
        { width: "auto", text: "ili", color: "#666" },
        { width: "*", text: "EUR", bold: true, alignment: "center" },
      ],
    },
    {},
  ];

  // Redovi duga, smeštaja i vanstandardnog perioda smeštaja — samo uključeni (isti u prvoj i završnoj tabeli)
  const extraRows = [
    ...(includeDebt ? [moneyRow("Dug iz prethodnog perioda", debtRSD, debtEUR)] : []),
    ...(includeLodging ? [moneyRow(`Smeštaj za period ${nextPeriodLabel}`, lodgingRSD, lodgingEUR)] : []),
    ...(includeEarlyLodging
      ? [moneyRow(`Smeštaj za period${earlyPeriodLabel ? ` ${earlyPeriodLabel}` : ""}${earlyLodgingNote ? ` – ${earlyLodgingNote}` : ""}`, earlyLodgingRSD, earlyLodgingEUR)]
      : []),
  ];
  const extraRSD = (includeDebt ? debtRSD : 0) + (includeLodging ? lodgingRSD : 0) + (includeEarlyLodging ? earlyLodgingRSD : 0);
  const extraEUR = (includeDebt ? debtEUR : 0) + (includeLodging ? lodgingEUR : 0) + (includeEarlyLodging ? earlyLodgingEUR : 0);

  // ✅ ZAJEDNIČKE ŠIRINE KOLONA za sve tri tabele
  // Prva kolona fleksibilna, druga fiksna 70, treća fiksna 70 (možeš prilagoditi)
  const colWidths = ["*", 70, 70];

  // Zbijeni redovi tabela: manje vazduha iznad i ispod teksta u ćeliji
  const tableLayout = (hLineWidth: (i: number) => number = () => 0.5) => ({
    hLineWidth,
    vLineWidth: () => 0.5,
    hLineColor: () => "#aaa",
    vLineColor: () => "#aaa",
    paddingTop: () => 1,
    paddingBottom: () => 1,
  });
  const LINE_GAP = 14; // visina jednog reda teksta

  // pdfmake tipovi zahtevaju literalne tipove (npr. alignment: "right") za svaku ćeliju;
  // struktura je proverena ručno, pa se tip dodeljuje jednom na kraju.
  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 50, 40, 50],
    content: [
      // Logo i podaci ustanove levo
      {
        stack: [
          logoBase64
            ? { image: logoBase64, fit: [170, 60], alignment: "left", margin: [0, 0, 0, 4] }
            : { text: facility.name, style: "facilityName" },
          logoBase64 ? { text: facility.name, bold: true, fontSize: 9 } : { text: facility.subtitle, fontSize: 9, color: "#555" },
          contactLine ? { text: contactLine, fontSize: 8, color: "#666", margin: [0, 2, 0, 0] } : { text: "" },
        ],
        margin: [0, 0, 0, 8],
      },
      // Ime i prezime pacijenta na sredini
      { text: patientName, style: "patientName", alignment: "center", margin: [0, 0, 0, 12] },
      // Period (centriran)
      

      // Tabela 1 – dug i/ili smeštaj (samo ono što je uključeno)
      ...(extraRows.length > 0
        ? [
            // Bez naslova: redovi tabele ("Smeštaj za period ...", "Dug iz prethodnog perioda") govore sami
            {
              table: {
                widths: colWidths,
                body: [
                  moneyHeader,
                  ...extraRows,
                  ...(extraRows.length > 1 ? [moneyRow("UKUPNO", extraRSD, extraEUR, true)] : []),
                ],
              },
              layout: tableLayout(),
              margin: [0, 10, 0, 15],
            },
          ]
        : []),

      // Tabela 2 – Specifikacija
      // Posle naslova razmak visine jednog reda, pa tabela
      { text: `Specifikacija troškova za period: ${periodText}`, bold: true, alignment: "left", margin: [0, 0, 0, LINE_GAP] },
      {
        table: {
          widths: colWidths,
          body: [
            [
              { text: "NAZIV", bold: true },
              { text: "KOLIČINA", bold: true, alignment: "center" },
              { text: "RSD", bold: true, alignment: "center" },
            ],
            ...items.map((item) => [
              // Cene analiza (cifre) su sitnije, da ne izgledaju veće od slova naziva
              item.priceList
                ? { text: [{ text: item.formattedName }, { text: ` = ${item.priceList}`, fontSize: 9 }] }
                : { text: item.formattedName },
              { text: qtyFmt.format(item.amount), alignment: "center" },
              { text: money.format(item.price), alignment: "center" },
            ]),
            [
              { text: "" },
              { text: "Ukupno", bold: true, alignment: "center" },
              { text: money.format(specTotalRSD), bold: true, alignment: "center" },
            ],
          ],
        },
        layout: tableLayout(),
        margin: [0, 0, 0, 15],
      },

      // Tabela 3 – Konačan obračun
      { text: "Konačan obračun", style: "subheader", margin: [0, 10, 0, 5] },
      {
        table: {
          widths: colWidths,
          body: [
            moneyHeader,
            moneyRow("Specifikacija troškova", specTotalRSD, specEUR),
            ...extraRows,
            moneyRow("Račun za naplatu (ukupno)", totalRSD, totalEUR, true),
          ],
        },
        layout: tableLayout((i: number) => (i === 0 || i === 2 + extraRows.length ? 0.5 : 0.2)),
        margin: [0, 0, 0, 15],
      },

      // Napomena ispod svih tabela (levo)
      ...(noteText
        ? [
            { text: "Napomena:", bold: true, margin: [0, 5, 0, 3] },
            { text: noteText, fontSize: 10, alignment: "left" },
          ]
        : []),
    ],
    footer: facility.bankAccount
      ? { text: `Uplata na račun: ${facility.bankAccount} · ${facility.name}`, fontSize: 8, color: "#666", alignment: "center", margin: [40, 20, 40, 0] }
      : undefined,
    defaultStyle: { fontSize: 11 },
    styles: {
      facilityName: { fontSize: 13, bold: true },
      patientName: { fontSize: 14, bold: true },
      subheader: { fontSize: 12, bold: true },
    },
  } as unknown as TDocumentDefinitions;

  const pdf = pdfMake.createPdf(inScript(docDefinition, getScript()));
  if (mode === "preview") return URL.createObjectURL(await pdf.getBlob());
  if (mode === "print") {
    pdf.print();
  } else {
    pdf.download(`specifikacija-${patientName}-${periodText.replace(/[^a-z0-9]/gi, "_")}.pdf`);
  }
};
