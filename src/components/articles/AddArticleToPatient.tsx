import { useState } from "react";
import useArticles, { Articles } from "../../hooks/Patient/useArticle";
import Select from "../form/Select";
import ComponentCard from "../common/ComponentCard";
import Input from "../form/input/InputField";

interface AddArticleProps {
  patientId: string;
}

export default function AddArticleToPatient({ patientId }: AddArticleProps) {
  const { getArticles, addArticleToPatient } = useArticles();
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  if (getArticles.isLoading) return <p>Učitavanje artikala...</p>;
  if (getArticles.isError) return <p>Greška pri učitavanju artikala</p>;

  const articles: Articles[] = getArticles.data || [];
  const selectedArticle = articles.find((a) => a._id === selectedArticleId);

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
        },
      }
    );
  };

  return (
    <ComponentCard title="DODAJ ARTIKAL">
      <div className="flex flex-col space-y-2">

        <Select
          options={articles.map((a) => ({
            value: a._id,
            label: `${a.name} — cena: ${a.price} RSD — stanje: ${a.quantity} -- od familije ${a.familyQuantity}`,
          }))}
          placeholder="Izaberite Artikal"
          onChange={setSelectedArticleId}
          defaultValue={selectedArticleId}
        />

        <Input
          type="number"
          min={0.01}
          step={0.01}
          placeholder="Unesi količinu"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          onClick={handleAdd}
          disabled={addArticleToPatient.isPending}
          className="bg-blue-500 w-fit self-end text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {addArticleToPatient.isPending ? "Dodavanje..." : "Dodaj pacijentu"}
        </button>
      </div>
    </ComponentCard>
  );
}
