import { useId, useState } from "react";
import { api } from "@shared/api/api";
import Dialog from "@shared/ui/dialog/Dialog";
import Field from "@shared/ui/form/Field";
import { Input } from "@shared/ui/form/controls";
import { notify } from "@shared/lib/notify";
import { useAuth } from "@app/providers/AuthContext";
import { serverMessage } from "@features/auth/model";
import NewPasswordForm from "./NewPasswordForm";

// Promena sopstvene lozinke; posle promene ostali uređaji su odjavljeni.
export default function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const id = useId();
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setCurrent("");
    setError(null);
    onClose();
  };

  const submit = async (newPassword: string) => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await api.post("/api/auth/password", { currentPassword: current, newPassword });
      notify.success(data.message);
      close();
    } catch (err) {
      setError(serverMessage(err, "Lozinka nije promenjena."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={close} size="sm" title="Promena lozinke" description="Posle promene bićete odjavljeni sa ostalih uređaja.">
      {open && (
        <div className="space-y-4">
          {error && (
            <p role="alert" className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </p>
          )}
          <Field label="Trenutna lozinka" htmlFor={id}>
            <Input id={id} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </Field>
          <NewPasswordForm submitLabel="Promeni lozinku" loading={saving} personal={[user?.name ?? "", user?.lastName ?? ""]} onSubmit={submit} />
        </div>
      )}
    </Dialog>
  );
}
