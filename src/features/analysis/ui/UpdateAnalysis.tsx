import { useForm } from "react-hook-form";
import { useUpdateAnalysis } from "@features/analysis/hooks/useUpdateAnalysis";

const UpdateAnalysisForm = ({ analysis }: any) => {
  const { mutate, isPending } = useUpdateAnalysis();

  const { register, handleSubmit } = useForm({
    defaultValues: {
      price: analysis.price,
      name: analysis.name,
    },
  });

  const onSubmit = (data: any) => {
    mutate({
      id: analysis._id,
      data,
    });
  };

  const fieldInputClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <input
        {...register("name")}
        className={fieldInputClass}
        placeholder="Naziv"
      />

      <input
        type="number"
        {...register("price")}
        className={fieldInputClass}
        placeholder="Cena"
      />

      <button
        disabled={isPending}
        className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:bg-gray-400"
      >
        {isPending ? "Čuvanje..." : "Sačuvaj izmene"}
      </button>
    </form>
  );
};

export default UpdateAnalysisForm;