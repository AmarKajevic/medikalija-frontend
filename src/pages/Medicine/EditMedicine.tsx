import { useState } from "react"
import { api } from "@shared/api/api"

interface MedicineProps {
  medicineId: string
  pricePerUnit?: number
  quantity?: number
  mode?: "home" | "family"  // doma ili porodica
  onUpdated: () => void
}

export default function EditMedicine({
  medicineId,
  pricePerUnit = 0,
  quantity = 0,
  mode = "home",
  onUpdated,
}: MedicineProps) {
  const [price, setPrice] = useState<number>(pricePerUnit)
  const [quantityValue, setQuantityValue] = useState<number>(quantity)
  const [addQuantity, setAddQuantity] = useState<number>(0)
  const [message, setMessage] = useState("")

  // Funkcija za update cene
  const handlePriceUpdate = async () => {
    try {
      const data = { pricePerUnit: price }
      const response = await api.put(`/api/medicine/${medicineId}`, data)
      if (response.data.success) {
        setMessage("Cena uspešno promenjena")
        onUpdated()
      }
    } catch (error) {
      console.error(error)
      setMessage("Greška pri ažuriranju cene")
    }
  }

  // Funkcija za update količine
const handleQuantityUpdate = async (isAdd: boolean) => {
  try {
    const data = isAdd ? { addQuantity } : { quantity: quantityValue }

    const endpoint =
      mode === "family"
        ? `/api/medicine/patient-stock/${medicineId}`
        : `/api/medicine/${medicineId}`
    const response = await api.put(endpoint, data)

    if (response.data.success) {
      setMessage("Količina uspešno promenjena")
      setQuantityValue(0)
      setAddQuantity(0)
      onUpdated()
    }
  } catch (error) {
    console.error(error)
    setMessage("Greška pri ažuriranju količine")
  }
}


  return (
    <div className="flex items-center gap-2">
      {/* Cena */}
      {mode === "home" && (
        <>
          <input
            type="number"
            value={price === 0 ? "" : price}
            onChange={(e) => setPrice(e.target.value === "" ? 0 : Number(e.target.value))}
            className="w-20 rounded-md border border-gray-300 p-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder="Cena"
          />
          <button
            onClick={handlePriceUpdate}
            className="rounded-md bg-success-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-success-600"
          >
            Nova cena
          </button>
        </>
      )}

      {/* Količina */}
          <input
            type="number"
            value={quantityValue === 0 ? "" : quantityValue}
            onChange={(e) =>
              setQuantityValue(e.target.value === "" ? 0 : Number(e.target.value))
            }
            className="w-20 rounded-md border border-gray-300 p-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder="Nova količina"
          />

      <button
        onClick={() => handleQuantityUpdate(false)}
        className="rounded-md bg-brand-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
      >
        Nova količina
      </button>

        <input
          type="number"
          value={addQuantity === 0 ? "" : addQuantity}
          onChange={(e) =>
            setAddQuantity(e.target.value === "" ? 0 : Number(e.target.value))
          }
          className="w-20 rounded-md border border-gray-300 p-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          placeholder="Dodaj količinu"
        />

      <button
        onClick={() => handleQuantityUpdate(true)}
        className="rounded-md bg-gray-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-600"
      >
        Dodaj količinu
      </button>

      {/* Poruka */}
      {message && <p className="ml-2 text-sm text-success-600 dark:text-success-500">{message}</p>}
    </div>
  )
}
