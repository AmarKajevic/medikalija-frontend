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

  if (isLoading) return <p className="text-center py-6">Učitavanje...</p>;
  if (error) return <p className="text-center py-6 text-red-600">Greška pri učitavanju</p>;
  if (!patient) return <p className="text-center py-6 text-gray-500">Pacijent nije pronađen</p>;

  const handleMedicineUsed = () => {
    refetchMedicines();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* --- Osnovne informacije o pacijentu --- */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <PatientInfo patient={patient} />
      </div>

      {/* --- Sekcija za dodavanje dijagnoza, artikala i lekova --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
          <DiagnosisSection patientId={patient._id} />        
          <AddArticleToPatient patientId={patient._id} />    
          <UseMedicine patientId={patient._id} onMedicineUsed={handleMedicineUsed} />
        
      </div>

      {/* --- Tabela sa dijagnozama, lekovima i artiklima --- */}
      <div className="bg-white rounded-xl shadow-md p-4 overflow-x-auto">
        <PatientDataTableForNurse
          diagnoses={diagnoses}
          medicines={usedMedicine}
          usedArticles={getPatientArticles.data || []}
        />
      </div>
    </div>
  );
}
