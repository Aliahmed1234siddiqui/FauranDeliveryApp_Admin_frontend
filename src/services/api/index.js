// Single import point for every backend call:
//   import { vendorsApi, ordersApi } from '../services/api';
//
// Each module mirrors one part of the Furan Admin API handbook and documents the
// params and response shape next to every function.

export { authApi, accountApi } from './auth';
export { vendorsApi, ridersApi, customersApi, usersApi } from './people';
export { ordersApi, paymentsApi, needsRefund } from './orders';
export { productsApi, categoriesApi, masterCatalogApi, inventoryApi } from './catalog';
export { dashboardApi, reportsApi, settingsApi } from './reports';
export { payoutsApi, settlementsApi, SETTLEMENT_METHODS } from './finance';
export { employeesApi, notificationsApi } from './team';
export { ApiError } from '../http';
