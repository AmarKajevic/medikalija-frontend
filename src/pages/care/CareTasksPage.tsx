import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { LuArchiveRestore, LuEllipsis, LuHeartHandshake, LuPencil, LuPlus, LuSparkles, LuTrash2 } from "react-icons/lu";
import PageHeader from "@shared/ui/page/PageHeader";
import DataTable, { Column } from "@shared/ui/data-table/DataTable";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import Dialog, { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import ActionMenu from "@shared/ui/menu/ActionMenu";
import Field from "@shared/ui/form/Field";
import { Input } from "@shared/ui/form/controls";
import StockCombobox from "@shared/ui/combobox/StockCombobox";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import { formatQty, formatRSD } from "@shared/lib/format";
import { useArticleOptions } from "@features/articles/ui/useArticleOptions";
import { CareTask, CareTaskInput, isBillableTask, useCareTasks, useDeleteCareTask, useSaveCareTask } from "@features/nurse-entries/model";

// Česte usluge za brz početak; uprava ih posle prilagodi (cena, artikal).
const SUGGESTED: Array<Pick<CareTaskInput, "name" | "category">> = [
  { name: "Promenjene pelene", category: "Higijena" },
  { name: "Promenjena posteljina", category: "Higijena" },
  { name: "Kupanje", category: "Higijena" },
  { name: "Presvlačenje", category: "Higijena" },
  { name: "Brijanje", category: "Higijena" },
  { name: "Sečenje noktiju", category: "Higijena" },
  { name: "Okretanje u krevetu", category: "Nega" },
  { name: "Previjanje rane", category: "Nega" },
  { name: "Nega dekubitusa", category: "Nega" },
  { name: "Pomoć pri hranjenju", category: "Ishrana" },
  { name: "Merenje pritiska", category: "Merenja" },
  { name: "Merenje šećera", category: "Merenja" },
  { name: "Merenje temperature", category: "Merenja" },
  { name: "Šetnja", category: "Aktivnost" },
];

const billingText = (t: CareTask) => {
  const parts = [];
  if (t.article && t.articleAmount > 0) parts.push(`troši ${t.article.name} × ${formatQty(t.articleAmount)}`);
  if (t.price > 0) parts.push(`usluga ${formatRSD(t.price)}`);
  return parts.length ? parts.join(" + ") : "bez cene — upisuje se u specifikaciji";
};

type DialogState = { type: "edit"; task: CareTask | null } | { type: "delete"; task: CareTask } | null;

export default function CareTasksPage() {
  const { data = [], isLoading, isError, refetch } = useCareTasks({ all: true });
  const save = useSaveCareTask();
  const remove = useDeleteCareTask();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [seeding, setSeeding] = useState(false);
  const categories = useMemo(() => [...new Set(data.map((t) => t.category).filter(Boolean))], [data]);

  const seed = async () => {
    setSeeding(true);
    let added = 0;
    for (const s of SUGGESTED) {
      try {
        await save.mutateAsync({ ...s, price: 0, articleAmount: 1, article: null, active: true });
        added += 1;
      } catch {
        // već postoji — preskače se
      }
    }
    setSeeding(false);
    notify.success(`Dodato ${added} usluga. Podesite cene i artikle gde je potrebno.`);
  };

  const columns: Column<CareTask>[] = [
    {
      id: "name",
      header: "Usluga",
      sortValue: (t) => t.name,
      cell: (t) => (
        <div className="min-w-0">
          <p className={`font-medium ${t.active ? "text-gray-900 dark:text-white" : "text-gray-400 line-through"}`}>{t.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t.category}</p>
        </div>
      ),
    },
    {
      id: "billing",
      header: "Naplata",
      cell: (t) => (
        <span className={isBillableTask(t) ? "text-gray-700 dark:text-gray-300" : "text-gray-400"}>
          {billingText(t)}
          <span className="block text-xs text-gray-400">ide na odobrenje i u specifikaciju</span>
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      hideBelow: "sm",
      sortValue: (t) => (t.active ? 0 : 1),
      cell: (t) => (t.active ? <Badge size="sm" color="success">Aktivna</Badge> : <Badge size="sm" color="light">Arhivirana</Badge>),
    },
    {
      id: "actions",
      header: <span className="sr-only">Akcije</span>,
      align: "right",
      cell: (t) => (
        <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
          <ActionMenu
            trigger={({ toggle }) => (
              <button type="button" onClick={toggle} aria-label={`Akcije za ${t.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5">
                <LuEllipsis className="h-4 w-4" />
              </button>
            )}
            items={[
              { label: "Izmeni", icon: <LuPencil />, onClick: () => setDialog({ type: "edit", task: t }) },
              t.active
                ? { label: "Obriši", icon: <LuTrash2 />, danger: true, separated: true, onClick: () => setDialog({ type: "delete", task: t }) }
                : {
                    label: "Vrati u upotrebu",
                    icon: <LuArchiveRestore />,
                    separated: true,
                    onClick: () => save.mutate({ id: t._id, active: true }, { onSuccess: () => notify.success("Usluga je ponovo aktivna."), onError: (e) => notify.error(e) }),
                  },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Usluge nege"
        description="Lista iz koje sestre biraju šta je urađeno pacijentu. Usluga može da troši artikal sa stanja i/ili da ima svoju cenu. Svaka urađena nega ide na odobrenje i u specifikaciju."
        actions={
          <Button startIcon={<LuPlus className="h-4 w-4" />} onClick={() => setDialog({ type: "edit", task: null })}>
            Nova usluga
          </Button>
        }
      />
      {isError ? (
        <ErrorState message="Usluge nisu učitane." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          loading={isLoading}
          getRowId={(t) => t._id}
          onRowClick={(t) => setDialog({ type: "edit", task: t })}
          searchText={(t) => `${t.name} ${t.category}`}
          searchPlaceholder="Pretraži usluge..."
          empty={{
            icon: <LuHeartHandshake />,
            title: "Još nema usluga",
            description: "Dodajte svoje ili krenite od predloženih (pelene, posteljina, kupanje, merenja...).",
            action: (
              <Button variant="outline" startIcon={<LuSparkles className="h-4 w-4" />} loading={seeding} onClick={seed}>
                Dodaj predložene usluge
              </Button>
            ),
          }}
        />
      )}

      <TaskDialog open={dialog?.type === "edit"} task={dialog?.type === "edit" ? dialog.task : null} categories={categories} onClose={() => setDialog(null)} />

      <ConfirmDialog
        open={dialog?.type === "delete"}
        onClose={() => setDialog(null)}
        title="Obrisati uslugu?"
        description="Ako je usluga već korišćena, biće arhivirana: nestaje sa liste za sestre, a ostaje u istoriji nege."
        confirmText="Obriši"
        loading={remove.isPending}
        onConfirm={() =>
          dialog?.type === "delete" &&
          remove.mutate(dialog.task._id, {
            onSuccess: (res) => {
              notify.success(res.message);
              setDialog(null);
            },
            onError: (err) => notify.error(err),
          })
        }
      />
    </>
  );
}

const toNumber = (v: string) => Number(v.replace(",", "."));

function TaskDialog({ open, task, categories, onClose }: { open: boolean; task: CareTask | null; categories: string[]; onClose: () => void }) {
  const formId = useId();
  const ids = { name: useId(), category: useId(), article: useId(), amount: useId(), price: useId(), list: useId() };
  const save = useSaveCareTask();
  const { options: articles, isLoading } = useArticleOptions("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [usesArticle, setUsesArticle] = useState(false);
  const [article, setArticle] = useState("");
  const [amount, setAmount] = useState("1");
  const [hasPrice, setHasPrice] = useState(false);
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(task?.name ?? "");
    setCategory(task?.category ?? "");
    setUsesArticle(!!task?.article);
    setArticle(task?.article?._id ?? "");
    setAmount(String(task?.articleAmount ?? 1).replace(".", ","));
    setHasPrice((task?.price ?? 0) > 0);
    setPrice(task?.price ? String(task.price).replace(".", ",") : "");
  }, [open, task]);

  const articleName = articles.find((a) => a.value === article)?.label;
  const summary =
    [usesArticle && articleName && `skida ${amount || "?"} × ${articleName} sa stanja (prvo porodično) i naplaćuje ga`, hasPrice && price && `naplaćuje uslugu ${price} RSD`]
      .filter(Boolean)
      .join(", a ") || "ulazi u specifikaciju bez cene (cenu upisuje uprava)";

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return notify.error("Unesite naziv usluge.");
    if (usesArticle && !article) return notify.error("Izaberite artikal koji usluga troši.");
    if (usesArticle && !(toNumber(amount) > 0)) return notify.error("Količina artikla mora biti veća od nule.");
    if (hasPrice && !(toNumber(price) > 0)) return notify.error("Unesite cenu usluge.");

    save.mutate(
      {
        id: task?._id,
        name: name.trim(),
        category: category.trim() || "Nega",
        article: usesArticle ? article : null,
        articleAmount: usesArticle ? toNumber(amount) : 1,
        price: hasPrice ? toNumber(price) : 0,
        ...(task ? {} : { active: true }),
      },
      {
        onSuccess: () => {
          notify.success(task ? "Usluga je izmenjena." : "Usluga je dodata.");
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
      title={task ? "Izmena usluge" : "Nova usluga nege"}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button size="sm" type="submit" form={formId} loading={save.isPending}>
            Sačuvaj
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <Field label="Naziv" htmlFor={ids.name} hint="Kako će sestra videti uslugu na listi.">
            <Input id={ids.name} value={name} onChange={(e) => setName(e.target.value)} placeholder="npr. Promenjene pelene" autoFocus />
          </Field>
          <Field label="Grupa" htmlFor={ids.category}>
            <Input id={ids.category} list={ids.list} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Nega" />
            <datalist id={ids.list}>
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
        </div>

        <fieldset className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <legend className="px-1 text-sm font-medium text-gray-800 dark:text-white/90">Naplata</legend>
          <label className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={usesArticle} onChange={(e) => setUsesArticle(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" />
            <span>
              Troši artikal sa stanja
              <span className="block text-xs text-gray-500">npr. „Promenjene pelene” troši 1 × Pelene</span>
            </span>
          </label>
          {usesArticle && (
            <div className="grid gap-3 pl-6 sm:grid-cols-[1fr_110px]">
              <Field label="Artikal" htmlFor={ids.article}>
                <StockCombobox id={ids.article} value={article} onChange={setArticle} options={articles} loading={isLoading} placeholder="Pretraži artikle..." />
              </Field>
              <Field label="Količina" htmlFor={ids.amount} hint="po jednom unosu">
                <Input id={ids.amount} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </Field>
            </div>
          )}
          <label className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={hasPrice} onChange={(e) => setHasPrice(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" />
            <span>
              Naplaćuje se cena usluge
              <span className="block text-xs text-gray-500">npr. prevoz, frizer, pedikir</span>
            </span>
          </label>
          {hasPrice && (
            <div className="pl-6 sm:w-48">
              <Field label="Cena (RSD)" htmlFor={ids.price}>
                <Input id={ids.price} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" trailing="RSD" />
              </Field>
            </div>
          )}
        </fieldset>

        <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-400">
          Kad sestra unese ovu uslugu, ona <strong className="font-medium text-gray-800 dark:text-gray-200">{summary}</strong>.
          {" Pre ulaska u specifikaciju unos odobrava uprava."}
        </p>
      </form>
    </Dialog>
  );
}
