import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { LuArchive, LuInfo, LuPackageOpen, LuPencil, LuTrash2 } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { isManager } from "@app/paths";
import PageHeader from "@shared/ui/page/PageHeader";
import { Card, CardBody, CardHeader } from "@shared/ui/card/Card";
import Tabs from "@shared/ui/tabs/Tabs";
import Field from "@shared/ui/form/Field";
import { Input, Select } from "@shared/ui/form/controls";
import Button from "@shared/ui/button/Button";
import Dialog, { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import StockCombobox from "@shared/ui/combobox/StockCombobox";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { notify } from "@shared/lib/notify";
import { formatQty } from "@shared/lib/format";
import { usePatients } from "@features/patients/hooks/usePatients";
import { useMedicineOptions } from "@features/medicine/hooks/useMedicineOptions";
import { useArticleOptions } from "@features/articles/ui/useArticleOptions";
import { useGetPatientStockArticles } from "@features/articles/hooks/useGetPatientStockArticles";
import { useMedicines } from "@features/medicine/hooks/useMedicines";
import { useGetArticles } from "@features/articles/hooks/useGetArticles";
import { InventoryKind } from "@features/inventory/model";
import {
  FamilyMedicineRow,
  useAddFamilyStock,
  useFamilyMedicines,
  useMoveToReserve,
  useRemoveFamilyMedicine,
  useSetFamilyMedicine,
} from "@features/inventory/familyStock";

const num = (v: string) => Number(v.replace(",", ".")) || 0;
type PatientLite = { _id: string; name: string; lastName: string; dischargeDate?: string | null };
type CatalogItem = { _id: string; name: string; unitsPerPackage?: number };

function AddFamilyStockForm({ patientId }: { patientId: string }) {
  const id = useId();
  const [kind, setKind] = useState<InventoryKind>("medicine");
  const [itemId, setItemId] = useState("");
  const [packages, setPackages] = useState("");
  const [units, setUnits] = useState("");
  const add = useAddFamilyStock();

  const medicineOptions = useMedicineOptions(patientId);
  const articleOptions = useArticleOptions(patientId);
  const { options, isLoading } = kind === "medicine" ? medicineOptions : articleOptions;
  const medicines = (useMedicines().data ?? []) as CatalogItem[];
  const articles = (useGetArticles().data ?? []) as CatalogItem[];
  const catalogItem = (kind === "medicine" ? medicines : articles).find((i) => i._id === itemId);
  const upp = catalogItem?.unitsPerPackage ?? 0;
  const total = num(packages) * upp + num(units);

  useEffect(() => {
    setItemId("");
    setPackages("");
    setUnits("");
  }, [kind, patientId]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!catalogItem) return notify.error("Izaberite stavku iz šifarnika.");
    if (total <= 0) return notify.error("Unesite količinu.");
    add.mutate(
      { kind, patientId, name: catalogItem.name, unitsPerPackage: upp || undefined, packages: upp > 0 ? num(packages) : 0, units: num(units) },
      {
        onSuccess: () => {
          notify.success(`${catalogItem.name}: dodato ${formatQty(total)} kom. na porodično stanje.`);
          setItemId("");
          setPackages("");
          setUnits("");
        },
        onError: (err) => notify.error(err),
      }
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Tabs variant="pills" value={kind} onChange={setKind} items={[{ value: "medicine", label: "Lek" }, { value: "article", label: "Artikal" }]} />
      <Field label={kind === "medicine" ? "Lek" : "Artikal"} htmlFor={`${id}-item`} hint="Stavka mora postojati u šifarniku doma.">
        <StockCombobox id={`${id}-item`} value={itemId} onChange={setItemId} options={options} loading={isLoading} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Pakovanja" htmlFor={`${id}-p`} hint={upp > 0 ? `po ${upp} kom.` : itemId ? "Nema definisano pakovanje" : undefined}>
          <Input id={`${id}-p`} inputMode="numeric" value={packages} onChange={(e) => setPackages(e.target.value)} disabled={upp <= 0} placeholder="0" />
        </Field>
        <Field label="Pojedinačno" htmlFor={`${id}-u`}>
          <Input id={`${id}-u`} inputMode="decimal" value={units} onChange={(e) => setUnits(e.target.value)} placeholder="0" trailing="kom." />
        </Field>
      </div>
      <p className="flex gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-600 dark:bg-white/[0.03] dark:text-gray-400">
        <LuInfo className="mt-0.5 h-4 w-4 shrink-0" />
        Porodično stanje se troši pre stanja doma i ne naplaćuje se u specifikaciji.
      </p>
      <Button type="submit" className="w-full" loading={add.isPending} disabled={!itemId || total <= 0}>
        Dodaj {total > 0 ? `${formatQty(total)} kom.` : ""}
      </Button>
    </form>
  );
}

function FamilyMedicinesList({ patientId, manager }: { patientId: string; manager: boolean }) {
  const { data = [], isLoading } = useFamilyMedicines(patientId);
  const move = useMoveToReserve();
  const setQty = useSetFamilyMedicine();
  const remove = useRemoveFamilyMedicine();
  const [action, setAction] = useState<{ type: "reserve" | "edit" | "remove"; row: FamilyMedicineRow } | null>(null);
  const [amount, setAmount] = useState("");

  const open = (type: "reserve" | "edit" | "remove", row: FamilyMedicineRow) => {
    setAmount(type === "edit" ? String(row.quantity) : "");
    setAction({ type, row });
  };
  const close = () => setAction(null);
  const done = (msg: string) => ({ onSuccess: () => { notify.success(msg); close(); }, onError: (e: unknown) => notify.error(e) });

  if (isLoading) return <Skeleton className="h-32" />;
  if (data.length === 0) return <EmptyState compact icon={<LuPackageOpen />} title="Nema porodičnih lekova" />;

  return (
    <>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {data.map((r) => (
          <li key={r._id} className="flex flex-wrap items-center gap-3 py-3">
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">{r.medicine?.name}</span>
            <span className="text-sm tabular-nums text-gray-700 dark:text-gray-300">{formatQty(r.quantity)} kom.</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="xs" startIcon={<LuArchive className="h-3.5 w-3.5" />} onClick={() => open("reserve", r)}>
                U rezervu
              </Button>
              {manager && (
                <>
                  <Button variant="ghost" size="xs" aria-label="Ispravi količinu" onClick={() => open("edit", r)}>
                    <LuPencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="xs" aria-label="Ukloni" onClick={() => open("remove", r)}>
                    <LuTrash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Dialog
        open={action?.type === "reserve" || action?.type === "edit"}
        onClose={close}
        size="sm"
        title={action?.type === "reserve" ? `Prebaci u rezervu: ${action.row.medicine?.name}` : `Ispravka stanja: ${action?.row.medicine?.name}`}
        description={action?.type === "reserve" ? `Dostupno ${formatQty(action.row.quantity)} kom. Rezerva se može kasnije vratiti pacijentu ili domu.` : "Unesite tačnu količinu posle provere."}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={close}>Otkaži</Button>
            <Button
              size="sm"
              loading={move.isPending || setQty.isPending}
              disabled={action?.type === "reserve" ? num(amount) <= 0 || num(amount) > (action?.row.quantity ?? 0) : amount === ""}
              onClick={() =>
                action &&
                (action.type === "reserve"
                  ? move.mutate({ id: action.row._id, amount: num(amount), patientId }, done("Prebačeno u rezervu."))
                  : setQty.mutate({ id: action.row._id, quantity: num(amount), patientId }, done("Količina je ispravljena.")))
              }
            >
              {action?.type === "reserve" ? "Prebaci" : "Sačuvaj"}
            </Button>
          </>
        }
      >
        <Field label="Količina" htmlFor="family-amount">
          <Input id="family-amount" autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} trailing="kom." />
        </Field>
      </Dialog>

      <ConfirmDialog
        open={action?.type === "remove"}
        onClose={close}
        loading={remove.isPending}
        onConfirm={() => action && remove.mutate({ id: action.row._id, patientId }, done("Uklonjeno sa porodičnog stanja."))}
        title={`Ukloniti „${action?.row.medicine?.name}“ sa porodičnog stanja?`}
        description="Količina se briše, ne prebacuje se u rezervu niti na stanje doma."
        confirmText="Ukloni"
      />
    </>
  );
}

function FamilyArticlesList({ patientId }: { patientId: string }) {
  const { data = [], isLoading } = useGetPatientStockArticles(patientId);
  const rows = (data as Array<{ _id: string; name: string; familyQuantity: number }>).filter((r) => r.familyQuantity > 0);
  if (isLoading) return <Skeleton className="h-32" />;
  if (rows.length === 0) return <EmptyState compact icon={<LuPackageOpen />} title="Nema porodičnih artikala" />;
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {rows.map((r) => (
        <li key={r._id} className="flex items-center gap-3 py-3">
          <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">{r.name}</span>
          <span className="text-sm tabular-nums text-gray-700 dark:text-gray-300">{formatQty(r.familyQuantity)} kom.</span>
        </li>
      ))}
    </ul>
  );
}

export default function FamilyStockPage() {
  const { user } = useAuth();
  const manager = isManager(user?.role);
  const [params, setParams] = useSearchParams();
  const { data, isLoading } = usePatients();
  const [tab, setTab] = useState<InventoryKind>("medicine");

  const patients = useMemo(
    () =>
      ((data?.patients ?? []) as PatientLite[])
        .filter((p) => !p.dischargeDate)
        .sort((a, b) => `${a.lastName} ${a.name}`.localeCompare(`${b.lastName} ${b.name}`, "sr")),
    [data]
  );
  const patientId = params.get("patient") ?? "";
  const patient = patients.find((p) => p._id === patientId);

  return (
    <>
      <PageHeader
        title="Porodične zalihe"
        description="Lekovi i artikli koje porodica donosi pacijentu. Troše se prvi i ne naplaćuju se."
      />

      <Card className="mb-6">
        <CardBody className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-80">
            <Field label="Pacijent" htmlFor="family-patient">
              <Select id="family-patient" value={patientId} onChange={(e) => setParams(e.target.value ? { patient: e.target.value } : {})} disabled={isLoading}>
                <option value="">{isLoading ? "Učitavanje..." : "Izaberite pacijenta..."}</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.lastName} {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {patient && <p className="pb-2 text-sm text-gray-500 dark:text-gray-400">Prikaz i unos za: <span className="font-medium text-gray-900 dark:text-white">{patient.name} {patient.lastName}</span></p>}
        </CardBody>
      </Card>

      {!patient ? (
        <Card>
          <EmptyState icon={<LuPackageOpen />} title="Izaberite pacijenta" description="Porodične zalihe se uvek vode po pacijentu." />
        </Card>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(320px,400px)_1fr]">
          <Card>
            <CardHeader title="Novi unos" description="Šta je porodica donela?" />
            <CardBody>
              <AddFamilyStockForm patientId={patient._id} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Trenutno porodično stanje" />
            <CardBody>
              <Tabs className="mb-2" value={tab} onChange={setTab} items={[{ value: "medicine", label: "Lekovi" }, { value: "article", label: "Artikli" }]} />
              {tab === "medicine" ? <FamilyMedicinesList patientId={patient._id} manager={manager} /> : <FamilyArticlesList patientId={patient._id} />}
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}
