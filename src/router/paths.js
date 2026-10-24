// Every in-app URL is built here, so a route can be renamed in one place.
//
//   navigate(paths.order(order.orderId))
//   navigate(paths.orders({ status: 'delivery_failed' }))
//
// Route patterns (with :id) live in routes.js next to the page they render.

// Adds ?key=value pairs, skipping empty values. Values are URL-encoded.
export function withQuery(path, query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

const list = (path) => (query) => withQuery(path, query);
const detail = (path) => (id) => `${path}/${encodeURIComponent(id)}`;

export const paths = {
  login: list('/login'),
  dashboard: list('/'),
  profile: list('/profile'),

  orders: list('/orders'),
  order: detail('/orders'),

  vendors: list('/vendors'),
  vendor: detail('/vendors'),
  riders: list('/riders'),
  rider: detail('/riders'),
  liveRiders: list('/riders/live'),
  customers: list('/customers'),
  customer: detail('/customers'),

  payments: list('/payments'),
  payouts: list('/payouts'),

  products: list('/products'),
  categories: list('/categories'),
  masterCatalog: list('/master-catalog'),
  inventory: list('/inventory'),

  reports: list('/reports'),
  employees: list('/employees'),
  settings: list('/settings'),
};
