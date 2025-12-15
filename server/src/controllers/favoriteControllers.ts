// src/controllers/favoriteControllers.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { Favorite } from "../models/Favorite";
import { Fighter } from "../models/Fighter";

// Ortak tarih formatlayıcı
function formatFavoriteWithFighter(doc: any) {
  if (!doc) return null;

  const obj = doc.toObject ? doc.toObject() : doc;
  const fighter = obj.fighter;

  return {
    ...obj,
    createdAt: obj.createdAt
      ? new Date(obj.createdAt).toLocaleString("tr-TR", {
          timeZone: "Europe/Istanbul",
        })
      : undefined,
    updatedAt: obj.updatedAt
      ? new Date(obj.updatedAt).toLocaleString("tr-TR", {
          timeZone: "Europe/Istanbul",
        })
      : undefined,
    fighter: fighter
      ? {
          ...fighter,
          createdAt: fighter.createdAt
            ? new Date(fighter.createdAt).toLocaleString("tr-TR", {
                timeZone: "Europe/Istanbul",
              })
            : undefined,
          updatedAt: fighter.updatedAt
            ? new Date(fighter.updatedAt).toLocaleString("tr-TR", {
                timeZone: "Europe/Istanbul",
              })
            : undefined,
        }
      : null,
  };
}

// GET /api/favorites  → Tüm favoriler (fighter bilgisiyle birlikte)
export const getFavorites = async (req: Request, res: Response) => {
  try {
    const favorites = await Favorite.find({ user: (req as any).userId })
      .populate("fighter")
      .sort({ createdAt: -1 });

    const formatted = favorites.map((f) => formatFavoriteWithFighter(f));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("getFavorites error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/favorites  → body: { fighterExternalId, note? }
export const createFavorite = async (req: Request, res: Response) => {
  try {
    const { fighterExternalId, note } = req.body as {
      fighterExternalId?: string;
      note?: string;
    };
    const userId = (req as any).userId;

    if (!fighterExternalId) {
      return res.status(400).json({
        success: false,
        message: "fighterExternalId zorunludur.",
      });
    }

    // slug (externalId) ile fighter bul
    const fighter = await Fighter.findOne({ externalId: fighterExternalId });
    if (!fighter) {
      return res
        .status(404)
        .json({ success: false, message: "Fighter not found" });
    }

    // aynı user + aynı fighter için favori var mı
    const existing = await Favorite.findOne({
      user: userId,
      fighter: fighter._id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Bu dövüşçü zaten favorilerinde.",
      });
    }

    const favorite = await Favorite.create({
      user: userId,
      fighter: fighter._id,
      note,
    });

    const populated = await favorite.populate("fighter");
    const formatted = formatFavoriteWithFighter(populated);

    res.status(201).json({ success: true, data: formatted });
  } catch (err: any) {
    console.error("createFavorite error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Bu dövüşçü zaten favorilerinde.",
      });
    }

    res.status(400).json({
      success: false,
      message: err.message || "Bad request",
    });
  }
};

// PATCH /api/favorites/:externalId  → Not güncelle
// :externalId = TERCIHEN Fighter.externalId (slug)
// ama geriye dönük uyumluluk için bazı fallback’ler var
export const updateFavoriteNote = async (req: Request, res: Response) => {
  try {
    const { externalId } = req.params;
    const { note } = req.body as { note?: string };
    const userId = (req as any).userId;

    if (!externalId) {
      return res
        .status(400)
        .json({ success: false, message: "externalId zorunludur." });
    }

    if (typeof note !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "note zorunludur." });
    }

    console.log("PATCH /api/favorites param:", externalId);

    let favorite = null;

    // 1️⃣ Normal case: externalId = Fighter.externalId (slug)
    const fighterBySlug = await Fighter.findOne({ externalId });
    if (fighterBySlug) {
      favorite = await Favorite.findOneAndUpdate(
        { user: userId, fighter: fighterBySlug._id },
        { note },
        { new: true, runValidators: true }
      ).populate("fighter");
    }

    // 2️⃣ Eğer slug ile bulunamadıysa ve param ObjectId formatında ise
    if (!favorite && mongoose.Types.ObjectId.isValid(externalId)) {
      // 2a) externalId = Favorite._id olabilir
      favorite = await Favorite.findOneAndUpdate(
        { _id: externalId, user: userId },
        { note },
        { new: true, runValidators: true }
      ).populate("fighter");

      // 2b) Hâlâ yoksa externalId = Fighter._id olabilir
      if (!favorite) {
        const fighterById = await Fighter.findById(externalId);
        if (fighterById) {
          favorite = await Favorite.findOneAndUpdate(
            { user: userId, fighter: fighterById._id },
            { note },
            { new: true, runValidators: true }
          ).populate("fighter");
        }
      }
    }

    if (!favorite) {
      return res
        .status(404)
        .json({ success: false, message: "Favorite not found" });
    }

    const formatted = formatFavoriteWithFighter(favorite);
    res.json({ success: true, data: formatted });
  } catch (err: any) {
    console.error("updateFavoriteNote error:", err);
    res.status(400).json({
      success: false,
      message: err.message || "Bad request",
    });
  }
};

// DELETE /api/favorites/:externalId → Favoriyi sil
// :externalId = TERCIHEN Fighter.externalId (slug)
// ama geriye dönük uyumluluk için ObjectId fallback’leri var
export const deleteFavoriteByExternalId = async (
  req: Request,
  res: Response
) => {
  try {
    const { externalId } = req.params;
    const userId = (req as any).userId;

    console.log("DELETE /api/favorites/:externalId - Request received:", {
      externalId,
      userId,
      url: req.url,
      originalUrl: req.originalUrl,
    });

    if (!externalId) {
      return res
        .status(400)
        .json({ success: false, message: "externalId zorunludur." });
    }

    let favorite = null;

    // 1️⃣ Normal case: externalId = Fighter.externalId (slug)
    const fighterBySlug = await Fighter.findOne({ externalId });
    console.log("Fighter lookup (by slug):", {
      found: !!fighterBySlug,
      externalId,
      fighterId: fighterBySlug?._id,
    });

    if (fighterBySlug) {
      favorite = await Favorite.findOneAndDelete({
        user: userId,
        fighter: fighterBySlug._id,
      });
    }

    // 2️⃣ Slug ile bulamazsak ve param ObjectId formatındaysa
    if (!favorite && mongoose.Types.ObjectId.isValid(externalId)) {
      // 2a) externalId = Favorite._id olabilir
      favorite = await Favorite.findOneAndDelete({
        _id: externalId,
        user: userId,
      });

      // 2b) Hâlâ yoksa externalId = Fighter._id olabilir
      if (!favorite) {
        const fighterById = await Fighter.findById(externalId);
        console.log("Fighter lookup (by _id):", {
          found: !!fighterById,
          fighterId: fighterById?._id,
        });

        if (fighterById) {
          favorite = await Favorite.findOneAndDelete({
            user: userId,
            fighter: fighterById._id,
          });
        }
      }
    }

    console.log("Favorite delete result:", {
      found: !!favorite,
      userId,
      externalId,
    });

    if (!favorite) {
      return res
        .status(404)
        .json({ success: false, message: "Favorite not found" });
    }

    res.json({ success: true, message: "Favorite deleted successfully" });
  } catch (err) {
    console.error("deleteFavoriteByExternalId error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};