import { useId, useMemo, useState } from "react";
import { Link } from "react-router";
import { LuCheck, LuCircleAlert, LuX } from "react-icons/lu";
import Button from "@shared/ui/button/Button";
import Dialog from "@shared/ui/dialog/Dialog";
import Field from "@shared/ui/form/Field";
import { Textarea } from "@shared/ui/form/controls";
import { inputClass } from "@shared/ui/form/Field";
import EmptyState, { ErrorState } from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { notify } from "@shared/lib/notify";
import { paths } from "@app/paths";
import { NurseEntry, personName, TYPE_LABEL, useAcceptEntries, useNurseEntries, useRejectEntries } from "@features/nurse-entries/model";
import { formatWhen, TYPE_ICON } from "./display";

const REASONS = ["Greška u unosu", "Dupli unos", "Ne naplaćuje se", "Nije dato pacijentu"];

const toNumber = (v: string) => Number(v.replace(",", "."));
const patientIdOf = (e: NurseEntry) => (typeof e.patient === "object" ? e.patient._id : e.patient);

interface Props {
  /** Bez pacijenta: svi unosi na čekanju, grupisani po pacijentu */
  patientId?: string;
  /** Samo deo unosa (npr. dati u periodu specifikacije) */
  filter?: (entry: NurseEntry) => boolean;
}

// Uprava pregleda unose sestara i bira šta ulazi u specifikaciju.
export default function EntryReview({ patientId, filter }: Props) {
  const query = useNurseEntries({ patientId, status: ["pending"], limit: 500 }, { refetchInterval: 30_000 });
  const { isLoading, isError, refetch } = query;
  const data = useMemo(() => (filter ? (query.data ?? []).filter(filter) : query.data ?? []), [query.data, filter]);
  const accept = useAcceptEntries();
  const reject = useRejectEntries();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rejecting, setRejecting] = useState<string[] | null>(null);

  const ids = data.map((e) => e._id);
  const chosen = ids.filter((id) => selected.has(id));
  const allChosen = ids.length > 0 && chosen.length === ids.length;

  const groups = useMemo(() => {
    if (patientId) return [{ key: patientId, title: "", entries: data }];
    const map = new Map<string, { key: string; title: string; entries: NurseEntry[] }>();
    for (const e of data) {
      const key = patientIdOf(e);
      if (!map.has(key)) map.set(key, { key, title: personName(e.patient) || "Pacijent", entries: [] });
      map.get(key)!.entries.push(e);
    }
    return [...map.values()];
  }, [data, patientId]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const amountOf = (e: NurseEntry) => amounts[e._id] ?? String(e.amount).replace(".", ",");
  const invalidAmount = (e: NurseEntry) => !(toNumber(amountOf(e)) > 0);

  const runAccept = (list: string[]) => {
    const entries = data.filter((e) => list.includes(e._id));
    const bad = entries.find(invalidAmount);
    if (bad) return notify.error(`Neispravna količina za „${bad.name}”.`);

    accept.mutate(
      {
        items: entries.map((e) => ({ id: e._id, amount: toNumber(amountOf(e)) })),
        patientIds: [...new Set(entries.map(patientIdOf))],
      },
      {
        onSuccess: (res) => {
          const failed = res.results.filter((r) => !r.ok);
          setErrors((prev) => {
            const next = { ...prev };
            for (const r of res.results) {
              if (r.ok) delete next[r.id];
              else next[r.id] = r.message;
            }
            return next;
          });
          setSelected((s) => new Set([...s].filter((id) => failed.some((f) => f.id === id))));
          if (failed.length === 0) notify.success(res.message);
          else notify.error(`${res.message} Pogledajte poruke kod stavki koje nisu prošle.`);
        },
        onError: (err) => notify.error(err),
      }
    );
  };

  if (isError) return <ErrorState message="Unosi nisu učitani." onRetry={() => refetch()} />;
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }
  if (data.length === 0) {
    return <EmptyState compact icon={<LuCheck />} title="Sve je pregledano" description="Nema unosa sestara koji čekaju odobrenje." />;
  }

  return (
    <div className="space-y-3">
      {/* Grupne akcije */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={allChosen}
            onChange={() => setSelected(allChosen ? new Set() : new Set(ids))}
            className="h-4 w-4 rounded border-gray-300 accent-brand-600"
          />
          {chosen.length ? `Izabrano ${chosen.length} od ${ids.length}` : `Izaberi sve (${ids.length})`}
        </label>
        <div className="flex gap-2">
          <Button size="xs" variant="outline" disabled={!chosen.length || accept.isPending} startIcon={<LuX className="h-3.5 w-3.5" />} onClick={() => setRejecting(chosen)}>
            Odbij izabrane
          </Button>
          <Button size="xs" disabled={!chosen.length} loading={accept.isPending} startIcon={<LuCheck className="h-3.5 w-3.5" />} onClick={() => runAccept(chosen)}>
            Prihvati izabrane
          </Button>
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.key}>
          {g.title && (
            <div className="mb-1 flex items-center justify-between px-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {g.title} <span className="font-normal text-gray-400">({g.entries.length})</span>
              </p>
              <Link to={paths.patient(g.key)} className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                Profil pacijenta
              </Link>
            </div>
          )}
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {g.entries.map((e) => (
              <li key={e._id} className="flex flex-wrap items-start gap-3 p-3 sm:flex-nowrap">
                <input
                  type="checkbox"
                  checked={selected.has(e._id)}
                  onChange={() => toggle(e._id)}
                  aria-label={`Izaberi ${e.name}`}
                  className="mt-2 h-4 w-4 shrink-0 rounded border-gray-300 accent-brand-600"
                />
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400" title={TYPE_LABEL[e.type]}>
                  {TYPE_ICON[e.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white/90">{e.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {TYPE_LABEL[e.type]} · {formatWhen(e.performedAt)} · {personName(e.createdBy) || "Nepoznato"}
                  </p>
                  {e.note && <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">„{e.note}”</p>}
                  {errors[e._id] && (
                    <p role="alert" className="mt-1 flex gap-1 text-xs text-error-600 dark:text-error-400">
                      <LuCircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {errors[e._id]}
                    </p>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <input
                    inputMode="decimal"
                    value={amountOf(e)}
                    onChange={(ev) => setAmounts((a) => ({ ...a, [e._id]: ev.target.value }))}
                    aria-label={`Količina: ${e.name}`}
                    aria-invalid={invalidAmount(e) || undefined}
                    title={e.type === "care" ? "Broj puta" : "Količina"}
                    className={`${inputClass} h-8 !w-16 text-right tabular-nums ${invalidAmount(e) ? "border-error-400" : ""}`}
                  />
                  <Button size="xs" variant="ghost" onClick={() => setRejecting([e._id])} aria-label={`Odbij ${e.name}`} disabled={accept.isPending}>
                    Odbij
                  </Button>
                  <Button size="xs" variant="secondary" onClick={() => runAccept([e._id])} aria-label={`Prihvati ${e.name}`} disabled={accept.isPending}>
                    Prihvati
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <RejectDialog
        count={rejecting?.length ?? 0}
        open={!!rejecting}
        loading={reject.isPending}
        onClose={() => setRejecting(null)}
        onConfirm={(reason) =>
          rejecting &&
          reject.mutate(
            { ids: rejecting, reason },
            {
              onSuccess: (n) => {
                notify.success(n === 1 ? "Unos je odbijen." : `Odbijeno: ${n}.`);
                setSelected((s) => new Set([...s].filter((id) => !rejecting.includes(id))));
                setRejecting(null);
              },
              onError: (err) => notify.error(err),
            }
          )
        }
      />
    </div>
  );
}

function RejectDialog({ open, count, loading, onClose, onConfirm }: { open: boolean; count: number; loading: boolean; onClose: () => void; onConfirm: (reason: string) => void }) {
  const id = useId();
  const [reason, setReason] = useState("");
  const close = () => {
    setReason("");
    onClose();
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      size="sm"
      title={count > 1 ? `Odbiti ${count} unosa?` : "Odbiti unos?"}
      description="Ne ulazi u specifikaciju i ne skida se sa stanja. Sestra vidi razlog."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={close}>
            Otkaži
          </Button>
          <Button variant="danger" size="sm" loading={loading} onClick={() => onConfirm(reason.trim())}>
            Odbij
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              aria-pressed={reason === r}
              className={`rounded-full border px-2.5 py-1 text-xs transition ${
                reason === r ? "border-brand-400 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <Field label="Razlog (nije obavezno)" htmlFor={id}>
          <Textarea id={id} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}
