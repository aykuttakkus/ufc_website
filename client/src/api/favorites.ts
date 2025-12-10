// src/api/favorites.ts
import { api } from "./http";
import type { Favorite } from "../types";

// GET /api/favorites → Kullanıcının tüm favorileri
export async function getFavorites(): Promise<Favorite[]> {
  const res = await api.get<{ success: boolean; data: Favorite[] }>(
    "/favorites"
  );
  return res.data.data;
}

// POST /api/favorites  → yeni favori + not
// ❗ fighterId değil, fighterExternalId (slug) gönderiyoruz
export async function addFavorite(
  fighterExternalId: string,
  note: string
): Promise<Favorite> {
  const res = await api.post<{ success: boolean; data: Favorite }>(
    "/favorites",
    { fighterExternalId, note }
  );
  return res.data.data;
}

// PATCH /api/favorites/:externalId  → notu güncelle
// :externalId = Fighter.externalId (slug)
export async function updateFavoriteNote(
  fighterExternalId: string,
  note: string
): Promise<Favorite> {
  const encodedExternalId = encodeURIComponent(fighterExternalId);
  const res = await api.patch<{ success: boolean; data: Favorite }>(
    `/favorites/${encodedExternalId}`,
    { note }
  );
  return res.data.data;
}

// DELETE /api/favorites/:externalId → Favoriyi sil
// :externalId = Fighter.externalId (slug)
export async function deleteFavorite(
  fighterExternalId: string
): Promise<{ success: boolean; message: string }> {
  const encodedExternalId = encodeURIComponent(fighterExternalId);
  console.log(
    "DELETE request - externalId:",
    fighterExternalId,
    "encoded:",
    encodedExternalId
  );
  const res = await api.delete<{ success: boolean; message: string }>(
    `/favorites/${encodedExternalId}`
  );
  return res.data;
}