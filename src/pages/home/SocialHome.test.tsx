// Početna socijalnog radnika: radna lista (rokovi + podsetnici po hitnosti), novi korisnici, brzo otvaranje kartona.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { buildSocialTasks, daysFrom, filterTasks } from "@features/social/lib/tasks";
import type { SocialNote } from "@features/social/model";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));
vi.mock("@app/providers/AuthContext", () => ({ useAuth: () => ({ user: { _id: "s", name: "Sanja", lastName: "S", role: "social-worker" } }) }));

import SocialHome from "./SocialHome";

const NOW = new Date();
const iso = (days: number) => {
  const d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const milica = { _id: "p1", name: "Milica", lastName: "Jovanović" };
const note = (id: string, followDays: number, title: string): SocialNote => ({
  _id: id,
  patient: milica,
  author: { _id: "s", name: "S", lastName: "S", role: "social-worker" },
  category: "family",
  date: `${iso(-1)}T10:00:00.000Z`,
  title,
  text: "Tekst beleške",
  contact: "",
  followUp: { date: `${iso(followDays)}T00:00:00.000Z`, done: false, doneAt: null },
  createdAt: `${iso(-1)}T10:00:00.000Z`,
});

describe("radna lista", () => {
  it("rokovi i podsetnici zajedno, kasni prvo; filteri kasni i ova nedelja", () => {
    const tasks = buildSocialTasks(
      [{ patient: milica, kind: "assessment", due: `${iso(-3)}T00:00:00.000Z`, basis: "10 dana od prijema" }],
      [note("n1", 5, "Pozvati CSR"), note("n2", 20, "Posete")],
      { assessment: "Procena" },
      NOW
    );
    expect(tasks.map((t) => t.title)).toEqual(["Procena", "Pozvati CSR", "Posete"]);
    expect(tasks[0]!.days).toBe(-3);
    expect(filterTasks(tasks, "overdue").map((t) => t.title)).toEqual(["Procena"]);
    expect(filterTasks(tasks, "week").map((t) => t.title)).toEqual(["Procena", "Pozvati CSR"]);
    expect(daysFrom(iso(0), NOW)).toBe(0);
  });
});

describe("SocialHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation(async (url: string) => {
      if (url.startsWith("/api/social/deadlines")) return { data: { deadlines: [{ patient: milica, kind: "assessment", due: `${iso(-2)}T00:00:00.000Z`, basis: "10 dana od prijema" }] } };
      if (url.startsWith("/api/social-notes")) return { data: { notes: url.includes("followUp=open") ? [note("n1", 1, "Pozvati CSR")] : [] } };
      if (url.startsWith("/api/patient")) return { data: { patients: [{ ...milica, admissionDate: `${iso(-5)}T00:00:00.000Z`, dischargeDate: null }, { _id: "p2", name: "Stari", lastName: "Korisnik", admissionDate: "2020-01-01T00:00:00.000Z", dischargeDate: null }] } };
      return { data: {} };
    });
  });

  it("prikazuje šta kasni, šta je sledeće i nove korisnike sa linkom na dokumentaciju", async () => {
    renderWithProviders(<SocialHome greeting="Dobar dan" today="ponedeljak" />);
    const list = (await screen.findByText("Procena · Jovanović Milica")).closest("ul")!;
    expect(within(list).getByText("kasni 2 dana")).toBeInTheDocument();
    expect(within(list).getByText("Pozvati CSR · Jovanović Milica")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Procena · Jovanović Milica/ })).toHaveAttribute("href", "/patients/p1?tab=social&social=documents");
    // Novi prijem (5 dana) je na listi, stari korisnik nije
    expect(screen.getByRole("link", { name: /Dokumentacija/ })).toHaveAttribute("href", "/patients/p1?tab=social&social=documents");
    expect(screen.queryByText("Korisnik Stari")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Završi podsetnik: Pozvati CSR" })).toBeInTheDocument();
  });

  it("podsetnik se završava jednim klikom", async () => {
    api.post.mockResolvedValue({ data: { note: {} } });
    const { user } = renderWithProviders(<SocialHome greeting="Dobar dan" today="ponedeljak" />);
    await user.click(await screen.findByRole("button", { name: "Završi podsetnik: Pozvati CSR" }));
    expect(api.post).toHaveBeenCalledWith("/api/social-notes/n1/follow-up", { done: true });
  });
});
