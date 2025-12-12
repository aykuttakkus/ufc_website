// server/src/routes/eventDetailsRoutes.ts
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
 * Scraping (UFC upstream call) kapalı mı?
 * Render/prod'da genelde DISABLE_UFC_SCRAPING=true yapıp
 * refresh'i localde çalıştırıyoruz.
 */
function scrapingDisabled() {
  return String(process.env.DISABLE_UFC_SCRAPING || "").toLowerCase() === "true";
}

function denyIfDisabled(res: Response) {
  return res.status(403).json({
    success: false,
    message:
      "UFC upstream calls are disabled on this environment (DISABLE_UFC_SCRAPING=true). Run refresh/proxy locally.",
  });
}

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
 *       403:
 *         description: Proxy disabled on this environment
 *       500:
 *         description: Failed to fetch image
 */
router.get("/proxy-image", async (req: Request, res: Response) => {
  try {
    // Render/prod'da UFC upstream'ı komple kapatmak istiyorsan
    if (scrapingDisabled()) return denyIfDisabled(res);

    const rawUrl = req.query.url;

    if (!rawUrl || typeof rawUrl !== "string") {
      return res.status(400).json({ error: "url query parameter is required" });
    }

    // 1) URL decode (bozuksa patlatma)
    let imageUrl = rawUrl;
    try {
      imageUrl = decodeURIComponent(rawUrl);
    } catch {
      // ignore decode error
    }

    // 2) ufc.com -> www.ufc.com normalize
    if (imageUrl.startsWith("http://ufc.com")) {
      imageUrl = imageUrl.replace("http://ufc.com", "https://www.ufc.com");
    } else if (imageUrl.startsWith("https://ufc.com")) {
      imageUrl = imageUrl.replace("https://ufc.com", "https://www.ufc.com");
    }

    // 3) Sadece http/https izin ver
    if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
      return res.status(400).json({ error: "Invalid image URL", url: imageUrl });
    }

    // 4) SSRF koruması: sadece ufc.com domaini izinli
    let parsed: URL;
    try {
      parsed = new URL(imageUrl);
    } catch {
      return res.status(400).json({ error: "Invalid URL format", url: imageUrl });
    }

    const host = (parsed.hostname || "").toLowerCase();
    const isAllowedHost = host === "ufc.com" || host.endsWith(".ufc.com");
    if (!isAllowedHost) {
      return res.status(400).json({
        error: "Blocked host. Only ufc.com domains are allowed.",
        host,
      });
    }

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
      validateStatus: () => true, // upstream status'u biz handle edeceğiz
    });

    // Upstream 2xx değilse düzgün hata döndür
    if (response.status < 200 || response.status >= 300) {
      let snippet: string | undefined;
      try {
        if (Buffer.isBuffer(response.data)) {
          snippet = response.data.toString("utf8").slice(0, 300);
        } else if (typeof response.data === "string") {
          snippet = response.data.slice(0, 300);
        } else {
          snippet = JSON.stringify(response.data).slice(0, 300);
        }
      } catch {
        snippet = undefined;
      }

      return res.status(502).json({
        error: "Upstream error from UFC",
        status: response.status,
        statusText: response.statusText,
        snippet,
      });
    }

    const contentType = response.headers["content-type"] || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");

    return res.send(response.data);
  } catch (error: any) {
    console.error("🔥 proxy-image error:", error?.message || error);

    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;
      let snippet: string | undefined;

      try {
        if (Buffer.isBuffer(error.response.data)) {
          snippet = error.response.data.toString("utf8").slice(0, 300);
        } else if (typeof error.response.data === "string") {
          snippet = error.response.data.slice(0, 300);
        } else {
          snippet = JSON.stringify(error.response.data).slice(0, 300);
        }
      } catch {
        snippet = undefined;
      }

      return res.status(500).json({
        error: "Upstream error from UFC",
        status,
        statusText,
        snippet,
      });
    }

    return res.status(500).json({
      error: "Failed to fetch image",
      message: error?.message || "Unknown error",
    });
  }
});

export default router;