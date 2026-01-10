import { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import axios from "axios"

interface MedicineProps {
  medicineId: string
  pricePerUnit?: number
  quantity?: number
  mode?: "home" | "family"
  onUpdated: () => void
}

export default function EditMedicine({
  medicineId,
  pricePerUnit,
  mode = "home",
  onUpdated,
}: MedicineProps) {
  const { token } = useAuth()

  // ⬇️ number | "" da bi placeholder radio
  const [price, setPrice] = useState<number | "">(
    pricePerUnit ?? ""
  )
  const [quantityValue, setQuantityValue] = useState<number | "">("")
  const [addQuantity, setAddQuantity] = useState<number | "">("")
  const [message, setMessage] = useState("")

  // Update cene
  const handlePriceUpdate = async () => {
    if (price === "") return

    try {
      const response = await axios.put(
        `https://medikalija-api.vercel.app/api/medicine/${medicineId}`,
        { pricePerUnit: Number(price) },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        setMessage("Cena uspešno promenjena")
        setPrice("")
        onUpdated()
      }
    } catch (error) {
      console.error(error)
      setMessage("Greška pri ažuriranju cene")
    }
  }

  // Update količine
  const handleQuantityUpdate = async (isAdd: boolean) => {
    const value = isAdd ? addQuantity : quantityValue
    if (value === "") return

    try {
      let data: any = {}

      if (mode === "family") {
        data = isAdd
          ? { addQuantity: Number(addQuantity), fromFamily: true }
          : { quantity: Number(quantityValue), fromFamily: true }
      } else {
        data = isAdd
          ? { addQuantity: Number(addQuantity) }
          : { quantity: Number(quantityValue) }
      }

      const response = await axios.put(
        `https://medikalija-api.vercel.app/api/medicine/${medicineId}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        setMessage("Količina uspešno promenjena")
        setQuantityValue("")
        setAddQuantity("")
        onUpdated()
      }
    } catch (error) {
      console.error(error)
      setMessage("Greška pri ažuriranju količine")
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">

      {/* Cena */}
      {mode === "home" && (
        <>
          <input
            type="number"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value === "" ? "" : Number(e.target.value))
            }
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

      {/* Nova količina */}
      <input
        type="number"
        value={quantityValue}
        onChange={(e) =>
          setQuantityValue(
            e.target.value === "" ? "" : Number(e.target.value)
          )
        }
        className="border p-1 rounded w-20"
        placeholder="Nova količina"
      />
      <button
        onClick={() => handleQuantityUpdate(false)}
        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
      >
        Nova količina
      </button>

      {/* Dodaj količinu */}
      <input
        type="number"
        value={addQuantity}
        onChange={(e) =>
          setAddQuantity(
            e.target.value === "" ? "" : Number(e.target.value)
          )
        }
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
      {message && (
        <p className="text-green-600 text-sm ml-2">{message}</p>
      )}
    </div>
  )
}
