// Grupa sa sopstvenom pretragom: otvara se klikom, pretraga važi samo za tu grupu.
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../test/render";
import SearchGroup from "./SearchGroup";

const items = ["Kupanje", "Brijanje", "Sečenje noktiju", "Presvlačenje", "Promenjena posteljina", "Promenjene pelene"];
const group = (title: string, list: string[], defaultOpen = false) => (
  <SearchGroup title={title} items={list} getKey={(i) => i} searchText={(i) => i} renderItem={(i) => <span>{i}</span>} defaultOpen={defaultOpen} />
);

describe("SearchGroup", () => {
  it("zatvorena grupa pokazuje naziv i broj; otvara se klikom", async () => {
    const { user } = renderWithProviders(group("Higijena", items));
    expect(screen.getByRole("button", { name: /Higijena \(6\)/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Kupanje")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Higijena/ }));
    expect(screen.getByText("Kupanje")).toBeInTheDocument();
  });

  it("pretraga po počecima reči samo u svojoj grupi", async () => {
    const { user } = renderWithProviders(
      <>
        {group("Higijena", items, true)}
        {group("Merenja", ["Merenje pritiska", "Merenje šećera"], true)}
      </>
    );
    await user.type(screen.getByLabelText("Pretraži: Higijena"), "prom");
    expect(screen.getByText("Promenjena posteljina")).toBeInTheDocument();
    expect(screen.queryByText("Kupanje")).not.toBeInTheDocument();
    expect(screen.getByText("Merenje pritiska")).toBeInTheDocument();
    expect(screen.queryByLabelText("Pretraži: Merenja")).not.toBeInTheDocument();
  });
});
