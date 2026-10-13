
import client from "./client";

export const vendorApi = {
  getAll: (params = {}) => client.get("/admin/vendors", { params }), // params: { status }
  approve: (id, approvalStatus) => client.patch(`/admin/vendors/${id}/approve`, { approvalStatus }),
};
