// Stručne usluge: dodavanje u specifikaciju (pretraga, broj puta), mesto na štampi i napomene smeštaja.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import type { SpecificationItem } from "@features/specification/types/types";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));
vi.mock("@shared/lib/notify", () => ({ notify: { success: vi.fn(), error: vi.fn() } }));

import AddProfessionalServiceForm from "@features/specification/ui/workspace/forms/AddProfessionalServiceForm";
import LodgingPricesPage from "@pages/settings/LodgingPricesPage";
import { sortSpecItems } from "@features/specification/lib/items";

beforeEach(() => {
  api.get.mockImplementation(async (url: string) => {
    if (url.startsWith("/api/professional-services")) {
      return {
        data: {
          services: [
            { _id: "s1", name: "Pregled kardiologa", priceRSD: 4500, active: true },
            { _id: "s2", name: "Psiholog — seansa", priceRSD: 3000, active: true },
          ],
        },
      };
    }
    if (url.startsWith("/api/lodging-notes")) return { data: { notes: [{ _id: "n1", text: "Smeštaj od prijema" }] } };
    return { data: { prices: [] } };
  });
  api.post.mockResolvedValue({ data: { specification: { _id: "spec", items: [] }, note: { _id: "n2", text: "x" } } });
});

describe("stručne usluge u specifikaciji", () => {
  it("pretraga i dodavanje sa brojem puta, u izabran period", async () => {
    const { user } = renderWithProviders(<AddProfessionalServiceForm patientId="p1" specificationId="spec" />);
    expect(await screen.findByText("Pregled kardiologa")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Usluga"), "psih");
    expect(screen.queryByText("Pregled kardiologa")).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText("Puta"));
    await user.type(screen.getByLabelText("Puta"), "2");
    await user.click(screen.getByRole("button", { name: "Dodaj Psiholog — seansa" }));
    expect(api.post).toHaveBeenCalledWith("/api/professional-services/charge", { patientId: "p1", serviceId: "s2", amount: 2, specificationId: "spec" });
  });

  it("na štampi i u listi idu posle artikala, pre nege i drugih troškova", () => {
    const item = (category: string, name: string) => ({ _id: name, name, category, amount: 1, price: 1 }) as unknown as SpecificationItem;
    const sorted = sortSpecItems([item("extra", "Frizer"), item("professional", "Psiholog"), item("articles", "Pelene"), item("care", "Kupanje"), item("medicine", "Andol")]);
    expect(sorted.map((i) => i.name)).toEqual(["Andol", "Pelene", "Psiholog", "Kupanje", "Frizer"]);
  });
});

describe("napomene za vanstandardni period (cene smeštaja)", () => {
  it("lista i dodavanje napomene", async () => {
    const { user } = renderWithProviders(<LodgingPricesPage />);
    expect(await screen.findByText("Smeštaj od prijema")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nova napomena"), "Smeštaj do početka perioda");
    await user.click(screen.getByRole("button", { name: "Dodaj napomenu" }));
    expect(api.post).toHaveBeenCalledWith("/api/lodging-notes", { text: "Smeštaj do početka perioda" });
  });
});
