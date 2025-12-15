// src/api/eventsApi.ts
import { api } from "./http";
import type { UfcEvent, EventWithFights } from "../types";

type EventsResponse = {
  success: boolean;
  data: UfcEvent[];
};

type EventDetailResponse = {
  success: boolean;
  data: EventWithFights;
};

export async function getUpcomingEvents(): Promise<UfcEvent[]> {
  const res = await api.get<EventsResponse>("/ufc/events/upcoming");
  return res.data.data;
}

export async function getPastEvents(): Promise<UfcEvent[]> {
  const res = await api.get<EventsResponse>("/ufc/events/past");
  return res.data.data;
}

// 🔥 Event detail (fight card + isimler)
export async function fetchEventDetail(
  ufcId: string
): Promise<EventWithFights> {
  const res = await api.get<EventDetailResponse>(`/ufc/events/${ufcId}`);
  return res.data.data;
}