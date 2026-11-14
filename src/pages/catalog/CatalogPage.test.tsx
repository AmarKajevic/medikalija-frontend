// "Šabloni i cene": sekcije po ulogama, izbor sekcije dugmadima i preusmerenje na dozvoljenu sekciju.
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { catalogSectionsFor } from "./catalogSections";

const auth = vi.hoisted(() => ({ user: { _id: "u", name: "A", lastName: "B", email: "", role: "admin" } }));
vi.mock("@app/providers/AuthContext", () => ({ useAuth: () => ({ user: auth.user }) }));
// Sekcije se ovde ne učitavaju (svaka ima svoje testove) — samo naslov
vi.mock("./catalogSections", async (orig) => {
  const real = await orig<typeof import("./catalogSections")>();
  const stub = (label: string) => () => <h2>{label}</h2>;
  const sections = real.CATALOG_SECTIONS.map((s) => ({ ...s, component: stub(`Sekcija ${s.label}`) as never }));
  return { ...real, CATALOG_SECTIONS: sections, catalogSectionsFor: (role?: string) => sections.filter((s) => s.roles.includes(role as never)) };
});

import CatalogPage from "./CatalogPage";

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/templates/:section?" element={<><CatalogPage /><Where /></>} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  );

describe("Šabloni i cene", () => {
  it("admin vidi sve sekcije; glavna sestra samo šablone za osoblje i negu", () => {
    expect(catalogSectionsFor("admin").map((s) => s.id)).toEqual(["staff", "care", "physio", "lodging", "services", "extra"]);
    expect(catalogSectionsFor("main-nurse").map((s) => s.id)).toEqual(["staff", "care"]);
    expect(catalogSectionsFor("nurse")).toEqual([]);
  });

  it("bez sekcije u adresi otvara prvu; klik na dugme menja sekciju", async () => {
    auth.user.role = "admin";
    renderAt("/templates");
    expect(await screen.findByRole("heading", { name: "Sekcija Medicinsko osoblje" })).toBeInTheDocument();
    expect(screen.getByTestId("where")).toHaveTextContent("/templates/staff");
    await userEvent.click(screen.getAllByRole("link", { name: /Fizikalna terapija/ })[0]!);
    expect(await screen.findByRole("heading", { name: "Sekcija Fizikalna terapija" })).toBeInTheDocument();
    expect(screen.getByTestId("where")).toHaveTextContent("/templates/physio");
  });

  it("sekcija koju uloga ne sme da vidi preusmerava na dozvoljenu", async () => {
    auth.user.role = "main-nurse";
    renderAt("/templates/lodging");
    expect(await screen.findByRole("heading", { name: "Sekcija Medicinsko osoblje" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Smeštaj/ })).not.toBeInTheDocument();
  });
});
