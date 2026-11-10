import { useState } from "react";
import { LuChevronDown, LuClipboardList, LuPlus } from "react-icons/lu";
import { Card, CardHeader } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import Badge from "@shared/ui/badge/Badge";
import ActionMenu from "@shared/ui/menu/ActionMenu";
import EmptyState, { ErrorState } from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { formatDay } from "@shared/lib/calendarDay";
import {
  DEADLINE_LABEL,
  deadlineState,
  DOC_ORDER,
  DOC_TYPES,
  DocType,
  SocialDocument,
  SUPPORT_LEVELS,
  useSocialDeadlines,
  useSocialDocuments,
} from "@features/social/dossier";
import SocialDocumentDialog from "./SocialDocumentDialog";

// Procene i individualni plan usluge korisnika, sa sledećim rokom po Pravilniku o standardima.
export default function SocialDocumentsCard({ patientId, patientName, canWrite, active }: { patientId: string; patientName: string; canWrite: boolean; active: boolean }) {
  const { data: docs = [], isLoading, isError, refetch } = useSocialDocuments(patientId);
  const { data: deadlines = [] } = useSocialDeadlines(active);
  const next = deadlines.find((d) => d.patient._id === patientId);
  const [open, setOpen] = useState<{ type: DocType; doc: SocialDocument | null } | null>(null);
  const lastPlan = docs.find((d) => (d.type === "plan" || d.type === "plan_review") && d.status === "final");

  return (
    <Card>
      <CardHeader
        icon={<LuClipboardList />}
        title="Procene i individualni plan"
        description="Prijemna procena, procena, individualni plan usluge, pregled plana"
        actions={
          canWrite && (
            <ActionMenu
              trigger={({ toggle }) => (
                <Button size="xs" startIcon={<LuPlus className="h-3.5 w-3.5" />} endIcon={<LuChevronDown className="h-3.5 w-3.5" />} onClick={toggle}>
                  Novi dokument
                </Button>
              )}
              items={DOC_ORDER.map((type) => ({ label: DOC_TYPES[type].label, onClick: () => setOpen({ type, doc: null }) }))}
            />
          )
        }
      />
      {next && (
        <div
          className={`flex flex-wrap items-center gap-2 border-b px-5 py-2.5 text-sm sm:px-6 ${
            deadlineState(next.due).tone === "error"
              ? "border-error-100 bg-error-50 text-error-800 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-300"
              : "border-gray-100 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300"
          }`}
        >
          <span className="font-medium">Sledeće: {DEADLINE_LABEL[next.kind]}</span>
          <span>
            rok {formatDay(next.due)} ({next.basis})
          </span>
          <Badge size="sm" color={deadlineState(next.due).tone}>
            {deadlineState(next.due).label}
          </Badge>
        </div>
      )}
      {isLoading ? (
        <div className="p-5">
          <Skeleton className="h-24" />
        </div>
      ) : isError ? (
        <div className="p-5">
          <ErrorState message="Dokumenti nisu učitani." onRetry={() => refetch()} />
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          compact
          icon={<LuClipboardList />}
          title="Još nema procena ni plana"
          description="Procena se radi u roku od 10 dana od prijema, a individualni plan u roku od 10 dana od procene."
        />
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {docs.map((d) => {
            const meta = DOC_TYPES[d.type];
            const level = SUPPORT_LEVELS.find((l) => l.value === d.supportLevel);
            return (
              <li key={d._id}>
                <button type="button" onClick={() => setOpen({ type: d.type, doc: d })} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.03] sm:px-6">
                  <span className="text-sm font-medium text-gray-900 dark:text-white/90">{meta.label}</span>
                  <Badge size="sm" color={d.status === "final" ? "success" : "warning"}>
                    {d.status === "final" ? "zaključeno" : "nacrt"}
                  </Badge>
                  {level && <span className="text-xs text-gray-500 dark:text-gray-400">{level.label}</span>}
                  {d.goals.length > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">{d.goals.length === 1 ? "1 cilj" : `${d.goals.length} ciljeva`}</span>}
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    {formatDay(d.date)} · {d.author.name} {d.author.lastName}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {open && (
        <SocialDocumentDialog
          open
          onClose={() => setOpen(null)}
          patientId={patientId}
          patientName={patientName}
          type={open.type}
          document={open.doc}
          canWrite={canWrite}
          previousGoals={open.type === "plan_review" && !open.doc ? lastPlan?.goals : undefined}
        />
      )}
    </Card>
  );
}
