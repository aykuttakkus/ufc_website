// src/routes/eventDetailsRoutes.ts
import { Router, Request, Response } from "express";
import axios from "axios";
import {
  getEventById,
  refreshEventDetails,
  refreshAllEventsDetails,
  refreshPastEventsDetails,
} from "../controllers/eventDetailsController";

const router = Router();

/**
 * @openapi
 * /events/{ufcId}:
 *   get:
 *     summary: Event details with all fights
 *     tags:
 *       - Events
 *     parameters:
 *       - in: path
 *         name: ufcId
 *         required: true
 *         schema:
 *           type: string
 *         description: UFC event identifier (slug)
 *     responses:
 *       200:
 *         description: Event with all fights
 *       404:
 *         description: Event not found
 */
router.get("/events/:ufcId", getEventById);

/**
 * @openapi
 * /events/{ufcId}/refresh-details:
 *   post:
 *     summary: Refresh fight card details for a single event from UFC website
 *     tags:
 *       - Events
 *     parameters:
 *       - in: path
 *         name: ufcId
 *         required: true
 *         schema:
 *           type: string
 *         description: UFC event identifier (slug)
 *     responses:
 *       200:
 *         description: Event details refreshed
 *       404:
 *         description: Event not found in DB
 *       502:
 *         description: Failed to refresh event details from UFC website
 */
router.post("/events/:ufcId/refresh-details", refreshEventDetails);

/**
 * @openapi
 * /events/refresh-all:
 *   post:
 *     summary: Refresh fight card details for ALL events (past + upcoming) from UFC website
 *     tags:
 *       - Events
 *     responses:
 *       200:
 *         description: Refresh summary for all events
 *       404:
 *         description: No events found in DB
 *       500:
 *         description: Failed to refresh all events
 */
router.post("/events/refresh-all", refreshAllEventsDetails);

/**
 * @openapi
 * /events/refresh-past:
 *   post:
 *     summary: Refresh fight card details for all PAST events from UFC website
 *     tags:
 *       - Events
 *     responses:
 *       200:
 *         description: Refresh summary for past events
 *       404:
 *         description: No past events found in DB
 *       500:
 *         description: Failed to refresh past events
 */
router.post("/events/refresh-past", refreshPastEventsDetails);

/**
 * @openapi
 * /proxy-image:
 *   get:
 *     summary: Proxy image requests to bypass CORS / hotlink restrictions
 *     tags:
 *       - Events
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: Encoded image URL to proxy
 *     responses:
 *       200:
 *         description: Image data
 *       400:
 *         description: URL parameter missing
 *       500:
 *         description: Failed to fetch image
 */
router.get("/proxy-image", async (req: Request, res: Response) => {
  try {
    const rawUrl = req.query.url;

    if (!rawUrl || typeof rawUrl !== "string") {
      return res.status(400).json({ error: "url query parameter is required" });
    }

    // Frontend'den encoded geldiyse çözüyoruz
    const imageUrl = decodeURIComponent(rawUrl);

    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Referer: "https://www.ufc.com/",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      timeout: 10000,
      maxRedirects: 5,
    });

    const contentType = response.headers["content-type"] || "image/jpeg";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // 24 saat cache

    // CORS zaten global cors() ile açık ama ekstra istersen:
    // res.setHeader("Access-Control-Allow-Origin", "*");

    res.send(response.data);
  } catch (error) {
    console.error("🔥 proxy-image error:", error);
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

export default router;