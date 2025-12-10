// src/routes/ufcEventsRoutes.ts
import { Router } from "express";
import {
  refreshUfcEvents,
  getUpcomingEvents,
  getPastEvents,
} from "../services/ufcEventsService";
import {
  getEventById,
  refreshEventDetails,
} from "../controllers/eventDetailsController";

const router = Router();

/**
 * POST /api/ufc/events/refresh
 * UFC sitesinden eventleri çekip Mongo'ya yazar
 */
router.post("/refresh", async (_req, res) => {
  try {
    const result = await refreshUfcEvents();

    return res.json({
      success: true,
      message: "UFC events refreshed from web",
      data: result,
    });
  } catch (err) {
    console.error("refreshUfcEvents error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh UFC events",
    });
  }
});

/**
 * GET /api/ufc/events/upcoming
 * DB'den upcoming eventleri döner (tüm upcoming)
 */
router.get("/upcoming", async (_req, res) => {
  try {
    const events = await getUpcomingEvents();

    return res.json({
      success: true,
      data: events,
    });
  } catch (err) {
    console.error("getUpcomingEvents error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to get upcoming events",
    });
  }
});

/**
 * GET /api/ufc/events/past
 * DB'den past eventleri döner (şimdilik son 10)
 */
router.get("/past", async (_req, res) => {
  try {
    const events = await getPastEvents();

    return res.json({
      success: true,
      data: events,
    });
  } catch (err) {
    console.error("getPastEvents error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to get past events",
    });
  }
});

/**
 * POST /api/ufc/events/:ufcId/refresh-details
 * Belirli bir event için UFC'den fight card scrape eder, DB'yi günceller
 */
router.post("/:ufcId/refresh-details", refreshEventDetails);

/**
 * GET /api/ufc/events/:ufcId
 * Belirli bir event'in detaylarını döner (fights dahil)
 */
router.get("/:ufcId", getEventById);

export default router;