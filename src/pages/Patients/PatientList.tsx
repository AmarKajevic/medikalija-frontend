import { useRef } from "react";
import { Link } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePatients } from "@features/patients/hooks/usePatients";
import DeleteButton from "@shared/ui/DeleteButton";
import { useDeletePatient } from "@features/patients/hooks/useDeletePatient";


function PatientList() {
  const { data, isLoading, error } = usePatients();
  const {mutate} = useDeletePatient()
  const parentRef = useRef<HTMLDivElement | null>(null)

  

  const patients = data?.patients|| [];

  const rowVirtualizer = useVirtualizer({
    count: patients.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 110,
    overscan: 10
  })
  const virtualRows = rowVirtualizer.getVirtualItems();

  if (isLoading)
    return <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">Učitavanje...</p>;

  if (error)
    return <p className="py-4 text-center text-sm text-error-500">{error.message}</p>;

  if (!patients.length)
    return <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">Nema pacijenata</p>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Lista pacijenata
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {patients.length} pacijenata ukupno
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 p-3 text-xs font-medium uppercase text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
            <div>Ime</div>
            <div>Prezime</div>
            <div>Datum prijema</div>
            <div>Otpušten</div>
            <div>Kontakt osoba</div>
            <div>Profil</div>
            <div>Izbriši</div>
          </div>

          <div ref={parentRef} className="h-[600px] overflow-auto">
            <div
              style={{
                height: rowVirtualizer.getTotalSize(),
                position: "relative",
              }}
            >
              {virtualRows.map((virtualRow) => {
                const patient = patients[virtualRow.index];

                return (
                  <div
                    key={patient?._id}
                    style={{
                      position: "absolute",
                      top: 0,
                      transform: `translateY(${virtualRow.start}px)`,
                      width: "100%",
                      left: 0,
                    }}
                  >
                    <div className="grid w-full grid-cols-7 items-center border-b border-gray-100 p-3 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]">
                      <div className="font-medium text-gray-800 dark:text-white/90">{patient?.name}</div>
                      <div>{patient?.lastName}</div>
                      <div>
                        {new Date(patient?.admissionDate).toLocaleDateString("sr-RS")}
                      </div>
                      <div>
                        {patient?.dischargeDate ? (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-400">
                            Otpušten
                          </span>
                        ) : (
                          <span className="rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
                            Čeka datum
                          </span>
                        )}
                      </div>
                      <div>{patient?.contactPerson}</div>
                      <div>
                        <Link
                          to={`/patient/${patient._id}`}
                          className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                        >
                          Profil
                        </Link>
                      </div>
                      <div>
                        <DeleteButton onConfirm={() => mutate(patient._id)} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientList;