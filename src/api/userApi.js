import client from "./client";

// Generic block/unblock - works for any role (customer, vendor, rider)
export const userApi = {
  setActive: (id, isActive) => client.patch(`/admin/users/${id}/block`, { isActive }),
};
