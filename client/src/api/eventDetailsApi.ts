// src/api/eventsApi.ts
import type { EventWithFights } from "../types";
import { api } from "./http"; // ⚠️ BURASI ÖNEMLİ: ortak axios instance'ı

// Tek event + fights detayını getir
export async function getEventById(ufcId: string): Promise<EventWithFights> {
  // Backend: /api/ufc/events/:ufcId
  const res = await api.get(`/ufc/events/${ufcId}`);
  return res.data.data;
}

// Upcoming events listesi
export async function getUpcomingEvents(): Promise<EventWithFights[]> {
  const res = await api.get("/ufc/events/upcoming");
  return res.data.data;
}

// Past events listesi
export async function getPastEvents(): Promise<EventWithFights[]> {
  const res = await api.get("/ufc/events/past");
  return res.data.data;
}

// (İstersen) tüm upcoming detaylarını backend'ten refresh eden endpoint
export async function refreshAllUpcomingEvents() {
  const res = await api.post("/ufc/events/refresh-all");
  return res.data;
}