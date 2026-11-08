// Specifikacija u toku: sklonjen prozor ostaje kao kartica dole desno; "Nastavi" ga vraća.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../../test/render";

const auth = vi.hoisted(() => ({ user: { _id: "u1", role: "admin" } as { _id: string; role: string } }));
vi.mock("@app/providers/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));
// Pravi prozor se testira posebno; ovde samo da li je otvoren i da ostaje u memoriji
vi.mock("@features/specification/ui/workspace/SpecificationWorkspaceDialog", () => ({
  default: ({ open, onClose, patientName, keepMounted }: { open: boolean; onClose: () => void; patientName: string; keepMounted?: boolean }) =>
    open ? (
      <div role="dialog" aria-label="Specifikacija">
        {patientName}
        <button type="button" onClick={onClose}>
          Zatvori
        </button>
      </div>
    ) : keepMounted ? (
      <p>u memoriji: {patientName}</p>
    ) : null,
}));

import { SpecificationDockProvider } from "./SpecificationDock";
import { useSpecificationDock } from "./useSpecificationDock";

function OpenButton() {
  const dock = useSpecificationDock();
  return (
    <button type="button" onClick={() => dock.openSpecification({ patientId: "p1", patientName: "Milica Jovanović" })}>
      Napravi specifikaciju
    </button>
  );
}

const renderDock = () =>
  renderWithProviders(
    <SpecificationDockProvider>
      <OpenButton />
    </SpecificationDockProvider>
  );

beforeEach(() => {
  sessionStorage.clear();
  auth.user = { _id: "u1", role: "admin" };
});

describe("SpecificationDock", () => {
  it("sklonjena specifikacija ostaje kao kartica; Nastavi je vraća, × je zatvara", async () => {
    const { user } = renderDock();
    await user.click(screen.getByRole("button", { name: "Napravi specifikaciju" }));
    expect(screen.getByRole("dialog", { name: "Specifikacija" })).toHaveTextContent("Milica Jovanović");

    await user.click(screen.getByRole("button", { name: "Zatvori" }));
    const card = screen.getByRole("region", { name: "Specifikacija u toku" });
    expect(card).toHaveTextContent("Milica Jovanović");
    expect(screen.getByText("u memoriji: Milica Jovanović")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nastavi" }));
    expect(screen.getByRole("dialog", { name: "Specifikacija" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Zatvori" }));
    await user.click(screen.getByRole("button", { name: "Zatvori specifikaciju u toku" }));
    expect(screen.queryByRole("region", { name: "Specifikacija u toku" })).not.toBeInTheDocument();
    expect(sessionStorage.getItem("spec-dock")).toBeNull();
  });

  it("posle osvežavanja kartica ostaje; drugi korisnik je ne vidi", () => {
    sessionStorage.setItem("spec-dock", JSON.stringify({ patientId: "p1", patientName: "Milica Jovanović", userId: "u1" }));
    const first = renderDock();
    expect(screen.getByRole("region", { name: "Specifikacija u toku" })).toBeInTheDocument();
    first.unmount();

    auth.user = { _id: "u2", role: "nurse" };
    renderDock();
    expect(screen.queryByRole("region", { name: "Specifikacija u toku" })).not.toBeInTheDocument();
  });
});
