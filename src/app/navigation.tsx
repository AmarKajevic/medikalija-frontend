import { ReactNode } from "react";
import { LuActivity, LuArchive, LuBriefcaseMedical, LuBedDouble, LuBell, LuCalendarDays, LuClipboardCheck, LuClipboardList, LuFlaskConical, LuHandHeart, LuHeartHandshake, LuHouse, LuLayers, LuListChecks, LuNotebookPen, LuPackage, LuPackageOpen, LuPill, LuSettings, LuStethoscope, LuUserCheck, LuUserCog, LuUsers } from "react-icons/lu";
import { CARE_ROLES, MANAGER_ROLES, paths, Role, SOCIAL_READ_ROLES, STAFF_ROLES, PHYSIO_ROLES } from "@app/paths";

export interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  roles: Role[];
  /** Aktivno i za podputanje (npr. /patients/123) */
  matchPrefix?: boolean;
  /** Brojač pored stavke (npr. unosi koji čekaju odobrenje) */
  badge?: "approvals";
  /** Boja ikonice (lakša orijentacija u meniju) */
  tone: string;
}

// Crveno-plava (kao kapsula leka): lekovi, pacijenti i porodične zalihe
const RED_BLUE = "nav-icon-red-blue";

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const NAVIGATION: NavGroup[] = [
  {
    items: [
      { label: "Početna", to: paths.home, icon: <LuHouse />, roles: STAFF_ROLES, tone: "text-brand-600 dark:text-brand-400" },
      { label: "Korisnici", to: paths.patients, icon: <LuUsers />, roles: STAFF_ROLES, matchPrefix: true, tone: RED_BLUE },
      { label: "Unos nege", to: paths.care, icon: <LuHeartHandshake />, roles: CARE_ROLES, tone: "text-pink-500 dark:text-pink-400" },
      { label: "Fizikalna terapija", to: paths.physio, icon: <LuActivity />, roles: PHYSIO_ROLES, tone: "text-teal-500 dark:text-teal-400" },
      { label: "Za odobrenje", to: paths.approvals, icon: <LuClipboardCheck />, roles: MANAGER_ROLES, badge: "approvals", tone: "text-warning-500 dark:text-warning-400" },
      { label: "Aktivnosti", to: paths.activity, icon: <LuUserCheck />, roles: MANAGER_ROLES, tone: "text-violet-500 dark:text-violet-400" },
      { label: "Kalendar", to: paths.calendar, icon: <LuCalendarDays />, roles: STAFF_ROLES, tone: "text-blue-light-600 dark:text-blue-light-400" },
      { label: "Obaveštenja", to: paths.notifications, icon: <LuBell />, roles: MANAGER_ROLES, tone: "text-orange-500 dark:text-orange-300" },
    ],
  },
  {
    label: "Ambulanta",
    items: [{ label: "Lekarski izveštaji", to: paths.reports, icon: <LuStethoscope />, roles: ["admin", "main-nurse", "doctor"], matchPrefix: true, tone: "text-rose-500 dark:text-rose-400" }],
  },
  {
    label: "Socijalni rad",
    items: [{ label: "Socijalni karton", to: paths.social, icon: <LuHandHeart />, roles: SOCIAL_READ_ROLES, tone: "text-indigo-500 dark:text-indigo-400" }],
  },
  {
    label: "Zalihe",
    items: [
      { label: "Lekovi", to: paths.medicines, icon: <LuPill />, roles: MANAGER_ROLES, matchPrefix: true, tone: RED_BLUE },
      { label: "Artikli", to: paths.articles, icon: <LuPackage />, roles: CARE_ROLES, matchPrefix: true, tone: "text-orange-500 dark:text-orange-300" },
      { label: "Porodične zalihe", to: paths.familyStock, icon: <LuPackageOpen />, roles: CARE_ROLES, tone: RED_BLUE },
      { label: "Rezerva lekova", to: paths.reserve, icon: <LuArchive />, roles: MANAGER_ROLES, tone: "text-amber-600 dark:text-amber-400" },
    ],
  },
  {
    label: "Medicina",
    items: [
      { label: "Analize", to: paths.analyses, icon: <LuFlaskConical />, roles: MANAGER_ROLES, tone: "text-violet-500 dark:text-violet-400" },
      { label: "Kombinacije analiza", to: paths.combinations, icon: <LuLayers />, roles: MANAGER_ROLES, tone: "text-fuchsia-500 dark:text-fuchsia-400" },
      { label: "Šabloni dijagnoza", to: paths.diagnosisTemplates, icon: <LuClipboardList />, roles: MANAGER_ROLES, tone: "text-cyan-600 dark:text-cyan-400" },
      { label: "Usluge nege", to: paths.careTasks, icon: <LuListChecks />, roles: MANAGER_ROLES, tone: "text-pink-500 dark:text-pink-400" },
    ],
  },
  {
    label: "Tim",
    items: [
      { label: "Dnevnik nege", to: paths.careLog, icon: <LuNotebookPen />, roles: MANAGER_ROLES, tone: "text-teal-600 dark:text-teal-400" },
      { label: "Osoblje", to: paths.users, icon: <LuUserCog />, roles: MANAGER_ROLES, tone: "text-indigo-500 dark:text-indigo-400" },
      { label: "Cene smeštaja", to: paths.lodgingPrices, icon: <LuBedDouble />, roles: ["admin"], tone: "text-blue-light-600 dark:text-blue-light-400" },
      { label: "Cene fizioterapije", to: paths.physioPrices, icon: <LuActivity />, roles: ["admin"], tone: "text-teal-500 dark:text-teal-400" },
      { label: "Stručne usluge", to: paths.professionalServices, icon: <LuBriefcaseMedical />, roles: ["admin"], tone: "text-sky-600 dark:text-sky-400" },
      { label: "Podešavanja", to: paths.settings, icon: <LuSettings />, roles: ["admin"], tone: "text-gray-500 dark:text-gray-400" },
    ],
  },
];

export const navigationFor = (role?: string): NavGroup[] =>
  NAVIGATION.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role as Role)) })).filter(
    (g) => g.items.length > 0
  );
