import client from "./client";

export const riderApi = {
  getAll: (params = {}) => client.get("/admin/riders", { params }), // params: { status }
  approve: (id, approvalStatus) => client.patch(`/admin/riders/${id}/approve`, { approvalStatus }),
};
