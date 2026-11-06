// Stranica kalendara se iscrtava bez beskonačne petlje, učitava samo vidljivi opseg
// i poštuje prava (sestra bez "Novi događaj").
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));
vi.mock("@shared/lib/notify", () => ({ notify: { success: vi.fn(), error: vi.fn() } }));
const auth = vi.hoisted(() => ({ role: "admin" }));
vi.mock("@app/providers/AuthContext", () => ({ useAuth: () => ({ user: { _id: "u1", name: "Ana", lastName: "A", role: auth.role } }) }));

import CalendarPage from "./CalendarPage";

// FullCalendar meri elemente
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const event = {
  id: "e1",
  eventId: "e1",
  title: "Pregled kardiologa",
  description: "",
  location: "",
  calendar: "plava",
  patient: null,
  allDay: false,
  start: new Date(2026, 10, 4, 10, 0).toISOString(),
  end: new Date(2026, 10, 4, 11, 0).toISOString(),
  occurrenceStart: new Date(2026, 10, 4, 10, 0).toISOString(),
  recurring: false,
  recurrence: null,
  series: null,
  isException: false,
  createdBy: null,
};

beforeEach(() => {
  api.get.mockReset();
  api.get.mockResolvedValue({ data: { events: [event], patients: [] } });
  auth.role = "admin";
  localStorage.clear();
});

describe("CalendarPage", () => {
  it("nedeljni prikaz iz adrese: naslov, događaj, upit samo za tu nedelju", async () => {
    renderWithProviders(<CalendarPage />, { route: "/calendar?view=week&date=2026-11-02" });
    expect(await screen.findByText(/2\s*–\s*8\. nov 2026/)).toBeInTheDocument();
    expect(await screen.findAllByText("Pregled kardiologa")).not.toHaveLength(0);
    const url = api.get.mock.calls.map((c) => String(c[0])).find((u) => u.includes("from=") && u.includes(encodeURIComponent(new Date(2026, 10, 2).toISOString())));
    expect(url).toBeDefined();
    expect(screen.getByRole("tab", { name: "Nedelja" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: /Novi događaj/ })).toBeInTheDocument();
  });

  it("promena prikaza i skrivanje vrste", async () => {
    const { user } = renderWithProviders(<CalendarPage />, { route: "/calendar?view=week&date=2026-11-02" });
    await screen.findAllByText("Pregled kardiologa");
    await user.click(screen.getByRole("tab", { name: "Mesec" }));
    await waitFor(() => expect(screen.getByRole("tab", { name: "Mesec" })).toHaveAttribute("aria-selected", "true"));
    expect(document.querySelector(".fc-dayGridMonth-view")).not.toBeNull();
    await user.click(screen.getByRole("checkbox", { name: /Pregled \/ termin/ }));
    await waitFor(() => expect(document.querySelector(".fc-event")).toBeNull());
    expect(JSON.parse(localStorage.getItem("calendar.hidden") ?? "[]")).toEqual(["plava"]);
  });

  it("sestra: samo pregled", async () => {
    auth.role = "nurse";
    renderWithProviders(<CalendarPage />, { route: "/calendar?view=week&date=2026-11-02" });
    await screen.findAllByText("Pregled kardiologa");
    expect(screen.queryByRole("button", { name: /Novi/ })).not.toBeInTheDocument();
  });
});
