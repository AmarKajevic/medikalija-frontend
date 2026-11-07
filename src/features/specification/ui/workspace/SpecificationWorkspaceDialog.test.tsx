// Prozor specifikacije: period specifikacije (istekao) i aktivan period; raniji periodi.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../../test/render";
import type { Specification } from "@features/specification/types/types";

const data = vi.hoisted(() => ({ active: null as unknown, billing: null as unknown, history: [] as unknown[], past: [] as unknown[], openPeriod: null as unknown }));
vi.mock("@features/specification/hooks/usePatientSpecification", () => ({ usePatientSpecification: () => ({ data: data.active, isLoading: false }) }));
vi.mock("@features/specification/hooks/useBillingPeriodSpecification", () => ({ useBillingPeriodSpecification: () => ({ data: data.billing, isLoading: false }) }));
vi.mock("@features/specification/hooks/usePastPeriods", () => ({
  usePastPeriods: () => ({ data: data.past }),
  useOpenPastPeriod: () => ({ mutate: data.openPeriod, isPending: false }),
}));
vi.mock("@features/specification/hooks/useSpecification", () => ({
  useSpecification: (id: string) => ({ data: (data.history as Specification[]).find((s) => s._id === id), isLoading: false }),
}));
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
  data.past = [];
  data.openPeriod = vi.fn();
});

const past = (start: string, end: string, specificationId: string | null, itemsCount = 0) => ({
  startDate: `${start}T00:00:00.000Z`,
  endDate: `${end}T00:00:00.000Z`,
  specificationId,
  itemsCount,
  totalPrice: 0,
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

describe("ručno biranje perioda", () => {
  it("svi raniji periodi od prijema, od najnovijeg (bez perioda specifikacije)", async () => {
    data.history = [spec("star", "2026-08-27", "2026-09-25")];
    data.past = [
      past("2026-09-26", "2026-10-25", null), // period specifikacije, lista stigla pre njegovog zapisa
      past("2026-08-27", "2026-09-25", "star", 3),
      past("2026-07-28", "2026-08-26", null),
    ];
    const { user } = renderWithProviders(<SpecificationWorkspaceDialog open onClose={vi.fn()} patientId="p1" patientName="Petar" />);
    await user.click(await screen.findByRole("tab", { name: /Izaberi period/ }));
    const select = screen.getByLabelText("Period") as HTMLSelectElement;
    expect([...select.options].map((o) => o.textContent)).toEqual(["27.08.2026. – 25.09.2026. · 3 stavke", "28.07.2026. – 26.08.2026. · bez stavki"]);
    expect(await screen.findByText("radni prostor: other star")).toBeInTheDocument();
    expect(data.openPeriod).not.toHaveBeenCalled();
  });

  it("neotvaran period se otvara (pravi) tek kad se izabere", async () => {
    data.history = [spec("nov", "2026-07-28", "2026-08-26")];
    data.past = [past("2026-08-27", "2026-09-25", "star"), past("2026-07-28", "2026-08-26", null)];
    data.openPeriod = vi.fn((_p, { onSuccess }) => onSuccess({ _id: "nov" }));
    const { user } = renderWithProviders(<SpecificationWorkspaceDialog open onClose={vi.fn()} patientId="p1" patientName="Petar" />);
    await user.click(await screen.findByRole("tab", { name: /Izaberi period/ }));
    await user.selectOptions(screen.getByLabelText("Period"), "2026-07-28T00:00:00.000Z");
    expect(data.openPeriod).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("radni prostor: other nov")).toBeInTheDocument();
  });

  it("bez ranijih perioda nema kartice za izbor", async () => {
    renderWithProviders(<SpecificationWorkspaceDialog open onClose={vi.fn()} patientId="p1" patientName="Petar" />);
    await screen.findByText("radni prostor: billing billing");
    expect(screen.queryByRole("tab", { name: /Izaberi period/ })).not.toBeInTheDocument();
  });
});

describe("Raniji periodi", () => {
  it("svi periodi od prijema, od najnovijeg; neotvaran se aktivira po datumima", async () => {
    data.past = [
      past("2026-09-26", "2026-10-25", "prethodni", 1),
      past("2026-08-27", "2026-09-25", null),
      past("2026-07-28", "2026-08-26", "star", 12),
    ];
    const { user } = renderWithProviders(<PeriodSwitcher patientId="p1" activeSpecification={data.active as Specification} />);
    await user.click(screen.getByRole("button", { name: /26\.10\.2026\./ }));
    await user.click(screen.getByRole("menuitem", { name: /raniji period/ }));
    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toHaveLength(3);
    expect(items[0]).toContain("26.09.2026.");
    expect(items[0]).toContain("1 stavka");
    expect(items[1]).toContain("Bez stavki");
    expect(items[2]).toContain("12 stavki");
  });
});
