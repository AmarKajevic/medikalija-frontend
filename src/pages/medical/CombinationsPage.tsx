import { useEffect, useId, useMemo, useState } from "react";
import { LuCheck, LuLayers, LuPlus, LuSearch, LuTrash2 } from "react-icons/lu";
import PageHeader from "@shared/ui/page/PageHeader";
import { Card, CardHeader } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import Dialog, { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import Field from "@shared/ui/form/Field";
import { Input } from "@shared/ui/form/controls";
import EmptyState, { ErrorState } from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { notify } from "@shared/lib/notify";
import { formatRSD } from "@shared/lib/format";
import { normalizeSearch } from "@shared/lib/search";
import { useGetCombinations } from "@features/combinations/hooks/useGetCombinations";
import { useAddCombination } from "@features/combinations/hooks/useAddCombination";
import { useDeleteCombination } from "@features/combinations/hooks/useDeleteCombination";
import { useDeleteCombinationGroup } from "@features/combinations/hooks/useDeleteCombinationGroup";
import { useGetAnalyses } from "@features/analysis/hooks/useGetAnalyses";
import { Group } from "@features/combinations/types/types";

type Analysis = { _id: string; name: string; price: number };
const priceOf = (analyses: Analysis[]) => analyses.reduce((s, a) => s + (Number(a.price) || 0), 0);

function CombinationDialog({ open, onClose, groups, defaultGroup }: { open: boolean; onClose: () => void; groups: Group[]; defaultGroup?: string }) {
  const formId = useId();
  const add = useAddCombination();
  const { data } = useGetAnalyses();
  const analyses: Analysis[] = useMemo(() => data?.analyses ?? [], [data]);
  const [groupName, setGroupName] = useState("");
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setGroupName(defaultGroup ?? "");
      setName("");
      setQuery("");
      setSelected([]);
    }
  }, [open, defaultGroup]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(query.trim());
    return q ? analyses.filter((a) => normalizeSearch(a.name).includes(q)) : analyses;
  }, [analyses, query]);
  const chosen = analyses.filter((a) => selected.includes(a._id));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return notify.error("Unesite ili izaberite grupu.");
    if (!name.trim()) return notify.error("Unesite naziv kombinacije.");
    if (selected.length === 0) return notify.error("Izaberite bar jednu analizu.");
    add.mutate(
      { name: name.trim(), groupName: groupName.trim(), analysisIds: selected },
      {
        onSuccess: () => {
          notify.success(`Kombinacija „${name.trim()}“ je dodata.`);
          onClose();
        },
        onError: (err) => notify.error(err),
      }
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Nova kombinacija analiza"
      footer={
        <>
          <span className="mr-auto text-sm text-gray-500 dark:text-gray-400">
            {chosen.length} analiza · <span className="font-semibold text-gray-900 dark:text-white">{formatRSD(priceOf(chosen))}</span>
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>Otkaži</Button>
          <Button size="sm" type="submit" form={formId} loading={add.isPending}>Dodaj kombinaciju</Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Grupa" htmlFor={`${formId}-g`} hint="Izaberite postojeću ili upišite novu.">
            <Input id={`${formId}-g`} list={`${formId}-groups`} value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="npr. Laboratorija" />
            <datalist id={`${formId}-groups`}>
              {groups.map((g) => <option key={g._id} value={g.name} />)}
            </datalist>
          </Field>
          <Field label="Naziv kombinacije" htmlFor={`${formId}-n`}>
            <Input id={`${formId}-n`} value={name} onChange={(e) => setName(e.target.value)} placeholder="npr. Osnovna krvna slika" />
          </Field>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Analize</p>
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pretraži analize..." leading={<LuSearch className="h-4 w-4" />} />
          <ul className="mt-2 max-h-64 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-gray-500">Nema analiza</li>}
            {filtered.map((a) => {
              const on = selected.includes(a._id);
              return (
                <li key={a._id}>
                  <button type="button" onClick={() => toggle(a._id)} aria-pressed={on} className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${on ? "bg-brand-50 dark:bg-brand-500/10" : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}>
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? "border-brand-600 bg-brand-600 text-white" : "border-gray-300 dark:border-gray-600"}`}>
                      {on && <LuCheck className="h-3 w-3" />}
                    </span>
                    <span className="flex-1 text-gray-800 dark:text-gray-200">{a.name}</span>
                    <span className="tabular-nums text-gray-500 dark:text-gray-400">{formatRSD(a.price)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </form>
    </Dialog>
  );
}

export default function CombinationsPage() {
  const { data: groups = [], isLoading, isError, refetch } = useGetCombinations();
  const deleteCombination = useDeleteCombination();
  const deleteGroup = useDeleteCombinationGroup();
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<{ type: "create"; group?: string } | { type: "deleteCombination"; id: string; name: string } | { type: "deleteGroup"; id: string; name: string } | null>(null);
  const close = () => setDialog(null);

  const q = normalizeSearch(query.trim());
  const visible = groups
    .map((g) => ({
      ...g,
      combinations: (g.combinations ?? []).filter(
        (c) => !q || normalizeSearch(c.name).includes(q) || normalizeSearch(g.name).includes(q) || (c.analyses ?? []).some((a) => normalizeSearch(a.name).includes(q))
      ),
    }))
    .filter((g) => g.combinations.length > 0 || (!q && true));

  return (
    <>
      <PageHeader
        title="Kombinacije analiza"
        description="Grupe analiza koje se jednim klikom dodaju u specifikaciju pacijenta."
        actions={
          <Button size="sm" startIcon={<LuPlus className="h-4 w-4" />} onClick={() => setDialog({ type: "create" })}>
            Nova kombinacija
          </Button>
        }
      />

      <div className="mb-6 max-w-sm">
        <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pretraži kombinacije ili analize..." leading={<LuSearch className="h-4 w-4" />} aria-label="Pretraga kombinacija" />
      </div>

      {isError ? (
        <ErrorState message="Kombinacije nisu učitane." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-64" />)}</div>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState icon={<LuLayers />} title={q ? "Nema rezultata" : "Još nema kombinacija"} action={!q && <Button size="sm" onClick={() => setDialog({ type: "create" })}>Nova kombinacija</Button>} />
        </Card>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          {visible.map((g) => (
            <Card key={g._id}>
              <CardHeader
                title={g.name}
                description={`${g.combinations.length} kombinacija`}
                actions={
                  <>
                    <Button variant="ghost" size="xs" startIcon={<LuPlus className="h-3.5 w-3.5" />} onClick={() => setDialog({ type: "create", group: g.name })}>
                      Dodaj
                    </Button>
                    <Button variant="ghost" size="xs" aria-label={`Obriši grupu ${g.name}`} onClick={() => setDialog({ type: "deleteGroup", id: g._id, name: g.name })}>
                      <LuTrash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                }
              />
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {g.combinations.map((c) => (
                  <li key={c._id} className="group flex items-start gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(c.analyses ?? []).map((a) => (
                          <span key={a._id} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
                            {a.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-gray-900 dark:text-white">{formatRSD(priceOf(c.analyses ?? []))}</span>
                    <button
                      type="button"
                      onClick={() => setDialog({ type: "deleteCombination", id: c._id, name: c.name })}
                      aria-label={`Obriši ${c.name}`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-error-50 hover:text-error-600 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-error-500/10"
                    >
                      <LuTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <CombinationDialog open={dialog?.type === "create"} onClose={close} groups={groups} defaultGroup={dialog?.type === "create" ? dialog.group : undefined} />
      <ConfirmDialog
        open={dialog?.type === "deleteCombination"}
        onClose={close}
        loading={deleteCombination.isPending}
        onConfirm={() =>
          dialog?.type === "deleteCombination" &&
          deleteCombination.mutate(dialog.id, { onSuccess: () => { notify.success("Kombinacija je obrisana."); close(); }, onError: (e) => notify.error(e) })
        }
        title={`Obrisati kombinaciju „${dialog && "name" in dialog ? dialog.name : ""}“?`}
        description="Analize ostaju u šifarniku; briše se samo ova kombinacija."
        confirmText="Obriši"
      />
      <ConfirmDialog
        open={dialog?.type === "deleteGroup"}
        onClose={close}
        loading={deleteGroup.isPending}
        onConfirm={() =>
          dialog?.type === "deleteGroup" &&
          deleteGroup.mutate(dialog.id, { onSuccess: () => { notify.success("Grupa je obrisana."); close(); }, onError: (e) => notify.error(e) })
        }
        title={`Obrisati grupu „${dialog && "name" in dialog ? dialog.name : ""}“?`}
        description="Kombinacije iz ove grupe više se neće nuditi pri dodavanju u specifikaciju."
        confirmText="Obriši grupu"
      />
    </>
  );
}
