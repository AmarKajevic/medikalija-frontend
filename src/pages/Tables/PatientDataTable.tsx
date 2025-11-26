import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { UsedArticle } from "../../hooks/Patient/useArticle";
import { UsedCombination } from "../../hooks/Patient/useCombination";
import { useEffect, useState } from "react";

interface Props {
  diagnoses: any[];
  medicines: any[];
  usedCombinations: UsedCombination[];
  usedArticles: UsedArticle[];
  patientId: string;
  refetch: () => void;
}

export default function PatientDataTable({
  diagnoses,
  medicines,
  usedCombinations,
  usedArticles,
  patientId,
  refetch
}: Props) {

  const { token } = useAuth();

  // -------------------------------------
  //   🔥 dozvoljene role za prikaz
  // -------------------------------------
  const allowedRoles = ["admin", "head-nurse"];

  const filterByRole = (arr: any[]) =>
    arr.filter(item => allowedRoles.includes(item?.createdBy?.role));

  // -------------------------------------
  // 🔥 Lokalni state — prikazuje samo admin + glavna sestra
  // -------------------------------------
  const [localDiagnoses, setLocalDiagnoses] = useState(filterByRole(diagnoses));
  const [localMedicines, setLocalMedicines] = useState(filterByRole(medicines));
  const [localCombinations, setLocalCombinations] = useState(filterByRole(usedCombinations));
  const [localArticles, setLocalArticles] = useState(filterByRole(usedArticles));

  // Sync kada refetch donese nove podatke
  useEffect(() => setLocalDiagnoses(filterByRole(diagnoses)), [diagnoses]);
  useEffect(() => setLocalMedicines(filterByRole(medicines)), [medicines]);
  useEffect(() => setLocalCombinations(filterByRole(usedCombinations)), [usedCombinations]);
  useEffect(() => setLocalArticles(filterByRole(usedArticles)), [usedArticles]);

  // ---------------------------------------------------
  // OBRIŠI DIJAGNOZE
  // ---------------------------------------------------
  const deleteDiagnoses = async () => {
    if (!confirm("Obrisati sve dijagnoze?")) return;

    try {
      await axios.delete(
        `https://medikalija-api.vercel.app/api/diagnosis/patient/${patientId}/diagnoses/delete-all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLocalDiagnoses([]);
      refetch();

    } catch (error) {
      console.error("Greška pri brisanju dijagnoza:", error);
    }
  };

  // ---------------------------------------------------
  // OBRIŠI LEKOVE
  // ---------------------------------------------------
  const deleteMedicines = async () => {
    if (!confirm("Obrisati sve lekove?")) return;

    try {
      await axios.delete(
        `https://medikalija-api.vercel.app/api/medicine/patient/${patientId}/medicines/delete-all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLocalMedicines([]);
      refetch();

    } catch (error) {
      console.error("Greška pri brisanju lekova:", error);
    }
  };

  // ---------------------------------------------------
  // OBRIŠI KOMBINACIJE
  // ---------------------------------------------------
  const deleteCombinations = async () => {
    if (!confirm("Obrisati sve kombinacije?")) return;

    try {
      await axios.delete(
        `https://medikalija-api.vercel.app/api/analysis/combination/patient/${patientId}/combinations/delete-all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLocalCombinations([]);
      refetch();

    } catch (error) {
      console.error("Greška pri brisanju kombinacija:", error);
    }
  };

  // ---------------------------------------------------
  // OBRIŠI ARTIKLE
  // ---------------------------------------------------
  const deleteArticles = async () => {
    if (!confirm("Obrisati sve artikle?")) return;

    try {
      await axios.delete(
        `https://medikalija-api.vercel.app/api/articles/patient/${patientId}/articles/delete-all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLocalArticles([]);
      refetch();

    } catch (error) {
      console.error("Greška pri brisanju artikala:", error);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-4">

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-large text-gray-500">
                Dijagnoze
                <button onClick={deleteDiagnoses} className="ml-2 text-red-500 underline text-xs">
                  Obriši sve
                </button>
              </TableCell>

              <TableCell isHeader className="px-5 py-3 font-large text-gray-500">
                Lekovi
                <button onClick={deleteMedicines} className="ml-2 text-red-500 underline text-xs">
                  Obriši sve
                </button>
              </TableCell>

              <TableCell isHeader className="px-5 py-3 font-large text-gray-500">
                Kombinacije
                <button onClick={deleteCombinations} className="ml-2 text-red-500 underline text-xs">
                  Obriši sve
                </button>
              </TableCell>

              <TableCell isHeader className="px-5 py-3 font-large text-gray-500">
                Artikli
                <button onClick={deleteArticles} className="ml-2 text-red-500 underline text-xs">
                  Obriši sve
                </button>
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow>

              {/* ===================== DIJAGNOZE ===================== */}
              <TableCell className="px-5 py-3 align-top">
                {localDiagnoses.length ? (
                  localDiagnoses.map((d) => (
                    <div key={d._id} className="mb-3">
                      <p className="font-medium">{d.description}</p>
                      <span className="text-sm text-gray-500">
                        Dodao/la: {d.createdBy?.name} ({d.createdBy?.role}) <br />
                        {new Date(d.createdAt).toLocaleString("sr-RS")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p>Nema dijagnoza</p>
                )}
              </TableCell>

              {/* ===================== LEKOVI ===================== */}
              <TableCell className="px-5 py-3 align-top">
                {localMedicines.length ? (
                  localMedicines.map((m) => (
                    <div key={m._id} className="mb-3">
                      <p>
                        {m?.medicine?.name} || {m.amount} kom. || Cena leka = {m.priceAtTheTime.toFixed(2)} RSD
                        <br />|| Ukupno = {(m.amount * m.priceAtTheTime).toFixed(2)} RSD
                      </p>
                      <span className="text-sm text-gray-400">
                        Dodao/la: {m.createdBy?.name} ({m.createdBy?.role})<br/>
                        {new Date(m.createdAt).toLocaleDateString("sr-RS")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p>Nema lekova</p>
                )}
              </TableCell>

              {/* ===================== KOMBINACIJE ===================== */}
              <TableCell className="px-5 py-3 align-top">
                {localCombinations?.length ? (
                  localCombinations.map((ua) => (
                    <div key={ua._id} className="mb-4 border-b border-gray-200 pb-2">
                      {ua?.analyses.map((a: any) => (
                        <p key={a._id} className="text-sm">
                          {a.name} — <span className="text-gray-600">{a.price} RSD</span>
                        </p>
                      ))}
                      <p className="mt-2 font-semibold">
                        Ukupno: {ua?.analyses[0]?.totalPrice ?? 0} RSD
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Nema dodeljenih kombinacija</p>
                )}
              </TableCell>

              {/* ===================== ARTIKLI ===================== */}
              <TableCell className="px-5 py-3 align-top">
                {localArticles?.length ? (
                  localArticles.map((ua) => (
                    <div key={ua._id} className="mb-4 border-b border-gray-200 pb-2">
                      <p>
                        {ua.article.name} || {ua.amount} kom. || Cena artikla = {ua.article.price.toFixed(2)} RSD
                        <br />|| Ukupno = {(ua.article.price * ua.amount).toFixed(2)} RSD
                      </p>
                      <span className="text-sm text-gray-400">
                        Dodao/la: {ua.createdBy?.name} ({ua.createdBy?.role})
                        <br />
                        vreme: {new Date(ua.createdAt).toLocaleString("sr-RS")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Nema artikala</p>
                )}
              </TableCell>

            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
