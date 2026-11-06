import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DataTable, { type Column } from "./data-table/DataTable";
import Dialog, { ConfirmDialog } from "./dialog/Dialog";
import StockCombobox, { type StockOption } from "./combobox/StockCombobox";
import Button from "./button/Button";
import Tabs from "./tabs/Tabs";

type Row = { id: string; name: string; qty: number };
const columns: Column<Row>[] = [
  { id: "name", header: "Naziv", cell: (r) => r.name, sortValue: (r) => r.name },
  { id: "qty", header: "Količina", cell: (r) => r.qty, sortValue: (r) => r.qty },
];
const rows: Row[] = [
  { id: "1", name: "Živković", qty: 3 },
  { id: "2", name: "Andol", qty: 10 },
  { id: "3", name: "Brufen", qty: 1 },
];
const bodyRows = () => within(screen.getAllByRole("rowgroup")[1]!).getAllByRole("row");
const firstCells = () => bodyRows().map((r) => within(r).getAllByRole("cell")[0]!.textContent);

describe("DataTable", () => {
  it("pretraga ignoriše dijakritike", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={rows} getRowId={(r) => r.id} searchText={(r) => r.name} searchPlaceholder="Pretraga" />);
    await user.type(screen.getByRole("searchbox", { name: "Pretraga" }), "zivk");
    expect(firstCells()).toEqual(["Živković"]);
  });

  it("prazan rezultat pretrage prikazuje poruku", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={rows} getRowId={(r) => r.id} searchText={(r) => r.name} searchPlaceholder="Pretraga" />);
    await user.type(screen.getByRole("searchbox"), "xyz");
    expect(screen.getByText("Nema rezultata")).toBeInTheDocument();
  });

  it("sortiranje: rastuće, opadajuće, isključeno", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={rows} getRowId={(r) => r.id} />);
    const header = screen.getByRole("button", { name: /Količina/ });
    await user.click(header);
    expect(firstCells()).toEqual(["Brufen", "Živković", "Andol"]);
    expect(screen.getByRole("columnheader", { name: /Količina/ })).toHaveAttribute("aria-sort", "ascending");
    await user.click(header);
    expect(firstCells()).toEqual(["Andol", "Živković", "Brufen"]);
    await user.click(header);
    expect(firstCells()).toEqual(["Živković", "Andol", "Brufen"]);
  });

  it("paginacija", async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 25 }, (_, i) => ({ id: String(i), name: `Stavka ${i + 1}`, qty: i }));
    render(<DataTable columns={columns} data={many} getRowId={(r) => r.id} pageSize={10} />);
    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByText("1–10 od 25")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sledeća strana" }));
    await user.click(screen.getByRole("button", { name: "Sledeća strana" }));
    expect(bodyRows()).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Sledeća strana" })).toBeDisabled();
  });

  it("klik i Enter na redu", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={rows} getRowId={(r) => r.id} onRowClick={onRowClick} />);
    await user.click(screen.getByText("Andol"));
    expect(onRowClick).toHaveBeenLastCalledWith(rows[1]);
    bodyRows()[2]!.focus();
    await user.keyboard("{Enter}");
    expect(onRowClick).toHaveBeenLastCalledWith(rows[2]);
  });

  it("prazna lista prikazuje akciju", () => {
    render(<DataTable columns={columns} data={[]} getRowId={(r) => r.id} empty={{ title: "Nema pacijenata", action: <button>Novi pacijent</button> }} />);
    expect(screen.getByText("Nema pacijenata")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Novi pacijent" })).toBeInTheDocument();
  });
});

describe("Dialog", () => {
  it("Escape zatvara samo gornji dijalog, a pozadina je inert", async () => {
    const user = userEvent.setup();
    const root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);
    const closeOuter = vi.fn();
    const closeInner = vi.fn();

    render(
      <>
        <Dialog open onClose={closeOuter} title="Spoljni">sadržaj</Dialog>
        <ConfirmDialog open onClose={closeInner} onConfirm={() => {}} title="Potvrda" />
      </>,
      { container: root }
    );

    expect(root).toHaveAttribute("inert");
    expect(document.body.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");
    expect(closeInner).toHaveBeenCalledTimes(1);
    expect(closeOuter).not.toHaveBeenCalled();
    root.remove();
  });

  it("ConfirmDialog poziva potvrdu i ima pristupačan naslov", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog open onClose={() => {}} onConfirm={onConfirm} title="Obrisati lek?" confirmText="Obriši" />);
    expect(screen.getByRole("dialog", { name: "Obrisati lek?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Obriši" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

describe("StockCombobox", () => {
  const options: StockOption[] = [
    { value: "a", label: "Andol 100mg", home: 120, family: 10 },
    { value: "b", label: "Brufen 400mg", home: 0, family: 0 },
    { value: "c", label: "Žalfija sirup", home: 5, family: 0 },
  ];

  function Harness({ onPick }: { onPick: (v: string) => void }) {
    const [value, setValue] = useState("");
    return <StockCombobox value={value} onChange={(v) => { setValue(v); onPick(v); }} options={options} />;
  }

  it("pretraga bez dijakritika i izbor tastaturom", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<Harness onPick={onPick} />);
    await user.type(screen.getByRole("combobox"), "zalf");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await user.keyboard("{Enter}");
    expect(onPick).toHaveBeenCalledWith("c");
    expect(screen.getByRole("combobox")).toHaveValue("Žalfija sirup");
  });

  it("prikazuje porodično stanje i upozorava na praznu zalihu", async () => {
    const user = userEvent.setup();
    render(<Harness onPick={() => {}} />);
    await user.click(screen.getByRole("combobox"));
    const andol = screen.getByRole("option", { name: /Andol/ });
    expect(within(andol).getByText("Porodica 10")).toBeInTheDocument();
    expect(within(screen.getByRole("option", { name: /Brufen/ })).getByText("Dom 0")).toBeInTheDocument();
  });
});

describe("Button i Tabs", () => {
  it("dugme je podrazumevano type=button i onemogućeno dok se čeka", () => {
    const { rerender } = render(<Button>Sačuvaj</Button>);
    expect(screen.getByRole("button", { name: "Sačuvaj" })).toHaveAttribute("type", "button");
    rerender(<Button loading>Sačuvaj</Button>);
    expect(screen.getByRole("button", { name: /Sačuvaj/ })).toBeDisabled();
  });

  it("tabovi prijavljuju izbor i označavaju aktivni", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tabs value="a" onChange={onChange} items={[{ value: "a", label: "Lekovi", count: 2 }, { value: "b", label: "Artikli" }]} />);
    expect(screen.getByRole("tab", { name: /Lekovi/ })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("tab", { name: "Artikli" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });
});
