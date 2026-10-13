import client from "./client";

export const dashboardApi = {
  getCommissionSummary: () => client.get("/admin/dashboard/commission"),
  getInventoryOverview: () => client.get("/admin/dashboard/inventory"),
  getSalesAnalytics: () => client.get("/admin/analytics/sales"),
};
