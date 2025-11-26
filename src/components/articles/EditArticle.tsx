import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

interface ArticleProps {
  articleId: string;
  price?: number;
  quantity?: number;
  mode?: "home" | "family";
  onUpdated: () => void;
}

export default function EditArticle({
  articleId,
  price = 0,
  quantity = 0,
  mode = "home",
  onUpdated,
}: ArticleProps) {
  const { token } = useAuth();

  const [newPrice, setNewPrice] = useState<number>(price);
  const [newQuantity, setNewQuantity] = useState<number>(quantity);
  const [addQuantity, setAddQuantity] = useState<number>(0);
  const [message, setMessage] = useState("");

  const handlePriceUpdate = async () => {
    try {
      const data = { price: newPrice };

      const res = await axios.put(
        `https://medikalija-api.vercel.app/api/articles/${articleId}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setMessage("Cena uspešno ažurirana.");
        onUpdated(); // ✅ Refetch
      }
    } catch (err) {
      console.error(err);
      setMessage("Greška pri ažuriranju cene.");
    }
  };

  const handleQuantityUpdate = async (isAdd: boolean) => {
    try {
      let data: any = {};

      if (mode === "family") {
        data = isAdd
          ? { addQuantity, fromFamily: true }
          : { quantity: newQuantity, fromFamily: true };
      } else {
        data = isAdd
          ? { addQuantity }
          : { quantity: newQuantity };
      }

      const res = await axios.put(
        `https://medikalija-api.vercel.app/api/articles/${articleId}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setAddQuantity(0);
        setNewQuantity(0);
        onUpdated(); // ✅ Refetch
      }
    } catch (err) {
      console.error(err);
      setMessage("Greška pri ažuriranju količine.");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      {mode === "home" && (
        <>
          <input
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(Number(e.target.value))}
            className="border p-1 rounded w-24"
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

      <input
        type="number"
        value={newQuantity}
        onChange={(e) => setNewQuantity(Number(e.target.value))}
        className="border p-1 rounded w-28"
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
        className="border p-1 rounded w-28"
        placeholder="Dodaj količinu"
      />
      <button
        onClick={() => handleQuantityUpdate(true)}
        className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600"
      >
        Dodaj količinu
      </button>

      {message && <span className="text-xs text-green-600">{message}</span>}
    </div>
  );
}
