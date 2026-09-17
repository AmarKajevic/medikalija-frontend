import { useForm } from "react-hook-form";
import { useAddAnalysis } from "@features/analysis/hooks/useAddAnalysis";

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

  const fieldInputClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <div className="max-w-md space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Dodavanje analize</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input
          placeholder="Naziv analize"
          {...register("name", { required: true })}
          className={fieldInputClass}
        />

        <input
          type="number"
          step="0.01"
          placeholder="Cena"
          {...register("price", { required: true })}
          className={fieldInputClass}
        />

        <button
          disabled={isPending}
          className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:bg-gray-400"
        >
          {isPending ? "Čuvanje..." : "Sačuvaj"}
        </button>
      </form>
    </div>
  );
};

export default AddAnalysisNew;