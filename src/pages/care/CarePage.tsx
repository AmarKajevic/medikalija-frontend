import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { LuArrowLeft, LuSearch, LuUser } from "react-icons/lu";
import PageHeader from "@shared/ui/page/PageHeader";
import { Card, CardBody, CardHeader } from "@shared/ui/card/Card";
import { Input } from "@shared/ui/form/controls";
import Avatar from "@shared/ui/avatar/Avatar";
import EmptyState, { ErrorState } from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { matchesSearch } from "@shared/lib/search";
import { paths } from "@app/paths";
import { usePatients } from "@features/patients/hooks/usePatients";
import NurseEntryPanel from "@features/nurse-entries/ui/NurseEntryPanel";
import EntryList from "@features/nurse-entries/ui/EntryList";

interface PatientRow {
  _id: string;
  name: string;
  lastName: string;
  dischargeDate?: string | null;
}

// Radno mesto sestre u smeni: izabere pacijenta, unese šta je urađeno, ide dalje.
export default function CarePage() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("patient") ?? "";
  const { data, isLoading, isError, refetch } = usePatients();
  const [query, setQuery] = useState("");

  const patients = useMemo(
    () =>
      ((data?.patients ?? []) as PatientRow[])
        .filter((p) => !p.dischargeDate)
        .sort((a, b) => `${a.lastName} ${a.name}`.localeCompare(`${b.lastName} ${b.name}`, "sr")),
    [data]
  );
  const visible = useMemo(() => {
    const q = query.trim();
    return q ? patients.filter((p) => matchesSearch(`${p.name} ${p.lastName}`, q)) : patients;
  }, [patients, query]);
  const selected = patients.find((p) => p._id === selectedId);

  const select = (id: string) => setParams(id ? { patient: id } : {}, { replace: false });

  return (
    <>
      <PageHeader title="Unos nege" description="Izaberite pacijenta i označite šta ste uradili. Ono što se naplaćuje ide upravi na odobrenje." />

      <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
        {/* Na telefonu: lista ILI unos, da se ne skroluje preko celog spiska */}
        <Card className={selected ? "hidden lg:block" : ""}>
          <CardHeader title="Pacijenti" description={`${patients.length} na smeštaju`} />
          <CardBody className="space-y-3">
            <Input leading={<LuSearch className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pretraži po imenu..." aria-label="Pretraži pacijente" />
            {isError ? (
              <ErrorState message="Pacijenti nisu učitani." onRetry={() => refetch()} />
            ) : isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-11" />
                ))}
              </div>
            ) : (
              <ul className="-mx-2 max-h-[60vh] overflow-y-auto" aria-label="Pacijenti">
                {visible.map((p) => (
                  <li key={p._id}>
                    <button
                      type="button"
                      onClick={() => select(p._id)}
                      aria-current={p._id === selectedId ? "true" : undefined}
                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition ${
                        p._id === selectedId ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                      }`}
                    >
                      <Avatar name={p.name} lastName={p.lastName} size="sm" />
                      <span className="truncate">
                        {p.lastName} {p.name}
                      </span>
                    </button>
                  </li>
                ))}
                {visible.length === 0 && <li className="px-2 py-6 text-center text-sm text-gray-500">Nema pacijenta „{query}”.</li>}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="min-w-0 space-y-6">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button type="button" onClick={() => select("")} className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 lg:hidden dark:text-gray-300">
                  <LuArrowLeft className="h-4 w-4" /> Svi pacijenti
                </button>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selected.name} {selected.lastName}
                </h2>
                <Link to={paths.patient(selected._id)} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                  Profil pacijenta
                </Link>
              </div>
              <div className="grid items-start gap-6 2xl:grid-cols-2">
                <NurseEntryPanel patientId={selected._id} title="Šta ste uradili?" />
                <Card>
                  <CardHeader title="Unosi za pacijenta" />
                  <CardBody>
                    <EntryList patientId={selected._id} />
                  </CardBody>
                </Card>
              </div>
            </>
          ) : (
            <>
              <Card className="hidden lg:block">
                <EmptyState icon={<LuUser />} title="Izaberite pacijenta" description="Sa liste levo izaberite pacijenta kome ste nešto uradili." />
              </Card>
              <Card>
                <CardHeader title="Moji unosi" description="Sve što ste uneli, za sve pacijente." />
                <CardBody>
                  <EntryList mine />
                </CardBody>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
