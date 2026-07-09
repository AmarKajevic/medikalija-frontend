import { useForm } from "react-hook-form";
import { useAddAnalysis } from "../hooks/useAddAnalysis";

const AddAnalysisNew = () => {
  const { mutate, isPending } = useAddAnalysis();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: "",
      price: "",
    },
  });

  const onSubmit = (data: any) => {
    mutate(
      {
        ...data,
        price: Number(data.price),
      },
      {
        onSuccess: () => reset(),
      }
    );
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-xl space-y-4 max-w-md">
      <h2 className="text-xl font-bold">Dodavanje analize</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input
          placeholder="Naziv analize"
          {...register("name", { required: true })}
          className="border p-2 w-full"
        />

        <input
          type="number"
          step="0.01"
          placeholder="Cena"
          {...register("price", { required: true })}
          className="border p-2 w-full"
        />

        <button
          disabled={isPending}
          className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:bg-gray-400"
        >
          {isPending ? "Čuvanje..." : "Sačuvaj"}
        </button>
      </form>
    </div>
  );
};

export default AddAnalysisNew;