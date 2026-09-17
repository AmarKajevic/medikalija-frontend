import { useState } from "react"
import { useAddDiagnosis } from "@entities/diagnosis/hooks/useDiagnosis"

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
    <div className="mb-2 flex gap-2">
        <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="ubacite terapiju"
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        />
        <button onClick={handleSubmit} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
      >
        Dodaj terapiju
        </button>

    </div>
  )
}