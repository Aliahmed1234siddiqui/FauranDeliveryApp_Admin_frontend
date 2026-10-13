import client from "./client";

export const orderApi = {
  // params: { status, vendorId, fromDate, toDate }
  getAll: (params = {}) => client.get("/admin/orders", { params }),
};
