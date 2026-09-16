import { useParams, Link } from "react-router";
import usePatient from "@entities/patient/hooks/usePatient";
import PatientInfo from "@entities/patient/ui/PatientInfo";
import { useDiagnoses } from "@entities/diagnosis/hooks/useDiagnosis";
import PatientDataTable from "@pages/Tables/PatientDataTable";
import { useMedicine } from "@entities/medicine/hooks/useMedicine";

import useArticles from "@entities/article/hooks/useArticle";


import PatientSpecification from "@features/specification/ui/PatientSpecification";
import { PatientStockMedicines } from "@features/medicine/ui/PatientStockMedicines";
import { useUsedCombination } from "@features/combinations/hooks/useUsedCombination";





export default function PatientProfile() {
  const { patientId } = useParams<{ patientId: string }>();

  const { data: patient, isLoading, error } = usePatient(patientId!);

  const { data: diagnoses = [] } = useDiagnoses(patientId!);

  const { data: usedMedicine = [], refetch: refetchMedicines } = useMedicine(patientId!);

  const { getPatientArticles } = useArticles();
  const { data: usedArticles = [] } = getPatientArticles;

  const { data: usedCombination } = useUsedCombination(patientId!);

  if (isLoading) return <p>Učitavanje...</p>;
  if (error) return <p>Greška pri učitavanju</p>;
  if (!patient) return <p>Pacijent nije pronađen</p>;



  return (
    <div className="p-4 space-y-6">
      {/* Patient Info + Buttons */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <PatientInfo patient={patient} />

        {patient && patient._id && (
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/patient/${patientId}/specification-history`}
              className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white/10 dark:hover:bg-white/20 transition"
            >
              Istorija specifikacija
            </Link>

            <Link
              to={`/patient/${patient._id}/future-specifications`}
              className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white/10 dark:hover:bg-white/20 transition"
            >
              Specifikacije za naredne godine
            </Link>
            <Link
              to={`/patient-profile-nurse/${patient._id}`}
              className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white/10 dark:hover:bg-white/20 transition"
            >
              Šta su sestre dodale
            </Link>
            <PatientStockMedicines patientId={patient._id} />
          </div>
        )}
      </div>


      <div className="flex">
        <PatientSpecification patientId={patient._id} />
      </div>

      {/* TABLE */}
      <PatientDataTable
        diagnoses={diagnoses}
        medicines={usedMedicine}
        usedCombinations={usedCombination || []}
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
