// Izmena stavke: količina (i cena po komadu za negu); redosled stavki u specifikaciji.
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../../test/render";
import type { SpecificationItem } from "@features/specification/types/types";
import { sortSpecItems } from "@features/specification/lib/items";

const update = vi.hoisted(() => vi.fn());
vi.mock("@features/specification/api/specificationApi", () => ({ updateSpecificationItem: update }));

import EditItemDialog from "./EditItemDialog";

const item = (over: Partial<SpecificationItem>) => ({ _id: "i1", name: "Stavka", amount: 1, price: 0, ...over }) as SpecificationItem;

describe("redosled stavki", () => {
  it("analize, lekovi tablete, lekovi ampule, artikli, pa ostalo — bez obzira na redosled dodavanja", () => {
    const sorted = sortSpecItems([
      item({ _id: "a", category: "articles" }),
      item({ _id: "amp", category: "medicine", form: "parenteral" }),
      item({ _id: "x", category: "extra" }),
      item({ _id: "m1", category: "medicine", form: "oral" }),
      item({ _id: "c", category: "combination" }),
      item({ _id: "n", category: "care" }),
      item({ _id: "m2", category: "medicine" }),
      item({ _id: "f", category: "physio" }),
    ]);
    expect(sorted.map((i) => i._id)).toEqual(["c", "m1", "m2", "amp", "a", "n", "f", "x"]);
  });
});

describe("EditItemDialog", () => {
  it("lek: menja se samo količina", async () => {
    update.mockResolvedValue({ _id: "s1", items: [], totalPrice: 0 });
    const { user } = renderWithProviders(
      <EditItemDialog specId="s1" patientId="p1" item={item({ name: "Andol", category: "medicine", amount: 5, price: 50, entries: [{}] as never })} onClose={vi.fn()} />
    );
    expect(screen.queryByLabelText("Cena po komadu")).not.toBeInTheDocument();
    const qty = screen.getByLabelText("Količina");
    await user.clear(qty);
    await user.type(qty, "8");
    expect(screen.getByText(/80,00/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sačuvaj" }));
    expect(update).toHaveBeenCalledWith("s1", "i1", { amount: 8 });
  });

  it("nega bez cene: upisuje se cena po komadu", async () => {
    update.mockClear();
    update.mockResolvedValue({ _id: "s1", items: [], totalPrice: 0 });
    const { user } = renderWithProviders(<EditItemDialog specId="s1" patientId="p1" item={item({ name: "Kupanje", category: "care", amount: 2, price: 0 })} onClose={vi.fn()} />);
    const price = screen.getByLabelText("Cena po komadu");
    await user.clear(price);
    await user.type(price, "300");
    await user.click(screen.getByRole("button", { name: "Sačuvaj" }));
    expect(update).toHaveBeenCalledWith("s1", "i1", { amount: 2, unitPrice: 300 });
  });

  it("analize: samo ceo broj", async () => {
    const { user } = renderWithProviders(<EditItemDialog specId="s1" patientId="p1" item={item({ category: "combination", amount: 1, price: 450 })} onClose={vi.fn()} />);
    const qty = screen.getByLabelText("Količina");
    await user.clear(qty);
    await user.type(qty, "1,5");
    expect(screen.getByText("Unesite ceo broj.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sačuvaj" })).toBeDisabled();
  });
});
