import client from "./client";

export const authApi = {
  login: (identifier, password) => client.post("/auth/login", { identifier, password }),
  logout: () => client.post("/auth/logout"),
  me: () => client.get("/auth/me"),
};
