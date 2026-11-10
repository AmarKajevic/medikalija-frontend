// Socijalni dosije: JMBG, lični podaci, procene i individualni plan, rokovi.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";

const api = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));
vi.mock("@shared/lib/notify", () => ({ notify: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import { deadlineState, isValidJmbg } from "./dossier";
import SocialProfileDialog from "./ui/SocialProfileDialog";
import SocialDocumentDialog from "./ui/SocialDocumentDialog";
import SocialDeadlinesList from "./ui/SocialDeadlinesList";
import { notify } from "@shared/lib/notify";

/** Ispravan JMBG od prvih 12 cifara */
function jmbgFrom(first12: string) {
  const d = [...first12].map(Number);
  const sum = [7, 6, 5, 4, 3, 2].reduce((s, k, i) => s + k * (d[i]! + d[i + 6]!), 0);
  const m = 11 - (sum % 11);
  return first12 + String(m > 9 ? 0 : m);
}
const isoIn = (days: number) => {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() + days)).toISOString();
};

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  api.get.mockImplementation(async (url: string) => (url === "/api/social/staff" ? { data: { staff: [] } } : { data: {} }));
  vi.mocked(notify.error).mockReset();
});

describe("pomoćne funkcije", () => {
  it("JMBG: 13 cifara i kontrolna cifra", () => {
    const ok = jmbgFrom("010194071001");
    expect(isValidJmbg(ok)).toBe(true);
    expect(isValidJmbg(ok.slice(0, 12) + String((Number(ok[12]) + 1) % 10))).toBe(false);
    expect(isValidJmbg("12345")).toBe(false);
  });

  it("stanje roka: kasni, uskoro, kasnije", () => {
    expect(deadlineState(isoIn(-3))).toEqual({ label: "kasni 3 dana", tone: "error" });
    expect(deadlineState(isoIn(0)).label).toBe("danas");
    expect(deadlineState(isoIn(5)).tone).toBe("warning");
    expect(deadlineState(isoIn(60)).tone).toBe("light");
  });
});

describe("lični podaci", () => {
  it("neispravan JMBG se ne šalje; ispravan se čuva sa kontaktima i staratelj se traži samo kad treba", async () => {
    api.put.mockResolvedValue({ data: { profile: {} } });
    const { user } = renderWithProviders(<SocialProfileDialog open onClose={vi.fn()} patientId="p1" profile={null} />);
    expect(screen.queryByLabelText("Staratelj")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Poslovna sposobnost"), "partial");
    expect(screen.getByLabelText("Staratelj")).toBeInTheDocument();

    await user.type(screen.getByLabelText("JMBG"), "0101940710010");
    expect(screen.getByText(/JMBG nije ispravan/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sačuvaj" }));
    expect(api.put).not.toHaveBeenCalled();

    const ok = jmbgFrom("010194071001");
    await user.clear(screen.getByLabelText("JMBG"));
    await user.type(screen.getByLabelText("JMBG"), ok);
    await user.click(screen.getByRole("button", { name: "Dodaj kontakt" }));
    await user.type(screen.getByLabelText("Kontakt 1: ime i prezime"), "Marko Petrović");
    await user.click(screen.getByLabelText("Hitni kontakt"));
    await user.click(screen.getByRole("button", { name: "Sačuvaj" }));
    expect(api.put).toHaveBeenCalledWith(
      "/api/social/profile/p1",
      expect.objectContaining({ jmbg: ok, legalCapacity: "partial", contacts: [expect.objectContaining({ name: "Marko Petrović", emergency: true })] })
    );
  });
});

describe("individualni plan", () => {
  it("novi plan ima cilj i rok za pregled za 12 meseci; Zaključi čuva pa zaključuje", async () => {
    api.post.mockImplementation(async (url: string) => (url.endsWith("/finalize") ? { data: { document: { _id: "d1", status: "final" } } } : { data: { document: { _id: "d1" } } }));
    const onClose = vi.fn();
    const { user } = renderWithProviders(<SocialDocumentDialog open onClose={onClose} patientId="p1" patientName="Petar Petrović" type="plan" canWrite />);
    await user.type(screen.getByLabelText("Cilj"), "Uključiti u radno-okupacione aktivnosti");
    await user.click(screen.getByRole("button", { name: "Zaključi" }));
    await user.click(within(screen.getByRole("dialog", { name: /Zaključiti/ })).getByRole("button", { name: "Zaključi" }));

    const [url, body] = api.post.mock.calls[0]!;
    expect(url).toBe("/api/social/documents");
    expect(body).toMatchObject({ patientId: "p1", type: "plan", goals: [expect.objectContaining({ goal: "Uključiti u radno-okupacione aktivnosti" })] });
    const date = new Date(`${body.date}T12:00:00`);
    date.setMonth(date.getMonth() + 12);
    expect(body.nextReview).toBe(date.toISOString().slice(0, 10));
    expect(api.post).toHaveBeenLastCalledWith("/api/social/documents/d1/finalize");
    expect(onClose).toHaveBeenCalled();
  });

  it("pregled plana kreće od ciljeva poslednjeg plana; zaključen dokument je samo za čitanje", () => {
    const goals = [{ _id: "g1", goal: "Šetnja svaki dan", outcome: "", activities: "", responsible: "", due: null, status: "" as const }];
    const { unmount } = renderWithProviders(<SocialDocumentDialog open onClose={vi.fn()} patientId="p1" patientName="P" type="plan_review" canWrite previousGoals={goals} />);
    expect(screen.getByLabelText("Cilj")).toHaveValue("Šetnja svaki dan");
    unmount();

    const finalDoc = {
      _id: "d2",
      type: "assessment" as const,
      date: "2026-11-05T00:00:00.000Z",
      status: "final" as const,
      sections: { health: "Dijabetes" },
      supportLevel: 2,
      participants: "korisnik",
      goals: [],
      nextReview: null,
      author: { _id: "u", name: "S", lastName: "R", role: "social-worker" },
      finalizedBy: null,
      finalizedAt: "2026-11-06T00:00:00.000Z",
    };
    renderWithProviders(<SocialDocumentDialog open onClose={vi.fn()} patientId="p1" patientName="P" type="assessment" document={finalDoc} canWrite />);
    expect(screen.getByLabelText("Zdravstveno stanje")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Zaključi" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Rizici")).not.toBeInTheDocument(); // prazni delovi se ne prikazuju
  });
});

describe("rokovi", () => {
  it("prikazuje rokove u narednih 30 dana, kasni prvi; ostali na zahtev", async () => {
    api.get.mockResolvedValue({
      data: {
        deadlines: [
          { patient: { _id: "a", name: "Ana", lastName: "Anić" }, kind: "assessment", due: isoIn(-2), basis: "10 dana od prijema" },
          { patient: { _id: "b", name: "Bora", lastName: "Borić" }, kind: "review", due: isoIn(90), basis: "rok iz plana" },
        ],
      },
    });
    const { user } = renderWithProviders(<SocialDeadlinesList />);
    expect(await screen.findByText("Anić Ana")).toBeInTheDocument();
    expect(screen.getByText("kasni 2 dana")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Anić Ana/ })).toHaveAttribute("href", "/patients/a?tab=social");
    expect(screen.queryByText("Borić Bora")).not.toBeInTheDocument();
    await user.click(screen.getByLabelText(/Prikaži i rokove posle 30 dana/));
    expect(screen.getByText("Borić Bora")).toBeInTheDocument();
  });
});
