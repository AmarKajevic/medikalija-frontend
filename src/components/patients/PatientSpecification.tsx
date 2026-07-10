
import { Link } from "react-router";

import { useDeleteSpecificationItem } from "../../features/specification/hooks/useDeleteSpecificationItem";
import { SpecificationTable } from "../../features/specification/ui/SpecificationTable";
import { usePatientSpecification } from "../../features/specification/hooks/usePatientSpecification";
import { useModal } from "../../shared/ui/modal/useModal";


export default function PatientSpecification({
  patientId,
}: {
  patientId: string;
}) {
  const { data, isLoading, isError } =
    usePatientSpecification(patientId);
  const { open } = useModal();

  const deleteItem = useDeleteSpecificationItem(patientId);

  setTimeout(() => {
}, 500);



  if (isLoading) return <p>Učitavanje...</p>;
  if (isError) return <p>Greška pri učitavanju specifikacije.</p>;
  if (!data) return <p>Nema aktivne specifikacije.</p>;

  return (
    <div className="p-4 gap-3 max-w-3xl">

      <div className="flex justify-between items-center mb-4 gap-3">
        <h2 className="text-xl font-bold ">Napravi Specifikaciju</h2>

        <div className="flex gap-3">
          <button className="border-0 shadow-md p-2 gap-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md" onClick={() => open("medicine", { patientId })}>
          Dodaj lek
        </button>

        <button className="border-0 shadow-md p-2 gap-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md"  onClick={() => open("combination", { patientId })}>
          Dodaj kombinaciju
        </button>
        <button className="border-0 shadow-md p-2 gap-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md" onClick={() => open("article", { patientId })}>
          Dodaj artikle
        </button>

        

          <Link
            to={`/patient/${patientId}/specification-history`}
            className="border-0 shadow-md p-2 gap-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md"
          >
            pregled specifikacije
          </Link>
        </div>
      </div>

      <SpecificationTable
        data={data}
        onDelete={(itemId) =>
          deleteItem.mutate({
            specId: data._id,
            itemId,
          })
        }
      />

    </div>
  );
}