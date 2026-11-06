import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import type { User } from "@shared/types/index";

const auth = vi.hoisted(() => ({ user: null as User | null }));
vi.mock("@app/providers/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));
vi.mock("@features/patients/hooks/usePatients", () => ({
  usePatients: () => ({
    isLoading: false,
    isError: false,
    data: {
      patients: [
        { _id: "1", name: "Milica", lastName: "Jovanović", dateOfBirth: "1938-04-12T00:00:00Z", admissionDate: "2026-09-25T00:00:00Z", contactPerson: "Jovan" },
        { _id: "2", name: "Ljubica", lastName: "Živković", dateOfBirth: "1935-01-20T00:00:00Z", admissionDate: "2026-10-22T00:00:00Z" },
        { _id: "3", name: "Stevan", lastName: "Đurić", dateOfBirth: "1939-06-11T00:00:00Z", admissionDate: "2025-10-01T00:00:00Z", dischargeDate: "2026-10-17T00:00:00Z" },
      ],
    },
  }),
}));
vi.mock("@features/patients/hooks/useDeletePatient", () => ({ useDeletePatient: () => ({ mutate: vi.fn(), isPending: false }) }));
vi.mock("@features/patients/ui/AddPatientDialog", () => ({ default: ({ open }: { open: boolean }) => (open ? <p>dijalog novi pacijent</p> : null) }));

import PatientsPage from "./PatientsPage";

// Ime pacijenta (prvi <p> u ćeliji; drugi red "Prijem …" je samo za mobilni prikaz)
const names = () => screen.getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell")[0]!.querySelector("p")?.textContent);

beforeEach(() => {
  auth.user = { _id: "u", name: "Ana", lastName: "A", email: "", role: "admin" };
});

describe("PatientsPage", () => {
  it("podrazumevano prikazuje pacijente na smeštaju, sortirane po prezimenu", () => {
    renderWithProviders(<PatientsPage />);
    expect(names()).toEqual(["Milica Jovanović", "Ljubica Živković"]);
    expect(screen.getByRole("tab", { name: /Na smeštaju/ })).toHaveTextContent("2");
  });

  it("tab 'Otpušteni' i pretraga bez dijakritika", async () => {
    const { user } = renderWithProviders(<PatientsPage />);
    await user.click(screen.getByRole("tab", { name: /Otpušteni/ }));
    expect(names()).toEqual(["Stevan Đurić"]);
    await user.click(screen.getByRole("tab", { name: /Svi/ }));
    await user.type(screen.getByRole("searchbox"), "zivk");
    expect(names()).toEqual(["Ljubica Živković"]);
  });

  it("uprava otvara dijalog za novog pacijenta", async () => {
    const { user } = renderWithProviders(<PatientsPage />);
    await user.click(screen.getByRole("button", { name: "Novi pacijent" }));
    expect(screen.getByText("dijalog novi pacijent")).toBeInTheDocument();
  });

  it("sestra ne vidi dodavanje ni brisanje", async () => {
    auth.user = { _id: "n", name: "Sanja", lastName: "S", email: "", role: "nurse" };
    const { user } = renderWithProviders(<PatientsPage />);
    expect(screen.queryByRole("button", { name: "Novi pacijent" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Akcije za Milica Jovanović" }));
    expect(screen.queryByRole("menuitem", { name: "Obriši pacijenta" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Otvori profil" })).toBeInTheDocument();
  });
});
