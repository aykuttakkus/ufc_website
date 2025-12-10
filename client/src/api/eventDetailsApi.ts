// src/api/eventsApi.ts
import axios from "axios";
import type { EventWithFights } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
});

export async function getEventById(ufcId: string): Promise<EventWithFights> {
  const res = await api.get(`/events/${ufcId}`);
  return res.data.data;
}