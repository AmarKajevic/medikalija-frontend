// Prozor specifikacije: period specifikacije (istekao) i aktivan period; raniji periodi.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../../test/render";
import type { Specification } from "@features/specification/types/types";

const data = vi.hoisted(() => ({ active: null as unknown, billing: null as unknown, history: [] as unknown[], past: [] as unknown[], periods: [] as unknown[], openPeriod: null as unknown, setBilling: null as unknown }));
vi.mock("@features/specification/hooks/usePatientSpecification", () => ({ usePatientSpecification: () => ({ data: data.active, isLoading: false }) }));
vi.mock("@features/specification/hooks/useBillingPeriodSpecification", () => ({ useBillingPeriodSpecification: () => ({ data: data.billing, isLoading: false }) }));
vi.mock("@features/specification/hooks/usePastPeriods", () => ({
  usePastPeriods: () => ({ data: data.past }),
  useSelectablePeriods: () => ({ data: data.periods }),
  useOpenPastPeriod: () => ({ mutate: data.openPeriod, isPending: false }),
}));
vi.mock("@features/specification/hooks/useSetBillingPeriod", () => ({
  useSetBillingPeriod: () => ({ mutate: data.setBilling, isPending: false }),
}));
vi.mock("@features/specification/hooks/useSpecification", () => ({
  useSpecification: (id: string) => ({ data: (data.history as Specification[]).find((s) => s._id === id), isLoading: false }),
}));
vi.mock("./NonStandardPeriodPicker", () => ({
  default: ({ onChange }: { onChange: (id: string) => void }) => (
    <button type="button" onClick={() => onChange("vanstd")}>
      izaberi vanstandardni
    </button>
  ),
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
  data.periods = [];
  data.openPeriod = vi.fn();
  data.setBilling = vi.fn();
});

const past = (start: string, end: string, specificationId: string | null, itemsCount = 0) => ({
  startDate: `${start}T00:00:00.000Z`,
  endDate: `${end}T00:00:00.000Z`,
  specificationId,
  itemsCount,
  totalPrice: 0,
});

const period = (start: string, end: string, specificationId: string | null, flags: { isActive?: boolean; isBilling?: boolean; isCurrent?: boolean; itemsCount?: number } = {}) => ({
  ...past(start, end, specificationId, flags.itemsCount ?? 0),
  isActive: !!flags.isActive,
  isBilling: !!flags.isBilling,
  isCurrent: !!flags.isCurrent,
});

describe("SpecificationWorkspaceDialog", () => {
  it("specifikacija se pravi za period specifikacije; smeštaj za period je samo informacija", async () => {
    renderWithProviders(<SpecificationWorkspaceDialog open onClose={vi.fn()} patientId="p1" patientName="Petar" />);
    expect(await screen.findByText("radni prostor: billing billing")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Period specifikacije · 26\.09\.2026\. – 25\.10\.2026\./ })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("tab", { name: /Smeštaj za period/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Smeštaj za period:/).parentElement).toHaveTextContent("26.10.2026. – 24.11.2026.");
    expect(screen.getByText(/naplaćuje se unapred/)).toBeInTheDocument();
  });

  it("u prvom periodu (još nema isteklog) radi se u tekućem periodu", () => {
    data.billing = null;
    renderWithProviders(<SpecificationWorkspaceDialog open onClose={vi.fn()} patientId="p1" patientName="Petar" />);
    expect(screen.getByText("radni prostor: active active")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Tekući period/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("tab", { name: /Period specifikacije/ })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Vanstandardni period/ })).toBeInTheDocument();
  });
});

describe("izbor perioda specifikacije pored kartica", () => {
  it("ručni izbor i promena perioda su odmah dostupni", async () => {
    data.periods = [period("2026-09-26", "2026-10-25", "billing", { itemsCount: 2 })];
    const { user } = renderWithProviders(<SpecificationWorkspaceDialog open onClose={vi.fn()} patientId="p1" patientName="Petar" />);
    await screen.findByText("radni prostor: billing billing");
    await user.click(screen.getByRole("button", { name: "Ručno izaberi period" }));
    expect(screen.getByRole("dialog", { name: "Ručni izbor perioda specifikacije" })).toHaveTextContent(/Smeštaj za period se ne menja ručno/);
    await user.click(screen.getByRole("button", { name: "Otkaži" }));
    await user.click(screen.getByRole("button", { name: "Promeni period" }));
    const dlg = screen.getByRole("dialog", { name: "Promena perioda specifikacije" });
    expect(dlg).toHaveTextContent("26.09.2026. – 25.10.2026.");
    expect(dlg).toHaveTextContent("2 stavke");
  });
});

describe("vanstandardni period", () => {
  it("kartica posle perioda specifikacije: izabran period se otvara kao vanstandardni", async () => {
    data.history = [spec("vanstd", "2026-10-10", "2026-10-15")];
    const { user } = renderWithProviders(<SpecificationWorkspaceDialog open onClose={vi.fn()} patientId="p1" patientName="Petar" />);
    const tabs = (await screen.findAllByRole("tab")).map((t) => t.textContent);
    expect(tabs.findIndex((t) => t?.startsWith("Vanstandardni"))).toBe(tabs.findIndex((t) => t?.startsWith("Period specifikacije")) + 1);
    await user.click(screen.getByRole("tab", { name: /Vanstandardni period/ }));
    await user.click(screen.getByRole("button", { name: "izaberi vanstandardni" }));
    expect(await screen.findByText("radni prostor: nonstandard vanstd")).toBeInTheDocument();
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

describe("Promena perioda specifikacije", () => {
  it("periodi od današnjeg unazad, sa oznakama; smeštaj za period se ne bira kao budući", async () => {
    data.periods = [
      period("2026-11-25", "2026-12-24", null),
      period("2026-10-26", "2026-11-24", "active", { isActive: true, isCurrent: true }),
      period("2026-09-26", "2026-10-25", "prethodni", { isBilling: true, itemsCount: 1 }),
      period("2026-08-27", "2026-09-25", null),
      period("2026-07-28", "2026-08-26", "star", { itemsCount: 12 }),
    ];
    const { user } = renderWithProviders(<PeriodSwitcher patientId="p1" activeSpecification={data.active as Specification} />);
    await user.click(screen.getByRole("button", { name: /26\.10\.2026\./ }));
    await user.click(screen.getByRole("menuitem", { name: /Promeni period/ }));
    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toHaveLength(4); // bez perioda posle današnjeg
    expect(items[0]).toContain("Smeštaj za period");
    expect(items[0]).toContain("Današnji");
    expect(items[1]).toContain("Period specifikacije");
    expect(items[1]).toContain("1 stavka");
    expect(items[3]).toContain("12 stavki");
    expect(screen.getByRole("button", { name: "Izabran" })).toBeDisabled();
    // Već je uobičajeno (period pre današnjeg): nema prečice
    expect(screen.queryByRole("button", { name: "Vrati na uobičajeno" })).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Izaberi" })[2]!);
    expect(data.setBilling).toHaveBeenCalledWith({ specificationId: "star" }, expect.anything());
  });

  it("neotvaran period se šalje po datumima; prečica vraća na period pre današnjeg", async () => {
    data.periods = [
      period("2026-11-25", "2026-12-24", "unapred", { isActive: true }),
      period("2026-10-26", "2026-11-24", "danas", { isCurrent: true, isBilling: true }),
      period("2026-09-26", "2026-10-25", "prethodni"),
      period("2026-08-27", "2026-09-25", null),
    ];
    const { user } = renderWithProviders(<PeriodSwitcher patientId="p1" activeSpecification={data.active as Specification} />);
    await user.click(screen.getByRole("button", { name: /26\.10\.2026\./ }));
    await user.click(screen.getByRole("menuitem", { name: /Promeni period/ }));
    const choices = screen.getAllByRole("button", { name: "Izaberi" });
    await user.click(choices[choices.length - 1]!);
    expect(data.setBilling).toHaveBeenLastCalledWith({ startDate: "2026-08-27", endDate: "2026-09-25" }, expect.anything());
    await user.click(screen.getByRole("button", { name: "Vrati na uobičajeno" }));
    expect(data.setBilling).toHaveBeenLastCalledWith({ specificationId: "prethodni" }, expect.anything());
  });
});
