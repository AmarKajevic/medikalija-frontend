import { useEffect, useId, useState } from "react";
import { LuEllipsis, LuFlaskConical, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import PageHeader from "@shared/ui/page/PageHeader";
import DataTable, { Column } from "@shared/ui/data-table/DataTable";
import Button from "@shared/ui/button/Button";
import ActionMenu from "@shared/ui/menu/ActionMenu";
import Dialog, { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import Field from "@shared/ui/form/Field";
import { Input } from "@shared/ui/form/controls";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import { formatRSD } from "@shared/lib/format";
import { normalizeSearch } from "@shared/lib/search";
import { useGetAnalyses } from "@features/analysis/hooks/useGetAnalyses";
import { useAddAnalysis } from "@features/analysis/hooks/useAddAnalysis";
import { useUpdateAnalysis } from "@features/analysis/hooks/useUpdateAnalysis";
import { useDeleteAnalysis } from "@features/analysis/hooks/useDeleteAnalysis";

interface Analysis {
  _id: string;
  name: string;
  price: number;
}

function AnalysisDialog({ open, onClose, analysis, all }: { open: boolean; onClose: () => void; analysis?: Analysis | null; all: Analysis[] }) {
  const formId = useId();
  const add = useAddAnalysis();
  const update = useUpdateAnalysis();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (open) {
      setName(analysis?.name ?? "");
      setPrice(analysis ? String(analysis.price) : "");
    }
  }, [open, analysis]);

  const duplicate = all.find((a) => a._id !== analysis?._id && normalizeSearch(a.name) === normalizeSearch(name.trim()));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(price.replace(",", "."));
    if (!name.trim()) return notify.error("Unesite naziv.");
    if (duplicate) return notify.error(`Analiza „${duplicate.name}“ već postoji.`);
    if (!(value >= 0) || price === "") return notify.error("Unesite cenu.");
    const opts = {
      onSuccess: () => {
        notify.success(analysis ? "Analiza je izmenjena." : "Analiza je dodata.");
        onClose();
      },
      onError: (err: unknown) => notify.error(err),
    };
    if (analysis) update.mutate({ id: analysis._id, data: { name: name.trim(), price: value } }, opts);
    else add.mutate({ name: name.trim(), price: value }, opts);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title={analysis ? "Izmena analize" : "Nova analiza"}
      description={analysis ? "Nova cena važi za buduće unose; već naplaćene stavke se ne menjaju." : undefined}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Otkaži</Button>
          <Button size="sm" type="submit" form={formId} loading={add.isPending || update.isPending}>
            {analysis ? "Sačuvaj" : "Dodaj analizu"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Naziv" htmlFor={`${formId}-n`} error={duplicate ? "Analiza sa ovim nazivom već postoji." : undefined}>
          <Input id={`${formId}-n`} autoFocus value={name} onChange={(e) => setName(e.target.value)} invalid={!!duplicate} placeholder="npr. Kompletna krvna slika" />
        </Field>
        <Field label="Cena" htmlFor={`${formId}-p`}>
          <Input id={`${formId}-p`} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} trailing="RSD" placeholder="0,00" />
        </Field>
      </form>
    </Dialog>
  );
}

export default function AnalysesPage() {
  const { data, isLoading, isError, refetch } = useGetAnalyses();
  const remove = useDeleteAnalysis();
  const analyses: Analysis[] = data?.analyses ?? [];
  const [dialog, setDialog] = useState<{ type: "form" | "delete"; item?: Analysis } | null>(null);
  const close = () => setDialog(null);

  const columns: Column<Analysis>[] = [
    { id: "name", header: "Naziv", sortValue: (a) => a.name, cell: (a) => <span className="font-medium text-gray-900 dark:text-white">{a.name}</span> },
    { id: "price", header: "Cena", align: "right", sortValue: (a) => a.price, cell: (a) => <span className="tabular-nums">{formatRSD(a.price)}</span> },
    {
      id: "actions",
      header: <span className="sr-only">Akcije</span>,
      align: "right",
      cell: (a) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <ActionMenu
            trigger={({ toggle }) => (
              <button type="button" onClick={toggle} aria-label={`Akcije za ${a.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
                <LuEllipsis className="h-4 w-4" />
              </button>
            )}
            items={[
              { label: "Izmeni", icon: <LuPencil />, onClick: () => setDialog({ type: "form", item: a }) },
              { label: "Obriši", icon: <LuTrash2 />, danger: true, separated: true, onClick: () => setDialog({ type: "delete", item: a }) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Analize"
        description="Šifarnik laboratorijskih analiza i cena. Analize se grupišu u kombinacije koje se dodaju u specifikaciju."
        actions={
          <Button size="sm" startIcon={<LuPlus className="h-4 w-4" />} onClick={() => setDialog({ type: "form" })}>
            Nova analiza
          </Button>
        }
      />
      {isError ? (
        <ErrorState message="Analize nisu učitane." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={analyses}
          loading={isLoading}
          getRowId={(a) => a._id}
          onRowClick={(a) => setDialog({ type: "form", item: a })}
          searchText={(a) => a.name}
          searchPlaceholder="Pretraži analize..."
          initialSort={{ id: "name", dir: "asc" }}
          pageSize={25}
          empty={{ icon: <LuFlaskConical />, title: "Još nema analiza", action: <Button size="sm" onClick={() => setDialog({ type: "form" })}>Nova analiza</Button> }}
        />
      )}

      <AnalysisDialog open={dialog?.type === "form"} onClose={close} analysis={dialog?.item} all={analyses} />
      <ConfirmDialog
        open={dialog?.type === "delete"}
        onClose={close}
        loading={remove.isPending}
        onConfirm={() =>
          dialog?.item &&
          remove.mutate(dialog.item._id, { onSuccess: () => { notify.success("Analiza je obrisana."); close(); }, onError: (e) => notify.error(e) })
        }
        title={`Obrisati analizu „${dialog?.item?.name}“?`}
        description="Analiza se uklanja iz šifarnika i iz kombinacija u kojima se nalazi."
        confirmText="Obriši"
      />
    </>
  );
}
