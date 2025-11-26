import { useState } from "react"
import { useAddDiagnosis } from "../../hooks/Patient/useDiagnosis"

type Props = { patientId: string };

export default function DiagnosisForm({ patientId }: Props) {
    const[value, setValue] = useState("")
    const addDiagnosis = useAddDiagnosis(patientId)

    const handleSubmit = () => {

        if(!value) return;
        addDiagnosis.mutate({description: value})
        setValue("")
    }

  return (
    <div className="gap-2 mb-2 flex">
        <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="ubacite terapiju"
            className="border p-2 rounded-lg"
        />
        <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Dodaj terapiju
        </button>

    </div>
  )
}