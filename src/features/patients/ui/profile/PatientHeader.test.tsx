import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../../test/render";
import type { Patient } from "@entities/patient/hooks/usePatient";
import PatientHeader from "./PatientHeader";

const patient = { _id: "p1", name: "Milica", lastName: "Jovanović", dateOfBirth: "1938-04-12T00:00:00Z", admissionDate: "2026-09-25T00:00:00Z" } as Patient;
const noop = vi.fn();

const openMenu = async (props: { canManage: boolean; canViewSchedule?: boolean; onDischarge?: () => void; onEdit?: () => void }) => {
  const { user } = renderWithProviders(<PatientHeader patient={patient} onOpenSpecification={noop} {...props} />);
  await user.click(screen.getByRole("button", { name: /Više/ }));
  return screen.getAllByRole("menuitem").map((i) => i.textContent);
};

describe("PatientHeader: raspored perioda", () => {
  it("socijalni radnik: izmena, raspored i otpust, bez specifikacija", async () => {
    expect(await openMenu({ canManage: false, canViewSchedule: true, onEdit: noop, onDischarge: noop })).toEqual(["Izmeni podatke", "Raspored perioda (20 godina)", "Otpusti pacijenta"]);
    expect(screen.getByRole("menuitem", { name: /Raspored/ })).toHaveAttribute("href", "/patients/p1/schedule");
    expect(screen.queryByRole("button", { name: /Napravi specifikaciju/ })).toBeNull();
  });

  it("uprava i dalje ima raspored uz ostale stavke", async () => {
    const items = await openMenu({ canManage: true, onDischarge: noop });
    expect(items).toContain("Istorija specifikacija");
    expect(items).toContain("Raspored perioda (20 godina)");
  });

  it("bez dozvole nema menija", () => {
    renderWithProviders(<PatientHeader patient={patient} canManage={false} onOpenSpecification={noop} />);
    expect(screen.queryByRole("button", { name: /Više/ })).toBeNull();
  });
});
