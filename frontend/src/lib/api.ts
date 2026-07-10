import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

// Attaches the JWT to every request, if present.
// ASSUMPTION: token is stored in localStorage under "token" — update this
// if AuthContext uses a different key/storage mechanism.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("roadguard_token");  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});