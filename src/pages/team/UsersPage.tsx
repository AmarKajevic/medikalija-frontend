import { useMemo, useState } from "react";
import { LuEllipsis, LuKeyRound, LuLink, LuPencil, LuShieldCheck, LuShieldOff, LuTrash2, LuUserPlus, LuUsers, LuUserX } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import PageHeader from "@shared/ui/page/PageHeader";
import DataTable, { Column } from "@shared/ui/data-table/DataTable";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import Avatar from "@shared/ui/avatar/Avatar";
import Tabs from "@shared/ui/tabs/Tabs";
import ActionMenu, { ActionMenuItem } from "@shared/ui/menu/ActionMenu";
import { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import { canLogin, IssuedLink, lastSeen, ManagedUser, roleName, useDeleteUser, useUpdateUser, useUserLink, useUsers } from "@features/users/model";
import { EditUserDialog, InviteDialog, LinkDialog, RoleDialog, StaffDialog } from "@features/users/ui/UserDialogs";

type Filter = "active" | "invited" | "suspended" | "staff";

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-label="Google">
    <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.2-4.7 3.2-8Z" />
    <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7H2.1a11 11 0 0 0 0 9.9l3.7-2.8Z" />
    <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4Z" />
  </svg>
);

type Confirm = { kind: "suspend" | "delete"; user: ManagedUser } | null;

// Korisnici: pristup samo po pozivu. Admin poziva, menja ulogu, suspenduje.
export default function UsersPage() {
  const { user: me } = useAuth();
  const isAdmin = me?.role === "admin";
  const { data = [], isLoading, isError, refetch } = useUsers();
  const link = useUserLink();
  const update = useUpdateUser();
  const remove = useDeleteUser();
  const [filter, setFilter] = useState<Filter>("active");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [issued, setIssued] = useState<{ link: IssuedLink; title: string; person: string; email?: string | null } | null>(null);
  const [roleFor, setRoleFor] = useState<ManagedUser | null>(null);
  const [editFor, setEditFor] = useState<ManagedUser | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const groupOf = (u: ManagedUser): Filter => (!canLogin(u.role) || u.loginAllowed === false ? "staff" : u.status);
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { active: 0, invited: 0, suspended: 0, staff: 0 };
    for (const u of data) c[groupOf(u)] += 1;
    return c;
  }, [data]);
  const rows = useMemo(() => data.filter((u) => groupOf(u) === filter), [data, filter]);

  const issueLink = (u: ManagedUser, kind: "invite" | "reset") =>
    link.mutate(
      { id: u._id, kind },
      {
        onSuccess: (l) => setIssued({ link: l, title: kind === "invite" ? "Nova pozivnica" : "Link za novu lozinku", person: `${u.name} ${u.lastName}`, email: u.email }),
        onError: (err) => notify.error(err),
      }
    );

  const setStatus = (u: ManagedUser, status: "active" | "suspended") =>
    update.mutate(
      { id: u._id, status },
      {
        onSuccess: () => {
          notify.success(status === "suspended" ? `${u.name} ${u.lastName} više nema pristup.` : `${u.name} ${u.lastName} ponovo ima pristup.`);
          setConfirm(null);
        },
        onError: (err) => notify.error(err),
      }
    );

  const actionsFor = (u: ManagedUser): ActionMenuItem[] => {
    const group = groupOf(u);
    if (group === "staff") return [{ label: "Obriši iz evidencije", icon: <LuTrash2 />, danger: true, onClick: () => setConfirm({ kind: "delete", user: u }) }];
    const edit = { label: "Izmeni podatke", icon: <LuPencil />, onClick: () => setEditFor(u) };
    if (group === "invited")
      return [
        { label: "Kopiraj novi link pozivnice", icon: <LuLink />, onClick: () => issueLink(u, "invite") },
        edit,
        { label: "Povuci pozivnicu", icon: <LuUserX />, danger: true, separated: true, onClick: () => setConfirm({ kind: "delete", user: u }) },
      ];
    if (group === "suspended")
      return [
        { label: "Vrati pristup", icon: <LuShieldCheck />, onClick: () => setStatus(u, "active") },
        { label: "Promeni ulogu", icon: <LuUsers />, onClick: () => setRoleFor(u) },
        edit,
      ];
    return [
      { label: "Link za novu lozinku", icon: <LuKeyRound />, onClick: () => issueLink(u, "reset") },
      { label: "Promeni ulogu", icon: <LuUsers />, onClick: () => setRoleFor(u) },
      edit,
      { label: "Ukini pristup", icon: <LuShieldOff />, danger: true, separated: true, onClick: () => setConfirm({ kind: "suspend", user: u }) },
    ];
  };

  const columns: Column<ManagedUser>[] = [
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
            <p className="truncate text-xs text-gray-500 dark:text-gray-400" data-no-translit>
              {[u.email, u.username].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        </div>
      ),
    },
    { id: "role", header: "Uloga", sortValue: (u) => roleName(u.role), cell: (u) => <Badge size="sm" color={canLogin(u.role) ? "primary" : "light"}>{roleName(u.role)}</Badge> },
    {
      id: "status",
      header: filter === "invited" ? "Pozivnica" : "Poslednja prijava",
      hideBelow: "md",
      sortValue: (u) => (filter === "invited" ? u.invitedAt ?? "" : u.lastLoginAt ?? ""),
      cell: (u) =>
        filter === "staff" ? (
          <span className="text-gray-400">bez prijave</span>
        ) : filter === "invited" ? (
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {u.pendingLink && new Date(u.pendingLink.expiresAt) > new Date() ? (
              <>važi do {new Date(u.pendingLink.expiresAt).toLocaleDateString("sr-Latn-RS")}</>
            ) : (
              <span className="text-warning-600">istekla — pošaljite novu</span>
            )}
            {u.invitedBy && <span className="block text-xs text-gray-400">pozvao/la {u.invitedBy.name} {u.invitedBy.lastName}</span>}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
            {u.lastLoginMethod === "google" && <GoogleMark />}
            {lastSeen(u.lastLoginAt)}
          </span>
        ),
    },
    ...(isAdmin
      ? [
          {
            id: "actions",
            header: <span className="sr-only">Akcije</span>,
            align: "right" as const,
            cell: (u: ManagedUser) =>
              u._id !== me?._id && (
                <ActionMenu
                  trigger={({ toggle }) => (
                    <button type="button" onClick={toggle} aria-label={`Akcije za ${u.name} ${u.lastName}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5">
                      <LuEllipsis className="h-4 w-4" />
                    </button>
                  )}
                  items={actionsFor(u)}
                />
              ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Korisnici"
        description="Pristup samo po pozivu: osoba dobija link, sama postavlja lozinku ili se prijavljuje Google-om."
        actions={
          isAdmin && (
            <>
              <Button size="sm" variant="outline" onClick={() => setStaffOpen(true)}>
                Osoblje bez pristupa
              </Button>
              <Button size="sm" startIcon={<LuUserPlus className="h-4 w-4" />} onClick={() => setInviteOpen(true)}>
                Pozovi korisnika
              </Button>
            </>
          )
        }
      />
      <Tabs
        className="mb-4"
        value={filter}
        onChange={setFilter}
        items={[
          { value: "active", label: "Aktivni", count: counts.active },
          { value: "invited", label: "Pozivnice", count: counts.invited },
          { value: "suspended", label: "Bez pristupa", count: counts.suspended },
          { value: "staff", label: "Ostalo osoblje", count: counts.staff },
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
          searchText={(u) => `${u.name} ${u.lastName} ${u.email ?? ""} ${u.username ?? ""} ${roleName(u.role)}`}
          searchPlaceholder="Pretraži osoblje..."
          initialSort={{ id: "name", dir: "asc" }}
          empty={{
            icon: <LuUsers />,
            title: filter === "invited" ? "Nema otvorenih pozivnica" : filter === "suspended" ? "Nema korisnika bez pristupa" : "Nema korisnika",
            action:
              isAdmin && filter !== "suspended" ? (
                <Button size="sm" startIcon={<LuUserPlus className="h-4 w-4" />} onClick={() => (filter === "staff" ? setStaffOpen(true) : setInviteOpen(true))}>
                  {filter === "staff" ? "Dodaj osoblje" : "Pozovi korisnika"}
                </Button>
              ) : undefined,
          }}
        />
      )}

      {isAdmin && (
        <>
          <InviteDialog
            open={inviteOpen}
            onClose={() => setInviteOpen(false)}
            onInvited={(u, l) => {
              setInviteOpen(false);
              setFilter("invited");
              setIssued({ link: l, title: "Pozivnica je spremna", person: `${u.name} ${u.lastName}`, email: u.email });
            }}
          />
          <StaffDialog open={staffOpen} onClose={() => setStaffOpen(false)} />
          <RoleDialog user={roleFor} onClose={() => setRoleFor(null)} />
          <EditUserDialog user={editFor} onClose={() => setEditFor(null)} />
          <LinkDialog link={issued?.link ?? null} title={issued?.title ?? ""} person={issued?.person ?? ""} email={issued?.email} onClose={() => setIssued(null)} />
        </>
      )}

      <ConfirmDialog
        open={confirm?.kind === "suspend"}
        onClose={() => setConfirm(null)}
        loading={update.isPending}
        onConfirm={() => confirm && setStatus(confirm.user, "suspended")}
        title={`Ukinuti pristup: ${confirm?.user.name} ${confirm?.user.lastName}?`}
        description="Odjavljuje se odmah sa svih uređaja i više ne može da se prijavi. Unosi ostaju u istoriji; pristup možete vratiti kad god."
        confirmText="Ukini pristup"
      />
      <ConfirmDialog
        open={confirm?.kind === "delete"}
        onClose={() => setConfirm(null)}
        loading={remove.isPending}
        onConfirm={() =>
          confirm &&
          remove.mutate(confirm.user._id, {
            onSuccess: (res) => {
              notify.success(res.message);
              setConfirm(null);
            },
            onError: (e) => notify.error(e),
          })
        }
        title={confirm?.user.status === "invited" ? "Povući pozivnicu?" : `Obrisati ${confirm?.user.name} ${confirm?.user.lastName}?`}
        description={confirm?.user.status === "invited" ? "Link prestaje da važi, a zapis se briše." : "Zapis se uklanja iz evidencije osoblja."}
        confirmText={confirm?.user.status === "invited" ? "Povuci" : "Obriši"}
      />
    </>
  );
}
