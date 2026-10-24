// Single import point for every backend call:
//   import { vendorsApi, ordersApi } from '@/services/api';
//
// Each module mirrors one part of the Furan Admin API handbook and documents the
// params and response shape next to every function.

export { accountApi, authApi } from '@/services/api/auth';
export { categoriesApi, inventoryApi, masterCatalogApi, productsApi } from '@/services/api/catalog';
export { payoutsApi, SETTLEMENT_METHODS, settlementsApi } from '@/services/api/finance';
export { needsRefund, ordersApi, paymentsApi } from '@/services/api/orders';
export { customersApi, ridersApi, usersApi, vendorsApi } from '@/services/api/people';
export { dashboardApi, reportsApi, settingsApi } from '@/services/api/reports';
export { employeesApi, notificationsApi } from '@/services/api/team';
export { ApiError } from '@/services/http';
