# Fauran Admin Portal

React 19 + Vite admin portal for the Fauran quick-commerce marketplace. It covers every route in `routes/adminRoutes.js` (mounted at `/api/admin`), and runs on realistic mock data until you switch it to the live backend.

```bash
npm install
npm run dev        # http://localhost:5173  (demo login is prefilled)
npm run build
npm run lint
```

## Going live

All API calls go through `src/services/adminApi.js`, with one function per backend route. Mock mode is on by default. To use the real Node API, create `.env.local`:

```
VITE_USE_MOCK=false
VITE_API_BASE_URL=/api        # Vite proxies /api to http://localhost:5000 (see vite.config.js)
```

`src/services/http.js` sends the bearer token (`furan_admin_token`), refreshes it once on a 401 via `/auth/refresh-token`, and unwraps the `{ success, data }` envelope. List endpoints are expected to return `{ items, total, page, limit }`. Image routes (`products`, `categories`, `master-catalog`) are sent as `multipart/form-data` under the multer field names `images` and `image`.

## Pages → endpoints

| Page | Route | Endpoints |
|---|---|---|
| Dashboard | `/` | `dashboard/summary`, `dashboard/commission`, `dashboard/inventory`, `analytics/sales` |
| Orders | `/orders`, `/orders/:id` | `GET orders`, `GET orders/:id`, `PATCH orders/:id/cancel`, `PATCH orders/:id/confirm-return` |
| Vendors | `/vendors`, `/vendors/:id` | `GET vendors`, `GET vendors/:id`, `PATCH vendors/:id/approve`, `PATCH users/:id/block` |
| Riders | `/riders`, `/riders/:id`, `/riders/live` | `GET riders`, `GET riders/:id`, `GET riders/live`, `PATCH riders/:id/approve` |
| Customers | `/customers`, `/customers/:id` | `GET customers`, `GET customers/:id`, `PATCH customers/:id/status`, `PATCH customers/:id/cod` |
| Payments | `/payments` | `GET payments` |
| Payouts & settlements | `/payouts` | `payouts/vendors`, `payouts/riders`, `payouts/user/:id`, `POST payouts`, `POST payouts/cash-deposit`, `GET settlements` |
| Products | `/products` | full CRUD + `PATCH products/:id/approve` |
| Categories | `/categories` | full CRUD (with sub-categories via `parentCategory`) |
| Master catalog | `/master-catalog` | CRUD, `GET master-catalog/tree`, `POST master-catalog/bulk` |
| Inventory | `/inventory` | `GET inventory` |
| Reports | `/reports?tab=` | `reports/sales`, `revenue`, `vendors`, `riders`, `forecast` |
| Employees | `/employees` | full CRUD + `GET permissions` |
| Settings | `/settings` | `GET settings`, `PUT settings/radius`, `settings/commission`, `settings/general` |
| My profile | `/profile` | `GET me`, `GET permissions` |

Readable IDs (`VEN0003`, `ORD202610130001`, …) work in URLs, matching `useCustomIdParams`.

## Permissions

The sidebar, routes and command palette use the same keys as `requirePermission` (`src/layout/nav.js`). Super admins see everything. Employees see only the pages listed in their `permissions`, and other pages show a "no access" screen. A super admin can use **Preview as…** in the account menu to see the portal as an employee would.

## Structure

```
src/
  services/   http.js (fetch client), adminApi.js (one fn per route + mock implementations)
  data/       mockDb.js - in-memory demo data, mutated by mock actions
  lib/        router, auth/permissions context, data hooks, formatters
  ui/         design-system components: buttons, badges, tables, modals, drawers, charts…
  layout/     sidebar, top bar, Ctrl+K command palette, nav config
  pages/      one file per screen
  styles.css  design tokens (light + dark) and all component styles
```

`legacy-backup/` holds the previous single-file version of the app. The older `src/Components`, `src/api`, `src/context`, `src/routes` and `src/utils` folders are no longer imported and can be removed.
