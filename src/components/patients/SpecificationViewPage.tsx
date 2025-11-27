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
  const {
    data: spec,
    isLoading,
    isError,
    refetch,
  } = useSingleSpecification(specificationId || "");
  const { token } = useAuth();

  // ✅ lokalni state za dodatne troškove (postojeci deo)
  const [lodgingPrice, setLodgingPrice] = useState<number>(0);
  const [extraCostAmount, setExtraCostAmount] = useState<number>(0);
  const [extraCostLabel, setExtraCostLabel] = useState<string>("");

  // ✅ novi state za obračun (FRONTEND ONLY)
  const [previousDebt, setPreviousDebt] = useState<number>(0); // dug iz prethodnog perioda
  const [nextLodgingPrice, setNextLodgingPrice] = useState<number>(0); // smeštaj za narednih 30 dana (RSD)

  const [lowerExchangeRate, setLowerExchangeRate] = useState<number>(0); // niži kurs
  const [middleExchangeRate, setMiddleExchangeRate] = useState<number>(0); // srednji kurs

  if (isLoading) return <p>Učitavanje...</p>;
  if (isError) return <p>Greška pri učitavanju specifikacije.</p>;
  if (!spec) return <p>Specifikacija nije pronađena.</p>;

  // ✅ izvlacenje vrednosti iz items za postojeće troškove (smještaj + extra)
  const lodgingItem = spec.items.find((i: any) => i.category === "lodging");
  const extraItem = spec.items.find((i: any) => i.category === "extra");

  const lodgingExisting = lodgingItem ? lodgingItem.price ?? 0 : 0;
  const extraExistingAmount = extraItem ? extraItem.price ?? 0 : 0;
  const extraExistingLabel = extraItem ? extraItem.name ?? "" : "";

  // ✅ FUNKCIJA ZA DODAVANJE TROŠKOVA (u backend)
  const addCosts = async () => {
    try {
      await axios.post(
        `https://medikalija-api.vercel.app/api/specification/${spec._id}/add-costs`,
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

  // ✅ izračunavanje perioda za NAREDNIH 30 DANA (SMEŠTAJ)
  const currentEndDate = new Date(spec.endDate);
  const nextStartDate = new Date(currentEndDate);
  nextStartDate.setDate(nextStartDate.getDate() + 1); // dan posle endDate

  const nextEndDate = new Date(nextStartDate);
  nextEndDate.setDate(nextEndDate.getDate() + 29); // +29 dana → ukupno 30 dana

  const nextPeriodLabel = `${nextStartDate.toLocaleDateString(
    "sr-RS"
  )} — ${nextEndDate.toLocaleDateString("sr-RS")}`;

  // ✅ RSD i EUR OBRAČUN
  const specTotalRSD: number = spec.totalPrice ?? 0;
  const debtRSD: number = previousDebt || 0;
  const lodgingNextRSD: number = nextLodgingPrice || 0;

  const specEUR =
    lowerExchangeRate > 0 ? specTotalRSD / lowerExchangeRate : 0;
  const debtEUR =
    middleExchangeRate > 0 ? debtRSD / middleExchangeRate : 0;
  const lodgingNextEUR =
    middleExchangeRate > 0 ? lodgingNextRSD / middleExchangeRate : 0;

  const totalRSD = specTotalRSD + debtRSD + lodgingNextRSD;
  const totalEUR = specEUR + debtEUR + lodgingNextEUR;

  // ✅ WORD EXPORT (DODATO: TABELA SA OBRAČUNOM)
  const generateWord = () => {
    // Glavna tabela stavki
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
                  new Paragraph(item.name ?? item.formattedName ?? "Nepoznata stavka"),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph((item.amount ?? 1).toString()),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph((item.price ?? 0).toFixed(2)),
                ],
              }),
            ],
          })
      ),

      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Cena smeštaja (trenutna specifikacija)")],
          }),
          new TableCell({ children: [new Paragraph("—")] }),
          new TableCell({
            children: [
              new Paragraph(lodgingExisting.toFixed(2)),
            ],
          }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph(
                `Dodatni trošak — ${extraExistingLabel || "nema"}`
              ),
            ],
          }),
          new TableCell({ children: [new Paragraph("—")] }),
          new TableCell({
            children: [
              new Paragraph(extraExistingAmount.toFixed(2)),
            ],
          }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("")] }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Ukupno (RSD)", bold: true })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: (specTotalRSD ?? 0).toFixed(2),
                    bold: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ];

    // 🔥 DODATNA TABELA – OBRAČUN NAPLATE + EUR
    const summaryTableRows = [
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
                children: [new TextRun({ text: "Iznos (RSD)", bold: true })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Iznos (EUR)", bold: true })],
              }),
            ],
          }),
        ],
      }),

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
            children: [new Paragraph("Dug iz prethodnog perioda (srednji kurs)")],
          }),
          new TableCell({
            children: [new Paragraph(debtRSD.toFixed(2))],
          }),
          new TableCell({
            children: [new Paragraph(debtEUR.toFixed(2))],
          }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph(
                `Smeštaj za narednih 30 dana (${nextPeriodLabel}) – srednji kurs`
              ),
            ],
          }),
          new TableCell({
            children: [new Paragraph(lodgingNextRSD.toFixed(2))],
          }),
          new TableCell({
            children: [new Paragraph(lodgingNextEUR.toFixed(2))],
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
                  size: 28,
                }),
              ],
            }),
            new Paragraph({
              text: `Period: ${new Date(
                spec.startDate
              ).toLocaleDateString("sr-RS")} — ${new Date(
                spec.endDate
              ).toLocaleDateString("sr-RS")}`,
            }),
            new Paragraph({ text: "" }),
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Obračun kompletne naplate (RSD / EUR)",
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              text: `Period smeštaja unapred: ${nextPeriodLabel}`,
            }),
            new Table({
              rows: summaryTableRows,
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
        <Link to={-1 as any} className="text-blue-600 hover:underline">
          Nazad
        </Link>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        Period:{" "}
        {new Date(spec.startDate).toLocaleDateString("sr-RS")} —{" "}
        {new Date(spec.endDate).toLocaleDateString("sr-RS")}
      </p>

      {/* ✅ GLAVNA TABELA – STAVKE SPECIFIKACIJE */}
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
              <td className="border p-2">
                {item.formattedName ?? item.name}
              </td>
              <td className="border p-2 text-right">
                {item.amount ?? "1"}
              </td>
              <td className="border p-2 text-right">
                {(item.price ?? 0).toFixed(2)} RSD
              </td>
            </tr>
          ))}

          <tr className="font-semibold bg-gray-50">
            <td></td>
            <td className="border p-2 text-right">Ukupno:</td>
            <td className="border p-2 text-right">
              {(specTotalRSD ?? 0).toFixed(2)} RSD
            </td>
          </tr>
        </tbody>
      </table>

      {/* ✅ TABELA – DODAVANJE TROŠKOVA U SPECIFIKACIJU (BACKEND) */}
      <h3 className="text-lg font-semibold mb-2">Dodaj troškove</h3>

      <table className="w-full border-collapse border border-gray-300 mb-4">
        <tbody>
          <tr>
            <td className="border p-2 font-medium">Cena smeštaja (trenutna specifikacija)</td>
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
            <td className="border p-2 font-medium">Dodatni trošak — iznos (RSD)</td>
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

      <div className="flex justify-between mb-6 gap-3">
        <button
          onClick={generateWord}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Preuzmi Word dokument
        </button>
        <button
          onClick={addCosts}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Dodaj troškove
        </button>
      </div>

      {/* ——————————————————————————————— */}
      {/*      NOVA TABELA – OBRAČUN NAPLATE */}
      {/* ——————————————————————————————— */}

      <h3 className="text-lg font-semibold mt-4 mb-2">
        Obračun celokupne naplate (RSD)
      </h3>

      <table className="w-full border-collapse border border-gray-400 mb-6">
        <tbody>
          <tr>
            <td className="border p-2">Ukupna specifikacija (RSD)</td>
            <td className="border p-2 text-right">
              {specTotalRSD.toFixed(2)}
            </td>
          </tr>

          <tr>
            <td className="border p-2">Dug iz prethodnog perioda (RSD)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                className="border rounded p-1 w-32 text-right"
                value={previousDebt}
                onChange={(e) => setPreviousDebt(Number(e.target.value))}
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2">
              Smeštaj za narednih 30 dana (RSD)<br />
              <span className="text-xs text-gray-500">
                Period: {nextPeriodLabel}
              </span>
            </td>
            <td className="border p-2 text-right">
              <input
                type="number"
                className="border rounded p-1 w-32 text-right"
                value={nextLodgingPrice}
                onChange={(e) =>
                  setNextLodgingPrice(Number(e.target.value))
                }
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2 font-medium">
              Niži kurs (za specifikaciju)
            </td>
            <td className="border p-2 text-right">
              <input
                type="number"
                className="border rounded p-1 w-32 text-right"
                value={lowerExchangeRate}
                onChange={(e) =>
                  setLowerExchangeRate(Number(e.target.value))
                }
                placeholder="npr. 117.20"
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2 font-medium">
              Srednji kurs (dug + smeštaj)
            </td>
            <td className="border p-2 text-right">
              <input
                type="number"
                className="border rounded p-1 w-32 text-right"
                value={middleExchangeRate}
                onChange={(e) =>
                  setMiddleExchangeRate(Number(e.target.value))
                }
                placeholder="npr. 117.75"
              />
            </td>
          </tr>
        </tbody>
      </table>

      {/* ——————————————————————————————— */}
      {/*      KONVERZIJA U EVRE            */}
      {/* ——————————————————————————————— */}

      <h3 className="text-lg font-semibold mb-2">Konverzija u evre</h3>

      <table className="w-full border-collapse border border-gray-400 mb-6">
        <tbody>
          <tr>
            <td className="border p-2">
              Ukupna specifikacija (EUR, niži kurs)
            </td>
            <td className="border p-2 text-right">
              {specEUR.toFixed(2)}
            </td>
          </tr>

          <tr>
            <td className="border p-2">
              Dug iz prethodnog perioda (EUR, srednji kurs)
            </td>
            <td className="border p-2 text-right">
              {debtEUR.toFixed(2)}
            </td>
          </tr>

          <tr>
            <td className="border p-2">
              Smeštaj narednih 30 dana (EUR, srednji kurs)
            </td>
            <td className="border p-2 text-right">
              {lodgingNextEUR.toFixed(2)}
            </td>
          </tr>

          <tr className="font-bold bg-gray-50">
            <td className="border p-2">UKUPNO (RSD)</td>
            <td className="border p-2 text-right">
              {totalRSD.toFixed(2)}
            </td>
          </tr>

          <tr className="font-bold bg-gray-50">
            <td className="border p-2">UKUPNO (EUR)</td>
            <td className="border p-2 text-right">
              {totalEUR.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
