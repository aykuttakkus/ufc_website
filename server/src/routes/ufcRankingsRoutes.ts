// src/routes/ufcRankingsRoutes.ts
import { Router, Request, Response } from "express";
import {
  getUfcRankingsFromDb,
  refreshUfcRankingsInDb,
} from "../services/ufcRankingsService";
import { UfcRanking } from "../models/UfcRanking";

const router = Router();

/**
 * POST /api/ufc/rankings/refresh
 * → UFC web sitesinden rankings'i scrape eder ve DB'ye kaydeder
 * → Sadece Swagger API üzerinden manuel çağrılmalı
 * 
 * ⚠️ ÖNEMLİ: Bu route /:divisionName'den ÖNCE olmalı, yoksa Express "refresh"i divisionName olarak yorumlar
 */
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const divisions = await refreshUfcRankingsInDb();

    return res.json({
      success: true,
      message: "UFC rankings refreshed from web",
      data: {
        divisions,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[refreshUfcRankings] error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh UFC rankings",
    });
  }
});

/**
 * GET /api/ufc/rankings
 * → DB'den rankings'i okur (scraping yapmaz)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const divisions = await getUfcRankingsFromDb();

    // Son güncelleme zamanını al
    const ranking = await UfcRanking.findOne()
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return res.json({
      success: true,
      source: "https://www.ufc.com/rankings",
      updatedAt: ranking?.lastRefreshedAt?.toISOString() || null,
      divisions,
    });
  } catch (err: any) {
    console.error("[getUfcRankings] error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get UFC rankings",
    });
  }
});

/**
 * GET /api/ufc/rankings/:divisionName
 * → DB'den belirli bir siklet için rankings'i okur (scraping yapmaz)
 * Örn: /api/ufc/rankings/lightweight
 */
router.get("/:divisionName", async (req: Request, res: Response) => {
  try {
    const divisions = await getUfcRankingsFromDb();
    const requested = req.params.divisionName.toLowerCase();

    const division = divisions.find((d) =>
      d.division.toLowerCase().includes(requested)
    );

    if (!division) {
      return res.status(404).json({
        success: false,
        message: "Division not found",
      });
    }

    // Son güncelleme zamanını al
    const ranking = await UfcRanking.findOne()
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return res.json({
      success: true,
      source: "https://www.ufc.com/rankings",
      updatedAt: ranking?.lastRefreshedAt?.toISOString() || null,
      division,
    });
  } catch (err: any) {
    console.error("[getUfcDivision] error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get UFC division",
    });
  }
});

export default router;