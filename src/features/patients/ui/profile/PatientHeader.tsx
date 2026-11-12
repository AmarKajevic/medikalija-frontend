import { ReactNode } from "react";
import { LuCalendarDays, LuChevronDown, LuClipboardList, LuHistory, LuHouse, LuLogOut, LuPackageOpen, LuPhone, LuPlus, LuUserPen } from "react-icons/lu";
import Badge from "@shared/ui/badge/Badge";
import Button from "@shared/ui/button/Button";
import Avatar from "@shared/ui/avatar/Avatar";
import ActionMenu, { ActionMenuItem } from "@shared/ui/menu/ActionMenu";
import { formatDay, toCalendarDay } from "@shared/lib/calendarDay";
import { paths } from "@app/paths";
import { Patient } from "@entities/patient/hooks/usePatient";

const ageOf = (dateOfBirth: string | Date) => {
  const birth = toCalendarDay(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - birth.getUTCFullYear();
  if (now.getMonth() < birth.getUTCMonth() || (now.getMonth() === birth.getUTCMonth() && now.getDate() < birth.getUTCDate())) age -= 1;
  return age;
};

const Meta = ({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) => (
  <div className="flex min-w-0 items-center gap-2 text-sm">
    <span className="text-gray-400">{icon}</span>
    <span className="text-gray-500 dark:text-gray-400">{label}</span>
    <span className="truncate font-medium text-gray-800 dark:text-gray-200">{children}</span>
  </div>
);

interface Props {
  patient: Patient;
  /** Uprava: specifikacija, otpust, istorija */
  canManage: boolean;
  /** Raspored perioda (20 godina): uprava i socijalni radnik */
  canViewSchedule?: boolean;
  onOpenSpecification: () => void;
  /** Porodično stanje (nega); bez njega se stavka ne prikazuje */
  onOpenFamilyStock?: () => void;
  onDischarge: () => void;
  /** Uprava i socijalni radnik: ispravka podataka pacijenta */
  onEdit?: () => void;
  /** Glavne akcije za ulogu (npr. "Nov izveštaj" za doktora) */
  actions?: ReactNode;
}

export default function PatientHeader({ patient, canManage, canViewSchedule = canManage, onOpenSpecification, onOpenFamilyStock, onDischarge, onEdit, actions }: Props) {
  const discharged = !!patient.dischargeDate;

  const menu: ActionMenuItem[] = [
    ...(onOpenFamilyStock ? [{ label: "Porodično stanje", icon: <LuPackageOpen />, onClick: onOpenFamilyStock }] : []),
    ...(onEdit ? [{ label: "Izmeni podatke", icon: <LuUserPen />, onClick: onEdit }] : []),
    ...(canManage ? [{ label: "Istorija specifikacija", icon: <LuHistory />, to: paths.patientSpecifications(patient._id) }] : []),
    ...(canViewSchedule ? [{ label: "Raspored perioda (20 godina)", icon: <LuClipboardList />, to: paths.patientSchedule(patient._id) }] : []),
    ...(canManage && !discharged ? [{ label: "Otpusti pacijenta", icon: <LuLogOut />, onClick: onDischarge, danger: true, separated: true }] : []),
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar name={patient.name} lastName={patient.lastName} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {patient.name} {patient.lastName}
              </h1>
              {discharged ? (
                <Badge size="sm" color="light">Otpušten {formatDay(patient.dischargeDate)}</Badge>
              ) : (
                <Badge size="sm" color="success" dot>Na smeštaju</Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {patient.dateOfBirth ? `${formatDay(patient.dateOfBirth)} · ${ageOf(patient.dateOfBirth)} god.` : "Datum rođenja nije unet"}
            </p>
            <div className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              <Meta icon={<LuCalendarDays />} label="Prijem">{formatDay(patient.admissionDate)}</Meta>
              <Meta icon={<LuHouse />} label="Adresa">{patient.address || "—"}</Meta>
              {patient.contactPerson && <Meta icon={<LuPhone />} label="Kontakt">{patient.contactPerson}</Meta>}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {menu.length > 0 && (
            <ActionMenu
              trigger={({ toggle }) => (
                <Button variant="outline" size="sm" onClick={toggle} endIcon={<LuChevronDown className="h-4 w-4" />}>
                  Više
                </Button>
              )}
              items={menu}
            />
          )}
          {actions}
          {canManage && !discharged && (
            <Button size="sm" onClick={onOpenSpecification} startIcon={<LuPlus className="h-4 w-4" />}>
              Napravi specifikaciju
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
