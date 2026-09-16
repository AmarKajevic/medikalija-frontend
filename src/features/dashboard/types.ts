export interface ActivityItem {
  type: string;
  patient: string;
  createdBy: { name: string; lastName: string; role: string } | null;
  description: string;
  createdAt: string;
}

export interface UpcomingEvent {
  _id: string;
  title: string;
  start: string;
  end: string;
  calendar: string;
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
