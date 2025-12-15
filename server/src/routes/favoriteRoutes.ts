// src/routes/favoriteRoutes.ts
import { Router } from "express";
import {
  getFavorites,
  createFavorite,
  updateFavoriteNote,
  deleteFavoriteByExternalId,
} from "../controllers/favoriteControllers";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// 🔐 Bu router altındaki TÜM endpoint'ler auth ister
router.use(authMiddleware);

// GET /api/favorites            → Kullanıcının tüm favorileri (fighter populate edilmiş)
router.get("/", getFavorites);

// POST /api/favorites           → Yeni favori oluştur
// Body: { fighterExternalId: string, note?: string }
router.post("/", createFavorite);

// PATCH /api/favorites/:externalId  → Favori notunu güncelle
// :externalId = Tercihen Fighter.externalId (slug)
router.patch("/:externalId", updateFavoriteNote);

// DELETE /api/favorites/:externalId → Favoriyi sil
// :externalId = Tercihen Fighter.externalId (slug)
router.delete("/:externalId", deleteFavoriteByExternalId);

export default router;