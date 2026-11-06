// Ključni tokovi: zaštita ruta, unos leka (naplata/porodično stanje), prijava.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "react-router";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "./render";
import type { User } from "@shared/types/index";

// ---------- mock-ovi ----------
const auth = vi.hoisted(() => ({ user: null as User | null, login: vi.fn() }));
vi.mock("@app/providers/AuthContext", () => ({
  useAuth: () => ({ user: auth.user, login: auth.login, logout: vi.fn(), token: null, loading: false }),
}));

const notify = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("@shared/lib/notify", () => ({ notify, getErrorMessage: (_: unknown, f = "") => f }));

const medicineMutation = vi.hoisted(() => ({ mutateAsync: vi.fn(), isPending: false }));
vi.mock("@features/medicine/hooks/useUseMedicine", () => ({ useUseMedicine: () => medicineMutation }));
vi.mock("@features/articles/hooks/useUseArticle", () => ({ useUseArticle: () => ({ mutateAsync: vi.fn(), isPending: false }) }));
vi.mock("@features/medicine/hooks/useMedicineOptions", () => ({
  useMedicineOptions: () => ({
    isLoading: false,
    options: [
      { value: "andol", label: "Andol 100mg", home: 120, family: 10, price: 12.5 },
      { value: "brufen", label: "Brufen 400mg", home: 8, family: 0, price: 28 },
    ],
  }),
}));
vi.mock("@features/articles/ui/useArticleOptions", () => ({ useArticleOptions: () => ({ isLoading: false, options: [] }) }));

const api = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));

import { RequireAuth, RequireRole } from "@app/routing/guards";
import ConsumeItemForm from "@features/specification/ui/workspace/forms/ConsumeItemForm";
import SignInForm from "@features/auth/ui/SignInForm";

const asUser = (role: User["role"]): User => ({ _id: "u1", name: "Ana", lastName: "Test", email: "a@t", role });

beforeEach(() => {
  auth.user = null;
  localStorage.clear();
});

// ---------- zaštita ruta ----------
describe("zaštita ruta", () => {
  it("neprijavljen korisnik ide na prijavu", () => {
    renderWithProviders(
      <RequireAuth>
        <p>tajno</p>
      </RequireAuth>,
      { route: "/medicines", path: "/medicines", extraRoutes: <Route path="/signin" element={<p>prijava</p>} /> }
    );
    expect(screen.getByText("prijava")).toBeInTheDocument();
    expect(screen.queryByText("tajno")).not.toBeInTheDocument();
  });

  it("sestra na stranici uprave vidi 403, uprava vidi sadržaj", () => {
    auth.user = asUser("nurse");
    const page = (
      <RequireRole roles={["admin", "main-nurse"]}>
        <p>lekovi</p>
      </RequireRole>
    );
    const { unmount } = renderWithProviders(page);
    expect(screen.getByText("Nemate pristup")).toBeInTheDocument();
    unmount();

    auth.user = asUser("main-nurse");
    renderWithProviders(page);
    expect(screen.getByText("lekovi")).toBeInTheDocument();
  });
});

// ---------- unos leka ----------
describe("ConsumeItemForm", () => {
  const pickMedicine = async (user: ReturnType<typeof renderWithProviders>["user"], name: RegExp) => {
    await user.click(screen.getByLabelText("Lek"));
    await user.click(screen.getByRole("option", { name }));
  };

  it("pregled: prvo porodično stanje, naplaćuje se samo ostatak", async () => {
    const { user } = renderWithProviders(<ConsumeItemForm kind="medicine" patientId="p1" />);
    await pickMedicine(user, /Andol/);
    await user.type(screen.getByLabelText("Količina"), "15");

    expect(screen.getByText("Sa porodičnog stanja (ne naplaćuje se)").nextSibling).toHaveTextContent("10");
    expect(screen.getByText("Sa stanja doma").nextSibling).toHaveTextContent("5");
    expect(screen.getByText("Ulazi u specifikaciju").nextSibling).toHaveTextContent("62,50 RSD");
  });

  it("nedovoljno na stanju: upozorenje i onemogućeno dugme", async () => {
    const { user } = renderWithProviders(<ConsumeItemForm kind="medicine" patientId="p1" />);
    await pickMedicine(user, /Brufen/);
    await user.type(screen.getByLabelText("Količina"), "20");
    expect(screen.getByText(/Nema dovoljno na stanju doma/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dodaj lek" })).toBeDisabled();
  });

  it("kalkulator doze: dani × puta dnevno × doza", async () => {
    const { user } = renderWithProviders(<ConsumeItemForm kind="medicine" patientId="p1" />);
    await user.click(screen.getByRole("button", { name: /Kalkulator doze/ }));
    await user.type(screen.getByLabelText("Dana"), "3");
    await user.type(screen.getByLabelText("Puta dnevno"), "2");
    await user.selectOptions(screen.getByLabelText("Doza"), "0.5");
    expect(screen.getByLabelText("Količina")).toHaveValue("3");
  });

  it("decimalni zarez i slanje: poziva backend i javlja rezultat", async () => {
    medicineMutation.mutateAsync.mockResolvedValue({ message: "Dodato u specifikaciju." });
    const { user } = renderWithProviders(<ConsumeItemForm kind="medicine" patientId="p1" />);
    await pickMedicine(user, /Brufen/);
    await user.type(screen.getByLabelText("Količina"), "0,5");
    await user.click(screen.getByRole("button", { name: "Dodaj lek" }));

    expect(medicineMutation.mutateAsync).toHaveBeenCalledWith({ medicineId: "brufen", amount: 0.5 });
    expect(notify.success).toHaveBeenCalledWith("Brufen 400mg: Dodato u specifikaciju.");
    expect(screen.getByLabelText("Količina")).toHaveValue("");
  });

  it("sestra: samo beleženje, bez cene i bez blokade stanja", async () => {
    const { user } = renderWithProviders(<ConsumeItemForm kind="medicine" patientId="p1" recordOnly />);
    await pickMedicine(user, /Brufen/);
    await user.type(screen.getByLabelText("Količina"), "20");
    expect(screen.queryByText("Ulazi u specifikaciju")).not.toBeInTheDocument();
    expect(screen.queryByText(/Nema dovoljno/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zabeleži lek" })).toBeEnabled();
  });
});

// ---------- prijava ----------
describe("SignInForm", () => {
  const fill = async (user: ReturnType<typeof renderWithProviders>["user"]) => {
    await user.type(screen.getByLabelText("Ime"), "Ana");
    await user.type(screen.getByLabelText("Prezime"), "Admin");
    await user.type(screen.getByLabelText("Lozinka"), "tajna");
  };

  it("pogrešni podaci daju jasnu poruku", async () => {
    api.post.mockRejectedValue({ response: { status: 400, data: { error: "Neispravna lozinka" } } });
    const { user } = renderWithProviders(<SignInForm />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Prijavi se" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Pogrešno ime, prezime ili lozinka.");
  });

  it("uloga bez pristupa", async () => {
    api.post.mockRejectedValue({ response: { status: 403 } });
    const { user } = renderWithProviders(<SignInForm />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Prijavi se" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Vaša uloga nema pristup aplikaciji.");
  });

  it("uspeh: prijavljuje, pamti samo ime i vraća na traženu stranicu", async () => {
    api.post.mockResolvedValue({ data: { success: true, accessToken: "t", user: asUser("admin") } });
    const { user } = renderWithProviders(<SignInForm />, {
      // stanje koje postavlja RequireAuth kad preusmeri na prijavu
      route: { pathname: "/signin", state: { from: "/medicines" } },
      path: "/signin",
      extraRoutes: <Route path="/medicines" element={<p>stranica lekova</p>} />,
    });
    await fill(user);
    await user.click(screen.getByLabelText("Zapamti me na ovom uređaju"));
    await user.click(screen.getByRole("button", { name: "Prijavi se" }));

    expect(api.post).toHaveBeenCalledWith("/api/auth/login", { name: "Ana", lastName: "Admin", password: "tajna" });
    expect(auth.login).toHaveBeenCalledWith(asUser("admin"), "t");
    expect(JSON.parse(localStorage.getItem("rememberMe") ?? "{}")).toEqual({ name: "Ana", lastName: "Admin" });
    expect(localStorage.getItem("rememberMe")).not.toContain("tajna");
    expect(await screen.findByText("stranica lekova")).toBeInTheDocument();
  });
});
