// Čarobnjak specifikacije: koraci, uvek vidljivo ukupno, čuvanje obračuna usput.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../../../../test/render";
import type { Specification } from "@features/specification/types/types";

const rates = vi.hoisted(() => ({ value: { lower: 100, middle: 120 } }));
vi.mock("@entities/exchange-rate/model/ExchangeRateContext", () => ({
  useExchangeRates: () => ({ rates: rates.value, updateRates: vi.fn() }),
}));

const save = vi.hoisted(() => ({ mutateAsync: vi.fn(), isPending: false }));
vi.mock("@features/specification/hooks/useSaveBilling", () => ({ useSaveBilling: () => save }));
vi.mock("@features/specification/hooks/useDeleteSpecificationItem", () => ({
  useDeleteSpecificationItem: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@shared/lib/notify", () => ({ notify: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("@entities/facility/facility", async (orig) => ({
  ...(await orig<typeof import("@entities/facility/facility")>()),
  useFacility: () => ({ facility: { name: "Dom Sunce" } }),
}));
const pending = vi.hoisted(() => ({ entries: [] as Array<{ _id: string; performedAt: string }> }));
vi.mock("@features/nurse-entries/model", () => ({ useNurseEntries: () => ({ data: pending.entries }) }));
vi.mock("@features/nurse-entries/ui/EntryReview", () => ({ default: () => <p>pregled unosa sestara</p> }));
vi.mock("./PeriodNotes", () => ({ default: ({ onAddAsCost }: { onAddAsCost?: (l: string) => void }) => <button type="button" onClick={() => onAddAsCost?.("Prevoz do stomatologa")}>dodaj iz beleške</button> }));
vi.mock("./PeriodSwitcher", () => ({ default: () => <span>period</span> }));
vi.mock("./AddItemPanel", () => ({ default: ({ preset }: { preset?: { kind: string; label?: string } | null }) => <p>forma za dodavanje{preset ? `: ${preset.kind} ${preset.label}` : ""}</p> }));

import SpecificationWorkspace from "./SpecificationWorkspace";

const spec: Specification = {
  _id: "s1",
  patientName: "Petar Petrović",
  startDate: "2026-11-01T00:00:00.000Z",
  endDate: "2026-11-30T00:00:00.000Z",
  totalPrice: 1000,
  isActive: true,
  items: [{ _id: "i1", name: "Andol", category: "medicine", amount: 10, price: 1000 }],
};

const footer = () => screen.getByText(/^Korak \d od 3/).parentElement!;

beforeEach(() => {
  rates.value = { lower: 100, middle: 120 };
  save.mutateAsync.mockReset();
  pending.entries = [];
});

describe("SpecificationWorkspace", () => {
  it("prvi korak: dodavanje i stavke, ukupno se vidi u dnu", () => {
    renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    expect(screen.getByRole("button", { current: "step" })).toHaveTextContent("Šta je pacijent dobio");
    expect(screen.getByText("forma za dodavanje")).toBeInTheDocument();
    expect(screen.getByText("Andol")).toBeInTheDocument();
    expect(within(footer()).getByText(/1\.000,00 RSD/)).toBeInTheDocument();
  });

  it("učinak sestre: 'Dodaj kao trošak' otvara trošak sa opisom", async () => {
    const { user } = renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    await user.click(screen.getByRole("button", { name: "dodaj iz beleške" }));
    expect(screen.getByText("forma za dodavanje: extra Prevoz do stomatologa")).toBeInTheDocument();
  });

  it("obračun se čuva pri prelasku na pregled, a ukupno uključuje dug", async () => {
    save.mutateAsync.mockResolvedValue({});
    const { user } = renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    await user.click(screen.getByRole("button", { name: /Dalje: obračun/ }));
    await user.click(screen.getByRole("switch", { name: "Naplati: Dug iz prethodnog perioda" }));
    await user.type(screen.getByLabelText("Dug iz prethodnog perioda (EUR)"), "10");
    // 1.000 RSD + 10 € × 120
    expect(within(footer()).getByText(/2\.200,00 RSD/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Dalje: pregled/ }));
    expect(save.mutateAsync).toHaveBeenCalledWith({ previousDebtEUR: 10, nextLodgingEUR: 0, includeDebt: true, includeLodging: false });
    expect(screen.getByRole("button", { name: "Štampaj specifikaciju" })).toBeInTheDocument();
    expect(screen.queryByText(/nisu sačuvani/)).not.toBeInTheDocument();
  });

  it("neuspelo čuvanje ostavlja korisnika na obračunu", async () => {
    save.mutateAsync.mockRejectedValue(new Error("x"));
    const { user } = renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    await user.click(screen.getByRole("button", { name: /Dalje: obračun/ }));
    await user.click(screen.getByRole("switch", { name: "Naplati: Smeštaj za naredni period" }));
    await user.type(screen.getByLabelText("Smeštaj za naredni period (EUR)"), "500");
    await user.click(screen.getByRole("button", { name: /Dalje: pregled/ }));
    expect(screen.getByRole("button", { current: "step" })).toHaveTextContent("Obračun za uplatu");
  });

  it("unosi sestara na čekanju: pregled u prvom koraku i upozorenje pre štampe", async () => {
    pending.entries = [
      { _id: "e1", performedAt: "2026-11-05T10:00:00.000Z" },
      { _id: "e2", performedAt: "2026-11-06T10:00:00.000Z" },
    ];
    const { user } = renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    expect(screen.getByText("Unosi sestara čekaju odobrenje (2)")).toBeInTheDocument();
    expect(screen.getByText("pregled unosa sestara")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Pregled i štampa/ }));
    expect(screen.getByText(/2 unosa sestara još čeka/)).toBeInTheDocument();
  });

  it("dug i smeštaj su opcioni: isključeno ne ulazi u zbir ni u pregled", async () => {
    const withBilling = { ...spec, billing: { includeDebt: true, includeLodging: false, previousDebtEUR: 10, nextLodgingEUR: 900 } } as unknown as Specification;
    const { user } = renderWithProviders(<SpecificationWorkspace specification={withBilling} patientId="p1" patientName="Petar" />);
    // 1.000 RSD + dug 10 € × 120; smeštaj isključen
    expect(within(footer()).getByText(/2\.200,00 RSD/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Obračun za uplatu/ }));
    await user.click(screen.getByRole("switch", { name: "Naplati: Dug iz prethodnog perioda" }));
    expect(within(footer()).getByText(/1\.000,00 RSD/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Pregled i štampa/ }));
    expect(screen.getByText("Bez duga i smeštaja")).toBeInTheDocument();
    expect(screen.queryByText("Dug iz prethodnog perioda")).not.toBeInTheDocument();
  });

  it("period specifikacije: oznaka perioda i unosi sestara samo iz tog perioda", () => {
    pending.entries = [
      { _id: "e1", performedAt: "2026-11-05T10:00:00.000Z" },
      { _id: "e2", performedAt: "2026-12-02T10:00:00.000Z" },
    ];
    const billingSpec = { ...spec, isActive: false };
    renderWithProviders(
      <SpecificationWorkspace specification={billingSpec} patientId="p1" patientName="Petar" period="billing" pendingFilter={(at) => at < "2026-12-01"} />
    );
    expect(screen.getByText("Period specifikacije")).toBeInTheDocument();
    expect(screen.queryByText("period")).not.toBeInTheDocument(); // menja se samo aktivan period
    expect(screen.getByText("Unosi sestara čekaju odobrenje (1)")).toBeInTheDocument();
    expect(screen.getByText("forma za dodavanje")).toBeInTheDocument(); // dodavanje je moguće
  });

  it("bez kursa: polja za kurs su otvorena i pregled upozorava", async () => {
    rates.value = { lower: 0, middle: 0 };
    const { user } = renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    await user.click(screen.getByRole("button", { name: /Obračun za uplatu/ }));
    expect(screen.getByLabelText("Niži kurs")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Pregled i štampa/ }));
    expect(screen.getByText(/Kurs evra nije unet/)).toBeInTheDocument();
  });
});
