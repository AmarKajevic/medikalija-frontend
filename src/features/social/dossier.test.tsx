// Socijalni dosije: JMBG, podaci korisnika (delimično čuvanje, jedan izvor), novi korisnik,
// procene i individualni plan, rokovi, Word šabloni.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import PizZip from "pizzip";
import { renderWithProviders } from "../../test/render";

const api = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));
vi.mock("@shared/lib/notify", () => ({ notify: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
const navigate = vi.hoisted(() => vi.fn());
vi.mock("react-router", async (orig) => ({ ...(await orig<typeof import("react-router")>()), useNavigate: () => navigate }));

import { changedFields, deadlineState, DossierPatient, isValidJmbg, jmbgInfo, SocialDocument, SocialProfile } from "./dossier";
import SocialProfileDialog from "./ui/SocialProfileDialog";
import NewResidentDialog from "./ui/NewResidentDialog";
import SocialDocumentDialog from "./ui/SocialDocumentDialog";
import SocialDeadlinesList from "./ui/SocialDeadlinesList";
import { checkTemplate, fillTemplate } from "./lib/wordTemplate";
import { notify } from "@shared/lib/notify";

/** Ispravan JMBG od prvih 12 cifara */
function jmbgFrom(first12: string) {
  const d = [...first12].map(Number);
  const sum = [7, 6, 5, 4, 3, 2].reduce((s, k, i) => s + k * (d[i]! + d[i + 6]!), 0);
  const m = 11 - (sum % 11);
  return first12 + String(m > 9 ? 0 : m);
}
// Žensko, rođena 15.03.1938.
const MILICA_JMBG = jmbgFrom("150393871550");
const isoIn = (days: number) => {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() + days)).toISOString();
};

const patient: DossierPatient = { _id: "p1", name: "Milica", lastName: "Jovanović", dateOfBirth: null, address: "", admissionDate: "2026-09-01T00:00:00.000Z" };

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  api.get.mockImplementation(async (url: string) => (url === "/api/social/staff" ? { data: { staff: [] } } : { data: {} }));
  vi.mocked(notify.error).mockReset();
  navigate.mockReset();
  localStorage.clear();
});

describe("pomoćne funkcije", () => {
  it("JMBG: kontrolna cifra, datum rođenja i pol", () => {
    expect(isValidJmbg(MILICA_JMBG)).toBe(true);
    expect(isValidJmbg(MILICA_JMBG.slice(0, 12) + String((Number(MILICA_JMBG[12]) + 1) % 10))).toBe(false);
    expect(jmbgInfo(MILICA_JMBG)).toEqual({ birthDate: "1938-03-15", sex: "Ž" });
    expect(jmbgInfo("12345")).toBeNull();
  });

  it("samo promenjena polja; stanje roka", () => {
    expect(changedFields({ a: 1, b: [1], c: "x" }, { a: 1, b: [1, 2], c: "y" })).toEqual({ b: [1, 2], c: "y" });
    expect(deadlineState(isoIn(-3))).toEqual({ label: "kasni 3 dana", tone: "error" });
    expect(deadlineState(isoIn(5)).tone).toBe("warning");
    expect(deadlineState(isoIn(60)).tone).toBe("light");
  });
});

describe("podaci korisnika", () => {
  it("JMBG sam popunjava datum rođenja i pol; šalje se samo promenjeno, uz zaštitu od tuđih izmena", async () => {
    api.patch.mockResolvedValue({ data: { patient, profile: {} } });
    const profile = { _id: "sp", updatedAt: "2026-11-10T10:00:00.000Z", parentName: "Milan", contacts: [], guardian: {}, trustedPerson: {}, assignedStaff: null } as unknown as SocialProfile;
    const { user } = renderWithProviders(<SocialProfileDialog open onClose={vi.fn()} patient={patient} profile={profile} />);

    await user.type(screen.getByLabelText(/JMBG/), MILICA_JMBG);
    expect(screen.getByLabelText("Datum rođenja")).toHaveValue("15.03.1938");
    expect(screen.getByLabelText("Pol")).toHaveValue("Ž");
    await user.click(screen.getByRole("button", { name: "Sačuvaj" }));

    expect(api.patch).toHaveBeenCalledWith("/api/social/profile/p1", {
      patient: { dateOfBirth: "1938-03-15" },
      profile: { jmbg: MILICA_JMBG, sex: "Ž" },
      expectedUpdatedAt: "2026-11-10T10:00:00.000Z",
    });
  });

  it("datum rođenja koji se ne slaže sa JMBG-om se ne šalje; nesačuvane izmene traže potvrdu pre zatvaranja", async () => {
    const onClose = vi.fn();
    const { user } = renderWithProviders(<SocialProfileDialog open onClose={onClose} patient={{ ...patient, dateOfBirth: "1940-01-01T00:00:00.000Z" }} profile={null} />);
    await user.type(screen.getByLabelText(/JMBG/), MILICA_JMBG);
    expect(screen.getByText("Ne slaže se sa JMBG-om.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sačuvaj" }));
    expect(api.patch).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Uzmi iz JMBG-a/ }));
    expect(screen.getByLabelText("Datum rođenja")).toHaveValue("15.03.1938");

    await user.click(screen.getByRole("button", { name: "Otkaži" }));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("dialog", { name: "Odbaciti nesačuvane izmene?" })).getByRole("button", { name: "Odbaci izmene" }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("novi korisnik", () => {
  it("osnovni podaci: obavezni ime, prezime i datum prijema; čuva se samo uneto", async () => {
    api.post.mockResolvedValue({ data: { patient: { ...patient, _id: "new" }, profile: {} } });
    const { user } = renderWithProviders(<NewResidentDialog open onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Sačuvaj korisnika" }));
    expect(screen.getByText("Unesite ime.")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Ime"), "Milica");
    await user.type(screen.getByLabelText("Prezime"), "Jovanović");
    await user.type(screen.getByLabelText("Kontakt porodice"), "Jovan Jovanović");
    await user.type(screen.getByLabelText("Telefon"), "064 123");
    await user.click(screen.getByRole("button", { name: "Sačuvaj korisnika" }));

    const [url, body] = api.post.mock.calls[0]!;
    expect(url).toBe("/api/social/residents");
    expect(body.patient).toMatchObject({ name: "Milica", lastName: "Jovanović", dateOfBirth: "", address: "" });
    expect(body.profile).toEqual({ contacts: [expect.objectContaining({ name: "Jovan Jovanović", phone: "064 123", emergency: true })] });
    expect(navigate).toHaveBeenCalledWith("/patients/new?tab=social");
    expect(localStorage.length).toBe(0);
  });

  it("detaljni podaci prikazuju sve grupe; nedovršen unos se pamti i vraća", async () => {
    const first = renderWithProviders(<NewResidentDialog open onClose={vi.fn()} />);
    expect(screen.queryByLabelText("Poslovna sposobnost")).not.toBeInTheDocument();
    await first.user.click(screen.getByRole("tab", { name: "Detaljni podaci" }));
    expect(screen.getByLabelText("Poslovna sposobnost")).toBeInTheDocument();
    await first.user.type(screen.getByLabelText("Ime"), "Mira");
    first.unmount();

    renderWithProviders(<NewResidentDialog open onClose={vi.fn()} />);
    expect(screen.getByText("Vraćen je nesačuvan unos sa ovog računara.")).toBeInTheDocument();
    expect(screen.getByLabelText("Ime")).toHaveValue("Mira");
    expect(screen.getByRole("tab", { name: "Detaljni podaci" })).toHaveAttribute("aria-selected", "true");
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

    const finalDoc: SocialDocument = {
      _id: "d2",
      updatedAt: "2026-11-06T00:00:00.000Z",
      type: "assessment",
      date: "2026-11-05T00:00:00.000Z",
      status: "final",
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
    expect(screen.queryByLabelText("Rizici")).not.toBeInTheDocument();
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

describe("Word šabloni", () => {
  // Najmanji pravi .docx: tekst sa poljima i tabela čiji se red ponavlja za svaki kontakt
  const run = (t: string) => `<w:p><w:r><w:t xml:space="preserve">${t}</w:t></w:r></w:p>`;
  const docx = (body: string) => {
    const zip = new PizZip();
    zip.file(
      "[Content_Types].xml",
      '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
    );
    zip.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`);
    return zip.generate({ type: "arraybuffer" });
  };
  const table = `<w:tbl><w:tr><w:tc>${run("{#kontakti}{kontakt_ime}")}</w:tc><w:tc>${run("{kontakt_telefon}{/kontakti}")}</w:tc></w:tr></w:tbl>`;
  const catalog = {
    fields: [
      { key: "ime_prezime", label: "Ime i prezime", group: "Korisnik" },
      { key: "jmbg", label: "JMBG", group: "Korisnik" },
    ],
    lists: [{ key: "kontakti", label: "Kontakti", fields: [{ key: "kontakt_ime", label: "Ime", group: "" }, { key: "kontakt_telefon", label: "Telefon", group: "" }] }],
  };

  it("popunjava polja i ponavlja red tabele za svaki kontakt; prazno polje ostaje prazno", async () => {
    const file = docx(run("Korisnik: {ime_prezime}, JMBG: {jmbg}.") + table);
    const blob = await fillTemplate(file, {
      fields: { ime_prezime: "Milica Jovanović", jmbg: "" },
      lists: { kontakti: [{ kontakt_ime: "Jovan", kontakt_telefon: "064 1" }, { kontakt_ime: "Ana", kontakt_telefon: "060 2" }] },
    });
    // jsdom Blob nema arrayBuffer() — čita se kao u starijim pregledačima
    const bytes = await new Promise<ArrayBuffer>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(blob);
    });
    const xml = new PizZip(bytes).file("word/document.xml")!.asText();
    expect(xml).toContain("Korisnik: Milica Jovanović, JMBG: .");
    expect(xml.match(/<w:tr>/g)).toHaveLength(2);
    expect(xml).toContain("Jovan");
    expect(xml).toContain("060 2");
    expect(xml).not.toContain("undefined");
  });

  it("provera šablona: poznata i nepoznata polja, i greške u zagradama", async () => {
    const ok = await checkTemplate(docx(run("{ime_prezime} {jmgb}") + table), catalog);
    expect(ok.errors).toEqual([]);
    expect(ok.known).toEqual(expect.arrayContaining(["ime_prezime", "kontakti", "kontakti.kontakt_ime"]));
    expect(ok.unknown).toEqual(["jmgb"]);

    const broken = await checkTemplate(docx(run("{ime_prezime")), catalog);
    expect(broken.errors[0]).toMatch(/zatvorenu zagradu/);
    expect((await checkTemplate(new TextEncoder().encode("nije docx").buffer, catalog)).errors[0]).toMatch(/nije Word/);
  });
});
