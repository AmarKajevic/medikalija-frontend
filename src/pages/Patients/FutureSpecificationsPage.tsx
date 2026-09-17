import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/api/api";

// ⭐ DOCX
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  TextRun,
} from "docx";
import { saveAs } from "file-saver";

export default function FutureSpecificationsPage() {
  const { patientId } = useParams<{ patientId: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["future-specs", patientId],
    queryFn: async () => {
      const res = await api.get(`/api/specification/${patientId}/future-spec-periods`);
      return res.data.periods;
    },
  });

  if (isLoading) return <p className="p-6 text-sm text-gray-500 dark:text-gray-400">Učitavanje...</p>;
  if (isError) return <p className="p-6 text-sm text-error-500">Greška pri učitavanju.</p>;

  // ----------------------------
  // ⭐ Grupisanje po godinama
  // ----------------------------
  const groupedByYear: Record<number, any[]> = {};

  data.forEach((period: any) => {
    const year = new Date(period.startDate).getFullYear();
    if (!groupedByYear[year]) groupedByYear[year] = [];
    groupedByYear[year].push(period);
  });

  // -----------------------------------------
  // ⭐ Word Export – tabele kao u specifikaciji
  // -----------------------------------------
  const downloadWord = async () => {
    const sections: any[] = [];

    Object.keys(groupedByYear).forEach((year) => {
      const yearTitle = new Paragraph({
        children: [
          new TextRun({
            text: `Godina ${year}`,
          }),
        ],
        spacing: { after: 300 },
      });

      // Header row
      const headerRow = new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun("#")] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun("Početak")] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun("Kraj")] })],
          }),
        ],
      });

      // Data rows
      const rows = (groupedByYear as any)[year].map(
        (p: any, index: number) =>
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph(String(index + 1))],

                
              }),
              new TableCell({
                children: [
                  new Paragraph(
                    new Date(p.startDate).toLocaleDateString("sr-RS")
                  ),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph(
                    new Date(p.endDate).toLocaleDateString("sr-RS")
                  ),
                ],
              }),
            ],
          })
      );

      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...rows],
      });

      sections.push({
        properties: {},
        children: [
          yearTitle,
          table,
          new Paragraph({ text: "", spacing: { after: 500 } }),
        ],
      });
    });

    const doc = new Document({ sections });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "specifikacije_narednih_5_godina.docx");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Specifikacije za narednih 10 godina
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pregled svih budućih 30-dnevnih obračunskih perioda za ovog pacijenta.
          </p>
        </div>

        <button
          onClick={downloadWord}
          className="rounded-lg bg-success-500 px-4 py-2 text-sm font-medium text-white hover:bg-success-600"
        >
          ⬇️ Preuzmi Word
        </button>
      </div>

      {/* Render tabele po godinama */}
      {Object.keys(groupedByYear).map((year) => (
        <div key={year} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            Godina {year}
          </h2>

          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Početak</th>
                  <th className="p-3">Kraj</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {groupedByYear[Number(year)].map((p: any, index: number) => (
                  <tr key={index} className="text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.03]">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">
                      {new Date(p.startDate).toLocaleDateString("sr-RS")}
                    </td>
                    <td className="p-3">
                      {new Date(p.endDate).toLocaleDateString("sr-RS")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
