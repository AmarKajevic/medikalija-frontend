import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { LuRotateCcw } from "react-icons/lu";
import Dialog, { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Tabs from "@shared/ui/tabs/Tabs";
import { notify } from "@shared/lib/notify";
import { todayIso } from "@shared/lib/dateText";
import { paths } from "@app/paths";
import { changedFields, EMPTY_PROFILE, jmbgCheck, PatientBasics, SocialProfileInput, useCreateResident, useSocialStaff } from "@features/social/dossier";
import ResidentFormFields, { FormMode } from "./ResidentFormFields";

interface Draft {
  mode: FormMode;
  basics: PatientBasics;
  admissionDate: string;
  profile: SocialProfileInput;
}

// Nedovršen unos se čuva u pregledaču (samo na ovom računaru) dok se korisnik ne sačuva,
// da se ništa ne izgubi ako se prozor slučajno zatvori.
const DRAFT_KEY = "medikalija:new-resident-draft";
const EMPTY_BASICS: PatientBasics = { name: "", lastName: "", dateOfBirth: "", address: "" };
const emptyDraft = (): Draft => ({ mode: "basic", basics: { ...EMPTY_BASICS }, admissionDate: todayIso(), profile: structuredClone(EMPTY_PROFILE) });

const readDraft = (): Draft | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
};
const writeDraft = (d: Draft | null) => {
  try {
    if (d) localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    else localStorage.removeItem(DRAFT_KEY);
  } catch {
    // pregledač ne dozvoljava čuvanje — unos i dalje radi, samo se ne pamti
  }
};
const isEmpty = (d: Draft) => !d.basics.name.trim() && !d.basics.lastName.trim() && Object.keys(changedFields(EMPTY_PROFILE, d.profile)).length === 0;

// Novi korisnik: osnovni podaci (brz unos) ili detaljni (sve za dokumentaciju). Obavezni su samo
// ime, prezime i datum prijema; ostalo se dopunjuje kasnije u dosijeu.
export default function NewResidentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const formId = useId();
  const navigate = useNavigate();
  const create = useCreateResident();
  const { data: staff = [] } = useSocialStaff(open);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [restored, setRestored] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      const saved = readDraft();
      setDraft(saved && !isEmpty(saved) ? saved : emptyDraft());
      setRestored(!!saved && !isEmpty(saved));
      setSubmitted(false);
    }
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (open) writeDraft(isEmpty(draft) ? null : draft);
  }, [open, draft]);

  const errors = submitted
    ? {
        name: draft.basics.name.trim() ? undefined : "Unesite ime.",
        lastName: draft.basics.lastName.trim() ? undefined : "Unesite prezime.",
        admissionDate: draft.admissionDate ? undefined : "Unesite datum prijema.",
      }
    : {};

  const startOver = () => {
    writeDraft(null);
    setDraft(emptyDraft());
    setRestored(false);
  };
  const requestClose = () => (isEmpty(draft) ? onClose() : setConfirmClose(true));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const { basics, profile, admissionDate } = draft;
    if (!basics.name.trim() || !basics.lastName.trim() || !admissionDate) return;
    const jmbg = jmbgCheck(profile.jmbg, basics.dateOfBirth);
    if (jmbg.invalid) return notify.error("JMBG nije ispravan. Ispravite ga ili ga obrišite i dopunite kasnije.");
    if (jmbg.mismatch) return notify.error("Datum rođenja se ne slaže sa JMBG-om.");
    create.mutate(
      {
        patient: { ...basics, name: basics.name.trim(), lastName: basics.lastName.trim(), admissionDate },
        // Šalje se samo ono što je uneto
        profile: changedFields(EMPTY_PROFILE, { ...profile, contacts: profile.contacts.filter((c) => c.name.trim()) }),
      },
      {
        onSuccess: ({ patient }) => {
          writeDraft(null);
          notify.success(`${patient.name} ${patient.lastName} je dodat/a. Ostale podatke možete dopuniti u dosijeu.`);
          onClose();
          navigate(`${paths.patient(patient._id)}?tab=social`);
        },
        onError: (err) => notify.error(err, "Korisnik nije sačuvan."),
      }
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={requestClose}
        size="xl"
        title="Novi korisnik"
        description="Obavezni su samo ime, prezime i datum prijema — ostalo možete dopuniti kad stignu dokumenta."
        footer={
          <>
            {restored && (
              <Button variant="outline" size="sm" className="mr-auto" startIcon={<LuRotateCcw className="h-4 w-4" />} onClick={startOver}>
                Počni ispočetka
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={requestClose}>
              Otkaži
            </Button>
            <Button size="sm" type="submit" form={formId} loading={create.isPending}>
              Sačuvaj korisnika
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={onSubmit} className="space-y-4" noValidate>
          {restored && (
            <p role="status" className="rounded-lg bg-blue-light-50 px-3 py-2 text-sm text-blue-light-800 dark:bg-blue-light-500/10 dark:text-blue-light-300">
              Vraćen je nesačuvan unos sa ovog računara.
            </p>
          )}
          <Tabs
            variant="pills"
            className="max-w-sm"
            value={draft.mode}
            onChange={(mode) => setDraft((d) => ({ ...d, mode }))}
            items={[
              { value: "basic", label: "Osnovni podaci" },
              { value: "detailed", label: "Detaljni podaci" },
            ]}
          />
          <ResidentFormFields
            mode={draft.mode}
            basics={draft.basics}
            onBasics={(patch) => setDraft((d) => ({ ...d, basics: { ...d.basics, ...patch } }))}
            profile={draft.profile}
            onProfile={(patch) => setDraft((d) => ({ ...d, profile: { ...d.profile, ...patch } }))}
            staff={staff}
            admission={{ value: draft.admissionDate, onChange: (v) => setDraft((d) => ({ ...d, admissionDate: v })) }}
            errors={errors}
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
        variant="primary"
        title="Zatvoriti bez čuvanja?"
        description="Uneto ostaje zapamćeno na ovom računaru i vratiće se kad ponovo otvorite „Novi korisnik“."
        confirmText="Zatvori"
      />
    </>
  );
}
