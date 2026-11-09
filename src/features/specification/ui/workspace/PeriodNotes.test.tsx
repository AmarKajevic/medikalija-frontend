// Zabeleške sestara u periodu specifikacije: upit za period, grupisanje po danu, "Dodaj kao trošak".
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../../test/render";
import type { Specification } from "@features/specification/types/types";

const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));

import PeriodNotes from "./PeriodNotes";

const spec = { _id: "s1", patientName: "", startDate: "2026-10-25T00:00:00.000Z", endDate: "2026-11-23T00:00:00.000Z", totalPrice: 0, isActive: true, items: [] } as Specification;
const sestra = { _id: "n1", name: "Sanja", lastName: "Sestra", role: "nurse" };

beforeEach(() => {
  api.get.mockReset();
  api.get.mockImplementation(async (url: string) =>
    url.startsWith("/api/diagnosis")
      ? {
          data: {
            diagnosis: [
              { _id: "d1", description: "Vodila pacijenta kod stomatologa\nvađenje zuba", createdAt: new Date(2026, 10, 5, 10, 15).toISOString(), createdBy: sestra },
              { _id: "d2", description: "Izmeren pritisak 140/90", createdAt: new Date(2026, 10, 5, 8, 0).toISOString(), createdBy: sestra },
              { _id: "d3", description: "Previjanje rane", createdAt: new Date(2026, 10, 3, 9, 0).toISOString(), createdBy: sestra },
            ],
          },
        }
      : { data: { entries: [] } }
  );
});

describe("PeriodNotes", () => {
  it("traži samo period specifikacije i grupiše po danima", async () => {
    renderWithProviders(<PeriodNotes specification={spec} patientId="p1" />);
    expect(await screen.findByText("Previjanje rane")).toBeInTheDocument();
    const url = String(api.get.mock.calls.find((c) => String(c[0]).startsWith("/api/diagnosis"))![0]);
    const p = new URLSearchParams(url.split("?")[1]);
    expect(new Date(p.get("from")!).getTime()).toBe(new Date(2026, 9, 25).getTime());
    expect(new Date(p.get("to")!).getTime()).toBe(new Date(2026, 10, 24).getTime());
    expect(screen.getByRole("tab", { name: /Učinak rada \(3\)/ })).toBeInTheDocument();
    expect(screen.getAllByText(/^(čet|uto)/i)).toHaveLength(2); // 5. i 3. novembar
    expect(screen.queryByRole("button", { name: /Dodaj kao trošak/ })).not.toBeInTheDocument(); // zatvoren period / bez prava
  });

  it("sve na jednom mestu: učinak, unosi sestara i fizioterapija (i ono što se ne naplaćuje)", async () => {
    const fizio = { _id: "f1", name: "Fica", lastName: "Fizio", role: "physiotherapist" };
    const entry = (id: string, over: object) => ({ _id: id, patient: "p1", amount: 1, note: "", performedAt: new Date(2026, 10, 4, 11, 0).toISOString(), createdBy: sestra, ...over });
    api.get.mockImplementation(async (url: string) =>
      url.startsWith("/api/diagnosis")
        ? { data: { diagnosis: [{ _id: "d1", description: "Izmeren pritisak", createdAt: new Date(2026, 10, 5, 8, 0).toISOString(), createdBy: sestra }] } }
        : {
            data: {
              entries: [
                entry("e1", { type: "care", name: "Kupanje", status: "accepted" }),
                entry("e2", { type: "physio", name: "Grupna fizikalna terapija", status: "logged", createdBy: fizio }),
                entry("e3", { type: "physio", name: "Individualna aktivna fizikalna terapija (vanredna)", status: "pending", createdBy: fizio }),
              ],
            },
          }
    );
    const { user } = renderWithProviders(<PeriodNotes specification={spec} patientId="p1" />);
    expect(await screen.findByRole("tab", { name: "Sve (4)" })).toBeInTheDocument();
    expect(screen.getByText("Izmeren pritisak")).toBeInTheDocument();
    expect(screen.getByText("Kupanje")).toBeInTheDocument();
    expect(screen.getByText("Redovna · ne naplaćuje se")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Unosi sestara (1)" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Fizioterapija (2)" }));
    expect(screen.queryByText("Kupanje")).not.toBeInTheDocument();
    expect(screen.queryByText("Izmeren pritisak")).not.toBeInTheDocument();
    expect(screen.getByText("Grupna fizikalna terapija")).toBeInTheDocument();
    expect(screen.getByText("Čeka odobrenje")).toBeInTheDocument();
  });

  it("'Dodaj kao trošak' šalje prvi red beleške", async () => {
    const onAdd = vi.fn();
    const { user } = renderWithProviders(<PeriodNotes specification={spec} patientId="p1" onAddAsCost={onAdd} />);
    await user.click(await screen.findByRole("button", { name: /Dodaj kao trošak: Vodila pacijenta/ }));
    expect(onAdd).toHaveBeenCalledWith("Vodila pacijenta kod stomatologa");
  });
});
