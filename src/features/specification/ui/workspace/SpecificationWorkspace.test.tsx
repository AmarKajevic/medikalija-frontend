// Specifikacija: jedan ekran, smeštaj iznad kursa, uvek vidljivo ukupno; pregled/PDF/štampa čuvaju obračun usput.
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
vi.mock("@app/providers/AuthContext", () => ({ useAuth: () => ({ user: { role: "admin" } }) }));
const lodging = vi.hoisted(() => ({
  prices: [] as Array<{ _id: string; name: string; days: number; priceEUR: number; active: boolean }>,
  notes: [] as Array<{ _id: string; text: string }>,
}));
vi.mock("@features/lodging/model", () => ({ useLodgingPrices: () => ({ data: lodging.prices }), useLodgingNotes: () => ({ data: lodging.notes }) }));
const pdf = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("@features/specification/lib/generateSpecificationPDF", () => ({ generateSpecificationPDF: pdf.generate }));
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

const footer = () => screen.getByText(/^Ukupno:/).parentElement!;

beforeEach(() => {
  rates.value = { lower: 100, middle: 120 };
  save.mutateAsync.mockReset();
  pending.entries = [];
  pdf.generate.mockReset();
  pdf.generate.mockResolvedValue("blob:specifikacija");
});

describe("SpecificationWorkspace", () => {
  it("prvi korak: dodavanje i stavke, ukupno se vidi u dnu", () => {
    renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    expect(screen.getByText("forma za dodavanje")).toBeInTheDocument();
    expect(screen.getByText("Andol")).toBeInTheDocument();
    expect(within(footer()).getByText(/1\.000,00 RSD/)).toBeInTheDocument();
  });

  it("učinak sestre: 'Dodaj kao trošak' otvara trošak sa opisom", async () => {
    const { user } = renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    expect(screen.queryByRole("button", { name: "dodaj iz beleške" })).not.toBeInTheDocument(); // zabeleške su u posebnom prozoru
    await user.click(screen.getByRole("button", { name: "Zabeleške iz ovog perioda" }));
    await user.click(within(screen.getByRole("dialog", { name: "Zabeleške iz ovog perioda" })).getByRole("button", { name: "dodaj iz beleške" }));
    expect(screen.queryByRole("dialog", { name: "Zabeleške iz ovog perioda" })).not.toBeInTheDocument();
    expect(screen.getByText("forma za dodavanje: extra Prevoz do stomatologa")).toBeInTheDocument();
  });

  it("bez koraka: pregled, Skini PDF i Štampaj su uvek u donjoj traci; ispod smeštaja je naslov specifikacije troškova", () => {
    renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    expect(screen.queryByRole("navigation", { name: "Koraci" })).not.toBeInTheDocument();
    for (const name of ["Pregled specifikacije", "Skini PDF", "Štampaj"]) expect(screen.getByRole("button", { name })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Specifikacija troškova za period: / })).toBeInTheDocument();
  });

  it("pregled prikazuje PDF koji će biti odštampan, sa dugmadima Skini PDF i Štampaj", async () => {
    const { user } = renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    await user.click(screen.getByRole("button", { name: "Pregled specifikacije" }));
    const dialog = await screen.findByRole("dialog", { name: "Pregled specifikacije" });
    expect(pdf.generate).toHaveBeenCalledWith(expect.objectContaining({ mode: "preview", patientName: "Petar" }));
    expect(within(dialog).getByTitle("Specifikacija (PDF)")).toHaveAttribute("src", "blob:specifikacija");
    await user.click(within(dialog).getByRole("button", { name: "Štampaj" }));
    expect(pdf.generate).toHaveBeenLastCalledWith(expect.objectContaining({ mode: "print" }));
  });

  it("obračun se čuva pri prelasku na pregled, a ukupno uključuje dug", async () => {
    save.mutateAsync.mockResolvedValue({});
    const { user } = renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    await user.click(screen.getByRole("button", { name: /Dodaj smeštaj/ }));
    await user.click(screen.getByRole("switch", { name: "Naplati: Dug iz prethodnog perioda" }));
    await user.type(screen.getByLabelText("Dug iz prethodnog perioda (EUR)"), "10");
    // 1.000 RSD + 10 € × 120
    expect(within(footer()).getByText(/2\.200,00 RSD/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Zatvori" }));

    await user.click(screen.getByRole("button", { name: "Pregled specifikacije" }));
    expect(save.mutateAsync).toHaveBeenCalledWith({ previousDebtEUR: 10, nextLodgingEUR: 0, earlyLodgingEUR: 0, includeDebt: true, includeLodging: false, includeEarlyLodging: false, nextLodgingOption: "", earlyLodgingOption: "", earlyLodgingNote: "" });
    expect(await screen.findByRole("dialog", { name: "Pregled specifikacije" })).toBeInTheDocument();
  });

  it("neuspelo čuvanje: nema pregleda ni PDF-a sa nesačuvanim obračunom", async () => {
    save.mutateAsync.mockRejectedValue(new Error("x"));
    const { user } = renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    await user.click(screen.getByRole("button", { name: /Dodaj smeštaj/ }));
    await user.click(screen.getByRole("switch", { name: "Naplati: Smeštaj za naredni period" }));
    await user.type(screen.getByLabelText("Smeštaj za naredni period (EUR)"), "500");
    await user.click(screen.getByRole("button", { name: "Zatvori" }));
    await user.click(screen.getByRole("button", { name: "Pregled specifikacije" }));
    expect(pdf.generate).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "Pregled specifikacije" })).not.toBeInTheDocument();
  });

  it("smeštaj se čuva iz dijaloga i stoji na vrhu liste; uklanja se odatle", async () => {
    save.mutateAsync.mockResolvedValue({});
    const { user } = renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    await user.click(screen.getByRole("button", { name: /Dodaj smeštaj/ }));
    await user.click(screen.getByRole("switch", { name: "Naplati: Smeštaj za naredni period" }));
    await user.type(screen.getByLabelText("Smeštaj za naredni period (EUR)"), "500");
    await user.click(screen.getByRole("button", { name: "Sačuvaj obračun" }));
    expect(screen.queryByRole("dialog", { name: "Smeštaj i dug" })).not.toBeInTheDocument();

    expect(screen.getByText("Dodato u ovom periodu (2)")).toBeInTheDocument();
    const lodgingRow = screen.getByText("Smeštaj za naredni period");
    expect(lodgingRow.compareDocumentPosition(screen.getByText("Andol")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("button", { name: /Smeštaj i dug/ })).toHaveTextContent("500,00");

    await user.click(screen.getByRole("button", { name: "Ukloni Smeštaj za naredni period" }));
    expect(save.mutateAsync).toHaveBeenLastCalledWith(expect.objectContaining({ includeLodging: false, nextLodgingEUR: 500 }));
    expect(screen.queryByText("Smeštaj za naredni period")).not.toBeInTheDocument();
  });

  it("unosi sestara na čekanju: pregled na vrhu i upozorenje pre štampe", async () => {
    pending.entries = [
      { _id: "e1", performedAt: "2026-11-05T10:00:00.000Z" },
      { _id: "e2", performedAt: "2026-11-06T10:00:00.000Z" },
    ];
    const { user } = renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    expect(screen.getByText("Unosi osoblja čekaju odobrenje (2)")).toBeInTheDocument();
    expect(screen.getByText("pregled unosa sestara")).toBeInTheDocument();
    expect(within(footer().parentElement!).getByText(/2 unosa osoblja još čeka/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pregled specifikacije" }));
    expect(within(await screen.findByRole("dialog", { name: "Pregled specifikacije" })).getByText(/2 unosa osoblja još čeka/)).toBeInTheDocument();
  });

  it("dug i smeštaj su opcioni: isključeno ne ulazi u zbir ni u pregled", async () => {
    const withBilling = { ...spec, billing: { includeDebt: true, includeLodging: false, previousDebtEUR: 10, nextLodgingEUR: 900 } } as unknown as Specification;
    const { user } = renderWithProviders(<SpecificationWorkspace specification={withBilling} patientId="p1" patientName="Petar" />);
    // 1.000 RSD + dug 10 € × 120; smeštaj isključen
    expect(within(footer()).getByText(/2\.200,00 RSD/)).toBeInTheDocument();
    expect(screen.getByText("Dug iz prethodnog perioda")).toBeInTheDocument(); // na vrhu liste
    await user.click(screen.getByRole("button", { name: /Smeštaj i dug/ }));
    await user.click(screen.getByRole("switch", { name: "Naplati: Dug iz prethodnog perioda" }));
    expect(within(footer()).getByText(/1\.000,00 RSD/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Zatvori" }));
    save.mutateAsync.mockResolvedValue({});
    await user.click(screen.getByRole("button", { name: "Pregled specifikacije" }));
    expect(pdf.generate).toHaveBeenCalledWith(expect.objectContaining({ includeDebt: false, includeLodging: false }));
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
    expect(screen.getByText("Unosi osoblja čekaju odobrenje (1)")).toBeInTheDocument();
    expect(screen.getByText(/Još 1 unos čeka odobrenje u drugom periodu/)).toBeInTheDocument(); // 2.12. pada u tekući
    expect(screen.getByText("forma za dodavanje")).toBeInTheDocument(); // dodavanje je moguće
  });

  it("zatvorena specifikacija: samo pregled, izmene tek posle upozorenja", async () => {
    const closed = { ...spec, isActive: false } as Specification;
    const { user } = renderWithProviders(<SpecificationWorkspace specification={closed} patientId="p1" patientName="Petar" />);
    expect(screen.getByText("Zatvoren period · samo pregled")).toBeInTheDocument();
    expect(screen.queryByText(/forma za dodavanje/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ukloni Andol" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Omogući izmene" }));
    const warn = screen.getByRole("dialog", { name: "Izmena zatvorene specifikacije" });
    expect(warn).toHaveTextContent(/na sopstvenu odgovornost/);
    await user.click(within(warn).getByRole("button", { name: "Razumem, omogući izmene" }));

    expect(screen.getByText("forma za dodavanje")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ukloni Andol" })).toBeInTheDocument();
    expect(screen.getByText(/Zatvoren period · izmene na sopstvenu odgovornost/)).toBeInTheDocument();
  });

  it("smeštaj se bira iz cenovnika; može i drugi iznos ručno", async () => {
    lodging.prices = [
      { _id: "l1", name: "10 dana", days: 10, priceEUR: 200, active: true },
      { _id: "l2", name: "30 dana", days: 30, priceEUR: 900, active: true },
    ];
    save.mutateAsync.mockResolvedValue({});
    const { user } = renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    await user.click(screen.getByRole("button", { name: /Dodaj smeštaj/ }));
    await user.click(screen.getByText("Smeštaj za naredni period", { selector: "span" }));
    await user.selectOptions(screen.getByLabelText("Smeštaj za naredni period: cena"), "30 dana");
    // 1.000 RSD + 900 € × 120
    expect(within(footer()).getByText(/109\.000,00 RSD/)).toBeInTheDocument();
    await user.click(screen.getByText("Vanstandardni period smeštaja", { selector: "span" }));
    await user.selectOptions(screen.getByLabelText("Vanstandardni period smeštaja: cena"), "__manual");
    await user.type(screen.getByLabelText("Vanstandardni period smeštaja (EUR)"), "50");
    await user.click(screen.getByRole("button", { name: "Sačuvaj obračun" }));
    expect(save.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ nextLodgingEUR: 900, nextLodgingOption: "30 dana", includeLodging: true, earlyLodgingEUR: 50, earlyLodgingOption: "", includeEarlyLodging: true })
    );
    lodging.prices = [];
  });

  it("napomena uz vanstandardni smeštaj: bira se iz liste, čuva se i vidi u listi stavki", async () => {
    lodging.notes = [{ _id: "n1", text: "Smeštaj od prijema do početka perioda" }];
    save.mutateAsync.mockResolvedValue({});
    const { user } = renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    await user.click(screen.getByRole("button", { name: /Dodaj smeštaj/ }));
    expect(screen.queryByLabelText("Napomena uz vanstandardni smeštaj")).not.toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Naplati: Vanstandardni period smeštaja" }));
    await user.type(screen.getByLabelText("Vanstandardni period smeštaja (EUR)"), "120");
    await user.selectOptions(screen.getByLabelText("Napomena uz vanstandardni smeštaj"), "Smeštaj od prijema do početka perioda");
    await user.click(screen.getByRole("button", { name: "Sačuvaj obračun" }));
    expect(save.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ includeEarlyLodging: true, earlyLodgingEUR: 120, earlyLodgingNote: "Smeštaj od prijema do početka perioda" }));
    expect(screen.getByText("Smeštaj od prijema do početka perioda")).toBeInTheDocument();
    lodging.notes = [];
  });

  it("vanstandardni period: smeštaj nosi datume izabranog perioda, bez ponovnog unosa", async () => {
    save.mutateAsync.mockResolvedValue({});
    const nonStandard = { ...spec, nonStandard: true, startDate: "2026-10-01T00:00:00.000Z", endDate: "2026-10-05T00:00:00.000Z" };
    const { user } = renderWithProviders(<SpecificationWorkspace specification={nonStandard} patientId="p1" patientName="Petar" period="nonstandard" />);
    await user.click(screen.getByRole("button", { name: /Dodaj smeštaj/ }));
    await user.click(screen.getByRole("switch", { name: "Naplati: Vanstandardni period smeštaja" }));
    expect(screen.queryByLabelText(/Vanstandardni period od/)).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Vanstandardni period smeštaja (EUR)"), "50");
    await user.click(screen.getByRole("button", { name: "Sačuvaj obračun" }));
    expect(screen.getByText("01.10.2026. — 05.10.2026.")).toBeInTheDocument();
  });

  it("kurs evra je uvek vidljiv u zaglavlju; bez kursa donja traka upozorava", () => {
    rates.value = { lower: 0, middle: 0 };
    renderWithProviders(<SpecificationWorkspace specification={spec} patientId="p1" patientName="Petar" />);
    const box = screen.getByRole("group", { name: "Kurs evra" });
    expect(within(box).getByLabelText("Niži")).toHaveValue("");
    expect(within(box).getByLabelText("Srednji")).toBeInTheDocument();
    expect(screen.getByText(/Kurs evra nije unet/)).toBeInTheDocument();
  });
});
