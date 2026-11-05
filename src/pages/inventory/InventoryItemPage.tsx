import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { LuPackagePlus, LuPencil, LuTrash2 } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { isManager } from "@app/paths";
import PageHeader from "@shared/ui/page/PageHeader";
import StatCard from "@shared/ui/StatCard";
import Button from "@shared/ui/button/Button";
import { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import { formatQty, formatRSD } from "@shared/lib/format";
import { INVENTORY, InventoryKind, useDeleteItem, useInventoryItem } from "@features/inventory/model";
import { ItemDialog, RestockDialog } from "@features/inventory/ui/InventoryDialogs";
import { StockBadge } from "./InventoryListPage";

export default function InventoryItemPage({ kind }: { kind: InventoryKind }) {
  const cfg = INVENTORY[kind];
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const manager = isManager(user?.role);
  const { data: item, isLoading, isError, refetch } = useInventoryItem(cfg, id);
  const remove = useDeleteItem(cfg);
  const [dialog, setDialog] = useState<"edit" | "restock" | "delete" | null>(null);

  if (isLoading) return <PageLoader />;
  if (isError || !item) return <ErrorState message={`${cfg.singularCap} nije pronađen.`} onRetry={() => refetch()} />;

  const close = () => setDialog(null);

  return (
    <>
      <PageHeader
        title={item.name}
        meta={<StockBadge qty={item.quantity} />}
        breadcrumbs={[{ label: cfg.title, to: cfg.listPath }, { label: item.name }]}
        actions={
          manager && (
            <>
              <Button variant="outline" size="sm" startIcon={<LuTrash2 className="h-4 w-4" />} onClick={() => setDialog("delete")}>
                Obriši
              </Button>
              <Button variant="outline" size="sm" startIcon={<LuPencil className="h-4 w-4" />} onClick={() => setDialog("edit")}>
                Izmeni
              </Button>
              <Button size="sm" startIcon={<LuPackagePlus className="h-4 w-4" />} onClick={() => setDialog("restock")}>
                Dopuni stanje
              </Button>
            </>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Na stanju" value={`${formatQty(item.quantity)} kom.`} tone={item.quantity <= 0 ? "danger" : item.quantity <= 10 ? "warning" : "default"} />
        <StatCard label="Pakovanja" value={item.unitsPerPackage ? `${item.packageCount ?? 0}` : "—"} hint={item.unitsPerPackage ? `po ${item.unitsPerPackage} kom.` : "Pakovanje nije definisano"} />
        <StatCard label="Cena po jedinici" value={formatRSD(item.price)} />
        <StatCard label="Vrednost zalihe" value={formatRSD(Math.max(item.quantity, 0) * item.price)} />
      </div>

      {manager && (
        <>
          <ItemDialog cfg={cfg} open={dialog === "edit"} item={item} onClose={close} />
          <RestockDialog cfg={cfg} open={dialog === "restock"} item={item} onClose={close} />
          <ConfirmDialog
            open={dialog === "delete"}
            onClose={close}
            loading={remove.isPending}
            onConfirm={() =>
              remove.mutate(item._id, {
                onSuccess: () => {
                  notify.success(`„${item.name}“ je obrisan.`);
                  navigate(cfg.listPath);
                },
                onError: (err) => notify.error(err),
              })
            }
            title={`Obrisati „${item.name}“?`}
            description={`${cfg.singularCap} se uklanja iz šifarnika. Postojeće stavke u specifikacijama ostaju.`}
            confirmText="Obriši"
          />
        </>
      )}
    </>
  );
}
