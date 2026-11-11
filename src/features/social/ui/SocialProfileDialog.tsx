import { FormEvent, useEffect, useId, useState } from "react";
import Dialog, { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import { notify } from "@shared/lib/notify";
import {
  basicsOf,
  changedFields,
  DossierPatient,
  jmbgCheck,
  PatientBasics,
  profileToInput,
  SocialProfile,
  SocialProfileInput,
  useSaveProfile,
  useSocialStaff,
} from "@features/social/dossier";
import ResidentFormFields from "./ResidentFormFields";

interface Props {
  open: boolean;
  onClose: () => void;
  patient: DossierPatient;
  profile: SocialProfile | null;
}

// Izmena podataka korisnika. Čuva se samo ono što je promenjeno (i delimičan unos), a ako je
// neko drugi u međuvremenu sačuvao izmene, server to javlja umesto da ih prepiše.
export default function SocialProfileDialog({ open, onClose, patient, profile }: Props) {
  const formId = useId();
  const save = useSaveProfile(patient._id);
  const { data: staff = [] } = useSocialStaff(open);
  const [initial, setInitial] = useState({ basics: basicsOf(patient), profile: profileToInput(profile) });
  const [basics, setBasics] = useState<PatientBasics>(initial.basics);
  const [form, setForm] = useState<SocialProfileInput>(initial.profile);
  const [confirmClose, setConfirmClose] = useState(false);

  // Pri otvaranju: trenutni podaci (ne dira formu dok je otvorena, ni kad stignu osveženi podaci)
  useEffect(() => {
    if (!open) return;
    const next = { basics: basicsOf(patient), profile: profileToInput(profile) };
    setInitial(next);
    setBasics(next.basics);
    setForm(next.profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- samo pri otvaranju
  }, [open]);

  const basicsPatch = changedFields(initial.basics, basics);
  const profilePatch = changedFields(initial.profile, { ...form, contacts: form.contacts.filter((c) => c.name.trim()) });
  const dirty = Object.keys(basicsPatch).length > 0 || Object.keys(changedFields(initial.profile, form)).length > 0;

  const requestClose = () => (dirty ? setConfirmClose(true) : onClose());

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!dirty) return onClose();
    if (basicsPatch.name !== undefined && !basics.name.trim()) return notify.error("Ime ne može biti prazno.");
    if (basicsPatch.lastName !== undefined && !basics.lastName.trim()) return notify.error("Prezime ne može biti prazno.");
    const jmbg = jmbgCheck(form.jmbg, basics.dateOfBirth);
    if (jmbg.invalid) return notify.error("JMBG nije ispravan — proverite cifre.");
    if (jmbg.mismatch) return notify.error("Datum rođenja se ne slaže sa JMBG-om.");
    save.mutate(
      {
        patient: Object.keys(basicsPatch).length ? basicsPatch : undefined,
        profile: Object.keys(profilePatch).length ? profilePatch : undefined,
        expectedUpdatedAt: profile?.updatedAt,
      },
      {
        onSuccess: () => {
          notify.success("Podaci su sačuvani.");
          onClose();
        },
        onError: (err) => notify.error(err, "Podaci nisu sačuvani."),
      }
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={requestClose}
        size="xl"
        title="Podaci korisnika"
        description="Uneto ovde koristi se svuda: u kartonu, listi korisnika, procenama i Word šablonima. Možete sačuvati i delimično popunjeno."
        footer={
          <>
            {dirty && <span className="mr-auto text-xs text-warning-600 dark:text-warning-400">Imate nesačuvane izmene</span>}
            <Button variant="outline" size="sm" onClick={requestClose}>
              Otkaži
            </Button>
            <Button size="sm" type="submit" form={formId} loading={save.isPending}>
              Sačuvaj
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={onSubmit} noValidate>
          <ResidentFormFields
            mode="detailed"
            basics={basics}
            onBasics={(patch) => setBasics((b) => ({ ...b, ...patch }))}
            profile={form}
            onProfile={(patch) => setForm((f) => ({ ...f, ...patch }))}
            staff={staff}
          />
        </form>
      </Dialog>
      <ConfirmDialog
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false);
          onClose();
        }}
        title="Odbaciti nesačuvane izmene?"
        description="Izmene koje niste sačuvali biće izgubljene."
        confirmText="Odbaci izmene"
      />
    </>
  );
}
