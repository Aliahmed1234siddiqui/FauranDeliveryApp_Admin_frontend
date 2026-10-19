# Fauran Admin Portal

React 19 + Vite admin portal for the Fauran delivery marketplace. It is wired to every endpoint in the **Furan Admin Portal API** handbook: login, account and permissions, vendors, riders, customers, orders, payments and refunds, settings, products, categories, master catalog, inventory, dashboard and reports, payouts, employees, the live rider map and notifications.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run lint
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
  config.js            env vars → API_BASE_URL, SOCKET_URL, PAGE_SIZE
  services/
    http.js            fetch client: bearer token, refresh-once on 401, logout when blocked,
                       envelope unwrapping, paging headers, multipart helper (withFiles)
    socket.js          Socket.IO connection + useSocketEvent(event, handler)
    api/               one module per handbook section - every function documents its
      auth.js            params and response shape. Import from 'services/api'.
      people.js        vendors, riders, customers, block/unblock
      orders.js        orders, payments, refunds
      catalog.js       products, categories, master catalog, inventory
      reports.js       dashboard, reports, settings
      finance.js       payouts, cash deposits, settlements
      team.js          employees, notifications
  lib/                 router, auth/permissions context, useApi/useAction/useList hooks,
                       formatters, constants (statuses, payment methods…)
  ui/                  design-system components: buttons, badges, tables, modals, charts…
  layout/              sidebar, top bar (notifications), Ctrl+K palette, nav config
  pages/               one file per screen; shared.jsx holds cross-page pieces
                       (approval panel, block button, refund dialog, date range…)
  styles.css           design tokens (light + dark) and component styles
```

### Calling an endpoint

```js
import { vendorsApi } from '../services/api';

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

The sidebar, routes and command palette use the same 12 keys as the backend (`src/layout/nav.js`). Super admins see everything; employees only see pages in their `permissions`, and other URLs show a "no access" screen. A super admin can use **Preview as…** in the account menu to see the portal as one of their employees.

## Ids

Readable ids (`VEN…`, `RID…`, `CUS…`, `ORD…`, `PRD…`, `CTL…`) are used in every URL, e.g. `/vendors/VEN20261014172201`. The backend accepts them as well as Mongo `_id`s.
