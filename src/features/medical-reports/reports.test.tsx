// Lekarski izveštaji i socijalni karton: unos, automatsko čuvanje, potpis, prava.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { Route } from "react-router";
import { screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import type { MedicalReport } from "./model";
import type { SocialNote } from "@features/social/model";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));
const notify = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("@shared/lib/notify", () => ({ notify }));
const auth = vi.hoisted(() => ({ user: { _id: "d1", name: "Petar", lastName: "Lekić", role: "doctor" } }));
vi.mock("@app/providers/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));

import DiagnosisPicker from "./ui/DiagnosisPicker";
import ReportPage from "@pages/reports/ReportPage";
import SocialNoteDialog from "@features/social/ui/SocialNoteDialog";
import SocialNotesList from "@features/social/ui/SocialNotesList";

const patient = { _id: "p1", name: "Milica", lastName: "Jovanović", dateOfBirth: "1938-04-12T00:00:00.000Z" };

const report = (over: Partial<MedicalReport> = {}): MedicalReport => ({
  _id: "r1",
  patient,
  author: { _id: "d1", name: "Petar", lastName: "Lekić", role: "doctor" },
  type: "exam",
  visitDate: "2026-11-05T09:00:00.000Z",
  vitals: { bloodPressure: "135/85", pulse: 78, temperature: 36.6, spo2: null, glucose: null, weight: null },
  anamnesis: "Vrtoglavica.",
  findings: "Uredan nalaz.",
  diagnoses: [{ code: "I10", name: "Esencijalna (primarna) hipertenzija" }],
  therapy: "Concor 5mg 1x1",
  conclusion: "",
  followUp: { date: null, note: "" },
  status: "draft",
  signedAt: null,
  addenda: [],
  createdAt: "2026-11-05T09:10:00.000Z",
  updatedAt: "2026-11-05T09:10:00.000Z",
  ...over,
});

beforeEach(() => {
  Object.values(api).forEach((f) => f.mockReset());
  Object.values(notify).forEach((f) => f.mockReset());
  auth.user = { _id: "d1", name: "Petar", lastName: "Lekić", role: "doctor" };
});

describe("DiagnosisPicker", () => {
  function Harness() {
    const [v, setV] = useState<Array<{ code: string; name: string }>>([]);
    return <DiagnosisPicker value={v} onChange={setV} />;
  }

  it("bira iz čestih po nazivu ili šifri, dodaje sopstvenu, proverava MKB oblik", async () => {
    const { user } = renderWithProviders(<Harness />);
    await user.type(screen.getByLabelText("Dodaj dijagnozu"), "hipertenz");
    await user.click(screen.getByRole("option", { name: /I10 · Esencijalna/ }));
    expect(screen.getByRole("list", { name: "Izabrane dijagnoze" })).toHaveTextContent("I10");

    await user.click(screen.getByRole("button", { name: /Dijagnoza koje nema na listi/ }));
    await user.type(screen.getByLabelText("MKB-10 šifra"), "HTN");
    await user.type(screen.getByLabelText("Naziv dijagnoze"), "Nešto{Enter}");
    expect(notify.error).toHaveBeenCalledWith(expect.stringContaining("MKB-10"));

    await user.clear(screen.getByLabelText("MKB-10 šifra"));
    await user.type(screen.getByLabelText("MKB-10 šifra"), "r41.0");
    await user.click(screen.getByRole("button", { name: "Dodaj" }));
    expect(screen.getByRole("list", { name: "Izabrane dijagnoze" })).toHaveTextContent("R41.0");

    await user.click(screen.getByRole("button", { name: "Ukloni Esencijalna (primarna) hipertenzija" }));
    expect(screen.getByRole("list", { name: "Izabrane dijagnoze" })).not.toHaveTextContent("I10");
  });
});

describe("ReportPage", () => {
  const routes = { path: "/reports/:reportId", extraRoutes: <Route path="/patients/:id" element={<p>profil</p>} /> };

  it("nov izveštaj se sam čuva kao nacrt, pa se potpisuje", async () => {
    api.get.mockImplementation(async (url: string) => {
      if (url.startsWith("/api/patient")) return { data: { patients: [patient] } };
      if (url.startsWith("/api/medical-reports/r1")) return { data: { report: report() } };
      if (url.startsWith("/api/medical-reports")) return { data: { reports: [] } };
      return { data: {} };
    });
    api.post.mockImplementation(async (url: string) => (url.endsWith("/sign") ? { data: { report: report({ status: "signed", signedAt: new Date().toISOString() }) } } : { data: { report: report() } }));
    api.put.mockResolvedValue({ data: { report: report() } });

    const { user } = renderWithProviders(<ReportPage />, { route: "/reports/new?patient=p1", ...routes });
    expect(await screen.findByText("Nov lekarski izveštaj")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Anamneza/), "Vrtoglavica.");
    await user.type(screen.getByLabelText("Pritisak"), "135/85");
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/api/medical-reports", expect.objectContaining({ patientId: "p1", anamnesis: "Vrtoglavica." })), { timeout: 4000 });
    expect(api.post.mock.calls[0]![1].vitals.bloodPressure).toBe("135/85");

    await user.click(await screen.findByRole("button", { name: "Potpiši" }));
    await user.click(within(screen.getByRole("dialog", { name: "Potpisati izveštaj?" })).getByRole("button", { name: "Potpiši" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/api/medical-reports/r1/sign"));
    expect(notify.success).toHaveBeenCalledWith("Izveštaj je potpisan.");
  }, 15_000);

  it("sestra vidi potpisan izveštaj samo za čitanje", async () => {
    auth.user = { _id: "n1", name: "Sanja", lastName: "Sestra", role: "nurse" };
    api.get.mockImplementation(async (url: string) => {
      if (url.startsWith("/api/medical-reports/r1")) return { data: { report: report({ status: "signed", signedAt: "2026-11-05T09:30:00.000Z" }) } };
      if (url.startsWith("/api/medical-reports")) return { data: { reports: [] } };
      return { data: { patients: [patient] } };
    });
    renderWithProviders(<ReportPage />, { route: "/reports/r1", ...routes });
    expect(await screen.findByText(/Izveštaj je zaključan/)).toBeInTheDocument();
    expect(screen.getByText("Concor 5mg 1x1")).toBeInTheDocument();
    expect(screen.getByText("135/85 mmHg")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Potpiši" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Dodaj dopunu/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Anamneza/)).not.toBeInTheDocument();
  });

  it("doktor dodaje dopunu potpisanom izveštaju", async () => {
    api.get.mockImplementation(async (url: string) => {
      if (url.startsWith("/api/medical-reports/r1")) return { data: { report: report({ status: "signed", signedAt: "2026-11-05T09:30:00.000Z" }) } };
      if (url.startsWith("/api/medical-reports")) return { data: { reports: [] } };
      return { data: { patients: [patient] } };
    });
    api.post.mockResolvedValue({ data: { report: report({ status: "signed" }) } });
    const { user } = renderWithProviders(<ReportPage />, { route: "/reports/r1", ...routes });
    await user.click(await screen.findByRole("button", { name: /Dodaj dopunu/ }));
    await user.type(screen.getByLabelText("Tekst dopune"), "Kontrola za 7 dana.");
    await user.click(screen.getByRole("button", { name: "Sačuvaj dopunu" }));
    expect(api.post).toHaveBeenCalledWith("/api/medical-reports/r1/addenda", { text: "Kontrola za 7 dana." });
  });
});

describe("socijalni karton", () => {
  const note = (over: Partial<SocialNote> = {}): SocialNote => ({
    _id: "s1",
    patient: { _id: "p1", name: "Milica", lastName: "Jovanović" },
    author: { _id: "sw1", name: "Jelena", lastName: "Socijalna", role: "social-worker" },
    category: "family",
    date: "2026-11-05T12:00:00.000Z",
    title: "",
    text: "Razgovor sa sinom.",
    contact: "sin Marko",
    followUp: { date: new Date(Date.now() - 2 * 86_400_000).toISOString(), done: false, doneAt: null },
    createdAt: "2026-11-05T12:00:00.000Z",
    ...over,
  });

  it("nova beleška sa vrstom, kontaktom i podsetnikom", async () => {
    auth.user = { _id: "sw1", name: "Jelena", lastName: "Socijalna", role: "social-worker" };
    api.get.mockResolvedValue({ data: { patients: [patient] } });
    api.post.mockResolvedValue({ data: { note: note() } });
    const onClose = vi.fn();
    const { user } = renderWithProviders(<SocialNoteDialog open onClose={onClose} patientId="p1" />);
    await user.click(screen.getByRole("button", { name: "CSR i ustanove" }));
    await user.type(screen.getByLabelText("Beleška"), "Predat zahtev za tuđu negu.");
    await user.type(screen.getByLabelText(/Kontakt/), "CSR Novi Sad");
    await user.click(screen.getByRole("button", { name: "Sačuvaj" }));
    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(api.post.mock.calls[0]![1]).toMatchObject({ patientId: "p1", category: "institution", text: "Predat zahtev za tuđu negu.", contact: "CSR Novi Sad", followUp: { date: null } });
    expect(onClose).toHaveBeenCalled();
  });

  it("podsetnik koji kasni; zatvara ga samo autor", async () => {
    auth.user = { _id: "sw1", name: "Jelena", lastName: "Socijalna", role: "social-worker" };
    api.post.mockResolvedValue({ data: { note: note() } });
    const { user, unmount } = renderWithProviders(<SocialNotesList notes={[note()]} />);
    expect(screen.getByText(/kasni 2 dana/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Urađeno/ }));
    expect(api.post).toHaveBeenCalledWith("/api/social-notes/s1/follow-up", { done: true });
    unmount();

    auth.user = { _id: "d1", name: "Petar", lastName: "Lekić", role: "doctor" };
    renderWithProviders(<SocialNotesList notes={[note()]} />);
    expect(screen.queryByRole("button", { name: /Urađeno/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Akcije za belešku" })).not.toBeInTheDocument();
  });
});
