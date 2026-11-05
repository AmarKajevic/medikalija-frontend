import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LuArchive, LuEllipsis, LuTrash2, LuUndo2 } from "react-icons/lu";
import { api } from "@shared/api/api";
import PageHeader from "@shared/ui/page/PageHeader";
import DataTable, { Column } from "@shared/ui/data-table/DataTable";
import Badge from "@shared/ui/badge/Badge";
import Button from "@shared/ui/button/Button";
import ActionMenu from "@shared/ui/menu/ActionMenu";
import Dialog, { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import Field from "@shared/ui/form/Field";
import { Input, Select } from "@shared/ui/form/controls";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import { formatQty, formatRSD } from "@shared/lib/format";
import { usePatients } from "@features/patients/hooks/usePatients";

interface ReserveItem {
  _id: string;
  name: string;
  amount: number;
  source: "home" | "family";
  patient?: string;
  pricePerUnit?: number;
  createdAt: string;
}

const num = (v: string) => Number(v.replace(",", ".")) || 0;

export default function ReservePage() {
  const qc = useQueryClient();
  const { data: reserve = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["reserve"],
    queryFn: async (): Promise<ReserveItem[]> => (await api.get("/api/medicine-reserve")).data.reserve ?? [],
  });
  const { data: patientsData } = usePatients();
  const patientName = useMemo(() => {
    const map = new Map<string, string>();
    ((patientsData?.patients ?? []) as Array<{ _id: string; name: string; lastName: string }>).forEach((p) => map.set(p._id, `${p.name} ${p.lastName}`));
    return (id?: string) => (id ? map.get(id) ?? "Nepoznat pacijent" : "");
  }, [patientsData]);

  const [patientFilter, setPatientFilter] = useState("");
  const [action, setAction] = useState<{ type: "return" | "delete"; item: ReserveItem } | null>(null);
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState<"home" | "family">("home");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["reserve"] });
    qc.invalidateQueries({ queryKey: ["medicines"] });
    qc.invalidateQueries({ queryKey: ["familyStockMedicines"] });
  };
  const returnItem = useMutation({
    mutationFn: (v: { reserveId: string; amount: number; destination: "home" | "family" }) => api.post("/api/medicine-reserve/return", v),
    onSuccess: refresh,
  });
  const deleteItem = useMutation({ mutationFn: (id: string) => api.delete(`/api/medicine-reserve/${id}`), onSuccess: refresh });

  const rows = reserve.filter((r) => r.amount > 0 && (!patientFilter || r.patient === patientFilter));
  const patientsInReserve = [...new Set(reserve.filter((r) => r.patient).map((r) => r.patient!))];

  const columns: Column<ReserveItem>[] = [
    { id: "name", header: "Lek", sortValue: (r) => r.name, cell: (r) => <span className="font-medium text-gray-900 dark:text-white">{r.name}</span> },
    { id: "amount", header: "Količina", align: "right", sortValue: (r) => r.amount, cell: (r) => <span className="tabular-nums">{formatQty(r.amount)} kom.</span> },
    {
      id: "source",
      header: "Poreklo",
      sortValue: (r) => r.source,
      cell: (r) =>
        r.source === "family" ? (
          <span className="flex flex-wrap items-center gap-2">
            <Badge size="sm" color="primary">Porodica</Badge>
            <span className="text-gray-500 dark:text-gray-400">{patientName(r.patient)}</span>
          </span>
        ) : (
          <Badge size="sm" color="light">Dom</Badge>
        ),
    },
    { id: "price", header: "Cena / kom.", align: "right", hideBelow: "md", cell: (r) => (r.pricePerUnit ? formatRSD(r.pricePerUnit) : "—") },
    { id: "date", header: "Dodato", hideBelow: "lg", sortValue: (r) => r.createdAt, cell: (r) => new Date(r.createdAt).toLocaleDateString("sr-Latn-RS") },
    {
      id: "actions",
      header: <span className="sr-only">Akcije</span>,
      align: "right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="xs"
            startIcon={<LuUndo2 className="h-3.5 w-3.5" />}
            onClick={() => {
              setAmount(String(r.amount));
              setDestination(r.source === "family" ? "family" : "home");
              setAction({ type: "return", item: r });
            }}
          >
            Vrati
          </Button>
          <ActionMenu
            trigger={({ toggle }) => (
              <button type="button" onClick={toggle} aria-label={`Akcije za ${r.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
                <LuEllipsis className="h-4 w-4" />
              </button>
            )}
            items={[{ label: "Otpiši iz rezerve", icon: <LuTrash2 />, danger: true, onClick: () => setAction({ type: "delete", item: r }) }]}
          />
        </div>
      ),
    },
  ];

  const close = () => setAction(null);
  const item = action?.item;

  return (
    <>
      <PageHeader
        title="Rezerva lekova"
        description="Lekovi skinuti sa stanja (npr. posle otpusta ili isteka terapije) koji se mogu vratiti pacijentu ili domu."
      />

      {isError ? (
        <ErrorState message="Rezerva nije učitana." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          getRowId={(r) => r._id}
          searchText={(r) => `${r.name} ${patientName(r.patient)}`}
          searchPlaceholder="Pretraži lek ili pacijenta..."
          toolbar={
            patientsInReserve.length > 0 && (
              <div className="w-56">
                <Select aria-label="Filter po pacijentu" value={patientFilter} onChange={(e) => setPatientFilter(e.target.value)}>
                  <option value="">Svi pacijenti</option>
                  {patientsInReserve.map((id) => (
                    <option key={id} value={id}>{patientName(id)}</option>
                  ))}
                </Select>
              </div>
            )
          }
          empty={{ icon: <LuArchive />, title: "Rezerva je prazna", description: "Lekovi se u rezervu prebacuju sa porodičnih zaliha pacijenta." }}
        />
      )}

      <Dialog
        open={action?.type === "return"}
        onClose={close}
        size="sm"
        title={`Vrati iz rezerve: ${item?.name}`}
        description={`U rezervi: ${formatQty(item?.amount)} kom.`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={close}>Otkaži</Button>
            <Button
              size="sm"
              loading={returnItem.isPending}
              disabled={num(amount) <= 0 || num(amount) > (item?.amount ?? 0)}
              onClick={() =>
                item &&
                returnItem.mutate(
                  { reserveId: item._id, amount: num(amount), destination },
                  { onSuccess: () => { notify.success("Vraćeno iz rezerve."); close(); }, onError: (e) => notify.error(e) }
                )
              }
            >
              Vrati
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Kome se vraća" htmlFor="reserve-dest">
            <Select id="reserve-dest" value={destination} onChange={(e) => setDestination(e.target.value as "home" | "family")}>
              <option value="home">Na stanje doma</option>
              {item?.patient && <option value="family">Pacijentu ({patientName(item.patient)})</option>}
            </Select>
          </Field>
          <Field label="Količina" htmlFor="reserve-amount">
            <Input id="reserve-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} trailing="kom." />
          </Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={action?.type === "delete"}
        onClose={close}
        loading={deleteItem.isPending}
        onConfirm={() => item && deleteItem.mutate(item._id, { onSuccess: () => { notify.success("Otpisano iz rezerve."); close(); }, onError: (e) => notify.error(e) })}
        title={`Otpisati „${item?.name}“ iz rezerve?`}
        description="Količina se trajno uklanja (npr. istekao rok). Ne vraća se ni domu ni pacijentu."
        confirmText="Otpiši"
      />
    </>
  );
}
