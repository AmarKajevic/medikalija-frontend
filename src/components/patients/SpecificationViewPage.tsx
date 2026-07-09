import { useParams } from "react-router";
import { useEffect, useState } from "react";
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

  // ------------------------------
  //  BACKEND – DODATNI TROŠKOVI
  // ------------------------------
  const [extraCostAmount, setExtraCostAmount] = useState<number | "">("");
  const [extraCostLabel, setExtraCostLabel] = useState<string>("");

  // ------------------------------
  //  FRONTEND / BILLING – EUR
  // ------------------------------
  const [previousDebtEUR, setPreviousDebtEUR] = useState<string>("");   // dug u EUR
  const [nextLodgingEUR, setNextLodgingEUR] = useState<string>("");     // smeštaj u EUR

  const [lowerExchangeRate, setLowerExchangeRate] = useState<string>("");   // niži kurs
  const [middleExchangeRate, setMiddleExchangeRate] = useState<string>(""); // srednji kurs

  // ------------------------------
  //  POPUNI STATE IZ billing (ako postoji u bazi)
  // ------------------------------
  useEffect(() => {
    if (!spec || !spec.billing) return;

    if (spec.billing.previousDebtEUR && spec.billing.previousDebtEUR > 0) {
      setPreviousDebtEUR(spec.billing.previousDebtEUR.toString());
    } else {
      setPreviousDebtEUR("");
    }

    if (spec.billing.nextLodgingEUR && spec.billing.nextLodgingEUR > 0) {
      setNextLodgingEUR(spec.billing.nextLodgingEUR.toString());
    } else {
      setNextLodgingEUR("");
    }

    if (spec.billing.lowerExchangeRate && spec.billing.lowerExchangeRate > 0) {
      setLowerExchangeRate(spec.billing.lowerExchangeRate.toString());
    } else {
      setLowerExchangeRate("");
    }

    if (
      spec.billing.middleExchangeRate &&
      spec.billing.middleExchangeRate > 0
    ) {
      setMiddleExchangeRate(spec.billing.middleExchangeRate.toString());
    } else {
      setMiddleExchangeRate("");
    }
  }, [spec]);

  // ------------------------------
  //  STANJE UČITAVANJA
  // ------------------------------
  if (isLoading) return <p>Učitavanje...</p>;
  if (isError || !spec) return <p>Greška pri učitavanju specifikacije.</p>;

  const specTotalRSD: number = spec.totalPrice ?? 0;

  // ------------------------------
  //  PERIOD NAREDNIH 30 DANA (za smeštaj unapred)
  // ------------------------------
  const currentEndDate = new Date(spec.endDate);
  const nextStartDate = new Date(currentEndDate);
  nextStartDate.setDate(nextStartDate.getDate() + 1);

  const nextEndDate = new Date(nextStartDate);
  nextEndDate.setDate(nextEndDate.getDate() + 29);

  const nextPeriodLabel =
    `${nextStartDate.toLocaleDateString("sr-RS")} — ` +
    nextEndDate.toLocaleDateString("sr-RS");

  // ------------------------------
  //  KONVERZIJE (tvoja logika)
  // ------------------------------
  const debtEUR = previousDebtEUR === "" ? 0 : Number(previousDebtEUR);
  const lodgingEUR = nextLodgingEUR === "" ? 0 : Number(nextLodgingEUR);

  const lowRate = lowerExchangeRate === "" ? 0 : Number(lowerExchangeRate);
  const midRate = middleExchangeRate === "" ? 0 : Number(middleExchangeRate);

  // SPEC: RSD → EUR (NIŽI KURS)
  const specEUR = lowRate > 0 ? specTotalRSD / lowRate : 0;

  // DUG: EUR → RSD (SREDNJI KURS)
  const debtRSD = midRate > 0 ? debtEUR * midRate : 0;

  // SMEŠTAJ: EUR → RSD (SREDNJI KURS)
  const lodgingRSD = midRate > 0 ? lodgingEUR * midRate : 0;

  // UKUPNO
  const totalRSD = specTotalRSD + debtRSD + lodgingRSD;
  const totalEUR = specEUR + debtEUR + lodgingEUR;

  // ------------------------------
  //  BACKEND – DODAVANJE EXTRA TROŠKOVA
  // ------------------------------
  const addCosts = async () => {
    try {
      await axios.post(
        `https://medikalija-api.vercel.app/api/specification/${spec._id}/add-costs`,
        {
          extraCostAmount:
            extraCostAmount === "" ? 0 : Number(extraCostAmount),
          extraCostLabel,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await refetch();
      setExtraCostAmount("");
      setExtraCostLabel("");
    } catch (err) {
      console.error("Greška pri dodavanju troškova:", err);
    }
  };

  // ------------------------------
  //  BACKEND – ČUVANJE BILLINGA U BAZU
  // ------------------------------
  const saveBilling = async () => {
    try {
      await axios.post(
        `https://medikalija-api.vercel.app/api/specification/${spec._id}/billing`,
        {
          previousDebtEUR: debtEUR,
          nextLodgingEUR: lodgingEUR,
          lowerExchangeRate: lowRate,
          middleExchangeRate: midRate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await refetch();
    } catch (err) {
      console.error("Greška pri čuvanju obračuna:", err);
    }
  };

  // ------------------------------
  //  WORD EXPORT
  // ------------------------------
const generateWord = () => {
  // ------------------------------
  //  TABELA 1 — DUG + SMEŠTAJ
  // ------------------------------
  const tableDebtLodging = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Stavka")] }),
        new TableCell({ children: [new Paragraph("RSD")] }),
        new TableCell({ children: [new Paragraph("EUR")] }),
      ],
    }),

    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Dug iz prethodnog perioda")] }),
        new TableCell({ children: [new Paragraph(debtRSD.toFixed(2))] }),
        new TableCell({ children: [new Paragraph(debtEUR.toFixed(2))] }),
      ],
    }),

    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph(`Smeštaj za narednih 30 dana (${nextPeriodLabel})`)
          ]
        }),
        new TableCell({ children: [new Paragraph(lodgingRSD.toFixed(2))] }),
        new TableCell({ children: [new Paragraph(lodgingEUR.toFixed(2))] }),
      ],
    }),

    // UKUPNO za prvu tabelu
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("UKUPNO")] }),
        new TableCell({
          children: [
            new Paragraph((debtRSD + lodgingRSD).toFixed(2))
          ]
        }),
        new TableCell({
          children: [
            new Paragraph((debtEUR + lodgingEUR).toFixed(2))
          ]
        }),
      ],
    }),
  ];

  // ------------------------------
  //  TABELA 2 — SPECIFIKACIJA
  // ------------------------------
  const tableSpecification = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Opis")] }),
        new TableCell({ children: [new Paragraph("Količina")] }),
        new TableCell({ children: [new Paragraph("Cena (RSD)")] }),
      ],
    }),

    ...spec.items.map((item: any) =>
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph(item.formattedName ?? item.name ?? "Nepoznata stavka")
            ]
          }),
          new TableCell({ children: [new Paragraph(String(item.amount ?? 1))] }),
          new TableCell({ children: [new Paragraph((item.price ?? 0).toFixed(2))] }),
        ],
      })
    ),

    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("")] }),
        new TableCell({ children: [new Paragraph("Ukupno")] }),
        new TableCell({
          children: [new Paragraph(specTotalRSD.toFixed(2))]
        }),
      ],
    }),
  ];

  // ------------------------------
  //  TABELA 3 — KONAČAN OBRAČUN
  // ------------------------------
  const tableSummary = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Stavka")] }),
        new TableCell({ children: [new Paragraph("RSD")] }),
        new TableCell({ children: [new Paragraph("EUR")] }),
      ],
    }),

    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Specifikacija (niži kurs)")] }),
        new TableCell({ children: [new Paragraph(specTotalRSD.toFixed(2))] }),
        new TableCell({ children: [new Paragraph(specEUR.toFixed(2))] }),
      ],
    }),

    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Dug iz prethodnog perioda")] }),
        new TableCell({ children: [new Paragraph(debtRSD.toFixed(2))] }),
        new TableCell({ children: [new Paragraph(debtEUR.toFixed(2))] }),
      ],
    }),

    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph(
              `Smeštaj narednih 30 dana (${nextPeriodLabel})`
            )
          ]
        }),
        new TableCell({ children: [new Paragraph(lodgingRSD.toFixed(2))] }),
        new TableCell({ children: [new Paragraph(lodgingEUR.toFixed(2))] }),
      ],
    }),

    // FINAL TOTALS
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("UKUPNO")] }),
        new TableCell({ children: [new Paragraph(totalRSD.toFixed(2))] }),
        new TableCell({ children: [new Paragraph(totalEUR.toFixed(2))] }),
      ],
    }),
  ];

  // ------------------------------
  //  KREIRANJE WORD-a
  // ------------------------------
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
            text: `Period: ${new Date(spec.startDate).toLocaleDateString(
              "sr-RS"
            )} — ${new Date(spec.endDate).toLocaleDateString("sr-RS")}`,
          }),

          // Tabela 1
          new Paragraph(""),
          new Paragraph({
            children: [new TextRun({ text: "Dug + Smeštaj (EUR/RSD)", bold: true })]
          }),
          new Table({
            rows: tableDebtLodging,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),

          // Tabela 2
          new Paragraph(""),
          new Paragraph({
            children: [new TextRun({ text: "Specifikacija", bold: true })]
          }),
          new Table({
            rows: tableSpecification,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),

          // Tabela 3
          new Paragraph(""),
          new Paragraph({
            children: [new TextRun({ text: "Konačan obračun", bold: true })]
          }),
          new Table({
            rows: tableSummary,
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

  // ------------------------------
  //  RENDER
  // ------------------------------
  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Specifikacija pacijenta</h2>
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

      {/* 1) PRVO: SMEŠTAJ + DUG + KURS (UNOS U EUR) */}
      <h3 className="text-lg font-semibold mt-4 mb-2">
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
                onChange={(e) => setPreviousDebtEUR(e.target.value)}
                placeholder="unesi dug u evrima"
                className="border p-1 rounded w-32 text-right"
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
                value={nextLodgingEUR}
                onChange={(e) => setNextLodgingEUR(e.target.value)}
                placeholder="unesi smeštaj u evrima"
                className="border p-1 rounded w-32 text-right"
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2">Niži kurs (specifikacija)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                value={lowerExchangeRate}
                onChange={(e) => setLowerExchangeRate(e.target.value)}
                placeholder="npr. 117.20"
                className="border p-1 rounded w-32 text-right"
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2">Srednji kurs (dug + smeštaj)</td>
            <td className="border p-2 text-right">
              <input
                type="number"
                value={middleExchangeRate}
                onChange={(e) => setMiddleExchangeRate(e.target.value)}
                placeholder="npr. 117.75"
                className="border p-1 rounded w-32 text-right"
              />
            </td>
          </tr>
        </tbody>
      </table>
      {/* 2) POSLE TOGA: SPECIFIKACIJA (ONO ŠTO JE POTROŠENO OVOG PERIODA) */}
      <h3 className="text-lg font-semibold mb-2">
        Specifikacija za ovaj period
      </h3>

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
              <td className="border p-2">
                {item.formattedName ?? item.name ?? "Nepoznata stavka"}
              </td>
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
       {/* 3) NA KRAJU: DODATNI TROŠKOVI (IDU U SPECIFIKACIJU) */}
      <h3 className="text-lg font-semibold mb-2">Dodaj dodatne troškove</h3>

      <table className="w-full border-collapse border border-gray-300 mb-4">
        <tbody>
          <tr>
            <td className="border p-2 font-medium">Dodatni trošak — opis</td>
            <td className="border p-2">
              <input
                type="text"
                value={extraCostLabel}
                onChange={(e) => setExtraCostLabel(e.target.value)}
                placeholder="npr. dodatna terapija"
                className="border p-1 rounded w-full"
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2 font-medium">
              Dodatni trošak — iznos (RSD)
            </td>
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

      <div className="flex justify-end mb-4">
        <button
          onClick={addCosts}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Sačuvaj dodatne troškove
        </button>
      </div>

      {/* KONVERZIJA I UKUPNO */}
      <h3 className="text-lg font-semibold mb-2">Konverzija</h3>

      <table className="w-full border-collapse border border-gray-400 mb-6">
        <tbody>
          <tr>
            <td className="border p-2">Specifikacija (EUR, niži kurs)</td>
            <td className="border p-2 text-right">{specEUR.toFixed(2)}</td>
          </tr>

          <tr>
            <td className="border p-2">Dug iz prethodnog perioda (EUR)</td>
            <td className="border p-2 text-right">{debtEUR.toFixed(2)}</td>
          </tr>

          <tr>
            <td className="border p-2">Smeštaj narednih 30 dana (EUR)</td>
            <td className="border p-2 text-right">
              {lodgingEUR.toFixed(2)}
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

      <div className="flex justify-end gap-3 mb-10">
        <button
          onClick={saveBilling}
          className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
        >
          Sačuvaj obračun
        </button>

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
