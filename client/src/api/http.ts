// src/api/http.ts
import axios from "axios";
import { getToken } from "../utils/auth";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "http://localhost:5050";

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});