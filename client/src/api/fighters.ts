// src/api/fighters.ts
import { api } from "./http";
import type { Fighter } from "../types";

// 🔹 Opsiyonel filtrelerle GET /api/fighters
export async function getFighters(params?: {
  weightClass?: string;
  country?: string;
  q?: string;
}) {
  const res = await api.get<{ success: boolean; data: Fighter[] }>(
    "/fighters",
    { params }
  );
  return res.data.data;
}

// 🔹 GET /api/fighters/:externalId → slug/externalId ile tek dövüşçü
export async function getFighterByExternalId(externalId: string) {
  const res = await api.get<{ success: boolean; data: Fighter }>(
    `/fighters/${externalId}`
  );
  return res.data.data;
}

// 🧱 Yeni fighter yaratırken kullanacağımız payload
// (_id, createdAt, updatedAt backend tarafından set ediliyor)
export type FighterCreatePayload = Omit<
  Fighter,
  "_id" | "createdAt" | "updatedAt"
>;

// 🔹 POST /api/fighters  → Manuel yeni dövüşçü oluştur
export async function createFighter(payload: FighterCreatePayload) {
  const res = await api.post<{ success: boolean; data: Fighter }>(
    "/fighters",
    payload
  );
  return res.data.data;
}

// 🔹 PUT /api/fighters/:externalId  (tam güncelleme – externalId ile)
export async function updateFighter(
  externalId: string,
  payload: FighterCreatePayload
) {
  const res = await api.put<{ success: boolean; data: Fighter }>(
    `/fighters/${externalId}`,
    payload
  );
  return res.data.data;
}

// 🔹 PATCH /api/fighters/:externalId  (kısmi güncelleme – externalId ile)
export async function patchFighter(
  externalId: string,
  payload: Partial<FighterCreatePayload>
) {
  const res = await api.patch<{ success: boolean; data: Fighter }>(
    `/fighters/${externalId}`,
    payload
  );
  return res.data.data;
}

// 🔹 DELETE /api/fighters/:externalId
export async function deleteFighter(externalId: string) {
  const res = await api.delete<{ success: boolean; message: string }>(
    `/fighters/${externalId}`
  );
  return res.data;
}

// 🔹 POST /api/fighters/sync  → Octagon'dan veriyi çekip Mongo'ya yazar
export async function syncFighters() {
  const res = await api.post<{
    success: boolean;
    message: string;
    count: number;
  }>("/fighters/sync");

  return res.data; // { success, message, count }
}