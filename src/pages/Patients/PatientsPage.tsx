import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { LuEllipsis, LuExternalLink, LuTrash2, LuUserPlus, LuUsers } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { hasRole, isManager, paths, SOCIAL_WRITE_ROLES } from "@app/paths";
import PageHeader from "@shared/ui/page/PageHeader";
import DataTable, { Column } from "@shared/ui/data-table/DataTable";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import Avatar from "@shared/ui/avatar/Avatar";
import Tabs from "@shared/ui/tabs/Tabs";
import ActionMenu from "@shared/ui/menu/ActionMenu";
import { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { formatDay, toCalendarDay } from "@shared/lib/calendarDay";
import { notify } from "@shared/lib/notify";
import { usePatients } from "@features/patients/hooks/usePatients";
import { useDeletePatient } from "@features/patients/hooks/useDeletePatient";
import PurgePatientDialog from "@features/patients/ui/PurgePatientDialog";
import NewResidentDialog from "@features/social/ui/NewResidentDialog";
import { pages } from "@app/routeLoaders";

type PatientRow = {
  _id: string;
  name: string;
  lastName: string;
  dateOfBirth: string;
  admissionDate: string;
  dischargeDate?: string | null;
  contactPerson?: string;
  address?: string;
};

type Filter = "active" | "discharged" | "all";

const ageOf = (dob: string) => {
  const b = toCalendarDay(dob);
  const n = new Date();
  let age = n.getFullYear() - b.getUTCFullYear();
  if (n.getMonth() < b.getUTCMonth() || (n.getMonth() === b.getUTCMonth() && n.getDate() < b.getUTCDate())) age -= 1;
  return age;
};

export default function PatientsPage() {
  // Sledeći korak je skoro uvek profil pacijenta — njegov kod se preuzima unapred
  useEffect(() => {
    pages.PatientPage().catch(() => {});
  }, []);

  const navigate = useNavigate();
  const { user } = useAuth();
  const manager = isManager(user?.role);
  const admin = user?.role === "admin";
  // Korisnika unose uprava i socijalni radnik (osnovni ili detaljni podaci)
  const canAdd = hasRole(user?.role, SOCIAL_WRITE_ROLES);
  const [params, setParams] = useSearchParams();
  const { data, isLoading, isError, refetch } = usePatients();
  const remove = useDeletePatient();
  const [filter, setFilter] = useState<Filter>("active");
  const [toDelete, setToDelete] = useState<PatientRow | null>(null);
  const [toPurge, setToPurge] = useState<PatientRow | null>(null);

  const addOpen = params.get("new") === "1";
  const setAddOpen = (open: boolean) => setParams(open ? { new: "1" } : {}, { replace: true });

  const all = useMemo(() => (data?.patients ?? []) as PatientRow[], [data]);
  const counts = {
    active: all.filter((p) => !p.dischargeDate).length,
    discharged: all.filter((p) => p.dischargeDate).length,
    all: all.length,
  };
  const rows = useMemo(
    () => all.filter((p) => (filter === "all" ? true : filter === "active" ? !p.dischargeDate : !!p.dischargeDate)),
    [all, filter]
  );

  const columns: Column<PatientRow>[] = [
    {
      id: "name",
      header: "Korisnik",
      sortValue: (p) => `${p.lastName} ${p.name}`,
      cell: (p) => (
        <div className="flex items-center gap-3">
          <Avatar name={p.name} lastName={p.lastName} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900 dark:text-white">
              {p.name} {p.lastName}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400 sm:hidden">Prijem {formatDay(p.admissionDate)}</p>
          </div>
        </div>
      ),
    },
    {
      id: "age",
      header: "Godine",
      hideBelow: "md",
      sortValue: (p) => (p.dateOfBirth ? ageOf(p.dateOfBirth) : null),
      cell: (p) => <span className="tabular-nums">{p.dateOfBirth ? ageOf(p.dateOfBirth) : "—"}</span>,
    },
    {
      id: "admission",
      header: "Prijem",
      hideBelow: "sm",
      sortValue: (p) => +toCalendarDay(p.admissionDate),
      cell: (p) => <span className="tabular-nums">{formatDay(p.admissionDate)}</span>,
    },
    {
      id: "status",
      header: "Status",
      sortValue: (p) => (p.dischargeDate ? 1 : 0),
      cell: (p) =>
        p.dischargeDate ? (
          <Badge size="sm" color="light">Otpušten {formatDay(p.dischargeDate)}</Badge>
        ) : (
          <Badge size="sm" color="success" dot>Na smeštaju</Badge>
        ),
    },
    {
      id: "contact",
      header: "Kontakt osoba",
      hideBelow: "lg",
      cell: (p) => <span className="text-gray-500 dark:text-gray-400">{p.contactPerson || "—"}</span>,
    },
    {
      id: "actions",
      header: <span className="sr-only">Akcije</span>,
      align: "right",
      cell: (p) => (
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="flex justify-end">
          <ActionMenu
            trigger={({ toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-label={`Akcije za ${p.name} ${p.lastName}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5"
              >
                <LuEllipsis className="h-4 w-4" />
              </button>
            )}
            items={[
              { label: "Otvori profil", icon: <LuExternalLink />, to: paths.patient(p._id) },
              // Admin briše trajno sa svim podacima (uz ukucano ime); glavna sestra samo greškom unete, bez dokumentacije
              ...(admin
                ? [{ label: "Trajno obriši korisnika", icon: <LuTrash2 />, danger: true, separated: true, onClick: () => setToPurge(p) }]
                : manager
                  ? [{ label: "Obriši korisnika", icon: <LuTrash2 />, danger: true, separated: true, onClick: () => setToDelete(p) }]
                  : []),
            ]}
          />
        </div>
      ),
    },
  ];

  const confirmDelete = () =>
    toDelete &&
    remove.mutate(toDelete._id, {
      onSuccess: () => {
        notify.success(`${toDelete.name} ${toDelete.lastName} je obrisan/a.`);
        setToDelete(null);
      },
      onError: (err) => notify.error(err),
    });

  return (
    <>
      <PageHeader
        title="Korisnici"
        description="Svi korisnici smeštaja, njihov status i kontakt porodice."
        actions={
          canAdd && (
            <Button size="sm" startIcon={<LuUserPlus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>
              Novi korisnik
            </Button>
          )
        }
      />

      <Tabs
        className="mb-4"
        value={filter}
        onChange={setFilter}
        items={[
          { value: "active", label: "Na smeštaju", count: counts.active },
          { value: "discharged", label: "Otpušteni", count: counts.discharged },
          { value: "all", label: "Svi", count: counts.all },
        ]}
      />

      {isError ? (
        <ErrorState message="Lista korisnika nije učitana." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          getRowId={(p) => p._id}
          onRowClick={(p) => navigate(paths.patient(p._id))}
          searchText={(p) => `${p.name} ${p.lastName} ${p.contactPerson ?? ""} ${p.address ?? ""}`}
          searchPlaceholder="Pretraži po imenu, kontaktu, adresi..."
          empty={{
            icon: <LuUsers />,
            title: filter === "discharged" ? "Nema otpuštenih korisnika" : "Još nema korisnika",
            description: canAdd && filter !== "discharged" ? "Dodajte prvog korisnika da biste počeli." : undefined,
            action:
              canAdd && filter !== "discharged" ? (
                <Button size="sm" startIcon={<LuUserPlus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>
                  Novi korisnik
                </Button>
              ) : undefined,
          }}
        />
      )}

      {canAdd && <NewResidentDialog open={addOpen} onClose={() => setAddOpen(false)} />}
      {admin && <PurgePatientDialog open={!!toPurge} onClose={() => setToPurge(null)} patient={toPurge} />}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        title={`Obrisati ${toDelete?.name} ${toDelete?.lastName}?`}
        description="Briše se samo korisnik unet greškom, bez ikakve dokumentacije. Ako je korisnik napustio dom, koristite „Otpust“ na profilu — istorija ostaje sačuvana."
        confirmText="Obriši trajno"
      />
    </>
  );
}
