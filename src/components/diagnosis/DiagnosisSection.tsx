import { useState } from "react";
import { useAddDiagnosis } from "../../hooks/Patient/useDiagnosis";
import TextArea from "../form/input/TextArea";
import ComponentCard from "../common/ComponentCard";


interface Props {
  patientId: string;
}

export default function DiagnosisSection({ patientId }: Props) {
  const [newDiagnosis, setNewDiagnosis] = useState("");
  const addDiagnosisMutation = useAddDiagnosis(patientId);

  const handleAdd = () => {
    if (!newDiagnosis.trim()) return;
    addDiagnosisMutation.mutate({ description: newDiagnosis });
    setNewDiagnosis(""); // ✅ Očisti textarea posle dodavanja
  };

  return (
    <ComponentCard title="unesi Ucinak rada na pacijentu">
    

      <div className="mt-4 flex flex-col gap-3">
        <TextArea
          placeholder="Unesite ucinak..."
          rows={4}
          value={newDiagnosis}
          onChange={(value) => setNewDiagnosis(value)}
        />

        <button
          onClick={handleAdd}
          disabled={!newDiagnosis.trim()}
          className="bg-blue-500 w-fit self-end text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Dodaj Pacijentu
        </button>
      </div>
    </ComponentCard>
  );
}
