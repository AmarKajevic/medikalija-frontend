// Prijavljeni uređaji i zaštita od pada stranice.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }));
vi.mock("@shared/api/api", () => ({ api }));
vi.mock("@shared/lib/notify", () => ({ notify: { success: vi.fn(), error: vi.fn() } }));
const monitoring = vi.hoisted(() => ({ captureError: vi.fn() }));
vi.mock("@shared/lib/monitoring", () => monitoring);

import SessionsDialog from "./ui/SessionsDialog";
import { describeDevice } from "./model";
import ErrorBoundary from "@shared/ui/feedback/ErrorBoundary";

const CHROME_WIN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const SAFARI_IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

beforeEach(() => {
  api.get.mockResolvedValue({
    data: {
      sessions: [
        { id: "s1", method: "password", userAgent: CHROME_WIN, ip: "1.2.3.4", createdAt: "2026-11-01T08:00:00Z", lastUsedAt: "2026-11-09T08:00:00Z", current: true },
        { id: "s2", method: "google", userAgent: SAFARI_IOS, ip: "5.6.7.8", createdAt: "2026-11-02T08:00:00Z", lastUsedAt: "2026-11-08T08:00:00Z", current: false },
      ],
    },
  });
  api.delete.mockResolvedValue({ data: {} });
  api.post.mockResolvedValue({ data: { message: "Odjavljeno uređaja: 1." } });
});

describe("prijavljeni uređaji", () => {
  it("prepoznaje uređaj iz User-Agent-a", () => {
    expect(describeDevice(CHROME_WIN)).toEqual({ label: "Chrome · Windows", mobile: false });
    expect(describeDevice(SAFARI_IOS)).toEqual({ label: "Safari · iOS", mobile: true });
    expect(describeDevice("").label).toBe("Nepoznat uređaj");
  });

  it("lista uređaja; ovaj se ne odjavljuje odavde; drugi i 'svi ostali' da", async () => {
    const { user } = renderWithProviders(<SessionsDialog open onClose={vi.fn()} />);
    expect(await screen.findByText("Ovaj uređaj")).toBeInTheDocument();
    expect(screen.getByText("Safari · iOS")).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: /^Odjavi Chrome/ })).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Odjavi Safari · iOS" }));
    expect(api.delete).toHaveBeenCalledWith("/api/auth/sessions/s2");
    await user.click(screen.getByRole("button", { name: "Odjavi sve ostale uređaje" }));
    expect(api.post).toHaveBeenCalledWith("/api/auth/sessions/revoke-others");
  });
});

describe("ErrorBoundary", () => {
  it("greška pri prikazu: poruka umesto belog ekrana, greška se prijavljuje", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const Broken = () => {
      throw new Error("bum");
    };
    renderWithProviders(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Došlo je do greške na ovoj stranici/)).toBeInTheDocument();
    expect(monitoring.captureError).toHaveBeenCalledWith(expect.objectContaining({ message: "bum" }), expect.anything());
  });
});
