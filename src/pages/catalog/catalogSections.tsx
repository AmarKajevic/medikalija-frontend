import { lazy, type ComponentType, type LazyExoticComponent, type ReactNode } from "react";
import { LuActivity, LuBedDouble, LuBriefcaseMedical, LuCalendarDays, LuClipboardList, LuHeartHandshake, LuReceipt } from "react-icons/lu";
import { MANAGER_ROLES, type Role } from "@app/paths";

// Sekcije stranice "Šabloni i cene": jedan registar za meni sekcija, rute i preusmerenja starih adresa.
// Nova sekcija = jedan red ovde (i njena komponenta u ./sections).
export type CatalogSectionId = "staff" | "care" | "physio" | "events" | "lodging" | "services" | "extra";

export interface CatalogSection {
  id: CatalogSectionId;
  group: "Šabloni" | "Cenovnici";
  label: string;
  /** Kratko objašnjenje ispod naziva u meniju sekcija */
  hint: string;
  icon: ReactNode;
  tone: string;
  roles: readonly Role[];
  component: LazyExoticComponent<ComponentType>;
}

const ADMIN: readonly Role[] = ["admin"];

export const CATALOG_SECTIONS: CatalogSection[] = [
  {
    id: "staff",
    group: "Šabloni",
    label: "Nega",
    hint: "Tekstovi za učinak rada",
    icon: <LuClipboardList />,
    tone: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400",
    roles: MANAGER_ROLES,
    component: lazy(() => import("./sections/StaffTemplatesSection")),
  },
  {
    id: "care",
    group: "Šabloni",
    label: "Medicinsko osoblje",
    hint: "Usluge koje osoblje beleži",
    icon: <LuHeartHandshake />,
    tone: "bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300",
    roles: MANAGER_ROLES,
    component: lazy(() => import("./sections/CareTasksSection")),
  },
  {
    id: "physio",
    group: "Šabloni",
    label: "Fizikalna terapija",
    hint: "Vrste terapije i cene",
    icon: <LuActivity />,
    tone: "bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300",
    roles: ADMIN,
    component: lazy(() => import("./sections/PhysioSection")),
  },
  {
    id: "events",
    group: "Šabloni",
    label: "Kalendar",
    hint: "Nazivi događaja",
    icon: <LuCalendarDays />,
    tone: "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400",
    roles: ADMIN,
    component: lazy(() => import("./sections/EventTitlesSection")),
  },
  {
    id: "lodging",
    group: "Cenovnici",
    label: "Smeštaj",
    hint: "Cene i napomene",
    icon: <LuBedDouble />,
    tone: "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400",
    roles: ADMIN,
    component: lazy(() => import("./sections/LodgingPricesSection")),
  },
  {
    id: "services",
    group: "Cenovnici",
    label: "Stručne usluge",
    hint: "Specijalisti, psiholog…",
    icon: <LuBriefcaseMedical />,
    tone: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
    roles: ADMIN,
    component: lazy(() => import("./sections/ProfessionalServicesSection")),
  },
  {
    id: "extra",
    group: "Cenovnici",
    label: "Drugi troškovi",
    hint: "Frizer, prevoz, pedikir…",
    icon: <LuReceipt />,
    tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    roles: ADMIN,
    component: lazy(() => import("./sections/ExtraCostsSection")),
  },
];

export const catalogSectionsFor = (role?: string) => CATALOG_SECTIONS.filter((s) => s.roles.includes(role as Role));
