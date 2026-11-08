// Razvrstavanje lekova: označeni lekovi se prebacuju u drugu vrstu jednim zahtevom.
import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../../test/render";
import type { InventoryItem } from "@features/inventory/model";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));
const notify = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("@shared/lib/notify", () => ({ notify }));

import SortMedicinesDialog from "./SortMedicinesDialog";

const med = (_id: string, name: string, form: "oral" | "parenteral" = "oral"): InventoryItem => ({ _id, name, quantity: 10, price: 1, form });

describe("SortMedicinesDialog", () => {
  it("pretraga, izbor i prebacivanje u ampule", async () => {
    api.patch.mockResolvedValue({ data: { message: "Prebačeno: 2.", modified: 2 } });
    const meds = [med("1", "Andol"), med("2", "Ceftriakson amp"), med("3", "Cefaleksin amp"), med("4", "Fiziološki rastvor", "parenteral")];
    const { user } = renderWithProviders(<SortMedicinesDialog open onClose={vi.fn()} medicines={meds} />);

    expect(screen.queryByText("Fiziološki rastvor")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Pretraži lekove"), "cef");
    expect(screen.queryByText("Andol")).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Izaberi sve prikazane (2)"));
    await user.click(screen.getByRole("button", { name: /Prebaci izabrane \(2\) u: Ampule, rastvori, sol/ }));

    expect(api.patch).toHaveBeenCalledWith("/api/medicine/form", { ids: ["3", "2"], form: "parenteral" });
    await waitFor(() => expect(notify.success).toHaveBeenCalledWith("Prebačeno: 2. → Ampule, rastvori, sol"));
  });

  it("iz ampula nazad u tablete", async () => {
    api.patch.mockResolvedValue({ data: { message: "Prebačeno: 1.", modified: 1 } });
    const { user } = renderWithProviders(<SortMedicinesDialog open onClose={vi.fn()} medicines={[med("4", "Fiziološki rastvor", "parenteral")]} />);
    await user.click(screen.getByRole("tab", { name: /Ampule, rastvori, sol/ }));
    await user.click(screen.getByLabelText("Fiziološki rastvor"));
    await user.click(screen.getByRole("button", { name: /u: Tablete, kapsule/ }));
    expect(api.patch).toHaveBeenCalledWith("/api/medicine/form", { ids: ["4"], form: "oral" });
  });
});
