import { FormEvent, useEffect, useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LuTriangleAlert } from "react-icons/lu";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Field from "@shared/ui/form/Field";
import { Input } from "@shared/ui/form/controls";
import { notify } from "@shared/lib/notify";
import { api } from "@shared/api/api";

interface Props {
  open: boolean;
  onClose: () => void;
  patient: { _id: string; name: string; lastName: string } | null;
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

// Trajno brisanje korisnika sa SVIM podacima (samo admin). Nepovratno, pa se ime i prezime
// kuca ručno — kao kod brisanja repozitorijuma u velikim aplikacijama.
export default function PurgePatientDialog({ open, onClose, patient }: Props) {
  const formId = useId();
  const id = useId();
  const qc = useQueryClient();
  const [typed, setTyped] = useState("");
  const fullName = patient ? `${patient.name} ${patient.lastName}` : "";
  const matches = !!patient && normalize(typed) === normalize(fullName);

  const purge = useMutation({
    mutationFn: async () => (await api.delete(`/api/patient/${patient!._id}`, { params: { permanent: "true" }, data: { confirmName: typed } })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });

  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!matches) return;
    purge.mutate(undefined, {
      onSuccess: () => {
        notify.success(`${fullName} je trajno obrisan/a sa svim podacima.`);
        onClose();
      },
      onError: (err) => notify.error(err, "Korisnik nije obrisan."),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="md"
      title="Trajno brisanje korisnika"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button variant="danger" size="sm" type="submit" form={formId} loading={purge.isPending} disabled={!matches}>
            Obriši trajno
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="flex gap-3 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-800 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          <LuTriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">Ovo se ne može poništiti.</p>
            <p>
              Briše se <strong>{fullName}</strong> i sve vezano za korisnika: specifikacije, unosi nege i terapije, lekarski izveštaji, socijalni dosije i beleške, porodične
              zalihe i termini u kalendaru.
            </p>
            <p>Ako je korisnik napustio dom, umesto brisanja koristite „Otpust“ — istorija ostaje sačuvana, što zakon o evidencijama obično i zahteva.</p>
          </div>
        </div>
        <Field label={`Za potvrdu ukucajte: ${fullName}`} htmlFor={`${id}-confirm`}>
          <Input id={`${id}-confirm`} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoFocus placeholder={fullName} />
        </Field>
      </form>
    </Dialog>
  );
}
