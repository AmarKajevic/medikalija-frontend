import { Table, TableBody, TableCell, TableHeader, TableRow } from "@shared/ui/table/index";
import { UsedArticle } from "@entities/article/hooks/useArticle";
import { UsedMedicine } from "@entities/medicine/hooks/useMedicine";



interface Props {
  diagnoses: any[];
  usedArticles: UsedArticle[];
  medicines: UsedMedicine[];
}

export default function PatientDataTableForNurse({ diagnoses, usedArticles, medicines }: Props) {

  // ✅ Prikaži samo artikle koje je dodala sestra
  const nurseArticles = usedArticles.filter(a => a.createdBy?.role === "nurse");
  const nurseMedicines = medicines.filter(m => m.createdBy?.role === "nurse")

  return (
    <div className="overflow-hidden  rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table >
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-large text-gray-500 text-start text-theme-xs dark:text-gray-400">Dijagnoze</TableCell>
              <TableCell isHeader className="px-5 py-3 font-large text-gray-500 text-start text-theme-xs dark:text-gray-400">Artikli dodati od strane sestre</TableCell>
              <TableCell isHeader className="px-5 py-3 font-large text-gray-500 text-start text-theme-xs dark:text-gray-400">Lekovi dodati od strane sestre</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow>

              {/* ✅ DIJAGNOZE */}
              <TableCell className="px-5 py-3 align-top">
                {diagnoses.length ? (
                  diagnoses.map((d) => (
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

              {/* ✅ SAMO ARTIKLI OD SESTRE */}
              <TableCell className="px-5 py-3 align-top">
                {nurseArticles.length > 0 ? (
                  nurseArticles.map((ua) => (
                    <div key={ua._id} className="mb-4 border-b border-gray-100 pb-2 dark:border-gray-800">
                      <p className="text-gray-700 dark:text-gray-300">
                        {ua.article.name} — {ua.amount} kom. — Cena: {ua.article.price.toFixed(2)} RSD
                        <br />Ukupno: {(ua.article.price * ua.amount).toFixed(2)} RSD
                      </p>
                      <span className="text-sm text-gray-400 dark:text-gray-500">
                        Dodala: {ua.createdBy?.name} (sestra)
                        <br />
                        vreme: {new Date(ua.createdAt).toLocaleString("sr-RS")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Sestra nije dodala nijedan artikal</p>
                )}
              </TableCell>
              {/* ✅ LEKOVI OD SESTRE */}
              <TableCell className="px-5 py-3 align-top">
                {nurseMedicines.length > 0 ? (
                  nurseMedicines.map((m) => (
                    <div key={m._id} className="mb-4 border-b border-gray-100 pb-2 dark:border-gray-800">
                      <p className="text-gray-700 dark:text-gray-300">
                        {m.medicine.name} — {m.amount} kom. — Cena leka: {m.priceAtTheTime.toFixed(2)} RSD
                        <br />Ukupno: {(m.priceAtTheTime * m.amount).toFixed(2)} RSD
                      </p>
                      <span className="text-sm text-gray-400 dark:text-gray-500">
                        Dodala: {m.createdBy?.name} (sestra)
                        <br />
                        vreme: {new Date(m.createdAt).toLocaleString("sr-RS")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Sestra nije dodala nijedan lek</p>
                )}
              </TableCell>

            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
