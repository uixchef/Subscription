# Subscription — Payments Hub UI

A **Next.js** front-end for managing subscriptions inside a **Payment Hub** shell: sidebar navigation, top bar, and a subscriptions list with per-subscription detail views. The experience is modeled after a CRM-style hub (e.g. HighLevel-style layout); **business data created in the UI is stored in the browser** (`sessionStorage`) for prototyping—there is no backend API in this repo.

## What’s in the box

- **Hub chrome**: collapsible sidebar, top bar, toast region, responsive layout (`PaymentHubShell`).
- **Subscriptions list** (`/subscriptions`): table with toolbar, pagination, and navigation to detail.
- **Subscription detail** (`/subscriptions/[subscriptionId]`): status, billing, line items, transactions, customer and payment actions.
- **Flows (UI)**: create subscription, edit customer, add/update payment method, pause, resume, cancel, tax/line-item modals, and related validation helpers (postal/phone by region).

The home route redirects to `/subscriptions`.

## Tech stack

| Area | Choice |
|------|--------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router) |
| UI | React 19, [Tailwind CSS](https://tailwindcss.com) 4 |
| Components | [Radix UI](https://www.radix-ui.com) primitives, [shadcn](https://ui.shadcn.com)-style patterns (`src/components/ui`) |
| Icons | [Lucide React](https://lucide.dev) |
| Scripts | `dev` runs on **port 4000** (see below) |

## Prerequisites

- **Node.js** 20+ (aligns with `engines` expectations for modern Next; Node 24 is the current Vercel default)
- **npm** (or use your preferred package manager consistently)

## Getting started

```bash
cd my-app
npm install
npm run dev
```

Open [http://localhost:4000](http://localhost:4000). The dev server is configured for port **4000** in `package.json` (`next dev --webpack -p 4000`).

Other scripts:

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server (webpack), port 4000 |
| `npm run dev:turbo` | Dev with Turbopack, port 4000 |
| `npm run dev:clean` | Clear `.next` then dev |
| `npm run build` | Production build |
| `npm run start` | Start production server (after `build`) |
| `npm run lint` | ESLint |

## Data and persistence

- **Created subscriptions** and several related slices (e.g. customer directory, row updates) use **`sessionStorage`** with versioned keys. Clearing site data or closing the session resets that state.
- Seeded/demo data lives in modules such as `customer-demo-data.ts` where applicable.
- Treat this as a **product/design prototype**, not a source of truth for production billing.

## Project layout (high level)

```
src/
  app/
    (hub)/           # Hub layout: subscriptions, payments placeholder
    layout.tsx       # Root layout
    page.tsx         # Redirects to /subscriptions
  components/
    payment-hub/     # Shell, sidebar, top bar, toasts
    subscriptions/   # Feature UI, modals, tables, storage helpers
    ui/                # Shared primitives (button, dialog, etc.)
  lib/                 # Shared utilities (dates, etc.)
```

## Deploy

You can deploy to [Vercel](https://vercel.com) or any host that supports Next.js. Configure environment variables only if you extend the app with real APIs—this codebase does not require secrets for the default local-storage behavior.

## License

Private project (`"private": true` in `package.json`). All rights reserved unless you add an explicit license file.
