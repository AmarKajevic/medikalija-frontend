// Podešavanja ustanove: naziv/logo/kontakt koji idu u meni i na specifikaciju.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { DEFAULT_FACILITY, facilityContactLine } from "@entities/facility/facility";

const api = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));
const notify = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("@shared/lib/notify", () => ({ notify }));

import FacilitySettingsPage from "./FacilitySettingsPage";

beforeEach(() => {
  api.get.mockReset();
  api.put.mockReset();
  api.get.mockResolvedValue({ data: { facility: { ...DEFAULT_FACILITY, name: "Dom Sunce" } } });
});

describe("FacilitySettingsPage", () => {
  it("prikazuje sačuvane podatke; Sačuvaj je aktivno tek posle izmene", async () => {
    renderWithProviders(<FacilitySettingsPage />);
    expect(await screen.findByLabelText("Naziv ustanove")).toHaveValue("Dom Sunce");
    expect(screen.getByRole("button", { name: "Sačuvaj" })).toBeDisabled();
  });

  it("čuva izmene i pregled zaglavlja ih odmah prikazuje", async () => {
    api.put.mockImplementation(async (_url: string, body: object) => ({ data: { facility: body } }));
    const { user } = renderWithProviders(<FacilitySettingsPage />);
    await user.type(await screen.findByLabelText("PIB"), "101234567");
    await user.type(screen.getByLabelText("Mesto"), "Novi Sad");
    expect(screen.getByText("Novi Sad · PIB 101234567")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sačuvaj" }));
    expect(api.put).toHaveBeenCalledWith("/api/settings/facility", expect.objectContaining({ name: "Dom Sunce", taxId: "101234567", city: "Novi Sad" }));
    expect(notify.success).toHaveBeenCalledWith("Podešavanja su sačuvana.");
  });

  it("naziv ne sme biti prazan", async () => {
    const { user } = renderWithProviders(<FacilitySettingsPage />);
    const name = await screen.findByLabelText("Naziv ustanove");
    await user.clear(name);
    await user.type(name, " ");
    await user.click(screen.getByRole("button", { name: "Sačuvaj" }));
    expect(api.put).not.toHaveBeenCalled();
  });
});

describe("facilityContactLine", () => {
  it("spaja samo popunjena polja", () => {
    expect(facilityContactLine(DEFAULT_FACILITY)).toBe("");
    expect(
      facilityContactLine({ ...DEFAULT_FACILITY, address: "Glavna 1", city: "Novi Sad", taxId: "1", phone: "021 1", email: "a@b.rs" })
    ).toBe("Glavna 1, Novi Sad · PIB 1 · Tel. 021 1 · a@b.rs");
  });
});
