import client from "./client";

export const categoryApi = {
  create: (payload) => client.post("/admin/categories", payload), // { name, parentCategory? }
};
