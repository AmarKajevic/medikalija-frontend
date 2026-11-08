import { createContext, useContext } from "react";

export interface DockApi {
  /** Otvara specifikaciju pacijenta (i pamti je kao specifikaciju u toku) */
  openSpecification: (patient: { patientId: string; patientName: string }) => void;
}

export const DockContext = createContext<DockApi | null>(null);

/** Specifikacija u toku (vidi SpecificationDockProvider) */
export function useSpecificationDock(): DockApi {
  const ctx = useContext(DockContext);
  if (!ctx) throw new Error("useSpecificationDock mora biti unutar SpecificationDockProvider-a");
  return ctx;
}
