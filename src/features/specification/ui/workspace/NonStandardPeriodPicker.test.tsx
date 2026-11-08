// Vanstandardni period: ručno se biraju Od/Do i otvara se period van redovnog niza.
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../../test/render";

const api = vi.hoisted(() => ({ list: vi.fn(), open: vi.fn() }));
vi.mock("@features/specification/api/specificationApi", () => ({ fetchNonStandardPeriods: api.list, openNonStandardPeriod: api.open }));

import NonStandardPeriodPicker from "./NonStandardPeriodPicker";

describe("NonStandardPeriodPicker", () => {
  it("bez ranijih: forma Od/Do otvara novi period", async () => {
    api.list.mockResolvedValue([]);
    api.open.mockResolvedValue({ _id: "n1", startDate: "2026-10-10T00:00:00.000Z", endDate: "2026-10-15T00:00:00.000Z", items: [] });
    const onChange = vi.fn();
    const { user } = renderWithProviders(<NonStandardPeriodPicker patientId="p1" value="" onChange={onChange} />);
    await user.type(await screen.findByLabelText("Od"), "10102026");
    await user.type(screen.getByLabelText("Do"), "15102026");
    await user.click(screen.getByRole("button", { name: "Otvori period" }));
    expect(api.open).toHaveBeenCalledWith("p1", "2026-10-10", "2026-10-15");
    expect(onChange).toHaveBeenCalledWith("n1");
  });

  it("postojeći: bira se najnoviji, može i novi", async () => {
    api.list.mockResolvedValue([{ _id: "n2", startDate: "2026-10-20T00:00:00.000Z", endDate: "2026-10-22T00:00:00.000Z", items: [{}, {}] }]);
    const onChange = vi.fn();
    renderWithProviders(<NonStandardPeriodPicker patientId="p1" value="" onChange={onChange} />);
    expect(await screen.findByRole("option", { name: /20\.10\.2026\. – 22\.10\.2026\. · 2 stavke/ })).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith("n2");
    expect(screen.getByRole("button", { name: "Novi vanstandardni period" })).toBeInTheDocument();
  });
});
