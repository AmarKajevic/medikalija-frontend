import { useParams } from "react-router";
import usePatient from "../../hooks/Patient/usePatient";
import PatientInfo from "../../components/patients/PatientInfo";
import { useDiagnoses } from "../../hooks/Patient/useDiagnosis";
import DiagnosisSection from "../../components/diagnosis/DiagnosisSection";
import PatientDataTable from "../Tables/PatientDataTable";
import { useMedicine } from "../../hooks/Patient/useMedicine";

import UseMedicine from "../Medicine/UseMedicine";
import AddArticleToPatient from "../../components/articles/AddArticleToPatient";
import useArticles from "../../hooks/Patient/useArticle";
import { useCombinations } from "../../hooks/Patient/useCombination";
import PatientComb from "../../components/patients/PatientComb";


export default function PatientProfile() {
  const { patientId } = useParams<{ patientId: string }>();

  const { data: patient, isLoading, error } = usePatient(patientId!);

  const { data: diagnoses = [] } = useDiagnoses(patientId!);

  const { data: usedMedicine = [], refetch: refetchMedicines } = useMedicine(patientId!);

  const { getPatientArticles } = useArticles();
  const { data: usedArticles = [] } = getPatientArticles;

  const { usedCombination } = useCombinations(patientId!);

  if (isLoading) return <p>Učitavanje...</p>;
  if (error) return <p>Greška pri učitavanju</p>;
  if (!patient) return <p>Pacijent nije pronađen</p>;

  const handleMedicineUsed = () => {
    refetchMedicines();
  };

  return (
    <div className="p-4 space-y-6">
      {/* Patient Info + Buttons */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <PatientInfo patient={patient} />

        {patient && patient._id && (
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href={`/patient/${patient._id}/specification`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Pogledaj specifikaciju
            </a>

            <a
              href={`/patient/${patientId}/specification-history`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Pogledaj istoriju specifikacija
            </a>

            <a
              href={`/patient/${patient._id}/future-specifications`}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
            >
              Specifikacije za naredne godine
            </a>
            <a
            href={`/patient-profile-nurse/${patient._id}`}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          >
            Sta su sestre dodale
          </a>
          </div>
        )}
      </div>

      {/* Use Medicine + Add Article */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DiagnosisSection patientId={patient._id} />
        <AddArticleToPatient patientId={patient._id} />
      </div>

      {/* Diagnosis + Combinations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UseMedicine patientId={patient._id} onMedicineUsed={handleMedicineUsed} />
        <PatientComb patientId={patient._id} />
      </div>

      {/* TABLE */}
      <PatientDataTable
        diagnoses={diagnoses}
        medicines={usedMedicine}
        usedCombinations={usedCombination.data || []}
        usedArticles={usedArticles}
        patientId={patient._id}      // 🔥 NOVO
        refetch={() => {
          refetchMedicines();        // 🔥 obavezno
          // Ako želiš — dodaj i druge refetch-e za članke, kombinacije itd.
        }}
      />
    </div>
  );
}
