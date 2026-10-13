import client from "./client";

export const settingsApi = {
  updateRadius: (payload) => client.put("/admin/settings/radius", payload),
  // payload: { initialKm, stepKm, maxKm, timeoutSec }
  updateCommission: (percent) => client.put("/admin/settings/commission", { percent }),
};
