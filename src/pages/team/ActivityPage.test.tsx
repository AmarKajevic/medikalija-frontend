// Aktivnosti: šta je ko od osoblja dodao, filter po osobi i vrsti.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";

const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));

import ActivityPage from "./ActivityPage";

const sanja = { _id: "u1", name: "Sanja", lastName: "Sestra", role: "nurse" };
const fica = { _id: "u2", name: "Fica", lastName: "Fizio", role: "physiotherapist" };
const milica = { _id: "p1", name: "Milica", lastName: "Jovanović" };
const at = (h: number) => new Date(2026, 10, 9, h, 0).toISOString();

beforeEach(() => {
  api.get.mockReset();
  api.get.mockResolvedValue({
    data: {
      activity: [
        { id: "a1", kind: "physio", at: at(12), patient: milica, by: fica, title: "Grupna fizikalna terapija", detail: "", status: "logged" },
        { id: "a2", kind: "note", at: at(10), patient: milica, by: sanja, title: "Učinak rada / dijagnoza", detail: "Pritisak 130/80", status: "note" },
        { id: "a3", kind: "medicine", at: at(9), patient: milica, by: sanja, title: "Andol × 2", detail: "posle ručka", status: "pending" },
      ],
    },
  });
});

const tableRows = () => screen.getAllByRole("row").slice(1);

describe("ActivityPage", () => {
  it("prikazuje ko je šta dodao, sa statusom; ko koliko", async () => {
    renderWithProviders(<ActivityPage />);
    expect(await screen.findByText("Pritisak 130/80")).toBeInTheDocument();
    expect(tableRows()).toHaveLength(3);
    expect(screen.getByText("Zabeleženo · ne naplaćuje se")).toBeInTheDocument();
    expect(screen.getByText("Čeka odobrenje")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Milica Jovanović" })[0]).toHaveAttribute("href", "/patients/p1");
    const people = within(screen.getByRole("group", { name: "Osoblje" })).getAllByRole("button");
    expect(people.map((b) => b.textContent)).toEqual([expect.stringMatching(/^Sanja Sestra.*2$/), expect.stringMatching(/^Fica Fizio.*1$/)]);
    // Podrazumevano poslednjih 7 dana
    const p = new URLSearchParams(String(api.get.mock.calls[0]![0]).split("?")[1]);
    expect(Date.now() - new Date(p.get("from")!).getTime()).toBeLessThanOrEqual(7 * 86_400_000);
  });

  it("filter po osobi i vrsti", async () => {
    const { user } = renderWithProviders(<ActivityPage />);
    await screen.findByText("Pritisak 130/80");
    await user.click(screen.getByRole("button", { name: /Fica Fizio/ }));
    expect(tableRows()).toHaveLength(1);
    expect(screen.getByText(/Grupna fizikalna terapija/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Fica Fizio/ }));
    await user.selectOptions(screen.getByLabelText("Vrsta unosa"), "medicine");
    expect(tableRows()).toHaveLength(1);
    expect(screen.getByText(/Andol × 2/)).toBeInTheDocument();
  });
});
