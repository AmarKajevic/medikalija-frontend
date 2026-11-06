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
vi.mock("./PeriodSwitcher", () => ({ default: () => <span>period</span> }));
vi.mock("./AddItemPanel", () => ({ default: () => <p>forma za dodavanje</p> }));

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
});

describe("SpecificationWorkspace", () => {
  it("prvi korak: dodavanje i stavke, ukupno se vidi u dnu", () => {
    renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    expect(screen.getByRole("button", { current: "step" })).toHaveTextContent("Šta je pacijent dobio");
    expect(screen.getByText("forma za dodavanje")).toBeInTheDocument();
    expect(screen.getByText("Andol")).toBeInTheDocument();
    expect(within(footer()).getByText(/1\.000,00 RSD/)).toBeInTheDocument();
  });

  it("obračun se čuva pri prelasku na pregled, a ukupno uključuje dug", async () => {
    save.mutateAsync.mockResolvedValue({});
    const { user } = renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    await user.click(screen.getByRole("button", { name: /Dalje: obračun/ }));
    await user.type(screen.getByLabelText("Dug iz prethodnog perioda (EUR)"), "10");
    // 1.000 RSD + 10 € × 120
    expect(within(footer()).getByText(/2\.200,00 RSD/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Dalje: pregled/ }));
    expect(save.mutateAsync).toHaveBeenCalledWith({ previousDebtEUR: 10, nextLodgingEUR: 0 });
    expect(screen.getByRole("button", { name: "Štampaj specifikaciju" })).toBeInTheDocument();
    expect(screen.queryByText(/nisu sačuvani/)).not.toBeInTheDocument();
  });

  it("neuspelo čuvanje ostavlja korisnika na obračunu", async () => {
    save.mutateAsync.mockRejectedValue(new Error("x"));
    const { user } = renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    await user.click(screen.getByRole("button", { name: /Dalje: obračun/ }));
    await user.type(screen.getByLabelText("Smeštaj za naredni period (EUR)"), "500");
    await user.click(screen.getByRole("button", { name: /Dalje: pregled/ }));
    expect(screen.getByRole("button", { current: "step" })).toHaveTextContent("Obračun za uplatu");
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
