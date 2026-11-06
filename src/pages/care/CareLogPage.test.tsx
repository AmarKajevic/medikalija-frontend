// Dnevnik nege: filteri idu u upit, pregled po sestri, zbirni brojevi.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import type { NurseEntry } from "@features/nurse-entries/model";

const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));

import CareLogPage from "./CareLogPage";

const entry = (over: Partial<NurseEntry>): NurseEntry => ({
  _id: "e1",
  patient: { _id: "p1", name: "Milica", lastName: "Jovanović" },
  type: "care",
  name: "Promenjene pelene",
  amount: 1,
  note: "",
  performedAt: new Date().toISOString(),
  createdBy: { _id: "n1", name: "Sanja", lastName: "Sestra" },
  status: "logged",
  reviewedBy: null,
  reviewedAt: null,
  rejectReason: "",
  acceptedAmount: null,
  chargedPrice: 0,
  ...over,
});

const entries = [
  entry({ _id: "e1" }),
  entry({ _id: "e2", name: "Kupanje", status: "accepted", chargedPrice: 170 }),
  entry({ _id: "e3", type: "medicine", name: "Andol", status: "pending", createdBy: { _id: "n2", name: "Ana", lastName: "Anić" } }),
];

beforeEach(() => {
  api.get.mockReset();
  api.get.mockImplementation(async (url: string) => {
    if (url.startsWith("/api/nurse-entries")) return { data: { entries } };
    if (url.startsWith("/api/auth/users")) return { data: { users: [{ _id: "n1", name: "Sanja", lastName: "Sestra", role: "nurse" }, { _id: "n2", name: "Ana", lastName: "Anić", role: "nurse" }] } };
    return { data: { patients: [{ _id: "p1", name: "Milica", lastName: "Jovanović" }] } };
  });
});

const lastEntriesUrl = () => {
  const urls = api.get.mock.calls.map((c) => String(c[0])).filter((u) => u.startsWith("/api/nurse-entries"));
  return urls[urls.length - 1]!;
};

describe("CareLogPage", () => {
  it("zbirni brojevi i pregled po sestri", async () => {
    renderWithProviders(<CareLogPage />, { route: "/care-log" });
    expect(await screen.findByText("Promenjene pelene")).toBeInTheDocument();
    expect(screen.getAllByText("170,00 RSD")).toHaveLength(2); // zbir "Naplaćeno" i red u tabeli
    const perNurse = screen.getByRole("button", { name: /Sanja Sestra/ });
    expect(within(perNurse).getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ana Anić/ })).toHaveTextContent("čeka 1");
  });

  it("filteri idu u upit i ostaju u adresi", async () => {
    const { user } = renderWithProviders(<CareLogPage />, { route: "/care-log" });
    await screen.findByText("Promenjene pelene");
    expect(lastEntriesUrl()).toContain("limit=2000");

    await user.click(screen.getByRole("button", { name: "Danas" }));
    await user.click(within(screen.getByRole("group", { name: "Vrsta" })).getByRole("button", { name: "Nega" }));
    await user.click(screen.getByRole("button", { name: /Ana Anić/ }));
    await waitFor(() => {
      const url = lastEntriesUrl();
      expect(url).toContain("type=care");
      expect(url).toContain("createdBy=n2");
    });
    const from = new URLSearchParams(lastEntriesUrl().split("?")[1]).get("from")!;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(new Date(from).getTime()).toBe(today.getTime());
  });
});
