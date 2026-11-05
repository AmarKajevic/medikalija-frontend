import { ReactNode } from "react";
import {
  LuArchive,
  LuBell,
  LuCalendarDays,
  LuClipboardList,
  LuFlaskConical,
  LuHouse,
  LuLayers,
  LuPackage,
  LuPackageOpen,
  LuPill,
  LuUserCheck,
  LuUsers,
  LuUserCog,
} from "react-icons/lu";
import { MANAGER_ROLES, paths, Role, STAFF_ROLES } from "@app/paths";

export interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  roles: Role[];
  /** Aktivno i za podputanje (npr. /patients/123) */
  matchPrefix?: boolean;
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
      { label: "Kalendar", to: paths.calendar, icon: <LuCalendarDays />, roles: MANAGER_ROLES },
      { label: "Obaveštenja", to: paths.notifications, icon: <LuBell />, roles: MANAGER_ROLES },
    ],
  },
  {
    label: "Zalihe",
    items: [
      { label: "Lekovi", to: paths.medicines, icon: <LuPill />, roles: MANAGER_ROLES, matchPrefix: true },
      { label: "Artikli", to: paths.articles, icon: <LuPackage />, roles: STAFF_ROLES, matchPrefix: true },
      { label: "Porodične zalihe", to: paths.familyStock, icon: <LuPackageOpen />, roles: STAFF_ROLES },
      { label: "Rezerva lekova", to: paths.reserve, icon: <LuArchive />, roles: MANAGER_ROLES },
    ],
  },
  {
    label: "Medicina",
    items: [
      { label: "Analize", to: paths.analyses, icon: <LuFlaskConical />, roles: MANAGER_ROLES },
      { label: "Kombinacije analiza", to: paths.combinations, icon: <LuLayers />, roles: MANAGER_ROLES },
      { label: "Šabloni dijagnoza", to: paths.diagnosisTemplates, icon: <LuClipboardList />, roles: MANAGER_ROLES },
    ],
  },
  {
    label: "Tim",
    items: [
      { label: "Aktivnosti sestara", to: paths.nurseActivity, icon: <LuUserCheck />, roles: MANAGER_ROLES },
      { label: "Korisnici", to: paths.users, icon: <LuUserCog />, roles: MANAGER_ROLES },
    ],
  },
];

export const navigationFor = (role?: string): NavGroup[] =>
  NAVIGATION.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role as Role)) })).filter(
    (g) => g.items.length > 0
  );
