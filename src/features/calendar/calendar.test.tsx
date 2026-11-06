// Kalendar: pretvaranje forme u zahtev (i za ceo niz iz termina), opis ponavljanja,
// unos vremena i tok čuvanja događaja koji se ponavlja.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { parseTime } from "@shared/lib/timeText";
import Dialog from "@shared/ui/dialog/Dialog";
import TimeInput from "@shared/ui/form/TimeInput";
import { CalendarOccurrence, combine, describeRecurrence, draftFrom, newDraft, presetOf, toPayload, validateDraft } from "./model";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));
const notify = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("@shared/lib/notify", () => ({ notify }));

import EventDialog from "./ui/EventDialog";

const weekly: CalendarOccurrence = {
  id: "s1_x",
  eventId: "s1",
  title: "Fizioterapija",
  description: "",
  location: "",
  calendar: "plava",
  patient: null,
  allDay: false,
  start: combine("2026-11-17", "10:00").toISOString(),
  end: combine("2026-11-17", "11:00").toISOString(),
  occurrenceStart: combine("2026-11-17", "10:00").toISOString(),
  recurring: true,
  recurrence: { freq: "weekly", interval: 1, byWeekday: [1] },
  series: { start: combine("2026-11-03", "10:00").toISOString(), end: combine("2026-11-03", "11:00").toISOString() },
  isException: false,
  createdBy: null,
};

beforeEach(() => {
  Object.values(api).forEach((f) => f.mockReset());
  Object.values(notify).forEach((f) => f.mockReset());
  api.get.mockResolvedValue({ data: { patients: [] } });
});

describe("model", () => {
  it("izmena celog niza iz termina pomera početak niza za isti pomeraj", () => {
    const d = draftFrom(weekly);
    // termin 17.11. pomeren sa 10:00 na 11:30, trajanje 30 min
    const body = toPayload({ ...d, startTime: "11:30", endTime: "12:00" }, "series");
    expect(body.start).toBe(combine("2026-11-03", "11:30").toISOString());
    expect(body.end).toBe(combine("2026-11-03", "12:00").toISOString());
    expect(body.recurrence).toEqual({ freq: "weekly", interval: 1, byWeekday: [1] });
  });

  it("samo jedan termin: šalje se termin, bez ponavljanja, sa ključem termina", () => {
    const body = toPayload({ ...draftFrom(weekly), startTime: "11:30", endTime: "12:00" }, "occurrence");
    expect(body.start).toBe(combine("2026-11-17", "11:30").toISOString());
    expect(body).toMatchObject({ scope: "occurrence", occurrenceStart: weekly.occurrenceStart, recurrence: null });
  });

  it("celodnevni: datumi bez vremena, kraj uključiv", () => {
    const d = { ...newDraft({ start: new Date(2026, 10, 2), end: new Date(2026, 10, 4), allDay: true }), title: "Renoviranje" };
    expect(toPayload(d)).toMatchObject({ allDay: true, start: "2026-11-02", end: "2026-11-04" });
  });

  it("nov događaj bez vremena: naredno pola sata, 1 h", () => {
    const d = newDraft();
    expect(d.startTime).toMatch(/:(00|30)$/);
    expect(combine(d.endDate, d.endTime).getTime() - combine(d.startDate, d.startTime).getTime()).toBe(3_600_000);
  });

  it("provera: kraj posle početka, naziv obavezan", () => {
    const d = newDraft({ start: new Date(2026, 10, 2, 10), end: new Date(2026, 10, 2, 11) });
    expect(validateDraft(d)).toBe("Unesite naziv događaja.");
    expect(validateDraft({ ...d, title: "X", endTime: "09:00" })).toBe("Kraj mora biti posle početka.");
    expect(validateDraft({ ...d, title: "X" })).toBeNull();
  });

  it("opis ponavljanja običnim jezikom i prepoznavanje gotovih izbora", () => {
    expect(describeRecurrence({ freq: "weekly", byWeekday: [1, 3] })).toBe("Svake nedelje: uto, čet");
    expect(describeRecurrence({ freq: "weekly", byWeekday: [0, 1, 2, 3, 4] })).toBe("Svake nedelje: radnim danima");
    expect(describeRecurrence({ freq: "daily", interval: 2, count: 5 })).toBe("Svakih 2 dana · 5 puta");
    expect(describeRecurrence({ freq: "monthly", until: "2026-12-31" }, "2026-11-17")).toBe("Svakog meseca, 17. · do 31.12.2026.");
    expect(presetOf({ freq: "weekly", byWeekday: [0, 1, 2, 3, 4] })).toBe("weekdays");
    expect(presetOf({ freq: "weekly", byWeekday: [1] })).toBe("weekly");
    expect(presetOf({ freq: "daily", count: 3 })).toBe("custom");
  });
});

describe("vreme", () => {
  it("prihvata uobičajene načine kucanja, 24 h", () => {
    expect(parseTime("930")).toBe("09:30");
    expect(parseTime("9")).toBe("09:00");
    expect(parseTime("14.15")).toBe("14:15");
    expect(parseTime("1430")).toBe("14:30");
    expect(parseTime("24:00")).toBeNull();
    expect(parseTime("12:75")).toBeNull();
  });

  function Harness() {
    const [v, setV] = useState("09:00");
    return (
      <>
        <label htmlFor="t">Vreme</label>
        <TimeInput id="t" value={v} onChange={setV} durationFrom="08:00" />
        <output data-testid="v">{v}</output>
      </>
    );
  }

  it("kucanje pa izlazak iz polja; izbor sa liste prikazuje trajanje", async () => {
    const { user } = renderWithProviders(<Harness />);
    const input = screen.getByLabelText("Vreme");
    await user.clear(input);
    await user.type(input, "1045");
    await user.tab();
    expect(screen.getByTestId("v")).toHaveTextContent("10:45");

    await user.click(input);
    const option = screen.getByRole("option", { name: /11:00/ });
    expect(option).toHaveTextContent("3 h");
    await user.click(option);
    expect(screen.getByTestId("v")).toHaveTextContent("11:00");
  });

  it("neispravno vreme: poruka, vrednost ostaje", async () => {
    const { user } = renderWithProviders(<Harness />);
    const input = screen.getByLabelText("Vreme");
    await user.clear(input);
    await user.type(input, "99");
    await user.tab();
    expect(screen.getByRole("alert")).toHaveTextContent("SS:MM");
    expect(screen.getByTestId("v")).toHaveTextContent("09:00");
  });

  it("Escape zatvara listu, ali ne i dijalog", async () => {
    const close = vi.fn();
    const { user } = renderWithProviders(
      <Dialog open onClose={close} title="Test">
        <Harness />
      </Dialog>
    );
    await user.click(screen.getByLabelText("Vreme"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(close).not.toHaveBeenCalled();
  });
});

describe("EventDialog", () => {
  it("nov termin po satima sa ponavljanjem utorkom i četvrtkom", async () => {
    api.post.mockResolvedValue({ data: {} });
    const onClose = vi.fn();
    const draft = newDraft({ start: new Date(2026, 10, 17, 10, 0), end: new Date(2026, 10, 17, 11, 0) });
    const { user } = renderWithProviders(<EventDialog draft={draft} onClose={onClose} />);

    await user.type(screen.getByLabelText("Naziv"), "Fizioterapija");
    await user.click(screen.getByRole("button", { name: "30 min" }));
    await user.selectOptions(screen.getByLabelText("Ponavljanje"), "custom");
    await user.click(screen.getByRole("button", { name: "četvrtak" }));
    await user.click(screen.getByRole("radio", { name: "Posle" }));
    await user.click(screen.getByRole("button", { name: "Sačuvaj" }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    const [url, body] = api.post.mock.calls[0]!;
    expect(url).toBe("/api/calendar");
    expect(body).toMatchObject({
      title: "Fizioterapija",
      allDay: false,
      start: new Date(2026, 10, 17, 10, 0).toISOString(),
      end: new Date(2026, 10, 17, 10, 30).toISOString(),
      recurrence: { freq: "weekly", interval: 1, byWeekday: [1, 3], count: 10 },
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("promena početka pomera i kraj (trajanje ostaje)", async () => {
    const draft = newDraft({ start: new Date(2026, 10, 17, 10, 0), end: new Date(2026, 10, 17, 10, 45) });
    const { user } = renderWithProviders(<EventDialog draft={draft} onClose={vi.fn()} />);
    const [startTime] = screen.getAllByRole("combobox", { name: "u" });
    await user.clear(startTime!);
    await user.type(startTime!, "1400");
    await user.tab();
    const [, endTime] = screen.getAllByRole("combobox", { name: "u" });
    expect(endTime).toHaveValue("14:45");
  });

  it("izmena termina iz niza pita: samo ovaj ili svi", async () => {
    api.put.mockResolvedValue({ data: {} });
    const { user } = renderWithProviders(<EventDialog draft={draftFrom(weekly)} onClose={vi.fn()} />);
    await user.clear(screen.getByLabelText("Naziv"));
    await user.type(screen.getByLabelText("Naziv"), "Fizioterapija (pomereno)");
    await user.click(screen.getByRole("button", { name: "Sačuvaj" }));

    const scope = screen.getByRole("dialog", { name: "Izmena događaja koji se ponavlja" });
    expect(within(scope).getByRole("radio", { name: /Samo ovaj termin/ })).toBeChecked();
    await user.click(within(scope).getByRole("button", { name: "Sačuvaj" }));
    await waitFor(() => expect(api.put).toHaveBeenCalled());
    expect(api.put.mock.calls[0]![0]).toBe("/api/calendar/s1");
    expect(api.put.mock.calls[0]![1]).toMatchObject({ scope: "occurrence", title: "Fizioterapija (pomereno)", recurrence: null });
  });

  it("neispravan unos se ne šalje", async () => {
    const { user } = renderWithProviders(<EventDialog draft={newDraft()} onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Sačuvaj" }));
    expect(api.post).not.toHaveBeenCalled();
    expect(notify.error).toHaveBeenCalledWith("Unesite naziv događaja.");
  });
});
