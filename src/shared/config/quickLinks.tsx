import { ReactNode } from "react";
import {
  FaUserPlus,
  FaUsers,
  FaUserShield,
  FaPrescriptionBottleAlt,
  FaUserNurse,
  FaDiaspora,
  FaYCombinator,
  FaDochub,
  FaMedkit,
  FaBookMedical,
  FaFileMedical,
  FaPills,
} from "react-icons/fa";

export interface QuickLink {
  to: string;
  label: string;
  icon: ReactNode;
}

export const ADMIN_QUICK_LINKS: QuickLink[] = [
  { to: "/patient-page", label: "Dodaj pacijenta", icon: <FaUserPlus /> },
  { to: "/patient-list", label: "Lista pacijenata", icon: <FaUsers /> },
  { to: "/signup", label: "Registruj sestru", icon: <FaUserShield /> },
  { to: "/medicine-new", label: "Lista lekova ", icon: <FaPrescriptionBottleAlt /> },
  { to: "/analyses-list", label: "lista Analiza ", icon: <FaDochub /> },
  { to: "/combinations", label: "kombinacije analiza ", icon: <FaYCombinator /> },
  { to: "/articlesNew", label: " Artikl lista ", icon: <FaDiaspora /> },
  { to: "/nurse-actions", label: "Kontrola sestara ", icon: <FaUserNurse /> },
  { to: "/users-list", label: "Lista korisnika aplikacije ", icon: <FaUserPlus /> },
  { to: "/adding-to-reserve-list", label: "dodavanje rezervnih lekova", icon: <FaMedkit /> },
  { to: "/reserve-list", label: "Lista rezervnih lekova", icon: <FaBookMedical /> },
];

export const NURSE_QUICK_LINKS: QuickLink[] = [
  { to: "/family-articles", label: "artikli ", icon: <FaPrescriptionBottleAlt /> },
  { to: "/familyMedicine", label: "dodavanje lekova od porodice ", icon: <FaFileMedical /> },
  { to: "/patient-page", label: "Lista pacijenata", icon: <FaUsers /> },
  { to: "/patient-medicines", label: "Lekovi pacijenata", icon: <FaPills /> },
];
