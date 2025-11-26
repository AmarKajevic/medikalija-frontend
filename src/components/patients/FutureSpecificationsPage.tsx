import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

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
  const { token } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["future-specs", patientId],
    queryFn: async () => {
      const res = await axios.get(
        `https://medikalija-api.vercel.app/api/specification/${patientId}/future-spec-periods`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data.periods;
    },
  });

  if (isLoading) return <p>Učitavanje...</p>;
  if (isError) return <p className="text-red-500">Greška pri učitavanju.</p>;

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
    <div className="max-w-4xl mx-auto p-4 space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Specifikacije za narednih 10 godina</h1>

        <button
          onClick={downloadWord}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          ⬇️ Preuzmi Word
        </button>
      </div>

      {/* Render tabele po godinama */}
      {Object.keys(groupedByYear).map((year) => (
        <div key={year}>
          <h2 className="text-xl font-bold mb-3 text-blue-700">
            Godina {year}
          </h2>

          <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-300">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-200 text-gray-800">
                <tr>
                  <th className="p-3 border font-semibold">#</th>
                  <th className="p-3 border font-semibold">Početak</th>
                  <th className="p-3 border font-semibold">Kraj</th>
                </tr>
              </thead>

              <tbody>
                {groupedByYear[Number(year)].map((p: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-3 border">{index + 1}</td>
                    <td className="p-3 border">
                      {new Date(p.startDate).toLocaleDateString("sr-RS")}
                    </td>
                    <td className="p-3 border">
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
