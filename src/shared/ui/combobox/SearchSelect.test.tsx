import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchSelect from "./SearchSelect";
import Dialog from "@shared/ui/dialog/Dialog";
import { toCsv } from "@shared/lib/csv";

const OPTIONS = [
  { value: "1", label: "Jovanović Milica", description: "rođ. 1938." },
  { value: "2", label: "Petrović Dragan" },
  { value: "3", label: "Živković Ljubica" },
];

function Harness() {
  const [v, setV] = useState("");
  return (
    <>
      <label htmlFor="p">Pacijent</label>
      <SearchSelect id="p" value={v} onChange={setV} options={OPTIONS} emptyLabel="Bez pacijenta" />
      <output data-testid="v">{v}</output>
    </>
  );
}

describe("SearchSelect", () => {
  it("nalazi po delu imena, bilo kojim redom, bez kvačica i u ćirilici", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Pacijent");

    await user.type(input, "mil jov");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await user.clear(input);
    await user.type(input, "zivk");
    expect(screen.getByRole("option", { name: /Živković Ljubica/ })).toBeInTheDocument();
    await user.clear(input);
    await user.type(input, "Петров");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("v")).toHaveTextContent("2");
    expect(input).toHaveValue("Petrović Dragan");
  });

  it("strelice i brisanje izbora", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByLabelText("Pacijent"));
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByTestId("v")).toHaveTextContent("2");
    await user.click(screen.getByRole("button", { name: "Obriši izbor" }));
    expect(screen.getByTestId("v")).toBeEmptyDOMElement();
  });

  it("Escape zatvara listu, ne i dijalog", async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    render(
      <Dialog open onClose={close} title="T">
        <Harness />
      </Dialog>
    );
    await user.click(screen.getByLabelText("Pacijent"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(close).not.toHaveBeenCalled();
  });
});

describe("CSV za Excel", () => {
  it("separator ';', decimalni zarez, navodnici gde treba", () => {
    expect(toCsv([["Stavka", "Količina"], ['Pelene "XL"; noćna', 1.5]])).toBe('Stavka;Količina\r\n"Pelene ""XL""; noćna";1,5');
  });
});
