// Unos nege (sestra) i odobravanje (uprava).
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import type { CareTask, NurseEntry } from "./model";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));
const notify = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("@shared/lib/notify", () => ({ notify }));
vi.mock("@app/providers/AuthContext", () => ({ useAuth: () => ({ user: { _id: "n1", name: "Sanja", lastName: "S", role: "nurse" } }) }));

import CareTaskPicker from "./ui/CareTaskPicker";
import EntryReview from "./ui/EntryReview";
import EntryList from "./ui/EntryList";

const tasks: CareTask[] = [
  { _id: "t1", name: "Promenjene pelene", category: "Higijena", article: { _id: "a1", name: "Pelene" }, articleAmount: 1, price: 0, active: true },
  { _id: "t2", name: "Promenjena posteljina", category: "Higijena", article: null, articleAmount: 1, price: 0, active: true },
  { _id: "t3", name: "Merenje pritiska", category: "Merenja", article: null, articleAmount: 1, price: 0, active: true },
];

const entry = (over: Partial<NurseEntry>): NurseEntry => ({
  _id: "e1",
  patient: { _id: "p1", name: "Milica", lastName: "Jovanović" },
  type: "care",
  name: "Promenjene pelene",
  amount: 2,
  note: "",
  performedAt: new Date().toISOString(),
  createdBy: { _id: "n1", name: "Sanja", lastName: "S" },
  status: "pending",
  reviewedBy: null,
  reviewedAt: null,
  rejectReason: "",
  acceptedAmount: null,
  chargedPrice: 0,
  ...over,
});

beforeEach(() => {
  Object.values(api).forEach((f) => f.mockReset());
  Object.values(notify).forEach((f) => f.mockReset());
});

describe("CareTaskPicker", () => {
  beforeEach(() => api.get.mockResolvedValue({ data: { tasks } }));

  it("više usluga odjednom, sa brojem puta, u jednom zahtevu", async () => {
    api.post.mockResolvedValue({ data: { message: "Poslato upravi na odobrenje.", entries: [] } });
    const { user } = renderWithProviders(<CareTaskPicker patientId="p1" />);

    await user.click(await screen.findByRole("button", { name: "Promenjene pelene" }));
    await user.click(screen.getByRole("button", { name: "Više: Promenjene pelene" }));
    await user.click(screen.getByRole("button", { name: "Promenjena posteljina" }));
    expect(screen.getByText(/uprava ga odobrava/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sačuvaj (3)" }));
    expect(api.post).toHaveBeenCalledWith("/api/nurse-entries", {
      patientId: "p1",
      entries: [
        { type: "care", itemId: "t1", amount: 2, note: undefined, performedAt: undefined },
        { type: "care", itemId: "t2", amount: 1, note: undefined, performedAt: undefined },
      ],
    });
    await waitFor(() => expect(notify.success).toHaveBeenCalledWith("Poslato upravi na odobrenje."));
    expect(screen.getByRole("button", { name: "Promenjene pelene" })).toHaveAttribute("aria-pressed", "false");
  });

  it("usluge su grupisane, a besplatne ne traže odobrenje", async () => {
    const { user } = renderWithProviders(<CareTaskPicker patientId="p1" />);
    expect(await screen.findByText("Merenja")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Merenje pritiska" }));
    expect(screen.queryByText(/uprava ga odobrava/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sačuvaj (1)" })).toBeEnabled();
  });

  it("prazan katalog objašnjava šta treba uraditi", async () => {
    api.get.mockResolvedValue({ data: { tasks: [] } });
    renderWithProviders(<CareTaskPicker patientId="p1" />);
    expect(await screen.findByText("Lista usluga je prazna")).toBeInTheDocument();
  });
});

describe("EntryReview", () => {
  const pending = [
    entry({ _id: "e1", name: "Promenjene pelene", amount: 2 }),
    entry({ _id: "e2", type: "medicine", name: "Andol 100mg", amount: 20 }),
  ];
  beforeEach(() => api.get.mockResolvedValue({ data: { entries: pending } }));

  it("prihvatanje jednog unosa sa ispravljenom količinom", async () => {
    api.post.mockResolvedValue({ data: { message: "Prihvaćeno: 1.", results: [{ id: "e2", ok: true, message: "ok" }] } });
    const { user } = renderWithProviders(<EntryReview patientId="p1" />);
    const qty = await screen.findByLabelText("Količina: Andol 100mg");
    await user.clear(qty);
    await user.type(qty, "1,5");
    await user.click(screen.getByRole("button", { name: "Prihvati Andol 100mg" }));
    expect(api.post).toHaveBeenCalledWith("/api/nurse-entries/accept", { items: [{ id: "e2", amount: 1.5 }] });
    await waitFor(() => expect(notify.success).toHaveBeenCalledWith("Prihvaćeno: 1."));
  });

  it("grupno prihvatanje: neuspele stavke ostaju izabrane i prikazuju razlog", async () => {
    api.post.mockResolvedValue({
      data: {
        message: "Prihvaćeno 1 od 2.",
        results: [
          { id: "e1", ok: true, message: "ok" },
          { id: "e2", ok: false, message: "Nedovoljno leka na stanju doma." },
        ],
      },
    });
    const { user } = renderWithProviders(<EntryReview patientId="p1" />);
    await user.click(await screen.findByLabelText(/Izaberi sve/));
    await user.click(screen.getByRole("button", { name: "Prihvati izabrane" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Nedovoljno leka na stanju doma.");
    expect(screen.getByLabelText("Izaberi Andol 100mg")).toBeChecked();
    expect(screen.getByLabelText("Izaberi Promenjene pelene")).not.toBeChecked();
    expect(notify.error).toHaveBeenCalled();
  });

  it("odbijanje sa razlogom", async () => {
    api.post.mockResolvedValue({ data: {} });
    const { user } = renderWithProviders(<EntryReview patientId="p1" />);
    await user.click(await screen.findByRole("button", { name: "Odbij Promenjene pelene" }));
    const dialog = screen.getByRole("dialog", { name: "Odbiti unos?" });
    await user.click(within(dialog).getByRole("button", { name: "Dupli unos" }));
    await user.click(within(dialog).getByRole("button", { name: "Odbij" }));
    expect(api.post).toHaveBeenCalledWith("/api/nurse-entries/e1/reject", { reason: "Dupli unos" });
    await waitFor(() => expect(notify.success).toHaveBeenCalledWith("Unos je odbijen."));
  });

  it("neispravna količina se ne šalje", async () => {
    const { user } = renderWithProviders(<EntryReview patientId="p1" />);
    const qty = await screen.findByLabelText("Količina: Promenjene pelene");
    await user.clear(qty);
    await user.click(screen.getByRole("button", { name: "Prihvati Promenjene pelene" }));
    expect(api.post).not.toHaveBeenCalled();
    expect(notify.error).toHaveBeenCalledWith("Neispravna količina za „Promenjene pelene”.");
  });

  it("bez unosa: sve je pregledano", async () => {
    api.get.mockResolvedValue({ data: { entries: [] } });
    renderWithProviders(<EntryReview />);
    expect(await screen.findByText("Sve je pregledano")).toBeInTheDocument();
  });
});

describe("EntryList", () => {
  it("statusi, razlog odbijanja i povlačenje samo sopstvenog unosa na čekanju", async () => {
    api.get.mockResolvedValue({
      data: {
        entries: [
          entry({ _id: "e1", status: "pending" }),
          entry({ _id: "e2", name: "Kupanje", status: "pending", createdBy: { _id: "n2", name: "Ana", lastName: "A" } }),
          entry({ _id: "e3", name: "Andol", status: "rejected", rejectReason: "Dupli unos", reviewedBy: { _id: "a", name: "Ana", lastName: "Admin" } }),
          entry({ _id: "e4", name: "Pelene", status: "accepted", chargedPrice: 170 }),
        ],
      },
    });
    api.delete.mockResolvedValue({ data: {} });
    const { user } = renderWithProviders(<EntryList patientId="p1" />);

    expect(await screen.findByText("Odbio/la Ana Admin: Dupli unos")).toBeInTheDocument();
    expect(screen.getByText("Naplaćeno 170,00 RSD")).toBeInTheDocument();
    expect(screen.getAllByText("Čeka odobrenje")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /Povuci unos/ })).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Povuci unos Promenjene pelene" }));
    await user.click(screen.getByRole("button", { name: "Povuci unos" }));
    expect(api.delete).toHaveBeenCalledWith("/api/nurse-entries/e1");
  });
});
