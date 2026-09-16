# Medikalija

Admin dashboard for **Medikalija** — a resident and staff management system for elder-care facilities (starački dom). Admins and nursing staff use it to manage patients, medicine/article inventory, diagnoses and analyses, billing periods, and facility-wide scheduling. Talks to the [Medikalija API](../medikalija-api) backend.

UI is built on top of the [TailAdmin](https://tailadmin.com) React + Tailwind template (MIT licensed), customized for this domain.

## Tech stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4**
- **TanStack Query** for server state, **Axios** for HTTP
- **React Router v7**
- **ApexCharts** (dashboards), **FullCalendar** (scheduling), **pdfmake** (specification PDFs), **react-hook-form** + **zod** (forms)

## Features

- **Role-based dashboards** — admin/glavna sestra see facility-wide KPIs (patients, staff by role, low-stock medicines, upcoming events, recent activity); nurses/doctors see a lighter personal view. Same data surfaces as quick-access links in both the dashboard grid and the sidebar.
- **Patient profile** — single page for a patient's specification (billing period): pick/backfill any 30-day period, add lekovi/artikli/kombinacije, enter debt/lodging costs and exchange rates, print or export a PDF, all without leaving the page. Full specification history stays available as a secondary view.
- **Medicine & article inventory** — home and family stock, reserves, per-patient usage.
- **Diagnoses, analyses & combinations**, **calendar**, **notifications**, **dark mode**.
- Session handled via a short-lived in-memory access token plus a silent-refresh httpOnly cookie — no long-lived tokens sit in `localStorage`.

## Architecture

Organized as **Feature-Sliced Design**:

```
src/
  app/        entry point, routing, global providers (App.tsx, main.tsx)
  pages/      route-level components
  widgets/    composite UI blocks (sidebar, header, dashboard/patient panels)
  features/   user-facing actions (auth, specification editing, add-medicine, ...)
  entities/   domain data hooks/UI (patient, medicine, exchange-rate, ...)
  shared/     UI kit, API client, config, icons, lib
```

Each layer only imports from layers below it. Path aliases (`@app/*`, `@pages/*`, `@widgets/*`, `@features/*`, `@entities/*`, `@shared/*`, configured in `vite.config.ts` and `tsconfig.app.json`) are used for any cross-layer import, so moving a file only means updating its own imports, not every file that imports it.

## Getting started

### Prerequisites

- Node.js 18+
- The [Medikalija API](../medikalija-api) running (locally or deployed)

### Setup

```bash
npm install
cp .env.example .env   # set VITE_API_URL to your API's URL
npm run dev
```

### Environment variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the Medikalija API (e.g. `http://localhost:5000` or `https://medikalija-api.vercel.app`) |

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview a production build locally |

## License

The base UI template (TailAdmin) is MIT licensed — see `LICENSE.md`. The Medikalija-specific application code is proprietary to the facility it was built for.
