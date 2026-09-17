import { useParams } from "react-router";
import { useSpecification } from "@features/specification/hooks/useSpecification";
import { useDeleteSpecificationItem } from "@features/specification/hooks/useDeleteSpecificationItem";
import { usePatient } from "@features/patients/hooks/usePatient";
import { SpecificationEditor } from "@features/specification/ui/SpecificationEditor";

export default function SpecificationViewPage() {
  const { specificationId } = useParams();
  const { data: spec, isLoading, isError } = useSpecification(specificationId || "");
  const { data: patient } = usePatient(spec?.patientId || "");
  const deleteItem = useDeleteSpecificationItem(spec?.patientId || "");

  if (isLoading) return <p className="p-6 text-sm text-gray-500 dark:text-gray-400">Učitavanje...</p>;
  if (isError || !spec) return <p className="p-6 text-sm text-error-500">Greška pri učitavanju specifikacije.</p>;

  const patientName = patient ? `${patient.name} ${patient.lastName}` : "";

  return (
    <div className="p-5">
      <button onClick={() => window.history.back()} className="mb-4 text-brand-500 hover:underline print:hidden">
        ← Nazad
      </button>

      <SpecificationEditor
        specification={spec}
        patientName={patientName}
        onDeleteItem={(itemId) => deleteItem.mutate({ specId: spec._id, itemId })}
      />

      {!spec.isActive && (
        <p className="text-xs text-gray-500 dark:text-gray-400 print:hidden">
          Ovo nije aktivan period — nove stavke (lekovi, artikli, kombinacije) dodaju se na stranici
          pacijenta u trenutno aktivan period.
        </p>
      )}
    </div>
  );
}
