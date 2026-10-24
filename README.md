# Fauran Mart Admin Portal

React 19 + Vite admin portal for the Fauran Mart delivery marketplace. It is wired to every endpoint in the **Furan Admin Portal API** handbook: login, account and permissions, vendors, riders, customers, orders, payments and refunds, settings, products, categories, master catalog, inventory, dashboard and reports, payouts, employees, the live rider map and notifications.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run lint       # ESLint (lint:fix to auto-fix, incl. import order)
npm run format     # Prettier
npm run check      # lint + format check + build — run before pushing
```

## Connecting to the backend

`npm run dev` proxies `/api` and `/socket.io` to the backend, so the browser only ever talks to its own origin. That means no CORS setup and readable paging headers. Create `.env.local` (copy `.env.example`):

```bash
# Local backend (default)
VITE_BACKEND_URL=http://localhost:5000

# …or the deployed backend
VITE_BACKEND_URL=https://fauran-delivery-app-apis.vercel.app
```

Leave `VITE_API_BASE_URL` at `/api` in development. For a production build served from another domain, set it to the full API URL (`https://host/api`; a bare `https://host` also works, since `/api` is added for you). The backend's CORS list must then include the portal's domain. At the time of writing, the deployed API only allows `http://localhost:3000`.

**Live updates:** the rider map and notification bell listen on Socket.IO (`rider:live_location`, `rider:status`, `notification:new`). Vercel does not keep websockets open, so against the Vercel deployment the map falls back to polling every 15 seconds. Run the backend on a normal Node host to get real-time pins.

## Deploying

The portal is a single-page app, so the host must serve `index.html` for every path. Otherwise reloading a page such as `/vendors/VEN…` gives a 404.

- **Vercel:** `vercel.json` does this, and also forwards `/api/*` to the backend so production calls stay same-origin (no CORS setup). Leave `VITE_API_BASE_URL` unset or set it to `/api`.
- **Netlify / Cloudflare Pages / Render:** `public/_redirects` holds the same two rules.

If the backend URL changes, update it in both files.

## How the code is organised

```
src/
  main.jsx               entry: stamps the theme, mounts <App>
  app/                   app.jsx (providers) → auth-gate.jsx (login vs app) → app-shell.jsx (layout)
  router/                tiny history router: RouterProvider, Link, useRouter, useQueryState
    paths.js             every in-app URL builder: paths.order(id), paths.orders({ status })
    routes.js            page table: path pattern, permission, breadcrumbs (lazy-loaded pages)
  context/               auth: AuthProvider + useAuth() → admin, can(...perms), login/logout, preview
  hooks/                 useApi, useList, useAction, useDebounced, useTheme, useHotkey, …
  services/
    http.js              fetch client: bearer token, refresh-once on 401, logout when blocked,
                         envelope unwrapping, paging headers, multipart helper (withFiles)
    socket.js            Socket.IO connection + useSocketEvent(event, handler)
    query-client.js      React Query cache settings (stale time, retries)
    api/                 one module per handbook section; every function documents its
      auth.js              params and response shape. Import from '@/services/api'.
      people.js          vendors, riders, customers, block/unblock
      orders.js          orders, payments, refunds
      catalog.js         products, categories, master catalog, inventory
      reports.js         dashboard, reports, settings
      finance.js         payouts, cash deposits, settlements
      team.js            employees, notifications
  components/            shared building blocks, one component per file, each folder has an index.js
    ui/                  Button, Badge, Card, Field, Input, Select, StatCard, Skeleton, …
    overlays/            Modal, Drawer, ConfirmDialog, Menu
    charts/              LineChart, BarChart, Donut, Sparkline, BarList
    data-table/          DataTable, Pagination
    layout/              Sidebar, Topbar, CommandPalette, nav-config.js
    common/              cross-page features: ApprovalPanel, BlockButton, RefundButton, DateRange, …
  pages/<feature>/       <name>-page.jsx (the route's default export) plus, when needed:
    components/          sections used only by that feature
    hooks/               hooks used only by that feature
    <feature>-utils.js   small helpers used only by that feature
  constants/             statuses, payment methods, labels
  utils/                 format (money, dates…), cx (class names)
  config/env.js          env vars → API_BASE_URL, SOCKET_URL, PAGE_SIZE
  styles/                index.css imports, in order: tokens.css (colors, fonts, radii — edit the
                         theme here), base, layout, components/*, pages, responsive
```

### Conventions

- **Imports** use the `@/` alias (`@/components/ui`, `@/hooks`), never `../../..`. Import shared pieces from the folder (`@/components/ui`), not the file. ESLint sorts imports into packages → `@/` → relative.
- **Files** are kebab-case. A component file exports one component, named in PascalCase; only route pages use `export default` (they're lazy-loaded).
- **URLs** always come from `paths` (`navigate(paths.vendor(id))`), so a route rename is a one-line change in `router/paths.js` and `router/routes.js`.
- **Data**: reads go through `useApi(fn, deps, { key })` or `useList`, writes through `useAction`. Give every `useApi` call a cache `key`, and put everything the call depends on in `deps`.
- **Where code goes**: used by one page → `pages/<feature>/components`; used by two or more features → `components/common` (or `components/ui` if it has no business logic).
- **Formatting** is Prettier's; run `npm run check` before pushing.

### Adding a page

1. Create `src/pages/<feature>/<name>-page.jsx` with a default export.
2. Add its URL builder to `router/paths.js` and its row (path, permission, breadcrumbs) to `router/routes.js`.
3. Add it to the sidebar in `components/layout/nav-config.js` if it should appear there.

### Calling an endpoint

```js
import { vendorsApi } from '@/services/api';

const page = await vendorsApi.list({ status: 'pending', search: 'fresh', page: 1 });
// → { items, total, page, limit, totalPages }  (totals come from X-Total-* headers)

await vendorsApi.setApproval('VEN20261014172201', 'rejected', 'Blurry CNIC');
```

Errors throw `ApiError` with the server's `message` (shown to the admin as a toast by `useAction`), `status` and the raw `body`.

### Adding or changing an endpoint

1. Add or edit the function in the matching `src/services/api/*.js` file and update its JSDoc.
2. Re-export it from `src/services/api/index.js` if it is a new object.
3. Use it in a page with `useApi` (reads), `useList` (paged lists kept in the URL) or `useAction` (writes with toasts).

## Permissions

The sidebar, routes and command palette use the same 12 keys as the backend (`src/components/layout/nav-config.js`). Super admins see everything; employees only see pages in their `permissions`, and other URLs show a "no access" screen. A super admin can use **Preview as…** in the account menu to see the portal as one of their employees.

## Ids

Readable ids (`VEN…`, `RID…`, `CUS…`, `ORD…`, `PRD…`, `CTL…`) are used in every URL, e.g. `/vendors/VEN20261014172201`. The backend accepts them as well as Mongo `_id`s.
