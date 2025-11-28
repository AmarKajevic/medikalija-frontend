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
  const { data: spec, isLoading, isError, refetch } =
    useSingleSpecification(specificationId || "");
  const { token } = useAuth();

  // BACKEND TROŠKOVI
  const [lodgingPrice, setLodgingPrice] = useState<number | "">("");
  const [extraCostAmount, setExtraCostAmount] = useState<number | "">("");
  const [extraCostLabel, setExtraCostLabel] = useState<string>("");

  // FRONTEND obračun (EUR)
  const [previousDebtEUR, setPreviousDebtEUR] = useState<number | "">("");
  const [nextLodgingEUR, setNextLodgingEUR] = useState<number | "">("");

  const [lowerExchangeRate, setLowerExchangeRate] = useState<number | "">("");
  const [middleExchangeRate, setMiddleExchangeRate] = useState<number | "">("");

  if (isLoading) return <p>Učitavanje...</p>;
  if (isError) return <p>Greška pri učitavanju specifikacije.</p>;
  if (!spec) return <p>Specifikacija nije pronađena.</p>;

  // PERIOD NAREDNIH 30 DANA
  const currentEndDate = new Date(spec.endDate);
  const nextStartDate = new Date(currentEndDate);
  nextStartDate.setDate(nextStartDate.getDate() + 1);

  const nextEndDate = new Date(nextStartDate);
  nextEndDate.setDate(nextEndDate.getDate() + 29);

  const nextPeriodLabel = `${nextStartDate.toLocaleDateString(
    "sr-RS"
  )} — ${nextEndDate.toLocaleDateString("sr-RS")}`;

  // -------------------------------------------------------
  // KONVERZIJE
  // -------------------------------------------------------

  const specTotalRSD = spec.totalPrice ?? 0;

  const debtEUR = previousDebtEUR === "" ? 0 : Number(previousDebtEUR);
  const lodgingEUR = nextLodgingEUR === "" ? 0 : Number(nextLodgingEUR);

  const lowRate = lowerExchangeRate === "" ? 0 : Number(lowerExchangeRate);
  const midRate = middleExchangeRate === "" ? 0 : Number(middleExchangeRate);

  // SPECIFIKACIJA: RSD → EUR
  const specEUR = lowRate > 0 ? specTotalRSD / lowRate : 0;

  // DUG: EUR → RSD
  const debtRSD = midRate > 0 ? debtEUR * midRate : 0;

  // SMEŠTAJ: EUR → RSD
  const lodgingRSD = midRate > 0 ? lodgingEUR * midRate : 0;

  // TOTAL
  const totalRSD = specTotalRSD + debtRSD + lodgingRSD;
  const totalEUR = specEUR + debtEUR + lodgingEUR;

  // -------------------------------------------------------
  // BACKEND ADD COSTS
  // -------------------------------------------------------
  const addCosts = async () => {
    try {
      await axios.post(
        `https://medikalija-api.vercel.app/api/specification/${spec._id}/add-costs`,
        {
          lodgingPrice: lodgingPrice === "" ? 0 : Number(lodgingPrice),
          extraCostAmount:
            extraCostAmount === "" ? 0 : Number(extraCostAmount),
          extraCostLabel,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await refetch();
      setLodgingPrice("");
      setExtraCostAmount("");
      setExtraCostLabel("");
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------
  // WORD EXPORT
  // -------------------------------------------------------
  const generateWord = () => {
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Opis")] }),
          new TableCell({ children: [new Paragraph("Količina")] }),
          new TableCell({ children: [new Paragraph("Cena (RSD)")] }),
        ],
      }),

      ...spec.items.map(
        (item: any) =>
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph(item.formattedName ?? item.name ?? "Stavka"),
                ],
              }),
              new TableCell({
                children: [new Paragraph((item.amount ?? 1).toString())],
              }),
              new TableCell({
                children: [
                  new Paragraph((item.price ?? 0).toFixed(2).toString()),
                ],
              }),
            ],
          })
      ),

      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("")] }),
          new TableCell({ children: [new Paragraph("Ukupno")] }),
          new TableCell({
            children: [new Paragraph(specTotalRSD.toFixed(2).toString())],
          }),
        ],
      }),
    ];

    const summaryRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Stavka")] }),
          new TableCell({ children: [new Paragraph("RSD")] }),
          new TableCell({ children: [new Paragraph("EUR")] }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Specifikacija (niži kurs)")],
          }),
          new TableCell({
            children: [new Paragraph(specTotalRSD.toFixed(2).toString())],
          }),
          new TableCell({
            children: [new Paragraph(specEUR.toFixed(2).toString())],
          }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Dug iz prethodnog perioda")],
          }),
          new TableCell({
            children: [new Paragraph(debtRSD.toFixed(2).toString())],
          }),
          new TableCell({
            children: [new Paragraph(debtEUR.toFixed(2).toString())],
          }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph(
                `Smeštaj narednih 30 dana (${nextPeriodLabel})`
              ),
            ],
          }),
          new TableCell({
            children: [new Paragraph(lodgingRSD.toFixed(2).toString())],
          }),
          new TableCell({
            children: [new Paragraph(lodgingEUR.toFixed(2).toString())],
          }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("UKUPNO")] }),
          new TableCell({ children: [new Paragraph(totalRSD.toFixed(2).toString())] }),
          new TableCell({ children: [new Paragraph(totalEUR.toFixed(2).toString())] }),
        ],
      }),
    ];

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Specifikacija pacijenta", bold: true, size: 28 })],
            }),
            new Paragraph({
              text: `Period: ${new Date(spec.startDate).toLocaleDateString(
                "sr-RS"
              )} — ${new Date(spec.endDate).toLocaleDateString("sr-RS")}`,
            }),
            new Paragraph(""),
            new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
            new Paragraph(""),
            new Paragraph({
              children: [new TextRun({ text: "Obračun naplate", bold: true, size: 26 })],
            }),
            new Table({ rows: summaryRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `specifikacija-${spec._id}.docx`);
    });
  };

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------
  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Specifikacija pacijenta</h2>
        <Link to={-1 as any} className="text-blue-600 hover:underline">
          Nazad
        </Link>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        Period: {new Date(spec.startDate).toLocaleDateString("sr-RS")} —{" "}
        {new Date(spec.endDate).toLocaleDateString("sr-RS")}
      </p>

      {/* GLAVNA TABELA */}
      <table className="w-full border-collapse border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Opis</th>
            <th className="border p-2 text-right">Količina</th>
            <th className="border p-2 text-right">Cena (RSD)</th>
          </tr>
        </thead>
        <tbody>
          {spec.items.map((item: any) => (
            <tr key={item._id}>
              <td className="border p-2">{item.formattedName ?? item.name}</td>
              <td className="border p-2 text-right">{item.amount ?? 1}</td>
              <td className="border p-2 text-right">
                {(item.price ?? 0).toFixed(2)}
              </td>
            </tr>
          ))}
          <tr className="font-bold bg-gray-50">
            <td></td>
            <td className="border p-2 text-right">Ukupno:</td>
            <td className="border p-2 text-right">
              {specTotalRSD.toFixed(2)} RSD
            </td>
          </tr>
        </tbody>
      </table>

      {/* BACKEND TROŠKOVI */}
      <h3 className="text-lg font-semibold mb-2">Dodaj troškove</h3>

      <table className="w-full border-collapse border border-gray-300 mb-4">
        <tbody>
          <tr>
            <td className="border p-2 font-medium">Cena smeštaja (RSD)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                value={lodgingPrice}
                onChange={(e) =>
                  setLodgingPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="npr. 35000"
                className="border p-1 rounded w-32 text-right"
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
                className="border p-1 rounded w-full"
                placeholder="npr. terapija"
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2 font-medium">Dodatni trošak — iznos (RSD)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                value={extraCostAmount}
                onChange={(e) =>
                  setExtraCostAmount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="npr. 1500"
                className="border p-1 rounded w-32 text-right"
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-end mb-6">
        <button
          onClick={addCosts}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Sačuvaj troškove
        </button>
       
      </div>

      {/* NAPLATA U EUR */}
      <h3 className="text-lg font-semibold mt-6 mb-2">
        Obračun naplate (unos u EUR)
      </h3>

      <table className="w-full border-collapse border border-gray-400 mb-6">
        <tbody>
          <tr>
            <td className="border p-2">Dug iz prethodnog perioda (EUR)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                value={previousDebtEUR}
                onChange={(e) =>
                  setPreviousDebtEUR(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="npr. 50"
                className="border p-1 rounded w-32 text-right"
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2">
              Smeštaj narednih 30 dana (EUR)
              <br />
              <span className="text-xs text-gray-500">{nextPeriodLabel}</span>
            </td>
            <td className="border p-2 text-right">
              <input
                type="number"
                value={nextLodgingEUR}
                onChange={(e) =>
                  setNextLodgingEUR(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="npr. 350"
                className="border p-1 rounded w-32 text-right"
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2 font-medium">Niži kurs (specifikacija)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                value={lowerExchangeRate}
                onChange={(e) =>
                  setLowerExchangeRate(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="npr. 117.20"
                className="border p-1 rounded w-32 text-right"
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2 font-medium">Srednji kurs (dug + smeštaj)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                value={middleExchangeRate}
                onChange={(e) =>
                  setMiddleExchangeRate(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="npr. 117.75"
                className="border p-1 rounded w-32 text-right"
              />
            </td>
          </tr>
        </tbody>
      </table>

      {/* KONVERZIJA */}
      <h3 className="text-lg font-semibold mb-2">Konverzija</h3>

      <table className="w-full border-collapse border border-gray-400 mb-10">
        <tbody>
          <tr>
            <td className="border p-2">Specifikacija (EUR)</td>
            <td className="border p-2 text-right">{specEUR.toFixed(2)}</td>
          </tr>

          <tr>
            <td className="border p-2">Dug iz prethodnog perioda (EUR)</td>
            <td className="border p-2 text-right">{debtEUR.toFixed(2)}</td>
          </tr>

          <tr>
            <td className="border p-2">Smeštaj (EUR)</td>
            <td className="border p-2 text-right">{lodgingEUR.toFixed(2)}</td>
          </tr>

          <tr className="font-bold bg-gray-50">
            <td className="border p-2">UKUPNO (RSD)</td>
            <td className="border p-2 text-right">{totalRSD.toFixed(2)}</td>
          </tr>

          <tr className="font-bold bg-gray-50">
            <td className="border p-2">UKUPNO (EUR)</td>
            <td className="border p-2 text-right">{totalEUR.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <div className="flex justify-end mb-6">
         <button
          onClick={generateWord}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Preuzmi Word
        </button>
      </div>
    </div>
  );
}
