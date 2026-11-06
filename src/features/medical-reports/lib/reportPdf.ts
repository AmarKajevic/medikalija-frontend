// PDF lekarskog izveštaja. Učitava se tek na zahtev (pdfmake je velik).
import pdfMake from "pdfmake/build/pdfmake";
import vfsFonts from "pdfmake/build/vfs_fonts";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { loadImageAsBase64 } from "@shared/lib/loadImageAsBase64";
import { getScript } from "@shared/lib/script";
import { inScript } from "@shared/lib/pdfScript";
import { type Facility, facilityContactLine } from "@entities/facility/facility";
import { MedicalReport, reportTypeLabel } from "@features/medical-reports/model";

(pdfMake as unknown as { vfs: unknown }).vfs = vfsFonts;

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const dateOnly = (iso: string) => new Date(iso).toLocaleDateString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric" });
const person = (p?: { name: string; lastName: string }) => (p ? `${p.name} ${p.lastName}` : "");

function section(title: string, body: string | undefined): Content[] {
  if (!body?.trim()) return [];
  return [
    { text: title.toUpperCase(), style: "label", margin: [0, 10, 0, 3] },
    { text: body, style: "body" },
  ];
}

export async function generateReportPDF(report: MedicalReport, facility: Facility, mode: "download" | "print" = "download") {
  let logo = "";
  if (facility.logo) logo = await loadImageAsBase64(facility.logo).catch(() => "");

  const v = report.vitals ?? ({} as MedicalReport["vitals"]);
  const vitals = [
    v.bloodPressure && `TA ${v.bloodPressure} mmHg`,
    v.pulse != null && `puls ${v.pulse}/min`,
    v.temperature != null && `TT ${String(v.temperature).replace(".", ",")} °C`,
    v.spo2 != null && `SpO2 ${v.spo2}%`,
    v.glucose != null && `glikemija ${String(v.glucose).replace(".", ",")} mmol/L`,
    v.weight != null && `TM ${String(v.weight).replace(".", ",")} kg`,
  ].filter(Boolean) as string[];

  const draft = report.status !== "signed";
  const contact = facilityContactLine(facility);

  const content: Content[] = [
    {
      columns: [
        logo ? { image: logo, fit: [120, 50], width: 130 } : { text: "", width: 0 },
        {
          width: "*",
          stack: [
            { text: facility.name, bold: true, fontSize: 12 },
            ...(facility.subtitle ? [{ text: facility.subtitle, fontSize: 9, color: "#555" }] : []),
            ...(contact ? [{ text: contact, fontSize: 8, color: "#666", margin: [0, 2, 0, 0] as [number, number, number, number] }] : []),
          ],
        },
      ],
      columnGap: 10,
    },
    { canvas: [{ type: "line", x1: 0, y1: 6, x2: 515, y2: 6, lineWidth: 0.5, lineColor: "#999" }], margin: [0, 4, 0, 10] },
    { text: `${reportTypeLabel(report.type)}${draft ? " — NACRT" : ""}`.toUpperCase(), style: "title" },
    {
      columns: [
        { stack: [{ text: "Pacijent", style: "label" }, { text: person(report.patient), bold: true }, ...(report.patient.dateOfBirth ? [{ text: `rođ. ${dateOnly(report.patient.dateOfBirth)}`, fontSize: 9 }] : [])] },
        { stack: [{ text: "Datum pregleda", style: "label" }, { text: dateTime(report.visitDate) }], alignment: "right" },
      ],
      margin: [0, 8, 0, 4],
    },
    ...(vitals.length ? [{ text: "VITALNI PARAMETRI", style: "label", margin: [0, 10, 0, 3] } as Content, { text: vitals.join("   ·   "), style: "body" } as Content] : []),
    ...section("Anamneza", report.anamnesis),
    ...section("Objektivni nalaz", report.findings),
    ...(report.diagnoses.length
      ? [
          { text: "DIJAGNOZE", style: "label", margin: [0, 10, 0, 3] } as Content,
          { ul: report.diagnoses.map((d) => ({ text: [d.code ? { text: `${d.code}  `, bold: true } : "", d.name] })), style: "body" } as Content,
        ]
      : []),
    ...section("Terapija", report.therapy),
    ...section("Zaključak i preporuke", report.conclusion),
    ...(report.followUp?.date ? section("Kontrola", `${dateOnly(report.followUp.date)}${report.followUp.note ? ` — ${report.followUp.note}` : ""}`) : []),
    ...report.addenda.flatMap((a) => section(`Dopuna ${dateTime(a.createdAt)} — ${person(a.author)}`, a.text)),
    {
      columns: [
        { text: "" },
        {
          width: 200,
          stack: [
            { text: draft ? "Nacrt — nije potpisan" : `Potpisano ${report.signedAt ? dateTime(report.signedAt) : ""}`, fontSize: 8, color: "#666" },
            { text: `dr ${person(report.author)}`, bold: true, margin: [0, 24, 0, 0] },
            { canvas: [{ type: "line", x1: 0, y1: 2, x2: 200, y2: 2, lineWidth: 0.5 }] },
            { text: "potpis i faksimil", fontSize: 7, color: "#888", margin: [0, 2, 0, 0] },
          ],
        },
      ],
      margin: [0, 30, 0, 0],
    },
  ];

  const doc: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 50],
    ...(draft ? { watermark: { text: "NACRT", color: "#bbb", opacity: 0.25, bold: true } } : {}),
    content,
    footer: (page, pages) => ({ text: `${facility.name} · ${person(report.patient)} · strana ${page}/${pages}`, fontSize: 7, color: "#888", alignment: "center", margin: [40, 20, 40, 0] }),
    styles: {
      title: { fontSize: 14, bold: true, alignment: "center", margin: [0, 0, 0, 4] },
      label: { fontSize: 8, bold: true, color: "#666" },
      body: { fontSize: 10, lineHeight: 1.25 },
    },
    defaultStyle: { fontSize: 10 },
  };

  const pdf = pdfMake.createPdf(inScript(doc, getScript()));
  const fileName = `izvestaj-${person(report.patient).replace(/\s+/g, "-")}-${dateOnly(report.visitDate).replace(/\./g, "-")}.pdf`;
  if (mode === "print") pdf.print();
  else pdf.download(fileName);
}
