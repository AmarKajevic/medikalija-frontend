// Pristup samo po pozivu: prihvatanje pozivnice, korisnici, automatska odjava.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { act, render, screen, within } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import type { ManagedUser } from "@features/users/model";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));
const notify = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("@shared/lib/notify", () => ({ notify }));
type TestUser = { _id: string; name: string; lastName: string; role: string } | null;
const auth = vi.hoisted(() => ({ user: null as TestUser, login: vi.fn(), logout: vi.fn() }));
vi.mock("@app/providers/AuthContext", () => ({ useAuth: () => ({ user: auth.user, login: auth.login, logout: auth.logout }) }));

import AcceptLinkPage from "@pages/auth/AcceptLinkPage";
import UsersPage from "@pages/team/UsersPage";
import IdleLogout from "./ui/IdleLogout";

beforeEach(() => {
  Object.values(api).forEach((f) => f.mockReset());
  Object.values(notify).forEach((f) => f.mockReset());
  auth.login.mockReset();
  auth.logout.mockReset().mockResolvedValue(undefined);
  auth.user = { _id: "a1", name: "Ana", lastName: "Admin", role: "admin" };
});

describe("prihvatanje pozivnice", () => {
  const link = {
    purpose: "invite",
    expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    name: "Sanja",
    lastName: "Petrović",
    email: null,
    username: "sanja.p",
    role: "nurse",
    invitedBy: "Ana Admin",
    google: false,
  };
  const routes = { path: "/invite/:token", route: "/invite/abc", extraRoutes: <Route path="/" element={<p>početna</p>} /> };

  it("prikazuje ko poziva; lozinka ne sme da sadrži ime; aktivira i prijavljuje", async () => {
    auth.user = null;
    api.get.mockImplementation(async (url: string) => (url.startsWith("/api/auth/link") ? { data: { link } } : { data: { googleClientId: null } }));
    api.post.mockResolvedValue({ data: { accessToken: "t", user: { _id: "u2", name: "Sanja", lastName: "Petrović", role: "nurse" } } });
    const { user } = renderWithProviders(<AcceptLinkPage />, routes);

    expect(await screen.findByText("Dobro došli, Sanja")).toBeInTheDocument();
    expect(screen.getByText(/Ana Admin vas poziva/)).toBeInTheDocument();
    expect(screen.getByText("sanja.p")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nova lozinka"), "sanja-lozinka-1");
    await user.type(screen.getByLabelText("Ponovite lozinku"), "sanja-lozinka-1");
    await user.click(screen.getByRole("button", { name: "Aktiviraj nalog" }));
    expect(api.post).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Nova lozinka"));
    await user.clear(screen.getByLabelText("Ponovite lozinku"));
    await user.type(screen.getByLabelText("Nova lozinka"), "plava-solja-kafe-7");
    await user.type(screen.getByLabelText("Ponovite lozinku"), "plava-solja-kafe-7");
    await user.click(screen.getByRole("button", { name: "Aktiviraj nalog" }));
    expect(api.post).toHaveBeenCalledWith("/api/auth/link/abc", { password: "plava-solja-kafe-7" });
    expect(await screen.findByText("početna")).toBeInTheDocument();
    expect(auth.login).toHaveBeenCalledWith(expect.objectContaining({ _id: "u2" }), "t");
  });

  it("istekao link: jasna poruka i put do prijave", async () => {
    auth.user = null;
    api.get.mockImplementation(async (url: string) => {
      if (url.startsWith("/api/auth/link")) throw { response: { status: 410, data: { message: "Link je istekao ili je već iskorišćen." } } };
      return { data: { googleClientId: null } };
    });
    renderWithProviders(<AcceptLinkPage />, routes);
    expect(await screen.findByText("Link nije važeći")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Na prijavu" })).toBeInTheDocument();
  });
});

describe("korisnici", () => {
  const u = (over: Partial<ManagedUser> = {}): ManagedUser => ({
    _id: "u1",
    name: "Mira",
    lastName: "Mirić",
    email: "mira@dom.rs",
    username: null,
    role: "nurse",
    status: "active",
    hasPassword: true,
    hasGoogle: false,
    pendingLink: null,
    lastLoginAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    lastLoginMethod: "password",
    ...over,
  });

  it("pozivanje korisničkim imenom daje link za kopiranje", async () => {
    api.get.mockResolvedValue({ data: { users: [u()] } });
    api.post.mockResolvedValue({
      data: { user: u({ _id: "u9", name: "Sanja", lastName: "Petrović", status: "invited" }), invite: { url: "https://app/invite/xyz", expiresAt: new Date().toISOString(), emailSent: false } },
    });
    const { user } = renderWithProviders(<UsersPage />);
    expect(await screen.findByText("pre 5 min")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Pozovi korisnika" }));
    const dlg = screen.getByRole("dialog", { name: "Pozovi korisnika" });
    await user.type(within(dlg).getByLabelText("Ime"), "Sanja");
    await user.type(within(dlg).getByLabelText("Prezime"), "Petrović");
    await user.click(within(dlg).getByText("Korisničkim imenom"));
    expect(within(dlg).getByLabelText("Korisničko ime")).toHaveValue("sanja.p");
    await user.click(within(dlg).getByRole("button", { name: "Napravi pozivnicu" }));

    expect(api.post).toHaveBeenCalledWith("/api/auth/invitations", { name: "Sanja", lastName: "Petrović", role: "nurse", username: "sanja.p" });
    const linkDlg = await screen.findByRole("dialog", { name: "Pozivnica je spremna" });
    expect(within(linkDlg).getByLabelText("Link")).toHaveValue("https://app/invite/xyz");
    expect(within(linkDlg).getByText(/Viberom ili lično/)).toBeInTheDocument();
  });

  it("ukidanje pristupa traži potvrdu", async () => {
    api.get.mockResolvedValue({ data: { users: [u()] } });
    api.patch.mockResolvedValue({ data: { user: u({ status: "suspended" }) } });
    const { user } = renderWithProviders(<UsersPage />);
    await user.click(await screen.findByRole("button", { name: "Akcije za Mira Mirić" }));
    await user.click(screen.getByRole("menuitem", { name: /Ukini pristup/ }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Ukini pristup" }));
    expect(api.patch).toHaveBeenCalledWith("/api/auth/users/u1", { status: "suspended" });
  });

  it("glavna sestra vidi listu, ali ne i akcije", async () => {
    auth.user = { _id: "m1", name: "Glavna", lastName: "Sestra", role: "main-nurse" };
    api.get.mockResolvedValue({ data: { users: [u()] } });
    renderWithProviders(<UsersPage />);
    await screen.findByText("pre 5 min");
    expect(screen.queryByRole("button", { name: "Pozovi korisnika" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Akcije za/ })).not.toBeInTheDocument();
  });
});

describe("automatska odjava", () => {
  afterEach(() => vi.useRealTimers());

  it("upozorava minut ranije, pa odjavljuje; 'Nastavi rad' produžava", async () => {
    vi.useFakeTimers();
    localStorage.clear();
    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<IdleLogout minutes={2} />} />
        </Routes>
      </MemoryRouter>
    );
    await act(async () => {
      vi.advanceTimersByTime(61_000);
    });
    expect(screen.getByRole("dialog", { name: "Da li ste još tu?" })).toBeInTheDocument();

    await act(async () => {
      screen.getByRole("button", { name: "Nastavi rad" }).click();
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(110_000);
    });
    expect(auth.logout).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });
    expect(auth.logout).toHaveBeenCalled();
  });
});

