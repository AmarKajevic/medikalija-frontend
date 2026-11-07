// Ručni unos datuma perioda: šalje nove datume i najavljuje početak sledećeg perioda.
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../../test/render";
import type { Specification } from "@features/specification/types/types";

const change = vi.hoisted(() => vi.fn());
vi.mock("@features/specification/api/specificationApi", () => ({ changeSpecificationDates: change }));

import EditPeriodDates from "./EditPeriodDates";

const spec: Specification = { _id: "s1", patientName: "", startDate: "2026-09-02T00:00:00.000Z", endDate: "2026-10-01T00:00:00.000Z", totalPrice: 0, isActive: false, items: [] };

describe("EditPeriodDates", () => {
  it("skraćen kraj: sledeći period počinje dan posle, šalju se novi datumi", async () => {
    change.mockResolvedValue({ ...spec, endDate: "2026-09-25T00:00:00.000Z" });
    const { user } = renderWithProviders(<EditPeriodDates specification={spec} patientId="p1" />);
    await user.click(screen.getByRole("button", { name: "Izmeni datume" }));
    const end = screen.getByLabelText("Do");
    await user.tripleClick(end);
    await user.keyboard("25092026");
    expect(screen.getByText("26.09.2026.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sačuvaj datume" }));
    expect(change).toHaveBeenCalledWith("p1", "s1", "2026-09-02", "2026-09-25");
  });

  it("bez izmene ili sa krajem pre početka nema čuvanja", async () => {
    const { user } = renderWithProviders(<EditPeriodDates specification={spec} patientId="p1" />);
    await user.click(screen.getByRole("button", { name: "Izmeni datume" }));
    expect(screen.getByRole("button", { name: "Sačuvaj datume" })).toBeDisabled();
  });
});
