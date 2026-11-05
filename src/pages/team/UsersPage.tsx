import { useId, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LuEye, LuEyeOff, LuTrash2, LuUserPlus, LuUsers } from "react-icons/lu";
import { api } from "@shared/api/api";
import { useAuth } from "@app/providers/AuthContext";
import PageHeader from "@shared/ui/page/PageHeader";
import DataTable, { Column } from "@shared/ui/data-table/DataTable";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import Avatar from "@shared/ui/avatar/Avatar";
import Tabs from "@shared/ui/tabs/Tabs";
import Dialog, { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import Field from "@shared/ui/form/Field";
import { Input, Select } from "@shared/ui/form/controls";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";

interface AppUser {
  _id: string;
  name: string;
  lastName: string;
  email?: string;
  role: string;
  loginAllowed?: boolean;
}

// Uloge sa pristupom aplikaciji i ostalo osoblje (vodi se u evidenciji, bez prijave)
const ROLES: Array<{ value: string; label: string; login: boolean }> = [
  { value: "main-nurse", label: "Glavna sestra", login: true },
  { value: "nurse", label: "Medicinska sestra", login: true },
  { value: "doctor", label: "Doktor", login: true },
  { value: "admin", label: "Direktor", login: true },
  { value: "Caregiver", label: "Negovatelj", login: false },
  { value: "Physiotherapist", label: "Fizioterapeut", login: false },
  { value: "Occupational Therapist", label: "Radni terapeut", login: false },
  { value: "Social Worker", label: "Socijalni radnik", login: false },
  { value: "Kitchen", label: "Kuhinja", login: false },
  { value: "Cleaner", label: "Higijena", login: false },
  { value: "Janitor", label: "Domar", login: false },
  { value: "Administration", label: "Administracija", login: false },
];
const roleName = (r: string) => ROLES.find((x) => x.value === r)?.label ?? r;
const canLogin = (r: string) => ROLES.find((x) => x.value === r)?.login ?? false;

function NewUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const formId = useId();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", lastName: "", email: "", password: "", role: "nurse" });
  const [showPassword, setShowPassword] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = useMutation({
    mutationFn: () => api.post("/api/auth/register", form),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const close = () => {
    setForm({ name: "", lastName: "", email: "", password: "", role: "nurse" });
    onClose();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.lastName.trim()) return notify.error("Unesite ime i prezime.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return notify.error("Unesite ispravan email.");
    if (form.password.length < 8) return notify.error("Lozinka mora imati najmanje 8 znakova.");
    create.mutate(undefined, {
      onSuccess: () => {
        notify.success(`${form.name} ${form.lastName} je dodat/a.`);
        close();
      },
      onError: (err) => notify.error(err),
    });
  };

  const id = (k: string) => `${formId}-${k}`;

  return (
    <Dialog
      open={open}
      onClose={close}
      size="lg"
      title="Novi korisnik"
      description="Prijava se vrši imenom, prezimenom i lozinkom."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={close}>Otkaži</Button>
          <Button size="sm" type="submit" form={formId} loading={create.isPending}>Dodaj korisnika</Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Ime" htmlFor={id("n")}><Input id={id("n")} autoFocus value={form.name} onChange={set("name")} /></Field>
        <Field label="Prezime" htmlFor={id("l")}><Input id={id("l")} value={form.lastName} onChange={set("lastName")} /></Field>
        <Field label="Email" htmlFor={id("e")}><Input id={id("e")} type="email" value={form.email} onChange={set("email")} /></Field>
        <Field label="Uloga" htmlFor={id("r")} hint={canLogin(form.role) ? "Ima pristup aplikaciji." : "Vodi se u evidenciji, bez prijave."}>
          <Select id={id("r")} value={form.role} onChange={set("role")}>
            <optgroup label="Pristup aplikaciji">
              {ROLES.filter((r) => r.login).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </optgroup>
            <optgroup label="Ostalo osoblje">
              {ROLES.filter((r) => !r.login).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </optgroup>
          </Select>
        </Field>
        <Field label="Početna lozinka" htmlFor={id("p")} hint="Najmanje 8 znakova. Saopštite je korisniku lično." className="sm:col-span-2">
          <div className="relative">
            <Input id={id("p")} type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={set("password")} className="pr-10" />
            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Sakrij lozinku" : "Prikaži lozinku"} className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 hover:text-gray-700">
              {showPassword ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
      </form>
    </Dialog>
  );
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const isAdmin = me?.role === "admin";
  const qc = useQueryClient();
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<AppUser[]> => (await api.get("/api/auth/users")).data.users ?? [],
  });
  const remove = useMutation({ mutationFn: (id: string) => api.delete(`/api/auth/users/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }) });
  const [filter, setFilter] = useState<"app" | "staff" | "all">("app");
  const [newOpen, setNewOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AppUser | null>(null);

  const rows = useMemo(() => data.filter((u) => (filter === "all" ? true : filter === "app" ? canLogin(u.role) : !canLogin(u.role))), [data, filter]);

  const columns: Column<AppUser>[] = [
    {
      id: "name",
      header: "Korisnik",
      sortValue: (u) => `${u.lastName} ${u.name}`,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} lastName={u.lastName} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900 dark:text-white">
              {u.name} {u.lastName} {u._id === me?._id && <span className="text-xs font-normal text-gray-400">(vi)</span>}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{u.email || "—"}</p>
          </div>
        </div>
      ),
    },
    { id: "role", header: "Uloga", sortValue: (u) => roleName(u.role), cell: (u) => <Badge size="sm" color={canLogin(u.role) ? "primary" : "light"}>{roleName(u.role)}</Badge> },
    {
      id: "access",
      header: "Pristup",
      hideBelow: "md",
      cell: (u) => (canLogin(u.role) ? <Badge size="sm" color="success" dot>Aplikacija</Badge> : <span className="text-gray-400">Bez prijave</span>),
    },
    ...(isAdmin
      ? [
          {
            id: "actions",
            header: <span className="sr-only">Akcije</span>,
            align: "right" as const,
            cell: (u: AppUser) =>
              u._id !== me?._id && (
                <Button variant="ghost" size="xs" aria-label={`Obriši ${u.name} ${u.lastName}`} onClick={() => setToDelete(u)}>
                  <LuTrash2 className="h-3.5 w-3.5" />
                </Button>
              ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Korisnici"
        description="Osoblje doma i njihov pristup aplikaciji."
        actions={
          isAdmin && (
            <Button size="sm" startIcon={<LuUserPlus className="h-4 w-4" />} onClick={() => setNewOpen(true)}>
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
          { value: "app", label: "Sa pristupom", count: data.filter((u) => canLogin(u.role)).length },
          { value: "staff", label: "Ostalo osoblje", count: data.filter((u) => !canLogin(u.role)).length },
          { value: "all", label: "Svi", count: data.length },
        ]}
      />
      {isError ? (
        <ErrorState message="Korisnici nisu učitani." onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          getRowId={(u) => u._id}
          searchText={(u) => `${u.name} ${u.lastName} ${u.email ?? ""} ${roleName(u.role)}`}
          searchPlaceholder="Pretraži osoblje..."
          initialSort={{ id: "name", dir: "asc" }}
          empty={{ icon: <LuUsers />, title: "Nema korisnika" }}
        />
      )}
      {isAdmin && <NewUserDialog open={newOpen} onClose={() => setNewOpen(false)} />}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={remove.isPending}
        onConfirm={() =>
          toDelete &&
          remove.mutate(toDelete._id, { onSuccess: () => { notify.success("Korisnik je obrisan."); setToDelete(null); }, onError: (e) => notify.error(e) })
        }
        title={`Obrisati ${toDelete?.name} ${toDelete?.lastName}?`}
        description="Korisnik gubi pristup aplikaciji. Njegovi raniji unosi ostaju u istoriji."
        confirmText="Obriši"
      />
    </>
  );
}
