import { useParams } from "react-router";
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

  // ❗ OVO OSTAJE – dodatni troškovi u RSD (backend)
  const [extraCostAmount, setExtraCostAmount] = useState<number>(0);
  const [extraCostLabel, setExtraCostLabel] = useState<string>("");

  // ❗ NOVO — OBA IZNOSE UNOSIMO U EUR
  const [previousDebtEUR, setPreviousDebtEUR] = useState<number>(0); // dug iz prethodnog perioda
  const [nextLodgingEUR, setNextLodgingEUR] = useState<number>(0); // smeštaj za naredni period

  // kurs
  const [lowerExchangeRate, setLowerExchangeRate] = useState<number>(0);
  const [middleExchangeRate, setMiddleExchangeRate] = useState<number>(0);

  if (isLoading) return <p>Učitavanje...</p>;
  if (isError) return <p>Greška pri učitavanju.</p>;
  if (!spec) return <p>Specifikacija nije pronađena.</p>;

  // postojeće stavke
const extraItem = spec.items.find((i: any) => i.category === "extra");

const extraExistingAmount = extraItem ? extraItem.price ?? 0 : 0;
const extraExistingLabel = extraItem ? extraItem.name ?? "" : "";



  // -----------------------------------------------
  // DODAVANJE TROŠKOVA (backend)
  // -----------------------------------------------
  const addCosts = async () => {
    try {
      await axios.post(
        `https://medikalija-api.vercel.app/api/specification/${spec._id}/add-costs`,
        { extraCostAmount, extraCostLabel },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await refetch();
      setExtraCostAmount(0);
      setExtraCostLabel("");
    } catch (err) {
      console.error("Greška pri dodavanju:", err);
    }
  };

  // -----------------------------------------------
  // PERIOD SLEDEĆEG SMEŠTAJA
  // -----------------------------------------------
  const currentEndDate = new Date(spec.endDate);
  const nextStartDate = new Date(currentEndDate);
  nextStartDate.setDate(nextStartDate.getDate() + 1);

  const nextEndDate = new Date(nextStartDate);
  nextEndDate.setDate(nextEndDate.getDate() + 29);

  const nextPeriodLabel =
    `${nextStartDate.toLocaleDateString("sr-RS")} — ` +
    nextEndDate.toLocaleDateString("sr-RS");

  // -----------------------------------------------
  // OBRAČUN (EUR & RSD)
  // -----------------------------------------------
  const specTotalRSD = spec.totalPrice ?? 0;

  const debtRSD =
    middleExchangeRate > 0 ? previousDebtEUR * middleExchangeRate : 0;

  const lodgingNextRSD =
    middleExchangeRate > 0 ? nextLodgingEUR * middleExchangeRate : 0;

  const specEUR =
    lowerExchangeRate > 0 ? specTotalRSD / lowerExchangeRate : 0;

  const totalRSD = specTotalRSD + debtRSD + lodgingNextRSD;
  const totalEUR = specEUR + previousDebtEUR + nextLodgingEUR;

  // -----------------------------------------------
  // WORD EXPORT
  // -----------------------------------------------
  const generateWord = () => {
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun("Opis")] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun("Količina")] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun("Cena (RSD)")] })],
          }),
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
                children: [new Paragraph(String(item.amount ?? 1))],
              }),
              new TableCell({
                children: [new Paragraph((item.price ?? 0).toFixed(2))],
              }),
            ],
          })
      ),

      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph(
                `Dodatni trošak – ${extraExistingLabel || "nema"}`
              ),
            ],
          }),
          new TableCell({ children: [new Paragraph("—")] }),
          new TableCell({
            children: [new Paragraph(extraExistingAmount.toFixed(2))],
          }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("")] }),
          new TableCell({
            children: [new Paragraph("Ukupno (RSD)")],
          }),
          new TableCell({
            children: [new Paragraph(specTotalRSD.toFixed(2))],
          }),
        ],
      }),
    ];

    const summaryRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Ukupna specifikacija (niži kurs)")],
          }),
          new TableCell({
            children: [new Paragraph(specTotalRSD.toFixed(2))],
          }),
          new TableCell({
            children: [new Paragraph(specEUR.toFixed(2))],
          }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Dug iz prethodnog perioda (EUR)")],
          }),
          new TableCell({
            children: [new Paragraph(debtRSD.toFixed(2))],
          }),
          new TableCell({
            children: [new Paragraph(previousDebtEUR.toFixed(2))],
          }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph(
                `Smeštaj za narednih 30 dana – ${nextPeriodLabel} (EUR)`
              ),
            ],
          }),
          new TableCell({
            children: [new Paragraph(lodgingNextRSD.toFixed(2))],
          }),
          new TableCell({
            children: [new Paragraph(nextLodgingEUR.toFixed(2))],
          }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("UKUPNO")] }),
          new TableCell({
            children: [new Paragraph(totalRSD.toFixed(2))],
          }),
          new TableCell({
            children: [new Paragraph(totalEUR.toFixed(2))],
          }),
        ],
      }),
    ];

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Specifikacija pacijenta", bold: true })],
            }),
            new Paragraph({
              text: `Period: ${new Date(
                spec.startDate
              ).toLocaleDateString("sr-RS")} — ${new Date(
                spec.endDate
              ).toLocaleDateString("sr-RS")}`,
            }),

            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),

            new Paragraph(""),

            new Table({
              rows: summaryRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `specifikacija-${spec._id}.docx`);
    });
  };

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Specifikacija pacijenta</h2>

        {/* FIX — nisu dozvoljeni brojevi u "to" */}
        <button
          onClick={() => window.history.back()}
          className="text-blue-600 hover:underline"
        >
          Nazad
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        Period:{" "}
        {new Date(spec.startDate).toLocaleDateString("sr-RS")} —{" "}
        {new Date(spec.endDate).toLocaleDateString("sr-RS")}
      </p>

      {/* GLAVNA TABELA */}
      <table className="w-full border-collapse border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Opis</th>
            <th className="border p-2 text-right">Količina</th>
            <th className="border p-2 text-right">Cena (RSD)</th>
          </tr>
        </thead>
        <tbody>
          {spec.items.map((item: any) => (
            <tr key={item._id}>
              <td className="border p-2">
                {item.formattedName ?? item.name}
              </td>
              <td className="border p-2 text-right">{item.amount ?? 1}</td>
              <td className="border p-2 text-right">
                {(item.price ?? 0).toFixed(2)}
              </td>
            </tr>
          ))}

          <tr className="font-bold bg-gray-50">
            <td></td>
            <td className="border p-2 text-right">Ukupno</td>
            <td className="border p-2 text-right">
              {specTotalRSD.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* DODATNI TROŠKOVI – ostaje isto, osim što je uklonjen "Cena smeštaja" */}
      <h3 className="text-lg font-semibold mb-2">Dodaj troškove</h3>

      <table className="w-full border-collapse border border-gray-300 mb-6">
        <tbody>
          <tr>
            <td className="border p-2 font-medium">Opis dodatnog troška</td>
            <td className="border p-2">
              <input
                type="text"
                className="border p-1 rounded w-full"
                value={extraCostLabel}
                onChange={(e) => setExtraCostLabel(e.target.value)}
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2 font-medium">Iznos (RSD)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                className="border p-1 w-32 rounded text-right"
                value={extraCostAmount}
                onChange={(e) =>
                  setExtraCostAmount(Number(e.target.value))
                }
              />
            </td>
          </tr>
        </tbody>
      </table>

      <button
        onClick={addCosts}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-8"
      >
        Dodaj troškove
      </button>

      {/* ----------------------------------------- */}
      {/*   OBRAČUN — EUR I RSD                    */}
      {/* ----------------------------------------- */}
      <h3 className="text-lg font-semibold mt-8 mb-2">
        Obračun celokupne naplate (EUR unos)
      </h3>

      <table className="w-full border-collapse border border-gray-400 mb-6">
        <tbody>
          <tr>
            <td className="border p-2">Dug iz prethodnog perioda (EUR)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                className="border rounded p-1 w-32 text-right"
                value={previousDebtEUR}
                onChange={(e) => setPreviousDebtEUR(Number(e.target.value))}
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2">
              Smeštaj za narednih 30 dana (EUR)
              <br />
              <span className="text-xs text-gray-500">
                Period: {nextPeriodLabel}
              </span>
            </td>
            <td className="border p-2 text-right">
              <input
                type="number"
                className="border rounded p-1 w-32 text-right"
                value={nextLodgingEUR}
                onChange={(e) => setNextLodgingEUR(Number(e.target.value))}
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2">Niži kurs (za specifikaciju)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                className="border rounded p-1 w-32 text-right"
                value={lowerExchangeRate}
                onChange={(e) =>
                  setLowerExchangeRate(Number(e.target.value))
                }
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2">Srednji kurs (dug + smeštaj)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                className="border rounded p-1 w-32 text-right"
                value={middleExchangeRate}
                onChange={(e) =>
                  setMiddleExchangeRate(Number(e.target.value))
                }
              />
            </td>
          </tr>
        </tbody>
      </table>

      {/* KONVERZIJA U EUR */}
      <h3 className="text-lg font-semibold mb-2">Konverzija</h3>

      <table className="w-full border-collapse border border-gray-400 mb-10">
        <tbody>
          <tr>
            <td className="border p-2">Specifikacija (EUR, niži kurs)</td>
            <td className="border p-2 text-right">{specEUR.toFixed(2)}</td>
          </tr>

          <tr>
            <td className="border p-2">Dug (EUR)</td>
            <td className="border p-2 text-right">
              {previousDebtEUR.toFixed(2)}
            </td>
          </tr>

          <tr>
            <td className="border p-2">Smeštaj narednih 30 dana (EUR)</td>
            <td className="border p-2 text-right">
              {nextLodgingEUR.toFixed(2)}
            </td>
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

      <button
        onClick={generateWord}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Preuzmi Word dokument
      </button>
    </div>
  );
}
