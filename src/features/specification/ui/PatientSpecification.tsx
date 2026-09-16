import { Link } from "react-router";

import { useDeleteSpecificationItem } from "@features/specification/hooks/useDeleteSpecificationItem";
import { usePatientSpecification } from "@features/specification/hooks/usePatientSpecification";
import { useModal } from "@shared/ui/modal/useModal";
import { usePatient } from "@features/patients/hooks/usePatient";
import { SpecificationPeriodPicker } from "@features/specification/ui/SpecificationPeriodPicker";
import { SpecificationEditor } from "@features/specification/ui/SpecificationEditor";

export default function PatientSpecification({
  patientId,
}: {
  patientId: string;
}) {
  const { data, isLoading, isError } = usePatientSpecification(patientId);
  const { data: patient } = usePatient(patientId);
  const { open } = useModal();

  const deleteItem = useDeleteSpecificationItem(patientId);

  if (isLoading) return <p>Učitavanje...</p>;
  if (isError) return <p>Greška pri učitavanju specifikacije.</p>;
  if (!data) return <p>Nema aktivne specifikacije.</p>;

  const patientName = patient ? `${patient.name} ${patient.lastName}` : "";

  return (
    <div className="w-full max-w-3xl">
      <SpecificationPeriodPicker patientId={patientId} activeSpecification={data} />

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3 print:hidden">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Napravi Specifikaciju</h2>

        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white/10 dark:hover:bg-white/20"
            onClick={() => open("medicine", { patientId })}
          >
            Dodaj lek
          </button>

          <button
            className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white/10 dark:hover:bg-white/20"
            onClick={() => open("combination", { patientId })}
          >
            Dodaj kombinaciju
          </button>
          <button
            className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white/10 dark:hover:bg-white/20"
            onClick={() => open("article", { patientId })}
          >
            Dodaj artikle
          </button>

          <Link
            to={`/patient/${patientId}/specification-history`}
            className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
          >
            Istorija specifikacija
          </Link>
        </div>
      </div>

      <SpecificationEditor
        specification={data}
        patientName={patientName}
        onDeleteItem={(itemId) => deleteItem.mutate({ specId: data._id, itemId })}
      />
    </div>
  );
}
