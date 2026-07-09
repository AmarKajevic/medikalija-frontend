import { useForm } from "react-hook-form";
import { useUpdateAnalysis } from "../hooks/useUpdateAnalysis";

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <input
        {...register("name")}
        className="border p-2 w-full"
        placeholder="Naziv"
      />

      <input
        type="number"
        {...register("price")}
        className="border p-2 w-full"
        placeholder="Cena"
      />

      <button
        disabled={isPending}
        className="bg-blue-600 text-white p-2 w-full"
      >
        {isPending ? "Čuvanje..." : "Update"}
      </button>
    </form>
  );
};

export default UpdateAnalysisForm;