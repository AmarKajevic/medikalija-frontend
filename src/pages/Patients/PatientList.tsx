import { useRef } from "react";
import { Link } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePatients } from "../../features/patients/hooks/usePatients";
import DeleteButton from "../../shared/ui/DeleteButton";
import { useDeletePatient } from "../../features/patients/hooks/useDeletePatient";


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
    return <p className="text-center py-4 text-gray-500">Učitavanje...</p>;

  if (error)
    return <p className="text-red-500 text-center py-4">{error.message}</p>;

  if (!patients.length)
    return <p className="text-center py-4">Nema pacijenata</p>;



  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">


      <div className="max-w-full overflow-x-auto">
        <div className="grid grid-cols-7 p-3 font-semibold border-b bg-gray-100">
        <div>Ime </div>
        <div>Prezime</div>
        <div>Datum prijema</div>
        <div>Otpusten</div>
        <div>Kontakt osoba</div>
        <div>Profil</div>
        <div>Izbrisi</div>

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
        <div className="grid grid-cols-7  w-full border-b p-2 hover:bg-gray-50">
          <div>{patient?.name}</div>
          <div>{patient?.lastName}</div>
          <div>
            {new Date(patient?.admissionDate).toLocaleDateString("sr-RS")}
          </div>
          <div>
            {patient?.dischargeDate ? "Otpušten" : "Čeka datum"}
          </div>
          <div>{patient?.contactPerson}</div>
          <div>
            <Link
              to={`/patient/${patient._id}`}
              className="px-3 py-1 bg-blue-600 text-white rounded"
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
  );
}

export default PatientList;