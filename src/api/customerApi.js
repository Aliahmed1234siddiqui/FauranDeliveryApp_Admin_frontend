import client from "./client";

export const customerApi = {
  getAll: (params = {}) => client.get("/admin/customers", { params }), // params: { search, status }
};
