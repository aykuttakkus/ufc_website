// server/src/controllers/eventDetailsController.ts
import { Request, Response } from "express";
import {
  refreshEventDetailsInDb,
  getEventWithFights,
} from "../services/ufcEventsDetail";
import { UfcEvent } from "../models/UfcEvent";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

function scrapingDisabled() {
  return String(process.env.DISABLE_UFC_SCRAPING || "").toLowerCase() === "true";
}

function denyIfDisabled(res: Response) {
  return res.status(403).json({
    success: false,
    message:
      "Scraping is disabled in this environment. Run refresh locally with DISABLE_UFC_SCRAPING=false (enable scraping locally). Keep DISABLE_UFC_SCRAPING=true on Render.",
  });
}

/**
 * GET /api/ufc/events/:ufcId
 * → DB'den event + fights döner (scrape etmez)
 */
export async function getEventById(req: Request, res: Response) {
  try {
    const { ufcId } = req.params;

    if (!ufcId) {
      return res.status(400).json({
        success: false,
        message: "ufcId param is required",
      });
    }

    const event = await getEventWithFights(ufcId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    return res.json({
      success: true,
      data: event,
    });
  } catch (err: any) {
    console.error("[getEventById] error:", err?.message || err);
    return res.status(500).json({
      success: false,
      message: "Failed to load event",
    });
  }
}

/**
 * POST /api/ufc/events/:ufcId/refresh-details
 * → UFC web sayfasından fight card scrape eder, DB'yi günceller
 */
export async function refreshEventDetails(req: Request, res: Response) {
  try {
    if (scrapingDisabled()) return denyIfDisabled(res);

    const { ufcId } = req.params;

    if (!ufcId) {
      return res.status(400).json({
        success: false,
        message: "ufcId param is required",
      });
    }

    const updated = await refreshEventDetailsInDb(ufcId);

    return res.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    console.error("[refreshEventDetails] error:", err?.message || err);

    if (err?.message === "Event not found in DB") {
      return res.status(404).json({
        success: false,
        message: "Event not found in DB",
      });
    }

    return res.status(502).json({
      success: false,
      message: "Failed to refresh event details from UFC website",
    });
  }
}

/**
 * POST /api/ufc/events/refresh-all
 * → DB'deki TÜM event’ler için UFC web sayfasından detayları yeniler.
 */
export async function refreshAllEventsDetails(req: Request, res: Response) {
  try {
    if (scrapingDisabled()) return denyIfDisabled(res);

    const events = await UfcEvent.find({});

    if (!events.length) {
      return res.status(404).json({
        success: false,
        message: "No events found in DB",
      });
    }

    const result = {
      totalEvents: events.length,
      updatedCount: 0,
      failedCount: 0,
      errors: [] as { ufcId: string; error: string }[],
    };

    for (const ev of events) {
      try {
        console.log("[refreshAllEventsDetails] Updating:", ev.ufcId);
        await refreshEventDetailsInDb(ev.ufcId);
        result.updatedCount += 1;
        await sleep(800);
      } catch (err: any) {
        console.error(
          `[refreshAllEventsDetails] Failed for ${ev.ufcId}:`,
          err?.message || err
        );
        result.failedCount += 1;
        result.errors.push({
          ufcId: ev.ufcId,
          error: err?.message || "Unknown error",
        });
        await sleep(1000);
      }
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[refreshAllEventsDetails] error:", err?.message || err);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh all events",
    });
  }
}

/**
 * POST /api/ufc/events/refresh-past
 * → SADECE past event’leri (isUpcoming === false) UFC web sayfasından yeniler.
 */
export async function refreshPastEventsDetails(req: Request, res: Response) {
  try {
    if (scrapingDisabled()) return denyIfDisabled(res);

    const events = await UfcEvent.find({ isUpcoming: false });

    if (!events.length) {
      return res.status(404).json({
        success: false,
        message: "No past events found in DB",
      });
    }

    const result = {
      totalEvents: events.length,
      updatedCount: 0,
      failedCount: 0,
      errors: [] as { ufcId: string; error: string }[],
    };

    for (const ev of events) {
      try {
        console.log("[refreshPastEventsDetails] Updating:", ev.ufcId);
        await refreshEventDetailsInDb(ev.ufcId);
        result.updatedCount += 1;
        await sleep(800);
      } catch (err: any) {
        console.error(
          `[refreshPastEventsDetails] Failed for ${ev.ufcId}:`,
          err?.message || err
        );
        result.failedCount += 1;
        result.errors.push({
          ufcId: ev.ufcId,
          error: err?.message || "Unknown error",
        });
        await sleep(1000);
      }
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("[refreshPastEventsDetails] error:", err?.message || err);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh past events",
    });
  }
}