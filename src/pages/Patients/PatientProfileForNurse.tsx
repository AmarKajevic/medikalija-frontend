import { useParams } from "react-router";
import useArticles from "@entities/article/hooks/useArticle";
import { useDiagnoses } from "@entities/diagnosis/hooks/useDiagnosis";
import usePatient from "@entities/patient/hooks/usePatient";
import PatientInfo from "@entities/patient/ui/PatientInfo";
import DiagnosisSection from "@features/diagnosis/ui/DiagnosisSection";
import AddArticleToPatient from "@features/articles/ui/AddArticleToPatient";
import PatientDataTableForNurse from "@pages/Tables/PatientDataTableForNurse";
import { useMedicine } from "@entities/medicine/hooks/useMedicine";
import UseMedicine from "@pages/Medicine/UseMedicine";

export default function PatientProfileForNurse() {
  const { patientId } = useParams<{ patientId: string }>();

  const { data: patient, isLoading, error } = usePatient(patientId!);
  const { data: usedMedicine = [], refetch: refetchMedicines } = useMedicine(patientId!);
  const { getPatientArticles } = useArticles();
  const { data: diagnoses = [] } = useDiagnoses(patientId!);

  if (isLoading) return <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Učitavanje...</p>;
  if (error) return <p className="py-6 text-center text-sm text-error-500">Greška pri učitavanju</p>;
  if (!patient) return <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Pacijent nije pronađen</p>;

  const handleMedicineUsed = () => {
    refetchMedicines();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      {/* --- Osnovne informacije o pacijentu --- */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <PatientInfo patient={patient} />
      </div>

      {/* --- Sekcija za dodavanje dijagnoza, artikala i lekova --- */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <DiagnosisSection patientId={patient._id} />
        <AddArticleToPatient patientId={patient._id} />
        <UseMedicine patientId={patient._id} onMedicineUsed={handleMedicineUsed} />
      </div>

      {/* --- Tabela sa dijagnozama, lekovima i artiklima --- */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <PatientDataTableForNurse
          diagnoses={diagnoses}
          medicines={usedMedicine}
          usedArticles={getPatientArticles.data || []}
        />
      </div>
    </div>
  );
}
