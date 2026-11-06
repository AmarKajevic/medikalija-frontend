export interface ActivityItem {
  type: string;
  patient: string;
  createdBy: { name: string; lastName: string; role: string } | null;
  description: string;
  createdAt: string;
}

// Termin iz kalendara (oblik GET /api/calendar; celodnevni ima datume "YYYY-MM-DD")
export interface UpcomingEvent {
  id: string;
  title: string;
  allDay: boolean;
  start: string;
  end: string;
  calendar: string;
  patient?: { _id: string; name: string; lastName: string } | null;
}

export interface LowStockMedicine {
  _id: string;
  name: string;
  quantity: number;
  unitsPerPackage: number;
}

export interface PersonalDashboardStats {
  scope: "personal";
  activePatients: number;
  upcomingEvents: UpcomingEvent[];
  unreadNotifications: number;
  recentActivity: ActivityItem[];
}

export interface FacilityDashboardStats {
  scope: "facility";
  patients: {
    active: number;
    discharged: number;
    admittedLast30Days: number;
  };
  staffByRole: { role: string; count: number }[];
  lowStockMedicines: LowStockMedicine[];
  upcomingEvents: UpcomingEvent[];
  unreadNotifications: number;
  recentActivity: ActivityItem[];
}

export type DashboardStats = PersonalDashboardStats | FacilityDashboardStats;
