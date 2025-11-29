import { useEffect, useState } from "react";

import Input from "../form/input/InputField";
import useArticles from "../../hooks/Patient/useArticle";

export default function ArticlesForm() {
  const { getArticles, mutate: addArticle, editArticle } = useArticles();

  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");

  // ❗️ NOVO — SAMO JEDAN INPUT "ukupna količina"
  const [totalQuantity, setTotalQuantity] = useState<number | "">("");

  const [unitsPerPackage, setUnitsPerPackage] = useState<number | "">("");

  const [fromFamily, setFromFamily] = useState(false);
  const [message, setMessage] = useState("");

  const articles = getArticles.data || [];
  const selectedArticle = articles.find((a) => a._id === selectedId);

  // ============================================================
  // Kada izabereš postojeći artikal → popuni polja
  // ============================================================
  useEffect(() => {
    if (selectedArticle) {
      setUnitsPerPackage(selectedArticle.unitsPerPackage ?? "");
      setPrice(selectedArticle.price);
    } else {
      setUnitsPerPackage("");
      setPrice("");
    }

    setTotalQuantity("");
  }, [selectedArticle]);

  // ============================================================
  // RESET FORME
  // ============================================================
  const resetForm = () => {
    setSelectedId("");
    setName("");
    setPrice("");
    setUnitsPerPackage("");
    setTotalQuantity("");
    setFromFamily(false);
  };

  // ============================================================
  // SUBMIT
  // ============================================================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const qty = totalQuantity === "" ? 0 : Number(totalQuantity);
    const units = unitsPerPackage === "" ? 0 : Number(unitsPerPackage);

    if (qty <= 0) {
      setMessage("Unesi ispravnu ukupnu količinu.");
      return;
    }



    const payload: any = {
      fromFamily,
      unitsPerPackage: units > 0 ? units : undefined,
    };

    if (selectedId) {
      // Ažuriranje postojećeg artikla
      payload.articleId = selectedId;
      payload.addQuantity = qty;

      editArticle.mutate(payload);
      setMessage("Količina uspešno dodata.");
    } else {
      // Novi artikal
      payload.name = name;
      payload.price = Number(price);
      payload.quantity = qty;

      addArticle(payload);
      setMessage("Artikal uspešno dodat.");
    }

    resetForm();
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-xl space-y-4">
      <h2 className="text-xl font-bold mb-2">
        {selectedId ? "Dodaj količinu postojećem artiklu" : "Dodaj novi artikal"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* SELECT */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Odaberi postojeći artikal ili unesi novi
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg text-sm"
          >
            <option value="">— Novi artikal —</option>
            {articles.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} (Dom: {a.quantity.toFixed(2)} | Porodica:{" "}
                {a.familyQuantity?.toFixed(2) ?? 0})
              </option>
            ))}
          </select>
        </div>

        {!selectedId && (
          <>
            <Input
              type="text"
              placeholder="Naziv artikla"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              type="number"
              placeholder="Cena po komadu (RSD)"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
              required
            />
          </>
        )}

        {/* TABLETA / PAKOVANJU */}
        <Input
          type="number"
          placeholder="broj komada u pakovanju"
          value={unitsPerPackage}
          onChange={(e) =>
            setUnitsPerPackage(
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
        />

        {/* ❗️ JEDAN INPUT ZA UKUPNU KOLIČINU */}
        <Input
          type="number"
          placeholder="Ukupna količina"
          value={totalQuantity}
          onChange={(e) =>
            setTotalQuantity(
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
          required
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={fromFamily}
            onChange={() => setFromFamily((prev) => !prev)}
          />
          <span>Porodica donela artikal</span>
        </label>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Sačuvaj
        </button>
      </form>

      {message && (
        <p className="mt-3 text-center text-sm text-gray-700">{message}</p>
      )}
    </div>
  );
}
