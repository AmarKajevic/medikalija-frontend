import { useParams, Link } from "react-router";
import { useState } from "react";
import axios from "axios";
import { useSingleSpecification } from "../../hooks/Patient/usePatientSpecification";
import { useAuth } from "../../context/AuthContext";

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";

export default function SpecificationViewPage() {
  const { specificationId } = useParams();
  const { data: spec, isLoading, isError, refetch } = useSingleSpecification(specificationId || "");
  const { token } = useAuth();

  // ✅ lokalni state kao u PatientSpecification
  const [lodgingPrice, setLodgingPrice] = useState<number>(0);
  const [extraCostAmount, setExtraCostAmount] = useState<number>(0);
  const [extraCostLabel, setExtraCostLabel] = useState<string>("");

  if (isLoading) return <p>Učitavanje...</p>;
  if (isError) return <p>Greška pri učitavanju specifikacije.</p>;
  if (!spec) return <p>Specifikacija nije pronađena.</p>;

  // ✅ izvlacenje vrednosti iz items
  const lodgingItem = spec.items.find((i: any) => i.category === "lodging");
  const extraItem = spec.items.find((i: any) => i.category === "extra");

  const lodgingExisting = lodgingItem ? lodgingItem.price ?? 0 : 0;
  const extraExistingAmount = extraItem ? extraItem.price ?? 0 : 0;
  const extraExistingLabel = extraItem ? extraItem.name ?? "" : "";

  // ✅ FUNKCIJA ZA DODAVANJE TROŠKOVA (ISTO KAO U PATIENTSPECIFICATION)
  const addCosts = async () => {
    try {
      await axios.post(
        `http://localhost:5000/api/specification/${spec._id}/add-costs`,
        { lodgingPrice, extraCostAmount, extraCostLabel },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await refetch();

      setLodgingPrice(0);
      setExtraCostAmount(0);
      setExtraCostLabel("");

    } catch (err) {
      console.error("Greška pri dodavanju troškova:", err);
    }
  };

  // ✅ WORD EXPORT (NE DIRAMO OSIM PRIKAZA TROŠKOVA)
  const generateWord = () => {
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({
            children: [
              new TextRun({ text: "Opis", bold: true })
            ]
          })] }),
          new TableCell({ children: [new Paragraph({
              children: [
                new TextRun({ text: "Kolicina", bold: true })
              ]
            })] }),
          new TableCell({ children: [new Paragraph({
            children: [
                new TextRun({ text: "Cena (RSD)", bold: true })
              ] 
            })] }),
        ],
      }),

      ...spec.items.map((item: any) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(item.name ?? "Nepoznata stavka")] }),
            new TableCell({ children: [new Paragraph((item.amount ?? 1).toString())] }),
            new TableCell({ children: [new Paragraph((item.price ?? 0).toFixed(2))] }),
          ],
        })
      ),

      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Cena smeštaja")] }),
          new TableCell({ children: [new Paragraph("—")] }),
          new TableCell({ children: [new Paragraph(lodgingExisting.toFixed(2))] }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(`Dodatni trošak — ${extraExistingLabel}`)] }),
          new TableCell({ children: [new Paragraph("—")] }),
          new TableCell({ children: [new Paragraph(extraExistingAmount.toFixed(2))] }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("")] }),
          new TableCell({ children: [new Paragraph({
            children: [
              new TextRun({ text: "Ukupno", bold: true })
            ]
          })] }),
          new TableCell({ children: [new Paragraph({
            children: [
              new TextRun({ text: (spec.totalPrice ?? 0).toFixed(2), bold: true})
            ]
          })] }),
          
        ],
      }),
    ];

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ children: [new TextRun({ text: "Specifikacija pacijenta", bold: true, size: 28 })] }),
            new Paragraph({
              text: `Period: ${new Date(spec.startDate).toLocaleDateString("sr-RS")} — ${new Date(spec.endDate).toLocaleDateString("sr-RS")}`,
            }),
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `specifikacija-${spec._id}.docx`);
    });
  };

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Specifikacija pacijenta</h2>
        <Link to={-1 as any} className="text-blue-600 hover:underline">
          Nazad
        </Link>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        Period: {new Date(spec.startDate).toLocaleDateString("sr-RS")} — {new Date(spec.endDate).toLocaleDateString("sr-RS")}
      </p>

      {/* ✅ GLAVNA TABELA */}
      <table className="w-full border-collapse border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Opis</th>
            <th className="border p-2 text-right">Količina</th>
            <th className="border p-2 text-right">Cena (RSD)</th>
          </tr>
        </thead>
        <tbody>
          {spec.items?.map((item: any) => (
            <tr key={item._id}>
              <td className="border p-2">{item.formattedName}</td>
              <td className="border p-2 text-right">{item.amount ?? "1"}</td>
              <td className="border p-2 text-right">{(item.price ?? 0).toFixed(2)} RSD</td>
            </tr>
          ))}

          <tr className="font-semibold bg-gray-50">
            <td></td>
            <td className="border p-2 text-right">Ukupno:</td>
            <td className="border p-2 text-right">{(spec.totalPrice ?? 0).toFixed(2)} RSD</td>
          </tr>
        </tbody>
      </table>

      {/* ✅ DRUGA TABELA — ISTA KAO U PatientSpecification */}
      <h3 className="text-lg font-semibold mb-2">Dodaj troškove</h3>

      <table className="w-full border-collapse border border-gray-300 mb-4">
        <tbody>
          <tr>
            <td className="border p-2 font-medium">Cena smeštaja</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                value={lodgingPrice}
                onChange={(e) => setLodgingPrice(Number(e.target.value))}
                className="border-4 rounded p-1 w-32 text-right"
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2 font-medium">Dodatni trošak — opis</td>
            <td className="border p-2 text-right">
              <input
                type="text"
                value={extraCostLabel}
                onChange={(e) => setExtraCostLabel(e.target.value)}
                className="border-4 rounded p-1 w-full"
                placeholder="npr. dodatna terapija"
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2 font-medium">Dodatni trošak — iznos</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                value={extraCostAmount}
                onChange={(e) => setExtraCostAmount(Number(e.target.value))}
                className="border-4 rounded p-1 w-32 text-right"
              />
            </td>
          </tr>
        </tbody>
      </table>
          <div className="flex justify-between">
           

      {/* ✅ WORD DOWNLOAD */}
      <button
        onClick={generateWord}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6"
      >
        Preuzmi Word dokument
      </button>
      <button
        onClick={addCosts}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-6"
      >
        Dodaj troškove
      </button>
          </div>
     

    </div>
  );
}
