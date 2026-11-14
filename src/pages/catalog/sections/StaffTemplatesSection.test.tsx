// Šabloni za medicinsko osoblje: dodavanje, izmena i brisanje.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../../test/render";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));
const notify = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("@shared/lib/notify", () => ({ notify }));

import StaffTemplatesSection from "./StaffTemplatesSection";

const template = { _id: "t1", name: "Pritisak", description: "Izmeren pritisak: ___" };

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({ data: { diagnosisTemplates: [template] } });
});

describe("Šabloni za medicinsko osoblje", () => {
  it("izmena šablona", async () => {
    api.put.mockResolvedValue({ data: { message: "ok" } });
    const { user } = renderWithProviders(<StaffTemplatesSection />);
    await user.click(await screen.findByRole("button", { name: "Akcije za Pritisak" }));
    await user.click(screen.getByRole("menuitem", { name: "Izmeni" }));
    const name = screen.getByLabelText(/Naziv/);
    await user.clear(name);
    await user.type(name, "Krvni pritisak");
    await user.click(screen.getByRole("button", { name: "Sačuvaj" }));
    expect(api.put).toHaveBeenCalledWith("/api/diagnosisTemplate/t1", { name: "Krvni pritisak", description: "Izmeren pritisak: ___" });
    await waitFor(() => expect(notify.success).toHaveBeenCalledWith("Šablon je izmenjen."));
  });

  it("brisanje uz potvrdu", async () => {
    api.delete.mockResolvedValue({ data: { message: "Šablon je obrisan." } });
    const { user } = renderWithProviders(<StaffTemplatesSection />);
    await user.click(await screen.findByRole("button", { name: "Akcije za Pritisak" }));
    await user.click(screen.getByRole("menuitem", { name: "Obriši" }));
    await user.click(screen.getByRole("button", { name: "Obriši" }));
    expect(api.delete).toHaveBeenCalledWith("/api/diagnosisTemplate/t1");
    await waitFor(() => expect(notify.success).toHaveBeenCalledWith("Šablon je obrisan."));
  });
});
