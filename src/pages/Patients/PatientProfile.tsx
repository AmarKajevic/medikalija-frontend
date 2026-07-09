import { useParams } from "react-router";
import usePatient from "../../hooks/Patient/usePatient";
import PatientInfo from "../../components/patients/PatientInfo";
import { useDiagnoses } from "../../hooks/Patient/useDiagnosis";
import PatientDataTable from "../Tables/PatientDataTable";
import { useMedicine } from "../../hooks/Patient/useMedicine";

import useArticles from "../../hooks/Patient/useArticle";


import PatientSpecification from "../../components/patients/PatientSpecification";
import { PatientStockMedicines } from "../../features/medicine/ui/PatientStockMedicines";
import { useUsedCombination } from "../../features/combinations/hooks/useUsedCombination";





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
          <div className="flex flex-col sm:flex-row gap-2">
          

            <a
              href={`/patient/${patientId}/specification-history`}
              className="px-4 py-2 bg-zinc-900 text-white rounded hover:bg-zinc-700 transition"
            >
              Pogledaj istoriju specifikacija
            </a>

            <a
              href={`/patient/${patient._id}/future-specifications`}
              className="px-4 py-2 bg-zinc-900 text-white rounded hover:bg-zinc-700 transition"
            >
              Specifikacije za naredne godine
            </a>
            <a
            href={`/patient-profile-nurse/${patient._id}`}
            className="px-4 py-2 bg-zinc-900 text-white rounded hover:bg-zinc-700 transition"
          >
            Sta su sestre dodale
          </a>
           <PatientStockMedicines patientId={patient._id}/>
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
