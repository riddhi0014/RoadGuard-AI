import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

// Read the token fresh on every request instead of baking it in once,
// so logging in/out during a session is reflected immediately.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("roadguard_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
