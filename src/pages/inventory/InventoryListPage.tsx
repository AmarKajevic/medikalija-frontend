import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { LuEllipsis, LuPackagePlus, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { isManager } from "@app/paths";
import PageHeader from "@shared/ui/page/PageHeader";
import DataTable, { Column } from "@shared/ui/data-table/DataTable";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import Tabs from "@shared/ui/tabs/Tabs";
import ActionMenu from "@shared/ui/menu/ActionMenu";
import StatCard from "@shared/ui/StatCard";
import { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import { formatQty, formatRSD } from "@shared/lib/format";
import { INVENTORY, InventoryItem, InventoryKind, stockStatus, useDeleteItem, useInventoryList } from "@features/inventory/model";
import { ItemDialog, RestockDialog } from "@features/inventory/ui/InventoryDialogs";

type Filter = "all" | "low" | "out";

export function StockBadge({ qty }: { qty: number }) {
  const s = stockStatus(qty);
  if (s === "out") return <Badge size="sm" color="error">Nema na stanju</Badge>;
  if (s === "low") return <Badge size="sm" color="warning">Pri kraju</Badge>;
  return null;
}

export default function InventoryListPage({ kind }: { kind: InventoryKind }) {
  const cfg = INVENTORY[kind];
  const navigate = useNavigate();
  const { user } = useAuth();
  const manager = isManager(user?.role);
  const { data = [], isLoading, isError, refetch } = useInventoryList(cfg);
  const remove = useDeleteItem(cfg);

  const [filter, setFilter] = useState<Filter>("all");
  const [dialog, setDialog] = useState<{ type: "create" | "edit" | "restock" | "delete"; item?: InventoryItem } | null>(null);

  const counts = {
    all: data.length,
    low: data.filter((i) => stockStatus(i.quantity) === "low").length,
    out: data.filter((i) => stockStatus(i.quantity) === "out").length,
  };
  const totalValue = data.reduce((s, i) => s + Math.max(i.quantity, 0) * i.price, 0);
  const rows = useMemo(() => (filter === "all" ? data : data.filter((i) => stockStatus(i.quantity) === filter)), [data, filter]);

  const columns: Column<InventoryItem>[] = [
    {
      id: "name",
      header: "Naziv",
      sortValue: (i) => i.name,
      cell: (i) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">{i.name}</span>
          <StockBadge qty={i.quantity} />
        </div>
      ),
    },
    {
      id: "qty",
      header: "Stanje",
      align: "right",
      sortValue: (i) => i.quantity,
      cell: (i) => <span className="tabular-nums">{formatQty(i.quantity)} kom.</span>,
    },
    {
      id: "packages",
      header: "Pakovanja",
      align: "right",
      hideBelow: "md",
      sortValue: (i) => i.packageCount ?? 0,
      cell: (i) =>
        i.unitsPerPackage ? (
          <span className="tabular-nums text-gray-500 dark:text-gray-400">
            {i.packageCount ?? 0} × {i.unitsPerPackage}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    { id: "price", header: "Cena / kom.", align: "right", hideBelow: "sm", sortValue: (i) => i.price, cell: (i) => <span className="tabular-nums">{formatRSD(i.price)}</span> },
    {
      id: "value",
      header: "Vrednost zalihe",
      align: "right",
      hideBelow: "lg",
      sortValue: (i) => i.quantity * i.price,
      cell: (i) => <span className="tabular-nums text-gray-500 dark:text-gray-400">{formatRSD(Math.max(i.quantity, 0) * i.price)}</span>,
    },
    ...(manager
      ? [
          {
            id: "actions",
            header: <span className="sr-only">Akcije</span>,
            align: "right" as const,
            cell: (i: InventoryItem) => (
              <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="flex justify-end gap-1">
                <Button variant="ghost" size="xs" startIcon={<LuPackagePlus className="h-3.5 w-3.5" />} onClick={() => setDialog({ type: "restock", item: i })}>
                  Dopuni
                </Button>
                <ActionMenu
                  trigger={({ toggle }) => (
                    <button type="button" onClick={toggle} aria-label={`Akcije za ${i.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5">
                      <LuEllipsis className="h-4 w-4" />
                    </button>
                  )}
                  items={[
                    { label: "Izmeni", icon: <LuPencil />, onClick: () => setDialog({ type: "edit", item: i }) },
                    { label: "Obriši", icon: <LuTrash2 />, danger: true, separated: true, onClick: () => setDialog({ type: "delete", item: i }) },
                  ]}
                />
              </div>
            ),
          },
        ]
      : []),
  ];

  const close = () => setDialog(null);
  const confirmDelete = () =>
    dialog?.item &&
    remove.mutate(dialog.item._id, {
      onSuccess: () => {
        notify.success(`„${dialog.item!.name}“ je obrisan.`);
        close();
      },
      onError: (err) => notify.error(err),
    });

  return (
    <>
      <PageHeader
        title={cfg.title}
        description={`Stanje ${kind === "medicine" ? "lekova" : "artikala"} doma. Porodične zalihe pacijenata vode se posebno.`}
        actions={
          manager && (
            <Button size="sm" startIcon={<LuPlus className="h-4 w-4" />} onClick={() => setDialog({ type: "create" })}>
              Novi {cfg.singular}
            </Button>
          )
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Ukupno stavki" value={counts.all} loading={isLoading} />
        <StatCard label="Pri kraju / nema" value={`${counts.low} / ${counts.out}`} loading={isLoading} tone={counts.out > 0 ? "danger" : counts.low > 0 ? "warning" : "default"} />
        <StatCard label="Vrednost zaliha" value={formatRSD(totalValue)} loading={isLoading} />
      </div>

      <Tabs
        className="mb-4"
        value={filter}
        onChange={setFilter}
        items={[
          { value: "all", label: "Sve", count: counts.all },
          { value: "low", label: "Pri kraju", count: counts.low },
          { value: "out", label: "Nema na stanju", count: counts.out },
        ]}
      />

      {isError ? (
        <ErrorState message="Lista nije učitana." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          getRowId={(i) => i._id}
          onRowClick={(i) => navigate(cfg.detailPath(i._id))}
          searchText={(i) => i.name}
          searchPlaceholder={`Pretraži ${kind === "medicine" ? "lekove" : "artikle"}...`}
          initialSort={{ id: "name", dir: "asc" }}
          empty={{
            title: filter === "all" ? `Još nema unetih ${kind === "medicine" ? "lekova" : "artikala"}` : "Nema stavki u ovoj grupi",
            action:
              manager && filter === "all" ? (
                <Button size="sm" startIcon={<LuPlus className="h-4 w-4" />} onClick={() => setDialog({ type: "create" })}>
                  Novi {cfg.singular}
                </Button>
              ) : undefined,
          }}
        />
      )}

      {manager && (
        <>
          <ItemDialog cfg={cfg} open={dialog?.type === "create" || dialog?.type === "edit"} item={dialog?.type === "edit" ? dialog.item : null} onClose={close} />
          <RestockDialog cfg={cfg} open={dialog?.type === "restock"} item={dialog?.type === "restock" ? dialog.item ?? null : null} onClose={close} />
          <ConfirmDialog
            open={dialog?.type === "delete"}
            onClose={close}
            onConfirm={confirmDelete}
            loading={remove.isPending}
            title={`Obrisati „${dialog?.item?.name}“?`}
            description={`${cfg.singularCap} se uklanja iz šifarnika. Postojeće stavke u specifikacijama ostaju, ali novi unosi više neće biti mogući.`}
            confirmText="Obriši"
          />
        </>
      )}
    </>
  );
}
