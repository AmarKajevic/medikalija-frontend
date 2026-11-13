// Fizioterapija: unos terapije i odobravanje vanredne sa cenom.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import type { NurseEntry } from "@features/nurse-entries/model";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));
const notify = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("@shared/lib/notify", () => ({ notify }));
vi.mock("@app/providers/AuthContext", () => ({ useAuth: () => ({ user: { _id: "f1", name: "Fiz", lastName: "T", role: "physiotherapist" } }) }));

import PhysioEntryForm from "./ui/PhysioEntryForm";
import EntryReview from "@features/nurse-entries/ui/EntryReview";

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
  notify.success.mockReset();
  notify.error.mockReset();
});

describe("PhysioEntryForm", () => {
  it("vanredna terapija za izabranog pacijenta ide upravi na odobrenje", async () => {
    api.get.mockResolvedValue({ data: { patients: [{ _id: "p1", name: "Milica", lastName: "Jovanović" }, { _id: "p2", name: "Stevan", lastName: "Đurić", dischargeDate: "2026-01-01" }] } });
    api.post.mockResolvedValue({ data: { message: "ok", entries: [] } });
    const { user } = renderWithProviders(<PhysioEntryForm />);
    await user.click(screen.getByLabelText("Pacijent"));
    expect(screen.queryByRole("option", { name: /Đurić/ })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("option", { name: /Milica Jovanović/ }));
    await user.click(screen.getByLabelText(/Grupna fizikalna terapija/));
    await user.click(screen.getByRole("button", { name: /Vanredna/ }));
    await user.type(screen.getByLabelText(/Napomena/), "posle pada");
    await user.click(screen.getByRole("button", { name: "Pošalji na odobrenje" }));
    expect(api.post).toHaveBeenCalledWith("/api/nurse-entries", {
      patientId: "p1",
      entries: [{ type: "physio", physioKind: "group", extra: true, note: "posle pada", performedAt: undefined }],
      specificationId: undefined,
    });
    await waitFor(() => expect(notify.success).toHaveBeenCalledWith("Vanredna terapija je poslata upravi na odobrenje."));
  });

  it("nudi i vrste koje je admin dodao u cenovnik", async () => {
    api.get.mockImplementation(async (url: string) =>
      url === "/api/physio-prices/kinds" ? { data: { kinds: [{ kind: "active", name: "Individualna aktivna fizikalna terapija" }, { kind: "c1", name: "Limfna drenaža" }] } } : { data: {} }
    );
    api.post.mockResolvedValue({ data: { message: "ok", entries: [] } });
    const { user } = renderWithProviders(<PhysioEntryForm patientId="p1" />);
    await user.click(await screen.findByLabelText(/Limfna drenaža/));
    await user.click(screen.getByRole("button", { name: "Zabeleži terapiju" }));
    expect(api.post).toHaveBeenCalledWith("/api/nurse-entries", expect.objectContaining({ entries: [expect.objectContaining({ physioKind: "c1" })] }));
  });

  it("redovna se samo beleži; bez vrste terapije nema slanja", async () => {
    api.post.mockResolvedValue({ data: { message: "ok", entries: [] } });
    const { user } = renderWithProviders(<PhysioEntryForm patientId="p1" />);
    expect(screen.queryByLabelText("Pacijent")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zabeleži terapiju" })).toBeDisabled();
    await user.click(screen.getByLabelText(/Individualna aktivna/));
    await user.click(screen.getByRole("button", { name: "Zabeleži terapiju" }));
    expect(api.post).toHaveBeenCalledWith("/api/nurse-entries", expect.objectContaining({ entries: [expect.objectContaining({ physioKind: "active", extra: false })] }));
  });
});

describe("odobravanje vanredne terapije", () => {
  const physio: NurseEntry = {
    _id: "e9",
    patient: { _id: "p1", name: "Milica", lastName: "Jovanović" },
    type: "physio",
    physioKind: "passive",
    extra: true,
    name: "Individualna pasivna fizikalna terapija (vanredna)",
    amount: 1,
    note: "",
    performedAt: new Date().toISOString(),
    createdBy: { _id: "f1", name: "Fiz", lastName: "T" },
    status: "pending",
    reviewedBy: null,
    reviewedAt: null,
    rejectReason: "",
    acceptedAmount: null,
    chargedPrice: 0,
  };

  it("cena se uzima iz cenovnika; bez cene u cenovniku se ne prihvata", async () => {
    let prices = [{ kind: "passive", priceRSD: null as number | null }];
    api.get.mockImplementation(async (url: string) => (url.startsWith("/api/physio-prices") ? { data: { prices } } : { data: { entries: [physio] } }));
    api.post.mockResolvedValue({ data: { message: "Prihvaćeno: 1.", results: [{ id: "e9", ok: true, message: "ok" }] } });
    const first = renderWithProviders(<EntryReview patientId="p1" />);
    expect(await screen.findByRole("link", { name: "Cena nije uneta" })).toBeInTheDocument();
    await first.user.click(screen.getByRole("button", { name: `Prihvati ${physio.name}` }));
    expect(api.post).not.toHaveBeenCalled();
    expect(notify.error).toHaveBeenCalledWith(`Cena za „${physio.name}” nije uneta. Admin je unosi u „Cene fizioterapije”.`);
    first.unmount();

    prices = [{ kind: "passive", priceRSD: 1500 }];
    const { user } = renderWithProviders(<EntryReview patientId="p1" />);
    expect(await screen.findByText(/1\.500,00/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Cena:/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: `Prihvati ${physio.name}` }));
    expect(api.post).toHaveBeenCalledWith("/api/nurse-entries/accept", { items: [{ id: "e9" }] });
  });
;
});
