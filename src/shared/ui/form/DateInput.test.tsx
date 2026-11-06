import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DateInput from "./DateInput";
import Dialog from "@shared/ui/dialog/Dialog";
import { isoToDisplay, maskDateTyping, parseDisplayDate } from "@shared/lib/dateText";

function Harness({ initial = "", onValue, min, max }: { initial?: string; onValue?: (v: string) => void; min?: string; max?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor="d">Datum</label>
      <DateInput id="d" value={value} min={min} max={max} fromYear={1900} onChange={(v) => { setValue(v); onValue?.(v); }} />
      <output data-testid="value">{value}</output>
    </>
  );
}

describe("parsiranje datuma", () => {
  it("prihvata uobičajene oblike, uvek dan pa mesec", () => {
    expect(parseDisplayDate("06.11.2026")).toBe("2026-11-06");
    expect(parseDisplayDate("6.11.2026.")).toBe("2026-11-06");
    expect(parseDisplayDate("6/11/2026")).toBe("2026-11-06");
    expect(parseDisplayDate("06112026")).toBe("2026-11-06");
  });

  it("odbija nepostojeće datume", () => {
    expect(parseDisplayDate("31.02.2026")).toBeNull();
    expect(parseDisplayDate("29.02.2027")).toBeNull();
    expect(parseDisplayDate("29.02.2028")).toBe("2028-02-29");
    expect(parseDisplayDate("12.13.2026")).toBeNull();
    expect(parseDisplayDate("abc")).toBeNull();
  });

  it("maska dodaje tačke i dopunjuje nulu", () => {
    expect(maskDateTyping("06112026")).toBe("06.11.2026");
    expect(maskDateTyping("0611")).toBe("06.11");
    expect(maskDateTyping("6.")).toBe("06.");
    expect(maskDateTyping("6.3.")).toBe("06.03.");
    expect(maskDateTyping("12a34")).toBe("12.34");
    expect(isoToDisplay("1921-05-03")).toBe("03.05.1921");
  });
});

describe("DateInput", () => {
  it("kucanje cifara daje datum čim je potpun", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText("Datum"), "03051921");
    expect(screen.getByLabelText("Datum")).toHaveValue("03.05.1921");
    expect(screen.getByTestId("value")).toHaveTextContent("1921-05-03");
  });

  it("nepostojeći datum: poruka i vrednost se ne menja", async () => {
    const user = userEvent.setup();
    render(<Harness initial="2026-01-10" />);
    const input = screen.getByLabelText("Datum");
    await user.clear(input);
    await user.type(input, "31022026");
    expect(screen.getByRole("alert")).toHaveTextContent("Datum ne postoji");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("poštuje najraniji dozvoljeni datum", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Harness min="2026-05-10" onValue={onValue} />);
    await user.type(screen.getByLabelText("Datum"), "01052026");
    expect(screen.getByRole("alert")).toHaveTextContent("ne može biti pre 10.05.2026");
    expect(onValue).not.toHaveBeenCalled();
  });

  it("brisanje polja briše vrednost", async () => {
    const user = userEvent.setup();
    render(<Harness initial="2026-01-10" />);
    await user.clear(screen.getByLabelText("Datum"));
    await user.tab();
    expect(screen.getByTestId("value")).toBeEmptyDOMElement();
  });

  it("do 1921. godine jednim izborom iz liste, bez listanja", async () => {
    const user = userEvent.setup();
    render(<Harness initial="2026-11-06" />);
    await user.click(screen.getByRole("button", { name: "Otvori kalendar" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Godina" }), "1921");
    await user.selectOptions(screen.getByRole("combobox", { name: "Mesec" }), "5");
    await user.click(screen.getByRole("gridcell", { name: "3. Maj 1921." }));
    expect(screen.getByTestId("value")).toHaveTextContent("1921-05-03");
    expect(screen.queryByRole("dialog", { name: "Izbor datuma" })).not.toBeInTheDocument();
  });

  it("nedelja počinje ponedeljkom, tastatura pomera izbor", async () => {
    const user = userEvent.setup();
    render(<Harness initial="2026-11-06" />);
    await user.click(screen.getByRole("button", { name: "Otvori kalendar" }));
    expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent("Pon");
    expect(screen.getByRole("gridcell", { name: "6. Novembar 2026." })).toHaveFocus();
    await user.keyboard("{ArrowRight}{ArrowDown}{Enter}");
    expect(screen.getByTestId("value")).toHaveTextContent("2026-11-14");
  });

  it("Escape u kalendaru zatvara kalendar, ali ne i dijalog", async () => {
    const user = userEvent.setup();
    const closeDialog = vi.fn();
    render(
      <Dialog open onClose={closeDialog} title="Otpust">
        <Harness initial="2026-11-06" />
      </Dialog>
    );
    await user.click(screen.getByRole("button", { name: "Otvori kalendar" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Izbor datuma" })).not.toBeInTheDocument();
    expect(closeDialog).not.toHaveBeenCalled();
  });
});
