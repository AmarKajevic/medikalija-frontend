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

  // Extra troškovi (unose se u RSD)
  const [extraCostAmount, setExtraCostAmount] = useState<number>(0);
  const [extraCostLabel, setExtraCostLabel] = useState<string>("");

  // Dug i smeštaj — unosi se u EUR
  const [previousDebtEUR, setPreviousDebtEUR] = useState<number>(0);
  const [nextLodgingEUR, setNextLodgingEUR] = useState<number>(0);

  // Kursevi
  const [lowerExchangeRate, setLowerExchangeRate] = useState<number>(0);
  const [middleExchangeRate, setMiddleExchangeRate] = useState<number>(0);

  if (isLoading) return <p>Učitavanje...</p>;
  if (isError || !spec) return <p>Greška pri učitavanju specifikacije.</p>;

  // Sledeći period: 30 dana posle kraja ove specifikacije
  const currentEndDate = new Date(spec.endDate);
  const nextStartDate = new Date(currentEndDate);
  nextStartDate.setDate(nextStartDate.getDate() + 1);

  const nextEndDate = new Date(nextStartDate);
  nextEndDate.setDate(nextEndDate.getDate() + 29);

  const nextPeriodLabel =
    nextStartDate.toLocaleDateString("sr-RS") +
    " — " +
    nextEndDate.toLocaleDateString("sr-RS");

  // RSD vrednosti
  const specTotalRSD = spec.totalPrice ?? 0;

  const debtRSD =
    middleExchangeRate > 0 ? previousDebtEUR * middleExchangeRate : 0;

  const lodgingNextRSD =
    middleExchangeRate > 0 ? nextLodgingEUR * middleExchangeRate : 0;

  // EUR vrednosti
  const specEUR =
    lowerExchangeRate > 0 ? specTotalRSD / lowerExchangeRate : 0;

  const debtEUR = previousDebtEUR;
  const lodgingNextEUR = nextLodgingEUR;

  const totalRSD = specTotalRSD + debtRSD + lodgingNextRSD;
  const totalEUR = specEUR + debtEUR + lodgingNextEUR;

  // ----------------------------------------------------------
  // DODAVANJE EXTRA TROŠKA U SPECIFIKACIJU
  // ----------------------------------------------------------
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
      console.error(err);
    }
  };

  // ----------------------------------------------------------
  // WORD EXPORT
  // ----------------------------------------------------------
  const generateWord = () => {
    // GLAVNA TABELA
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Opis", bold: true })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Količina", bold: true })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Cena (RSD)", bold: true })],
              }),
            ],
          }),
        ],
      }),

      ...spec.items.map(
        (item: any) =>
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text:
                          item.formattedName ??
                          item.name ??
                          "Nepoznata stavka",
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: (item.amount ?? 1).toString(),
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: (item.price ?? 0).toFixed(2),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
      ),

      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("")],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Ukupno", bold: true })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: specTotalRSD.toFixed(2) })],
              }),
            ],
          }),
        ],
      }),
    ];

    // TABELA SA EUR/RSD OBRACUNOM
    const summaryRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Stavka", bold: true })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "RSD", bold: true })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "EUR", bold: true })],
              }),
            ],
          }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Ukupna specifikacija")],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun(specTotalRSD.toFixed(2))],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun(specEUR.toFixed(2))],
              }),
            ],
          }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Dug iz prethodnog perioda")],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun(debtRSD.toFixed(2))],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun(debtEUR.toFixed(2))],
              }),
            ],
          }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph(`Smeštaj za narednih 30 dana (${nextPeriodLabel})`),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun(lodgingNextRSD.toFixed(2))],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun(lodgingNextEUR.toFixed(2))],
              }),
            ],
          }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "UKUPNO", bold: true })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: totalRSD.toFixed(2), bold: true }),
                ],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: totalEUR.toFixed(2), bold: true }),
                ],
              }),
            ],
          }),
        ],
      }),
    ];

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Specifikacija pacijenta",
                  bold: true,
                  size: 32,
                }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Period: ${new Date(
                    spec.startDate
                  ).toLocaleDateString("sr-RS")} — ${new Date(
                    spec.endDate
                  ).toLocaleDateString("sr-RS")}`,
                }),
              ],
            }),

            new Paragraph(""),

            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),

            new Paragraph(""),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Obračun ukupne naplate (RSD / EUR)",
                  bold: true,
                  size: 26,
                }),
              ],
            }),

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

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------
  return (
    <div className="p-5">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Specifikacija pacijenta</h2>
        <button
          onClick={() => window.history.back()}
          className="text-blue-600 hover:underline"
        >
          Nazad
        </button>

      </div>

      <p className="mb-4 text-sm text-gray-600">
        Period: {new Date(spec.startDate).toLocaleDateString("sr-RS")} —{" "}
        {new Date(spec.endDate).toLocaleDateString("sr-RS")}
      </p>

      {/* --------------------------------------------------------
          GLAVNA TABELA SPECIFIKACIJE
      -------------------------------------------------------- */}
      <table className="w-full border border-gray-400 mb-6">
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
                {(item.price ?? 0).toFixed(2)} RSD
              </td>
            </tr>
          ))}

          <tr className="bg-gray-50 font-bold">
            <td></td>
            <td className="border p-2 text-right">Ukupno:</td>
            <td className="border p-2 text-right">
              {specTotalRSD.toFixed(2)} RSD
            </td>
          </tr>
        </tbody>
      </table>

      {/* --------------------------------------------------------
          DODAVANJE TROŠKA
      -------------------------------------------------------- */}
      <h3 className="text-lg font-semibold mb-2">Dodaj trošak</h3>

      <table className="w-full border border-gray-400 mb-4">
        <tbody>
          <tr>
            <td className="border p-2">Opis troška</td>
            <td className="border p-2">
              <input
                className="border p-1 w-full"
                value={extraCostLabel}
                onChange={(e) => setExtraCostLabel(e.target.value)}
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2">Iznos (RSD)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                className="border p-1 w-32 text-right"
                value={extraCostAmount}
                onChange={(e) => setExtraCostAmount(Number(e.target.value))}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <button
        onClick={addCosts}
        className="bg-green-600 text-white px-4 py-2 rounded mb-8"
      >
        Dodaj trošak
      </button>

      {/* --------------------------------------------------------
          EUR OBRAČUN
      -------------------------------------------------------- */}
      <h3 className="text-lg font-semibold mb-2">
        Obračun u EUR (dug + smeštaj)
      </h3>

      <table className="w-full border border-gray-400 mb-6">
        <tbody>
          <tr>
            <td className="border p-2">Dug iz prethodnog perioda (EUR)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                className="border p-1 w-32 text-right"
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
                className="border p-1 w-32 text-right"
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
                className="border p-1 w-32 text-right"
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
                className="border p-1 w-32 text-right"
                value={middleExchangeRate}
                onChange={(e) =>
                  setMiddleExchangeRate(Number(e.target.value))
                }
              />
            </td>
          </tr>
        </tbody>
      </table>

      {/* --------------------------------------------------------
          KONVERZIJA
      -------------------------------------------------------- */}
      <h3 className="text-lg font-semibold mb-2">Konverzija</h3>

      <table className="w-full border border-gray-400 mb-8">
        <tbody>
          <tr>
            <td className="border p-2">Specifikacija (EUR)</td>
            <td className="border p-2 text-right">{specEUR.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border p-2">Dug (EUR)</td>
            <td className="border p-2 text-right">{debtEUR.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="border p-2">Smeštaj (EUR)</td>
            <td className="border p-2 text-right">
              {lodgingNextEUR.toFixed(2)}
            </td>
          </tr>
          <tr className="bg-gray-100 font-bold">
            <td className="border p-2">UKUPNO (RSD)</td>
            <td className="border p-2 text-right">{totalRSD.toFixed(2)}</td>
          </tr>
          <tr className="bg-gray-100 font-bold">
            <td className="border p-2">UKUPNO (EUR)</td>
            <td className="border p-2 text-right">{totalEUR.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <button
        onClick={generateWord}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Preuzmi Word dokument
      </button>
    </div>
  );
}
