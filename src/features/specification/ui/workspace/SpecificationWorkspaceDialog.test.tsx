// Prozor specifikacije: period specifikacije (istekao) i aktivan period; raniji periodi.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../../test/render";
import type { Specification } from "@features/specification/types/types";

const data = vi.hoisted(() => ({ active: null as unknown, billing: null as unknown, history: [] as unknown[] }));
vi.mock("@features/specification/hooks/usePatientSpecification", () => ({ usePatientSpecification: () => ({ data: data.active, isLoading: false }) }));
vi.mock("@features/specification/hooks/useBillingPeriodSpecification", () => ({ useBillingPeriodSpecification: () => ({ data: data.billing, isLoading: false }) }));
vi.mock("@features/specification/hooks/useSpecificationHistory", () => ({ useSpecificationHistory: () => ({ data: { history: data.history } }) }));
// Radni prostor se testira posebno; ovde samo koji period je otvoren
vi.mock("./SpecificationWorkspace", () => ({
  default: ({ specification, period }: { specification: Specification; period: string }) => <p>radni prostor: {period} {specification._id}</p>,
}));

import SpecificationWorkspaceDialog from "./SpecificationWorkspaceDialog";
import PeriodSwitcher from "./PeriodSwitcher";

const spec = (id: string, start: string, end: string, isActive = false): Specification => ({ _id: id, patientName: "", startDate: `${start}T00:00:00.000Z`, endDate: `${end}T00:00:00.000Z`, totalPrice: 0, isActive, items: [] });

beforeEach(() => {
  data.active = spec("active", "2026-10-26", "2026-11-24", true);
  data.billing = spec("billing", "2026-09-26", "2026-10-25");
  data.history = [];
});

describe("SpecificationWorkspaceDialog", () => {
  it("otvara se period specifikacije; aktivan period je druga kartica", async () => {
    const { user } = renderWithProviders(<SpecificationWorkspaceDialog open onClose={vi.fn()} patientId="p1" patientName="Petar" />);
    expect(await screen.findByText("radni prostor: billing billing")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Period specifikacije · 26\.09\.2026\. – 25\.10\.2026\./ })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("tab", { name: /Aktivan period/ }));
    expect(screen.getByText("radni prostor: active active")).toBeInTheDocument();
  });

  it("u prvom periodu nema kartice perioda specifikacije", () => {
    data.billing = null;
    renderWithProviders(<SpecificationWorkspaceDialog open onClose={vi.fn()} patientId="p1" patientName="Petar" />);
    expect(screen.getByText("radni prostor: active active")).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });
});

describe("Raniji periodi", () => {
  it("samo periodi pre aktivnog, od najnovijeg", async () => {
    data.history = [
      spec("star", "2026-08-27", "2026-09-25"),
      spec("buduci", "2026-11-25", "2026-12-24"),
      spec("prethodni", "2026-09-26", "2026-10-25"),
    ];
    const { user } = renderWithProviders(<PeriodSwitcher patientId="p1" activeSpecification={data.active as Specification} />);
    await user.click(screen.getByRole("button", { name: /26\.10\.2026\./ }));
    await user.click(screen.getByRole("menuitem", { name: /raniji period/ }));
    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toHaveLength(2);
    expect(items[0]).toContain("26.09.2026.");
    expect(items[1]).toContain("27.08.2026.");
  });
});
