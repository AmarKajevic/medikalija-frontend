import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { toCyrillic, toLatin } from "./script";
import { normalizeSearch } from "./search";
import ScriptProvider from "@app/providers/ScriptProvider";
import ScriptSwitch from "@shared/ui/ScriptSwitch";

describe("preslovljavanje", () => {
  it("latinica → ćirilica, sa slovima lj, nj, dž", () => {
    expect(toCyrillic("Ljubica Njegoš, džemper")).toBe("Љубица Његош, џемпер");
    expect(toCyrillic("LJUBICA")).toBe("ЉУБИЦА");
    expect(toCyrillic("Promenjene pelene × 2")).toBe("Промењене пелене × 2");
    expect(toCyrillic("Andol 100mg · 1.250,00 RSD")).toBe("Андол 100мг · 1.250,00 РСД");
  });

  it("strane reči, e-mail i linkovi ostaju", () => {
    expect(toCyrillic("Maximum Wi-Fi")).toBe("Maximum Wi-Fi");
    expect(toCyrillic("pišite na dom@primer.rs ili www.primer.rs")).toBe("пишите на dom@primer.rs или www.primer.rs");
  });

  it("ćirilica → latinica, i nazad bez gubitka", () => {
    expect(toLatin("Љубица Његош, џемпер")).toBe("Ljubica Njegoš, džemper");
    expect(toLatin("ЉУБИЦА")).toBe("LJUBICA");
    for (const s of ["Specifikacija za period 25.10.2026. – 23.11.2026.", "Đorđe Ćirić, Žabalj"]) {
      expect(toLatin(toCyrillic(s))).toBe(s);
    }
  });

  it("pretraga ne zavisi od pisma", () => {
    expect(normalizeSearch("Живковић")).toBe(normalizeSearch("zivkovic"));
    expect(normalizeSearch("Ђорђе")).toBe("djordje");
  });
});

function Page() {
  const [n, setN] = useState(0);
  return (
    <ScriptProvider>
      <ScriptSwitch />
      <h1>Pacijenti na smeštaju</h1>
      <input placeholder="Pretraži po imenu..." defaultValue="Milica" aria-label="Pretraga" />
      <kbd>Ctrl K</kbd>
      <span data-no-translit>ostaje</span>
      <button type="button" onClick={() => setN((x) => x + 1)}>
        Dodaj
      </button>
      {n > 0 && <p>Novi unos {n}</p>}
    </ScriptProvider>
  );
}

describe("ScriptProvider", () => {
  it("prebacuje ceo ekran, uključujući novi sadržaj, i vraća nazad", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<Page />);
    expect(screen.getByRole("heading")).toHaveTextContent("Pacijenti na smeštaju");

    await user.click(screen.getByRole("button", { name: "Ћирилица" }));
    expect(screen.getByRole("heading")).toHaveTextContent("Пацијенти на смештају");
    expect(document.documentElement.lang).toBe("sr-Cyrl");
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("placeholder", "Претражи по имену...");
    expect(input).toHaveValue("Milica"); // ono što korisnik kuca se ne dira
    expect(screen.getByText("Ctrl K")).toBeInTheDocument();
    expect(screen.getByText("ostaje")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Latinica" })).toBeInTheDocument();

    // Sadržaj koji se pojavi kasnije
    await user.click(screen.getByRole("button", { name: "Додај" }));
    await act(() => Promise.resolve());
    expect(screen.getByText("Нови унос 1")).toBeInTheDocument();
    expect(localStorage.getItem("script")).toBe("cyrillic");

    await user.click(screen.getByRole("button", { name: "Latinica" }));
    expect(screen.getByRole("heading")).toHaveTextContent("Pacijenti na smeštaju");
    expect(screen.getByText("Novi unos 1")).toBeInTheDocument();
  });
});
