import type { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

interface Options {
  route?: string | { pathname: string; state?: unknown };
  /** Putanja rute (npr. "/patients/:patientId") kad komponenta čita parametre */
  path?: string;
  /** Dodatne rute (npr. odredište preusmerenja) */
  extraRoutes?: ReactNode;
}

export function renderWithProviders(ui: ReactElement, { route = "/", path = "*", extraRoutes }: Options = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const user = userEvent.setup();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
          {extraRoutes}
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...utils, user, queryClient };
}
