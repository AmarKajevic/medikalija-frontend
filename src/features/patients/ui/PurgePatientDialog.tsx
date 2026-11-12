import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import { notify } from "@shared/lib/notify";
import { api } from "@shared/api/api";

interface Props {
  open: boolean;
  onClose: () => void;
  patient: { _id: string; name: string; lastName: string } | null;
}

// Trajno brisanje korisnika sa SVIM podacima (admin i socijalni radnik) — uz jednu potvrdu
export default function PurgePatientDialog({ open, onClose, patient }: Props) {
  const qc = useQueryClient();
  const fullName = patient ? `${patient.name} ${patient.lastName}` : "";

  const purge = useMutation({
    mutationFn: async () => (await api.delete(`/api/patient/${patient!._id}`, { params: { permanent: "true" } })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });

  const confirm = () =>
    purge.mutate(undefined, {
      onSuccess: () => {
        notify.success(`${fullName} je obrisan/a.`);
        onClose();
      },
      onError: (err) => notify.error(err, "Korisnik nije obrisan."),
    });

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={confirm}
      loading={purge.isPending}
      title="Da li ste sigurni da želite da obrišete?"
      description={`Korisnik ${fullName} biće obrisan zajedno sa svim podacima. Ovo se ne može poništiti.`}
      confirmText="Obriši"
    />
  );
}
