import { useState } from "react";
import { Link } from "react-router";
import { LuClock, LuFilePlus, LuMapPin, LuPencil, LuRepeat, LuText, LuTrash2, LuUser } from "react-icons/lu";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import { notify } from "@shared/lib/notify";
import { paths } from "@app/paths";
import { useAuth } from "@app/providers/AuthContext";
import { ButtonLink } from "@shared/ui/button/Button";
import { reportUrlForAppointment } from "@features/medical-reports/model";
import { eventColorClass, EVENT_COLORS } from "@features/calendar/colors";
import { CalendarOccurrence, describeRecurrence, describeWhen, Scope, useDeleteEvent } from "@features/calendar/model";
import ScopeDialog from "./ScopeDialog";

interface Props {
  occurrence: CalendarOccurrence | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (o: CalendarOccurrence) => void;
}

const Row = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
    <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>
    <div className="min-w-0">{children}</div>
  </div>
);

export default function EventDetails({ occurrence: o, canEdit, onClose, onEdit }: Props) {
  const remove = useDeleteEvent();
  const [askScope, setAskScope] = useState(false);
  const { user } = useAuth();
  if (!o) return null;
  // Doktor piše izveštaj direktno iz termina sa pacijentom
  const writeReport = user?.role === "doctor" && o.patient && (
    <ButtonLink to={reportUrlForAppointment(o)} size="sm" variant={canEdit ? "outline" : "primary"} startIcon={<LuFilePlus className="h-4 w-4" />} onClick={onClose}>
      Napiši izveštaj
    </ButtonLink>
  );

  const category = EVENT_COLORS.find((c) => c.value === o.calendar)?.label;
  const doDelete = (scope: Scope) =>
    remove.mutate(
      { occurrence: o, scope },
      {
        onSuccess: () => {
          notify.success(scope === "occurrence" ? "Termin je obrisan." : "Događaj je obrisan.");
          setAskScope(false);
          onClose();
        },
        onError: (err) => notify.error(err),
      }
    );

  return (
    <>
      <Dialog
        open
        onClose={onClose}
        size="sm"
        title={
          <span className="flex items-center gap-2.5">
            <span className={`h-3 w-3 shrink-0 rounded ${eventColorClass(o.calendar)}`} aria-hidden="true" />
            <span className="truncate">{o.title}</span>
          </span>
        }
        description={category}
        footer={
          canEdit ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="mr-auto text-error-600 hover:bg-error-50 dark:text-error-400"
                startIcon={<LuTrash2 className="h-4 w-4" />}
                loading={remove.isPending}
                onClick={() => (o.recurring && !o.isException ? setAskScope(true) : doDelete("series"))}
              >
                Obriši
              </Button>
              {writeReport}
              <Button size="sm" startIcon={<LuPencil className="h-4 w-4" />} onClick={() => onEdit(o)}>
                Izmeni
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={onClose}>
                Zatvori
              </Button>
              {writeReport}
            </>
          )
        }
      >
        <div className="space-y-3">
          <Row icon={<LuClock className="h-4 w-4" />}>
            <p className="first-letter:uppercase">{describeWhen(o)}</p>
          </Row>
          {o.recurring && (
            <Row icon={<LuRepeat className="h-4 w-4" />}>{describeRecurrence(o.recurrence, o.series?.start.slice(0, 10))}</Row>
          )}
          {o.isException && <Row icon={<LuRepeat className="h-4 w-4" />}>Izmenjen termin iz niza</Row>}
          {o.patient && (
            <Row icon={<LuUser className="h-4 w-4" />}>
              <Link to={paths.patient(o.patient._id)} className="font-medium text-brand-600 hover:underline dark:text-brand-400" onClick={onClose}>
                {o.patient.name} {o.patient.lastName}
              </Link>
            </Row>
          )}
          {o.location && <Row icon={<LuMapPin className="h-4 w-4" />}>{o.location}</Row>}
          {o.description && (
            <Row icon={<LuText className="h-4 w-4" />}>
              <p className="whitespace-pre-line">{o.description}</p>
            </Row>
          )}
          {o.createdBy && (
            <p className="border-t border-gray-100 pt-3 text-xs text-gray-400 dark:border-gray-800">
              Uneo/la: {o.createdBy.name} {o.createdBy.lastName}
            </p>
          )}
        </div>
      </Dialog>
      <ScopeDialog open={askScope} action="delete" loading={remove.isPending} onClose={() => setAskScope(false)} onPick={doDelete} />
    </>
  );
}
