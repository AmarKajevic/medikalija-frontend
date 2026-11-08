import { ReactNode } from "react";
import {
  LuArchive,
  LuBell,
  LuCalendarDays,
  LuClipboardCheck,
  LuHandHeart,
  LuHeartHandshake,
  LuListChecks,
  LuNotebookPen,
  LuClipboardList,
  LuFlaskConical,
  LuHouse,
  LuLayers,
  LuPackage,
  LuPackageOpen,
  LuPill,
  LuSettings,
  LuStethoscope,
  LuUserCheck,
  LuUsers,
  LuUserCog,
} from "react-icons/lu";
import { CARE_ROLES, MANAGER_ROLES, paths, Role, SOCIAL_READ_ROLES, STAFF_ROLES } from "@app/paths";

export interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  roles: Role[];
  /** Aktivno i za podputanje (npr. /patients/123) */
  matchPrefix?: boolean;
  /** Brojač pored stavke (npr. unosi koji čekaju odobrenje) */
  badge?: "approvals";
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const NAVIGATION: NavGroup[] = [
  {
    items: [
      { label: "Početna", to: paths.home, icon: <LuHouse />, roles: STAFF_ROLES },
      { label: "Pacijenti", to: paths.patients, icon: <LuUsers />, roles: STAFF_ROLES, matchPrefix: true },
      { label: "Unos nege", to: paths.care, icon: <LuHeartHandshake />, roles: CARE_ROLES },
      { label: "Za odobrenje", to: paths.approvals, icon: <LuClipboardCheck />, roles: MANAGER_ROLES, badge: "approvals" },
      { label: "Kalendar", to: paths.calendar, icon: <LuCalendarDays />, roles: STAFF_ROLES },
      { label: "Obaveštenja", to: paths.notifications, icon: <LuBell />, roles: MANAGER_ROLES },
    ],
  },
  {
    label: "Ambulanta",
    items: [{ label: "Lekarski izveštaji", to: paths.reports, icon: <LuStethoscope />, roles: ["admin", "main-nurse", "doctor"], matchPrefix: true }],
  },
  {
    label: "Socijalni rad",
    items: [{ label: "Socijalni karton", to: paths.social, icon: <LuHandHeart />, roles: SOCIAL_READ_ROLES }],
  },
  {
    label: "Zalihe",
    items: [
      { label: "Lekovi", to: paths.medicines, icon: <LuPill />, roles: MANAGER_ROLES, matchPrefix: true },
      { label: "Artikli", to: paths.articles, icon: <LuPackage />, roles: CARE_ROLES, matchPrefix: true },
      { label: "Porodične zalihe", to: paths.familyStock, icon: <LuPackageOpen />, roles: CARE_ROLES },
      { label: "Rezerva lekova", to: paths.reserve, icon: <LuArchive />, roles: MANAGER_ROLES },
    ],
  },
  {
    label: "Medicina",
    items: [
      { label: "Analize", to: paths.analyses, icon: <LuFlaskConical />, roles: MANAGER_ROLES },
      { label: "Kombinacije analiza", to: paths.combinations, icon: <LuLayers />, roles: MANAGER_ROLES },
      { label: "Šabloni dijagnoza", to: paths.diagnosisTemplates, icon: <LuClipboardList />, roles: MANAGER_ROLES },
      { label: "Usluge nege", to: paths.careTasks, icon: <LuListChecks />, roles: MANAGER_ROLES },
    ],
  },
  {
    label: "Tim",
    items: [
      { label: "Dnevnik nege", to: paths.careLog, icon: <LuNotebookPen />, roles: MANAGER_ROLES },
      { label: "Aktivnosti sestara", to: paths.nurseActivity, icon: <LuUserCheck />, roles: MANAGER_ROLES },
      { label: "Osoblje", to: paths.users, icon: <LuUserCog />, roles: MANAGER_ROLES },
      { label: "Podešavanja", to: paths.settings, icon: <LuSettings />, roles: ["admin"] },
    ],
  },
];

export const navigationFor = (role?: string): NavGroup[] =>
  NAVIGATION.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role as Role)) })).filter(
    (g) => g.items.length > 0
  );
