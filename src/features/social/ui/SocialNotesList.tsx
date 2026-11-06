import { useState } from "react";
import { Link } from "react-router";
import { LuBellRing, LuCheck, LuEllipsis, LuPencil, LuPhone, LuRotateCcw, LuTrash2 } from "react-icons/lu";
import Badge from "@shared/ui/badge/Badge";
import ActionMenu from "@shared/ui/menu/ActionMenu";
import { ConfirmDialog } from "@shared/ui/dialog/Dialog";
import EmptyState from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { notify } from "@shared/lib/notify";
import { useAuth } from "@app/providers/AuthContext";
import { hasRole, isManager, paths, SOCIAL_WRITE_ROLES } from "@app/paths";
import { categoryMeta, followUpState, SocialNote, useDeleteNote, useFollowUpDone } from "@features/social/model";
import SocialNoteDialog from "./SocialNoteDialog";

const day = (iso: string) => new Date(iso).toLocaleDateString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric" });

interface Props {
  notes: SocialNote[];
  loading?: boolean;
  /** Prikaži ime pacijenta (lista za sve pacijente) */
  showPatient?: boolean;
  emptyText?: string;
}

// Hronologija beleški socijalnog kartona, sa podsetnicima.
export default function SocialNotesList({ notes, loading, showPatient, emptyText = "Još nema beleški." }: Props) {
  const { user } = useAuth();
  const done = useFollowUpDone();
  const remove = useDeleteNote();
  const [editing, setEditing] = useState<SocialNote | null>(null);
  const [deleting, setDeleting] = useState<SocialNote | null>(null);
  const canEdit = (n: SocialNote) => hasRole(user?.role, SOCIAL_WRITE_ROLES) && (isManager(user?.role) || String(n.author._id) === String(user?._id));

  if (loading) {
    return (
      <div className="space-y-2 p-5">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }
  if (notes.length === 0) return <EmptyState compact title={emptyText} />;

  return (
    <>
      <ol className="divide-y divide-gray-100 dark:divide-gray-800">
        {notes.map((n) => {
          const meta = categoryMeta(n.category);
          const follow = n.followUp.date && !n.followUp.done ? followUpState(n.followUp.date) : null;
          return (
            <li key={n._id} className="flex gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge size="sm" color={meta.color}>
                    {meta.label}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {day(n.date)} · {n.author.name} {n.author.lastName}
                  </span>
                  {showPatient && (
                    <Link to={paths.patient(n.patient._id)} className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                      {n.patient.name} {n.patient.lastName}
                    </Link>
                  )}
                </div>
                {n.title && <p className="mt-1.5 text-sm font-semibold text-gray-900 dark:text-white">{n.title}</p>}
                <p className="mt-1 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">{n.text}</p>
                {n.contact && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                    <LuPhone className="h-3.5 w-3.5" /> {n.contact}
                  </p>
                )}
                {n.followUp.date && (
                  <p className={`mt-2 flex flex-wrap items-center gap-2 text-xs ${n.followUp.done ? "text-gray-400 line-through" : follow?.tone === "error" ? "text-error-600" : follow?.tone === "warning" ? "text-warning-600" : "text-gray-600 dark:text-gray-300"}`}>
                    <LuBellRing className="h-3.5 w-3.5" />
                    Podsetnik {day(n.followUp.date)}
                    {follow && <span className="no-underline">({follow.label})</span>}
                    {canEdit(n) && (
                      <button
                        type="button"
                        onClick={() =>
                          done.mutate({ id: n._id, done: !n.followUp.done }, { onSuccess: () => notify.success(n.followUp.done ? "Podsetnik je ponovo otvoren." : "Označeno kao urađeno."), onError: (e) => notify.error(e) })
                        }
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-0.5 font-medium text-gray-700 no-underline hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                      >
                        {n.followUp.done ? <LuRotateCcw className="h-3 w-3" /> : <LuCheck className="h-3 w-3" />}
                        {n.followUp.done ? "Vrati" : "Urađeno"}
                      </button>
                    )}
                  </p>
                )}
              </div>
              {canEdit(n) && (
                <ActionMenu
                  trigger={({ toggle }) => (
                    <button type="button" onClick={toggle} aria-label="Akcije za belešku" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5">
                      <LuEllipsis className="h-4 w-4" />
                    </button>
                  )}
                  items={[
                    { label: "Izmeni", icon: <LuPencil />, onClick: () => setEditing(n) },
                    { label: "Obriši", icon: <LuTrash2 />, danger: true, separated: true, onClick: () => setDeleting(n) },
                  ]}
                />
              )}
            </li>
          );
        })}
      </ol>
      <SocialNoteDialog open={!!editing} note={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Obrisati belešku?"
        description="Beleška će biti trajno uklonjena iz socijalnog kartona."
        confirmText="Obriši"
        loading={remove.isPending}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting._id, {
            onSuccess: () => {
              notify.success("Beleška je obrisana.");
              setDeleting(null);
            },
            onError: (e) => notify.error(e),
          })
        }
      />
    </>
  );
}
