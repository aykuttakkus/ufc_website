// src/api/http.ts
import axios from "axios";
import { getToken } from "../utils/auth";

export const api = axios.create({
  baseURL: "http://localhost:5050/api",
});

api.interceptors.request.use((config) => {
  const token = getToken(); // localStorage'dan "auth_token" okur
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});