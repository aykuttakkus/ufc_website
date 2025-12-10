// src/controllers/fighterController.ts
import { Request, Response } from "express";
import axios from "axios";
import { Fighter, IFighter } from "../models/Fighter";

// GET /api/fighters  → Tüm dövüşçüler (opsiyonel filtre + arama)
export const getFighters = async (req: Request, res: Response) => {
  try {
    const { weightClass, country, q } = req.query;

    const filter: Record<string, unknown> = {};

    if (weightClass && typeof weightClass === "string") {
      filter.weightClass = weightClass;
    }

    if (country && typeof country === "string") {
      // "China" yazarsan "Haikou, Hainan, China" gibi kayıtları da bulsun
      filter.country = { $regex: country, $options: "i" };
    }

    let query = Fighter.find(filter).sort({ name: 1 });

    if (q && typeof q === "string") {
      query = Fighter.find({
        $and: [filter, { $text: { $search: q } }],
      }).sort({ name: 1 });
    }

    const fighters = await query.exec();

    const formatted = fighters.map((f) => ({
      ...f.toObject(),
      createdAt: new Date(f.createdAt).toLocaleString("tr-TR", {
        timeZone: "Europe/Istanbul",
      }),
      updatedAt: new Date(f.updatedAt).toLocaleString("tr-TR", {
        timeZone: "Europe/Istanbul",
      }),
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("getFighters error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/fighters  → Manuel yeni dövüşçü oluştur
export const createFighter = async (req: Request, res: Response) => {
  try {
    const {
      externalId,
      name,
      weightClass,
      country,
      wins,
      losses,
      draws,
      nickname,
      status,
      imageUrl,
    } = req.body;

    if (!externalId || !name || !weightClass) {
      return res.status(400).json({
        success: false,
        message: "externalId, name ve weightClass zorunludur.",
      });
    }

    const fighter = await Fighter.create({
      externalId,
      name,
      weightClass,
      country,
      wins,
      losses,
      draws,
      nickname,
      status,
      imageUrl,
    });

    res.status(201).json({ success: true, data: fighter });
  } catch (err: any) {
    console.error("createFighter error:", err);
    res
      .status(400)
      .json({ success: false, message: err.message || "Bad request" });
  }
};

// Slug'ı isime dönüştür (kyoji-horiguchi → Kyoji Horiguchi)
function slugToNamePattern(slug: string): string {
  return slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Regex özel karakterlerini escape et
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 🔥 GET /api/fighters/:externalId → Tek dövüşçü (Octagon slug ile)
// Fallback: externalId bulunamazsa isimle arama yapar
export const getFighterByExternalId = async (req: Request, res: Response) => {
  try {
    const slug = req.params.externalId;
    
    // 1. Önce externalId ile dene (hızlı, exact match)
    let fighter = await Fighter.findOne({ externalId: slug }).exec();

    // 2. Bulunamazsa, isimle arama yap (case-insensitive regex)
    if (!fighter) {
      const namePattern = slugToNamePattern(slug);
      fighter = await Fighter.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(namePattern)}$`, "i") }
      }).exec();
    }

    // 3. Hala bulunamazsa, isim içinde arama yap (tüm kelimeler)
    if (!fighter) {
      const words = slug.split("-");
      // Tüm kelimelerin isimde geçmesi gerekiyor
      const regexPattern = words.map(w => `(?=.*${escapeRegex(w)})`).join("");
      fighter = await Fighter.findOne({
        name: { $regex: new RegExp(regexPattern, "i") }
      }).exec();
    }

    // 4. Hala bulunamazsa, kısmi kelime eşleşmesi dene (truncated names için)
    // Örn: "bahamondes" → "bahamon" eşleşir (ilk 5+ karakter)
    if (!fighter) {
      const words = slug.split("-");
      // Her kelimenin ilk 4+ karakterini al (kısa kelimeleri tam al)
      const partialPatterns = words.map(w => {
        const minLen = Math.min(4, w.length);
        return escapeRegex(w.slice(0, Math.max(minLen, Math.ceil(w.length * 0.6))));
      });
      const regexPattern = partialPatterns.map(p => `(?=.*${p})`).join("");
      fighter = await Fighter.findOne({
        name: { $regex: new RegExp(regexPattern, "i") }
      }).exec();
    }

    // 5. Son çare: ad + soyadının başlangıcı ile ara (daha güvenli)
    if (!fighter) {
      const words = slug.split("-");
      if (words.length >= 2) {
        const firstName = escapeRegex(words[0]); // Tam ad
        const lastNameStart = escapeRegex(words[words.length - 1].slice(0, 5)); // Soyadının ilk 5 harfi
        fighter = await Fighter.findOne({
          name: { $regex: new RegExp(`^${firstName}.*${lastNameStart}`, "i") }
        }).exec();
      }
    }

    if (!fighter) {
      return res
        .status(404)
        .json({ success: false, message: "Fighter not found" });
    }

    const formatted = {
      ...fighter.toObject(),
      createdAt: new Date(fighter.createdAt).toLocaleString("tr-TR", {
        timeZone: "Europe/Istanbul",
      }),
      updatedAt: new Date(fighter.updatedAt).toLocaleString("tr-TR", {
        timeZone: "Europe/Istanbul",
      }),
    };

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("getFighterByExternalId error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔥 PUT /api/fighters/:externalId  → Tam güncelleme (slug ile)
export const updateFighterByExternalId = async (req: Request, res: Response) => {
  try {
    const fighter = await Fighter.findOneAndUpdate(
      { externalId: req.params.externalId },
      {
        // externalId'i burada değiştirmiyoruz, slug sabit kalsın:
        name: req.body.name,
        weightClass: req.body.weightClass,
        country: req.body.country,
        wins: req.body.wins,
        losses: req.body.losses,
        draws: req.body.draws,
        nickname: req.body.nickname,
        status: req.body.status,
        imageUrl: req.body.imageUrl,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!fighter) {
      return res
        .status(404)
        .json({ success: false, message: "Fighter not found" });
    }

    res.json({ success: true, data: fighter });
  } catch (err: any) {
    console.error("updateFighterByExternalId error:", err);
    res
      .status(400)
      .json({ success: false, message: err.message || "Bad request" });
  }
};

// 🔥 PATCH /api/fighters/:externalId → Kısmi güncelleme
export const patchFighterByExternalId = async (req: Request, res: Response) => {
  try {
    const fighter = await Fighter.findOneAndUpdate(
      { externalId: req.params.externalId },
      {
        $set: {
          // externalId yine dokunmuyoruz
          name: req.body.name,
          weightClass: req.body.weightClass,
          country: req.body.country,
          wins: req.body.wins,
          losses: req.body.losses,
          draws: req.body.draws,
          nickname: req.body.nickname,
          status: req.body.status,
          imageUrl: req.body.imageUrl,
        },
      },
      { new: true, runValidators: true }
    );

    if (!fighter) {
      return res
        .status(404)
        .json({ success: false, message: "Fighter not found" });
    }

    res.json({ success: true, data: fighter });
  } catch (err: any) {
    console.error("patchFighterByExternalId error:", err);
    res
      .status(400)
      .json({ success: false, message: err.message || "Bad request" });
  }
};

// 🔥 DELETE /api/fighters/:externalId  → Silme
export const deleteFighterByExternalId = async (req: Request, res: Response) => {
  try {
    const fighter = await Fighter.findOneAndDelete({
      externalId: req.params.externalId,
    });

    if (!fighter) {
      return res
        .status(404)
        .json({ success: false, message: "Fighter not found" });
    }

    res.json({ success: true, message: "Fighter deleted successfully" });
  } catch (err) {
    console.error("deleteFighterByExternalId error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/fighters/sync → Octagon API'den data çek ve Mongo'ya yaz
export const syncFighters = async (_req: Request, res: Response) => {
  try {
    const response = await axios.get("https://api.octagon-api.com/fighters");
    const fightersData = response.data as Record<string, any>;

    const ids = Object.keys(fightersData);

    for (const externalId of ids) {
      const f = fightersData[externalId];

      const doc: Partial<IFighter> & { externalId: string } = {
        externalId,
        name: f.name,
        weightClass: f.category || "Unknown",
        country: f.placeOfBirth || "",
        wins: parseInt(f.wins || "0", 10),
        losses: parseInt(f.losses || "0", 10),
        draws: parseInt(f.draws || "0", 10),
        status: f.status || "",
        imageUrl: f.imgUrl || "",
        nickname: f.nickname || "",
      };

      await Fighter.updateOne({ externalId }, { $set: doc }, { upsert: true });
    }

    return res.json({
      success: true,
      message: "Fighters synced successfully",
      count: ids.length,
    });
  } catch (error) {
    console.error("syncFighters error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Sync failed" });
  }
};
