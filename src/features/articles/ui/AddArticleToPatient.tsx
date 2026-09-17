import { useState } from "react";
import useArticles, { Articles } from "@entities/article/hooks/useArticle";
import ComponentCard from "@shared/ui/common/ComponentCard";
import Input from "@shared/ui/form/input/InputField";

interface AddArticleProps {
  patientId: string;
}

export default function AddArticleToPatient({ patientId }: AddArticleProps) {
  const { getArticles, addArticleToPatient } = useArticles();

  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  // ✅ LIVE SEARCH STATE
  const [search, setSearch] = useState("");
  const [filteredArticles, setFilteredArticles] = useState<Articles[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  if (getArticles.isLoading) return <p>Učitavanje artikala...</p>;
  if (getArticles.isError) return <p>Greška pri učitavanju artikala</p>;

  const articles: Articles[] = getArticles.data || [];
  const selectedArticle = articles.find((a) => a._id === selectedArticleId);

  // ✅ LIVE FILTER (BEZ BACKEND POZIVA – IZ POSTOJEĆE LISTE)
  const handleSearch = (value: string) => {
    setSearch(value);

    if (!value.trim()) {
      setFilteredArticles([]);
      setShowDropdown(false);
      return;
    }

    const filtered = articles.filter((a) =>
      a.name.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredArticles(filtered);
    setShowDropdown(true);
  };

  const handleAdd = () => {
    const numericAmount = parseFloat(amount);

    if (!selectedArticleId) return alert("Izaberite Artikal");
    if (numericAmount <= 0 || isNaN(numericAmount))
      return alert("Količina mora biti veća od nule");

    if (selectedArticle && numericAmount > selectedArticle.quantity)
      return alert(
        `Nema dovoljno artikala na stanju (preostalo: ${selectedArticle.quantity})`
      );

    addArticleToPatient.mutate(
      { patientId, articleId: selectedArticleId, amount: numericAmount },
      {
        onSuccess: () => {
          alert("Artikal uspešno dodat pacijentu!");
          setSelectedArticleId("");
          setAmount("");
          setSearch("");
          setShowDropdown(false);
        },
      }
    );
  };

  return (
    <ComponentCard title="DODAJ ARTIKAL">
      <div className="flex flex-col space-y-2">

        {/* ✅ LIVE SEARCH INPUT */}
        <div className="relative">
          <Input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Pretraži artikal (npr. pelene, rukavice...)"
          />

          {/* ✅ DROPDOWN */}
          {showDropdown && filteredArticles.length > 0 && (
            <div className="absolute left-0 right-0 z-50 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
              {filteredArticles.map((a) => (
                <div
                  key={a._id}
                  onClick={() => {
                    setSelectedArticleId(a._id);
                    setSearch(a.name);
                    setShowDropdown(false);
                  }}
                  className="cursor-pointer border-b border-gray-100 px-3 py-2 text-sm last:border-0 hover:bg-brand-50 dark:border-gray-800 dark:hover:bg-brand-500/10"
                >
                  <div className="font-medium text-gray-800 dark:text-white/90">{a.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    💰 Cena: {a.price} RSD · 🏥 Stanje: {a.quantity} · 👪 Porodica: {a.familyQuantity}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✅ KOLIČINA */}
        <Input
          type="number"
          min={0.01}
          step={0.01}
          placeholder="Unesi količinu"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {/* ✅ DUGME */}
        <button
          onClick={handleAdd}
          disabled={addArticleToPatient.isPending}
          className="w-fit self-end rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {addArticleToPatient.isPending ? "Dodavanje..." : "Dodaj pacijentu"}
        </button>
      </div>
    </ComponentCard>
  );
}
