import { useEffect, useState } from "react";
import { api } from "@shared/api/api";
import ComponentCard from "@shared/ui/common/ComponentCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@shared/ui/table/index";
import Input from "@shared/ui/form/input/InputField";

export default function MedicineReserveList() {
  const [reserve, setReserve] = useState<any[]>([]);
  const [returnAmounts, setReturnAmounts] = useState<Record<string, number>>(
    {}
  );
  
  const [loading, setLoading] = useState(false);

  // ✅ UČITAVANJE REZERVE
  const fetchReserve = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/medicine-reserve");

      setReserve(res.data.reserve || []);
    } catch (err) {
      console.error("Greška pri učitavanju rezerve:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReserve();
  }, []);

  // ✅ BRISANJE IZ REZERVE
  const deleteReserve = async (id: string) => {
    if (!confirm("Obrisati lek iz rezerve?")) return;

    await api.delete(`/api/medicine-reserve/${id}`);

    fetchReserve();
  };

  // ✅ VRAĆANJE NAZAD U DOM / PORODICU
  const returnFromReserve = async (reserveId: string) => {
    const amount = returnAmounts[reserveId];
    if (!amount || amount <= 0)
      return alert("Unesi količinu za vraćanje!");

    await api.post("/api/medicine-reserve/return", { reserveId, amount });

    setReturnAmounts((prev) => ({ ...prev, [reserveId]: 0 }));
    fetchReserve();
  };

  return (
    <ComponentCard title="REZERVA LEKOVA">
      <div className="overflow-x-auto">

        {loading ? (
          <p className="text-sm text-gray-500">Učitavanje rezerve...</p>
        ) : reserve.length === 0 ? (
          <p className="text-sm text-gray-500">Rezerva je prazna.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Lek</TableCell>
                <TableCell isHeader>Količina</TableCell>
                <TableCell isHeader>Izvor</TableCell>
                <TableCell isHeader>Cena</TableCell>
                <TableCell isHeader>Datum</TableCell>
                <TableCell isHeader>Vrati</TableCell>
                <TableCell isHeader>Akcija</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {reserve.map((r) => (
                <TableRow key={r._id}>

                  {/* NAZIV */}
                  <TableCell className="font-medium text-gray-800 dark:text-white/90">{r.name}</TableCell>

                  {/* KOLIČINA */}
                  <TableCell>
                    <span className="font-semibold text-brand-500">
                      {r.amount}
                    </span>{" "}
                    kom
                  </TableCell>

                  {/* IZVOR */}
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        r.source === "home"
                          ? "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
                          : "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                      }`}
                    >
                      {r.source === "home" ? "Dom" : "Porodica"}
                    </span>
                  </TableCell>

                  {/* CENA */}
                  <TableCell>
                    {r.pricePerUnit ? `${r.pricePerUnit} RSD` : "-"}
                  </TableCell>

                  {/* DATUM */}
                  <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </TableCell>

                  {/* INPUT ZA VRAĆANJE */}
                  <TableCell className="w-32">
                    <Input
                      type="number"
                      placeholder="Količina"
                      value={returnAmounts[r._id] || ""}
                      onChange={(e) =>
                        setReturnAmounts({
                          ...returnAmounts,
                          [r._id]: Number(e.target.value),
                        })
                      }
                    />

                    <button
                      onClick={() => returnFromReserve(r._id)}
                      className="mt-2 w-full rounded-md bg-success-500 py-1 text-xs font-medium text-white hover:bg-success-600"
                    >
                      Vrati nazad
                    </button>
                  </TableCell>

                  {/* BRISANJE */}
                  <TableCell>
                    <button
                      onClick={() => deleteReserve(r._id)}
                      className="rounded-md bg-error-50 px-3 py-1.5 text-xs font-medium text-error-600 hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400 dark:hover:bg-error-500/25"
                    >
                      Obriši
                    </button>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </div>
    </ComponentCard>
  );
}
