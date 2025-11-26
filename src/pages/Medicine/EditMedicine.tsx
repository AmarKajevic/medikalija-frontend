import { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import axios from "axios"

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
  const { token } = useAuth()
  const [price, setPrice] = useState<number>(pricePerUnit)
  const [quantityValue, setQuantityValue] = useState<number>(quantity)
  const [addQuantity, setAddQuantity] = useState<number>(0)
  const [message, setMessage] = useState("")

  // Funkcija za update cene
  const handlePriceUpdate = async () => {
    try {
      const data = { pricePerUnit: price }
      const response = await axios.put(
        `https://medikalija-api.vercel.app/api/medicine/${medicineId}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      )
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
      let data: any = {}
      if (mode === "family") {
        data = isAdd ? { addQuantity, fromFamily: true } : { quantity: quantityValue, fromFamily: true }
      } else {
        data = isAdd ? { addQuantity } : { quantity: quantityValue }
      }

      const response = await axios.put(
        `https://medikalija-api.vercel.app/api/medicine/${medicineId}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      )

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
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="border p-1 rounded w-20"
            placeholder="Cena"
          />
          <button
            onClick={handlePriceUpdate}
            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
          >
            Nova cena
          </button>
        </>
      )}

      {/* Količina */}
      <input
        type="number"
        value={quantityValue}
        onChange={(e) => setQuantityValue(Number(e.target.value))}
        className="border p-1 rounded w-20"
        placeholder="Nova količina"
      />
      <button
        onClick={() => handleQuantityUpdate(false)}
        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
      >
        Nova količina
      </button>

      <input
        type="number"
        value={addQuantity}
        onChange={(e) => setAddQuantity(Number(e.target.value))}
        className="border p-1 rounded w-20"
        placeholder="Dodaj količinu"
      />
      <button
        onClick={() => handleQuantityUpdate(true)}
        className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600"
      >
        Dodaj količinu
      </button>

      {/* Poruka */}
      {message && <p className="text-green-600 text-sm ml-2">{message}</p>}
    </div>
  )
}
