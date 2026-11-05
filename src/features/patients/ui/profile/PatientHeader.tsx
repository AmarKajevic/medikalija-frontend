import { ReactNode } from "react";
import {
  LuCalendarDays,
  LuChevronDown,
  LuClipboardList,
  LuHistory,
  LuHouse,
  LuLogOut,
  LuPackageOpen,
  LuPhone,
  LuPlus,
  LuUserCheck,
} from "react-icons/lu";
import Badge from "@shared/ui/badge/Badge";
import Button from "@shared/ui/button/Button";
import ActionMenu from "@shared/ui/menu/ActionMenu";
import { formatDay, toCalendarDay } from "@shared/lib/calendarDay";
import { initials } from "@shared/lib/format";
import { Patient } from "@entities/patient/hooks/usePatient";

const ageOf = (dateOfBirth: string | Date) => {
  const birth = toCalendarDay(dateOfBirth);
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
};

const Meta = ({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) => (
  <div className="flex min-w-0 items-center gap-2 text-sm">
    <span className="text-gray-400">{icon}</span>
    <span className="text-gray-500 dark:text-gray-400">{label}</span>
    <span className="truncate font-medium text-gray-800 dark:text-white/90">{children}</span>
  </div>
);

interface Props {
  patient: Patient;
  onOpenSpecification: () => void;
  onOpenFamilyStock: () => void;
  onDischarge: () => void;
}

export default function PatientHeader({ patient, onOpenSpecification, onOpenFamilyStock, onDischarge }: Props) {
  const discharged = !!patient.dischargeDate;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-50 text-lg font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            {initials(patient.name, patient.lastName)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-white/90">
                {patient.name} {patient.lastName}
              </h1>
              {discharged ? (
                <Badge size="sm" color="light">Otpušten {formatDay(patient.dischargeDate)}</Badge>
              ) : (
                <Badge size="sm" color="success">Na smeštaju</Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {formatDay(patient.dateOfBirth)} · {ageOf(patient.dateOfBirth)} god.
            </p>
            <div className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              <Meta icon={<LuCalendarDays />} label="Prijem">{formatDay(patient.admissionDate)}</Meta>
              <Meta icon={<LuHouse />} label="Adresa">{patient.address || "—"}</Meta>
              {patient.contactPerson && (
                <Meta icon={<LuPhone />} label="Kontakt">{patient.contactPerson}</Meta>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <ActionMenu
            trigger={({ toggle }) => (
              <Button variant="outline" size="sm" onClick={toggle} endIcon={<LuChevronDown className="h-4 w-4" />}>
                Više
              </Button>
            )}
            items={[
              { label: "Istorija specifikacija", icon: <LuHistory />, to: `/patient/${patient._id}/specification-history` },
              { label: "Raspored perioda (10 godina)", icon: <LuClipboardList />, to: `/patient/${patient._id}/future-specifications` },
              { label: "Šta su sestre dodale", icon: <LuUserCheck />, to: `/patient-profile-nurse/${patient._id}` },
              { label: "Porodično stanje (lekovi i artikli)", icon: <LuPackageOpen />, onClick: onOpenFamilyStock },
              ...(discharged
                ? []
                : [{ label: "Otpusti pacijenta", icon: <LuLogOut />, onClick: onDischarge, danger: true, separated: true }]),
            ]}
          />
          {!discharged && (
            <Button size="sm" onClick={onOpenSpecification} startIcon={<LuPlus className="h-4 w-4" />}>
              Napravi specifikaciju
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
