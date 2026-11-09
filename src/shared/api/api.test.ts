// Sesija u browseru: 401 → jedno osvežavanje → ponovljen zahtev; neuspeh → odjava.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { api, getAccessToken, setAccessToken, setOnAuthFailure } from "./api";

type Handler = (config: InternalAxiosRequestConfig) => { status: number; data: unknown };
let handler: Handler;
const calls: string[] = [];

const adapter: AxiosAdapter = async (config) => {
  calls.push(`${config.method?.toUpperCase()} ${config.url} ${config.headers.Authorization ?? "-"}`);
  const { status, data } = handler(config);
  const response = { status, data, statusText: String(status), headers: {}, config, request: {} };
  if (status >= 400) throw Object.assign(new Error(String(status)), { isAxiosError: true, response, config });
  return response;
};

beforeEach(() => {
  api.defaults.adapter = adapter;
  calls.length = 0;
  setAccessToken("stari");
  setOnAuthFailure(null);
});

describe("api: osvežavanje sesije", () => {
  it("istekao token (401): osveži jednom i ponovi zahtev sa novim tokenom", async () => {
    handler = (c) =>
      c.url === "/api/auth/refresh"
        ? { status: 200, data: { accessToken: "novi", user: { _id: "u" } } }
        : c.headers.Authorization === "Bearer novi"
          ? { status: 200, data: { ok: true } }
          : { status: 401, data: { code: "token_expired" } };

    const res = await api.get("/api/patient");
    expect(res.data).toEqual({ ok: true });
    expect(getAccessToken()).toBe("novi");
    expect(calls).toEqual(["GET /api/patient Bearer stari", "POST /api/auth/refresh Bearer stari", "GET /api/patient Bearer novi"]);
  });

  it("više zahteva istovremeno sa 401: samo jedno osvežavanje", async () => {
    handler = (c) =>
      c.url === "/api/auth/refresh"
        ? { status: 200, data: { accessToken: "novi", user: { _id: "u" } } }
        : c.headers.Authorization === "Bearer novi"
          ? { status: 200, data: c.url }
          : { status: 401, data: {} };
    const results = await Promise.all(["/api/a", "/api/b", "/api/c"].map((u) => api.get(u)));
    expect(results.map((r) => r.data)).toEqual(["/api/a", "/api/b", "/api/c"]);
    expect(calls.filter((c) => c.includes("/api/auth/refresh"))).toHaveLength(1);
  });

  it("sesija završena (osvežavanje ne uspe): javlja se odjava, bez beskonačnog ponavljanja", async () => {
    const failure = vi.fn();
    setOnAuthFailure(failure);
    handler = (c) => (c.url === "/api/auth/refresh" ? { status: 401, data: { code: "session_revoked" } } : { status: 401, data: {} });
    await expect(api.get("/api/patient")).rejects.toThrow("401");
    expect(failure).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
    expect(calls).toHaveLength(2);
  });

  it("403 (nema pravo) se ne tretira kao istek sesije", async () => {
    handler = () => ({ status: 403, data: {} });
    await expect(api.get("/api/users")).rejects.toThrow("403");
    expect(calls).toHaveLength(1);
  });
});
