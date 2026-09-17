import { Table, TableBody, TableCell, TableHeader, TableRow } from "@shared/ui/table/index";
import { api } from "@shared/api/api";
import { UsedArticle } from "@entities/article/hooks/useArticle";

import { useEffect, useState } from "react";
import { UsedCombination } from "@features/combinations/types/types";



interface Props {
  diagnoses: any[];
  medicines: any[];
  usedCombinations: UsedCombination[];
  usedArticles: UsedArticle[];
  patientId: string;
  refetch: () => void;
}

export default function PatientDataTable({
  diagnoses = [],
  medicines = [],
  usedCombinations = [],
  usedArticles = [],
  patientId,
  refetch
}: Props) {

  const allowedRoles = ["admin", "main-nurse"];

  // Sada arr je sigurno niz jer smo dali default, ali ipak ostavljamo proveru
  const filterByRole = (arr: any[]) =>
    Array.isArray(arr) ? arr.filter(item => allowedRoles.includes(item?.createdBy?.role)) : [];

  const [localDiagnoses, setLocalDiagnoses] = useState(filterByRole(diagnoses));
  const [localMedicines, setLocalMedicines] = useState(filterByRole(medicines));
  const [localCombinations, setLocalCombinations] = useState(filterByRole(usedCombinations));
  const [localArticles, setLocalArticles] = useState(filterByRole(usedArticles));

  // useEffect-ovi ostaju isti, ali sad filterByRole prima sigurno niz
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
      await api.delete(`/api/diagnosis/patient/${patientId}/diagnoses/delete-all`);

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
      await api.delete(`/api/medicine/patient/${patientId}/medicines/delete-all`);

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
      await api.delete(`/api/analysis/combination/patient/${patientId}/combinations/delete-all`);

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
      await api.delete(`/api/articles/patient/${patientId}/articles/delete-all`);

      setLocalArticles([]);
      refetch();

    } catch (error) {
      console.error("Greška pri brisanju artikala:", error);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader>
                Dijagnoze
                <button onClick={deleteDiagnoses} className="ml-2 text-xs font-medium text-error-500 hover:underline">
                  Obriši sve
                </button>
              </TableCell>

              <TableCell isHeader>
                Lekovi
                <button onClick={deleteMedicines} className="ml-2 text-xs font-medium text-error-500 hover:underline">
                  Obriši sve
                </button>
              </TableCell>

              <TableCell isHeader>
                Kombinacije
                <button onClick={deleteCombinations} className="ml-2 text-xs font-medium text-error-500 hover:underline">
                  Obriši sve
                </button>
              </TableCell>

              <TableCell isHeader>
                Artikli
                <button onClick={deleteArticles} className="ml-2 text-xs font-medium text-error-500 hover:underline">
                  Obriši sve
                </button>
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow>

              {/* ===================== DIJAGNOZE ===================== */}
              <TableCell className="align-top">
                {localDiagnoses.length ? (
                  localDiagnoses.map((d) => (
                    <div key={d._id} className="mb-3">
                      <p className="font-medium text-gray-800 dark:text-white/90">{d.description}</p>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Dodao/la: {d.createdBy?.name} ({d.createdBy?.role}) <br />
                        {new Date(d.createdAt).toLocaleString("sr-RS")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Nema dijagnoza</p>
                )}
              </TableCell>

              {/* ===================== LEKOVI ===================== */}
              <TableCell className="align-top">
                {localMedicines.length ? (
                  localMedicines.map((m) => (
                    <div key={m._id} className="mb-3">
                      <p className="text-gray-700 dark:text-gray-300">
                        {m?.medicine?.name} || {m.amount} kom. || Cena leka = {m.priceAtTheTime.toFixed(2)} RSD
                        <br />|| Ukupno = {(m.amount * m.priceAtTheTime).toFixed(2)} RSD
                      </p>
                      <span className="text-sm text-gray-400 dark:text-gray-500">
                        Dodao/la: {m.createdBy?.name} ({m.createdBy?.role})<br/>
                        {new Date(m.createdAt).toLocaleDateString("sr-RS")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Nema lekova</p>
                )}
              </TableCell>

              {/* ===================== KOMBINACIJE ===================== */}
              <TableCell className="align-top">
                {localCombinations?.length ? (
                  localCombinations.map((ua) => (
                    <div key={ua._id} className="mb-4 border-b border-gray-100 pb-2 dark:border-gray-800">
                      {ua?.analyses.map((a: any) => (
                        <p key={a._id} className="text-sm text-gray-700 dark:text-gray-300">
                          {a.name} — <span className="text-gray-500 dark:text-gray-400">{a.price} RSD</span>
                        </p>
                      ))}
                      <p className="mt-2 font-semibold text-gray-800 dark:text-white/90">
                        Ukupno: {ua?.analyses[0]?.totalPrice ?? 0} RSD
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Nema dodeljenih kombinacija</p>
                )}
              </TableCell>

              {/* ===================== ARTIKLI ===================== */}
              <TableCell className="align-top">
                {localArticles?.length ? (
                  localArticles.map((ua) => (
                    <div key={ua._id} className="mb-4 border-b border-gray-100 pb-2 dark:border-gray-800">
                      <p className="text-gray-700 dark:text-gray-300">
                        {ua.article.name} || {ua.amount} kom. || Cena artikla = {ua.article.price.toFixed(2)} RSD
                        <br />|| Ukupno = {(ua.article.price * ua.amount).toFixed(2)} RSD
                      </p>
                      <span className="text-sm text-gray-400 dark:text-gray-500">
                        Dodao/la: {ua.createdBy?.name} ({ua.createdBy?.role})
                        <br />
                        vreme: {new Date(ua.createdAt).toLocaleString("sr-RS")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Nema artikala</p>
                )}
              </TableCell>

            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
