// features/specification/ui/SpecificationViewPage.tsx
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { useSpecification } from "../hooks/useSpecification";
import { useAddExtraCost } from "../hooks/useAddExtraCost";
import { useSaveBilling } from "../hooks/useSaveBilling";
import { useExchangeRates } from "../../../context/ExchangeRateContext";
import { generateSpecificationPDF } from "../lib/generateSpecificationPDF";
import { usePatient } from "../../patients/hooks/usePatient";


export default function SpecificationViewPage() {
  const { specificationId } = useParams();
  const { data: spec, isLoading, isError } = useSpecification(specificationId || "");
    const { data: patient } = usePatient(spec?.patientId || "");
  const { mutate: addExtraCost } = useAddExtraCost(specificationId || "");
  const { mutate: saveBilling, isPending: isSavingBilling } = useSaveBilling(specificationId || "");
  const { rates, updateRates } = useExchangeRates();

  console.log(spec)

  // Stanja (bez polja za kurseve)
  const [extraCostAmount, setExtraCostAmount] = useState<number | "">("");
  const [extraCostLabel, setExtraCostLabel] = useState("");
  const [previousDebtEUR, setPreviousDebtEUR] = useState("");
  const [nextLodgingEUR, setNextLodgingEUR] = useState("");

  // Modal za izmenu globalnih kurseva
  const [showRateModal, setShowRateModal] = useState(false);
  const [tempLower, setTempLower] = useState(rates.lower.toString());
  const [tempMiddle, setTempMiddle] = useState(rates.middle.toString());

  useEffect(() => {
    if (!spec?.billing) return;
    if (spec.billing.previousDebtEUR && spec.billing.previousDebtEUR > 0)
      setPreviousDebtEUR(spec.billing.previousDebtEUR.toString());
    else setPreviousDebtEUR("");
    if (spec.billing.nextLodgingEUR && spec.billing.nextLodgingEUR > 0)
      setNextLodgingEUR(spec.billing.nextLodgingEUR.toString());
    else setNextLodgingEUR("");
  }, [spec]);

 

  const handleUpdateRates = async () => {
    await updateRates(Number(tempLower), Number(tempMiddle));
    setShowRateModal(false);
  };

  if (isLoading) return <p>Učitavanje...</p>;
  if (isError || !spec) return <p>Greška pri učitavanju specifikacije.</p>;

  const specTotalRSD = spec.totalPrice ?? 0;

  const currentEndDate = new Date(spec.endDate);
  const nextStartDate = new Date(currentEndDate);
  nextStartDate.setDate(nextStartDate.getDate() + 1);
  const nextEndDate = new Date(nextStartDate);
  nextEndDate.setDate(nextEndDate.getDate() + 29);
  const nextPeriodLabel = `${nextStartDate.toLocaleDateString("sr-RS")} — ${nextEndDate.toLocaleDateString("sr-RS")}`;

  const debtEUR = previousDebtEUR === "" ? 0 : Number(previousDebtEUR);
  const lodgingEUR = nextLodgingEUR === "" ? 0 : Number(nextLodgingEUR);
  const lowRate = rates.lower;
  const midRate = rates.middle;
  const specEUR = lowRate > 0 ? specTotalRSD / lowRate : 0;
  const debtRSD = midRate > 0 ? debtEUR * midRate : 0;
  const lodgingRSD = midRate > 0 ? lodgingEUR * midRate : 0;
  const totalRSD = specTotalRSD + debtRSD + lodgingRSD;
  const totalEUR = specEUR + debtEUR + lodgingEUR;

  const handleAddCosts = () => {
    if (extraCostAmount && extraCostLabel) {
      addExtraCost({ amount: Number(extraCostAmount), label: extraCostLabel });
      setExtraCostAmount("");
      setExtraCostLabel("");
    }
  };

  const handleSaveBilling = () => {
    saveBilling({
      previousDebtEUR: debtEUR,
      nextLodgingEUR: lodgingEUR,

    });
  };

   const getItemDisplayName = (item: any): string => {
    if (item.category === "combination" && Array.isArray(item.analyses) && item.analyses.length > 0) {
      const names = item.analyses.map((a: any) => a.name).join(" + ");
    const prices = item.analyses.map((a: any) => a.price).join(" + ");
    return `${names} = ${prices}`;
    }
    return item.formattedName ?? item.name ?? "Nepoznata stavka";
  };

const handlePDFExport = () => {
  if (!spec) return;
  if(!patient) return;
  
  const patientName = `${patient.name} ${patient.lastName}`
  generateSpecificationPDF({
    patientName,
    startDate: spec.startDate,
    endDate: spec.endDate,
    items: spec.items.map((item: any) => ({
      formattedName: getItemDisplayName(item),
      amount: item.amount ?? 1,
      price: item.price ?? 0,
    })),
    debtEUR,
    debtRSD,
    lodgingEUR,
    lodgingRSD,
    specEUR,
    specTotalRSD,
    totalRSD,
    totalEUR,
    nextPeriodLabel,
  });
};

  return (
    <div className="p-5">
      {/* Zaglavlje, period, prikaz globalnih kurseva i dugme za izmenu */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Specifikacija pacijenta</h2>
        <button onClick={() => window.history.back()} className="text-blue-600 hover:underline">
          Nazad
        </button>
      </div>
      <p className="mb-4 text-sm text-gray-600">
        Period: {new Date(spec.startDate).toLocaleDateString("sr-RS")} —{" "}
        {new Date(spec.endDate).toLocaleDateString("sr-RS")}
      </p>

      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Globalni kursevi</h3>
        <button
          onClick={() => {
            setTempLower(rates.lower.toString());
            setTempMiddle(rates.middle.toString());
            setShowRateModal(true);
          }}
          className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300"
        >
          Izmeni kurseve
        </button>
      </div>
      <div className="p-3 bg-gray-50 rounded mb-6 text-sm">
        <p>Niži kurs (specifikacija): <strong>{rates.lower}</strong></p>
        <p>Srednji kurs (dug + smeštaj): <strong>{rates.middle}</strong></p>
      </div>

      {/* Tabela unosa (dug i smeštaj) */}
      <h3 className="text-lg font-semibold mt-4 mb-2">Obračun naplate (unos u EUR)</h3>
      <table className="w-full border-collapse border border-gray-400 mb-6">
        <tbody>
          <tr>
            <td className="border p-2">Dug iz prethodnog perioda (EUR)</td>
            <td className="border p-2 text-right">
              <input type="number" value={previousDebtEUR} onChange={(e) => setPreviousDebtEUR(e.target.value)} className="border p-1 rounded w-32 text-right" />
            </td>
          </tr>
          <tr>
            <td className="border p-2">
              Smeštaj za narednih 30 dana (EUR)<br />
              <span className="text-xs text-gray-500">Period: {nextPeriodLabel}</span>
            </td>
            <td className="border p-2 text-right">
              <input type="number" value={nextLodgingEUR} onChange={(e) => setNextLodgingEUR(e.target.value)} className="border p-1 rounded w-32 text-right" />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Specifikacija (items) */}
      <h3 className="text-lg font-semibold mb-2">Specifikacija za ovaj period</h3>
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
              <td className="border p-2">{getItemDisplayName(item)}</td>
              <td className="border p-2 text-right">{item.amount ?? 1}</td>
              <td className="border p-2 text-right">{(item.price ?? 0).toFixed(2)}</td>
            </tr>
          ))}
          <tr className="font-bold bg-gray-50">
            <td className="border p-2"></td>
            <td className="border p-2 text-right">Ukupno:</td>
            <td className="border p-2 text-right">{specTotalRSD.toFixed(2)} RSD</td>
          </tr>
        </tbody>
      </table>

      {/* Dodatni troškovi */}
      <h3 className="text-lg font-semibold mb-2">Dodaj dodatne troškove</h3>
      <table className="w-full border-collapse border border-gray-300 mb-4">
        <tbody>
          <tr>
            <td className="border p-2 font-medium">Dodatni trošak — opis</td>
            <td className="border p-2">
              <input type="text" value={extraCostLabel} onChange={(e) => setExtraCostLabel(e.target.value)} className="border p-1 rounded w-full" />
            </td>
          </tr>
          <tr>
            <td className="border p-2 font-medium">Dodatni trošak — iznos (RSD)</td>
            <td className="border p-2 text-right">
              <input type="number" value={extraCostAmount} onChange={(e) => setExtraCostAmount(e.target.value === "" ? "" : Number(e.target.value))} className="border p-1 rounded w-32 text-right" />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="flex justify-end mb-4">
        <button onClick={handleAddCosts} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Sačuvaj dodatne troškove
        </button>
      </div>

      {/* Konverzija */}
      <h3 className="text-lg font-semibold mb-2">Konverzija</h3>
      <table className="w-full border-collapse border border-gray-400 mb-6">
        <tbody>
          <tr><td className="border p-2">Specifikacija (EUR, niži kurs)</td><td className="border p-2 text-right">{specEUR.toFixed(2)}</td></tr>
          <tr><td className="border p-2">Dug iz prethodnog perioda (EUR)</td><td className="border p-2 text-right">{debtEUR.toFixed(2)}</td></tr>
          <tr><td className="border p-2">Smeštaj narednih 30 dana (EUR)</td><td className="border p-2 text-right">{lodgingEUR.toFixed(2)}</td></tr>
          <tr className="font-bold bg-gray-50"><td className="border p-2">UKUPNO (RSD)</td><td className="border p-2 text-right">{totalRSD.toFixed(2)}</td></tr>
          <tr className="font-bold bg-gray-50"><td className="border p-2">UKUPNO (EUR)</td><td className="border p-2 text-right">{totalEUR.toFixed(2)}</td></tr>
        </tbody>
      </table>

      <div className="flex justify-end gap-3 mb-10">
        <button
          onClick={handleSaveBilling}
          disabled={isSavingBilling}
          className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSavingBilling ? "Čuvanje..." : "Sačuvaj obračun"}
        </button>
                  <button
                onClick={handlePDFExport}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                Preuzmi Word (specifikacija)
                </button>
      </div>

      {/* Modal za izmenu globalnih kurseva */}
      {showRateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRateModal(false);
          }}
        >
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-semibold mb-4">Izmeni globalne kurseve</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Niži kurs (specifikacija)</label>
                <input type="number" step="0.01" value={tempLower} onChange={(e) => setTempLower(e.target.value)} className="border p-2 rounded w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Srednji kurs (dug + smeštaj)</label>
                <input type="number" step="0.01" value={tempMiddle} onChange={(e) => setTempMiddle(e.target.value)} className="border p-2 rounded w-full" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowRateModal(false)} className="px-4 py-2 border rounded hover:bg-gray-100">
                Otkaži
              </button>
              <button onClick={handleUpdateRates} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Sačuvaj
              </button>
             
            </div>
   
          </div>
          
        </div>
      )}
    </div>
  );
}