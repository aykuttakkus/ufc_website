// src/services/ufcEventsDetail.ts
import * as cheerio from "cheerio";
import {
  UfcEvent,
  IUfcEvent,
  IEventFight,
  CardSection,
  WinnerSide,
} from "../models/UfcEvent";
import { fetchUfcHtml } from "../clients/Client"; // ✅ Linux case-sensitive: client.ts ise böyle olmalı

// Köşe için asla gerçek isim olmayacak string / pattern’ler
const BAD_CORNER_PATTERNS = [
  "red corner",
  "blue corner",
  "full body silhouette image",
  "silhouette image",
  "corner image",
];

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

function isScrapingDisabled() {
  return String(process.env.DISABLE_UFC_SCRAPING || "").toLowerCase() === "true";
}

/**
 * Soft retry (403/429 vs. için) - en olası çözüm: yumuşak retry + backoff
 * Not: UFC bazen Cloudflare/WAF yüzünden 403 döndürebilir.
 */
async function fetchHtmlWithRetry(
  path: string,
  opts?: { attempts?: number; baseDelayMs?: number }
): Promise<string> {
  const attempts = opts?.attempts ?? 3;
  const baseDelayMs = opts?.baseDelayMs ?? 700;

  let lastErr: any;

  for (let i = 0; i < attempts; i++) {
    try {
      const html = await fetchUfcHtml(path);

      // Bazı durumlarda body içinde “Access denied” vb. dönebiliyor.
      const lower = (html || "").toLowerCase();
      if (
        lower.includes("access denied") ||
        lower.includes("request blocked") ||
        lower.includes("forbidden") ||
        lower.includes("error 403")
      ) {
        throw new Error("UFC responded with an access denied page (403-like).");
      }

      return html;
    } catch (err: any) {
      lastErr = err;

      const msg = String(err?.message || err);
      const looksLike403 =
        msg.includes("403") || msg.toLowerCase().includes("forbidden");
      const looksLike429 =
        msg.includes("429") || msg.toLowerCase().includes("too many");

      // Eğer son denemeyse direkt fırlat
      if (i === attempts - 1) break;

      // Backoff + jitter
      const jitter = Math.floor(Math.random() * 250);
      const delay =
        baseDelayMs * Math.pow(2, i) +
        jitter +
        (looksLike403 ? 500 : 0) +
        (looksLike429 ? 1200 : 0);

      console.warn(
        `[fetchHtmlWithRetry] attempt ${i + 1}/${attempts} failed for ${path}: ${msg}. Retrying in ${delay}ms`
      );

      await sleep(delay);
    }
  }

  throw new Error(
    `[fetchHtmlWithRetry] Failed after retries for ${path}: ${
      String(lastErr?.message || lastErr) || "Unknown error"
    }`
  );
}

/**
 * alt text içindeki "…image" kısmını at, sonrasını isim olarak kullanmaya çalış.
 */
function cleanAlt(raw?: string | null): string {
  if (!raw) return "";

  let alt = raw.replace(/\s+/g, " ").trim();
  if (!alt) return "";

  const NOISE_PATTERNS = [
    /facing\s+(left|right)/gi,
    /standing/gi,
    /profile/gi,
    /portrait/gi,
    /head\s*shot/gi,
    /upper\s*body/gi,
    /full\s*body/gi,
    /silhouette/gi,
    /image/gi,
    /photo/gi,
    /picture/gi,
    /middleweight/gi,
    /lightweight/gi,
    /heavyweight/gi,
    /featherweight/gi,
    /bantamweight/gi,
    /flyweight/gi,
    /welterweight/gi,
    /strawweight/gi,
  ];

  NOISE_PATTERNS.forEach((pat) => {
    alt = alt.replace(pat, " ");
  });

  alt = alt.replace(/[^a-zA-Z\s'’-]/g, " ").replace(/\s+/g, " ").trim();
  if (!alt) return "";

  return alt;
}

function sanitizeFighterName(raw: string | undefined | null): string {
  if (!raw) return "";
  const t = raw.replace(/\s+/g, " ").trim();
  if (!t) return "";

  const lower = t.toLowerCase();
  if (BAD_CORNER_PATTERNS.some((p) => lower.includes(p))) {
    return "";
  }

  return t;
}

function normalizeWeightClass(raw?: string | null): string {
  if (!raw) return "";
  let t = raw.replace(/\s+/g, " ").trim();

  t = t.replace(/#\d+/g, "").replace(/\s+/g, " ").trim();

  const mid = Math.floor(t.length / 2);
  const first = t.slice(0, mid).trim();
  const second = t.slice(mid).trim();
  if (first && first === second) return first;

  return t;
}

function normalizeImageUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("/")) {
    return `https://www.ufc.com${url}`;
  }

  return `https://www.ufc.com/${url}`;
}

function inferNamesFromEventTitle(eventName: string) {
  const parts = eventName.split(/vs/i);
  if (parts.length !== 2) {
    return { left: "", right: "" };
  }
  return {
    left: parts[0].trim(),
    right: parts[1].trim(),
  };
}

const SECTION_MAPPERS: { regex: RegExp; value: CardSection }[] = [
  { regex: /main card/i, value: "Main Card" },
  { regex: /early prelims?/i, value: "Early Prelims" },
  { regex: /prelims?/i, value: "Prelims" },
];

function detectSectionFromHeading(text: string): CardSection {
  const t = text.trim();
  for (const m of SECTION_MAPPERS) {
    if (m.regex.test(t)) return m.value;
  }
  return "Unknown";
}

function extractCountryCodeFromFlagSrc(src?: string | null): string | undefined {
  if (!src) return undefined;
  const match = src.match(/\/flags\/([^/.]+)\./i);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }
  return undefined;
}

function extractCountryInfo(
  fightNode: cheerio.Cheerio,
  side: "red" | "blue"
): { country?: string; countryCode?: string } {
  const container = fightNode
    .find(`.c-listing-fight__country--${side}`)
    .first();

  if (!container || container.length === 0) {
    return {};
  }

  const countryText =
    container
      .find(".c-listing-fight__country-text")
      .text()
      .replace(/\s+/g, " ")
      .trim() || undefined;

  const flagImg = container.find("img[src*='/flags/']").first();
  const flagSrc = flagImg.attr("src") || undefined;
  const countryCode = extractCountryCodeFromFlagSrc(flagSrc);

  return {
    country: countryText,
    countryCode,
  };
}

function extractFightResults(
  fightNode: cheerio.Cheerio
): {
  fightBonus?: string;
  resultRound?: number;
  resultMethod?: string;
  resultTime?: string;
  winnerSide?: WinnerSide;
} {
  let bonusText: string | undefined = undefined;

  const bannerSelectors = [
    ".c-listing-fight__banner--award .text",
    ".c-listing-fight__banner--award span",
    ".c-listing-fight__banner--award",
    ".c-listing-fight__award-banner",
    ".c-listing-fight__bonus",
    "[class*='banner'][class*='award']",
    "[class*='award']",
    "[class*='bonus']",
    "[class*='fight-of-the-night']",
    "[class*='performance-of-the-night']",
  ];

  for (const selector of bannerSelectors) {
    const bannerNode = fightNode.find(selector).first();
    if (bannerNode && bannerNode.length > 0) {
      const text = bannerNode.text().replace(/\s+/g, " ").trim();
      if (
        text &&
        (text.toLowerCase().includes("fight") ||
          text.toLowerCase().includes("performance"))
      ) {
        bonusText = text;
        break;
      }
    }
  }

  if (!bonusText) {
    const attributeSelectors = [
      "[data-award]",
      "[aria-label*='fight']",
      "[aria-label*='performance']",
      "[title*='fight']",
      "[title*='performance']",
    ];

    for (const selector of attributeSelectors) {
      const attrNode = fightNode.find(selector).first();
      if (attrNode && attrNode.length > 0) {
        const attrValue =
          attrNode.attr("data-award") ||
          attrNode.attr("aria-label") ||
          attrNode.attr("title") ||
          "";
        if (
          attrValue &&
          (attrValue.toLowerCase().includes("fight") ||
            attrValue.toLowerCase().includes("performance"))
        ) {
          bonusText = attrValue;
          break;
        }
      }
    }
  }

  if (!bonusText) {
    const parentNode = fightNode.parent();
    if (parentNode && parentNode.length > 0) {
      for (const selector of bannerSelectors) {
        const bannerNode = parentNode.find(selector).first();
        if (bannerNode && bannerNode.length > 0) {
          const text = bannerNode.text().replace(/\s+/g, " ").trim();
          if (
            text &&
            (text.toLowerCase().includes("fight") ||
              text.toLowerCase().includes("performance"))
          ) {
            bonusText = text;
            break;
          }
        }
      }
    }
  }

  if (!bonusText) {
    const fightText = fightNode.text();
    const fightTextLower = fightText.toLowerCase();

    const fightMatch = fightText.match(/fight\s+of\s+the\s+night/gi);
    if (fightMatch && fightMatch[0]) {
      bonusText = fightMatch[0];
    } else {
      const performanceMatch = fightText.match(
        /performance\s+of\s+the\s+night/gi
      );
      if (performanceMatch && performanceMatch[0]) {
        bonusText = performanceMatch[0];
      } else if (fightTextLower.includes("performance")) {
        const perfPatterns = [
          /performance\s+bonus/gi,
          /performance\s+award/gi,
          /potn/gi,
        ];
        for (const pattern of perfPatterns) {
          const match = fightText.match(pattern);
          if (match && match[0]) {
            bonusText = "Performance of the Night";
            break;
          }
        }
      }
    }
  }

  if (bonusText) {
    const normalized = bonusText.replace(/\s+/g, " ").trim().toLowerCase();
    if (normalized.includes("fight of the night")) {
      bonusText = "Fight of the Night";
    } else if (
      normalized.includes("performance of the night") ||
      normalized.includes("performance")
    ) {
      bonusText = "Performance of the Night";
    }
  }

  let resultRound: number | undefined;
  let resultMethod: string | undefined;
  let resultTime: string | undefined;

  let resultsRoot = fightNode
    .find(".c-listing-fight__results.c-listing-fight__results--desktop")
    .first();

  if (!resultsRoot || resultsRoot.length === 0) {
    resultsRoot = fightNode.find(".c-listing-fight__results").first();
  }

  if (!resultsRoot || resultsRoot.length === 0) {
    resultsRoot = fightNode.find("[class*='results']").first();
  }

  let resultItems =
    resultsRoot && resultsRoot.length > 0
      ? resultsRoot.find(".c-listing-fight__result")
      : fightNode.find(".c-listing-fight__result");

  if (resultItems && resultItems.length > 0) {
    resultItems.each((idx) => {
      const node = resultItems.eq(idx);

      let labelElement = node.find(".c-listing-fight__result-label").first();
      if (!labelElement || labelElement.length === 0) {
        labelElement = node.find("[class*='result-label']").first();
      }
      if (!labelElement || labelElement.length === 0) {
        labelElement = node.find(".c-listing-fight_result-label").first();
      }

      let valueElement = node.find(".c-listing-fight__result-text").first();
      if (!valueElement || valueElement.length === 0) {
        valueElement = node.find("[class*='result-text']").first();
      }
      if (!valueElement || valueElement.length === 0) {
        valueElement = node.find(".c-listing-fight_result-text").first();
      }

      if (!labelElement || !valueElement || !labelElement.length || !valueElement.length) {
        return;
      }

      const label = labelElement.text().replace(/\s+/g, " ").trim().toLowerCase();
      const valueText = valueElement.text().replace(/\s+/g, " ").trim();

      if (!label || !valueText) return;

      if (label.includes("round")) {
        const parsed = parseInt(valueText, 10);
        if (!Number.isNaN(parsed)) resultRound = parsed;
      } else if (label.includes("method")) {
        resultMethod = valueText;
      } else if (label.includes("time")) {
        resultTime = valueText;
      }
    });
  }

  let winnerSide: WinnerSide | undefined;

  const redCornerNode = fightNode.find(".c-listing-fight__corner--red").first();
  const blueCornerNode = fightNode.find(".c-listing-fight__corner--blue").first();

  const hasDrawOutcome = fightNode.find(".c-listing-fight__outcome--draw").length > 0;
  const hasNoContestOutcome = fightNode.find(".c-listing-fight__outcome--nc").length > 0;

  const redHasWin = redCornerNode.find(".c-listing-fight__outcome--win").length > 0;
  const blueHasWin = blueCornerNode.find(".c-listing-fight__outcome--win").length > 0;

  if (hasDrawOutcome) winnerSide = "draw";
  else if (hasNoContestOutcome) winnerSide = "no-contest";
  else if (redHasWin && !blueHasWin) winnerSide = "red";
  else if (blueHasWin && !redHasWin) winnerSide = "blue";

  return { fightBonus: bonusText, resultRound, resultMethod, resultTime, winnerSide };
}

function extractFighterNameFromCorner(
  cornerNode: cheerio.Cheerio,
  tickerNameFromFight?: string
): string {
  if (!cornerNode || cornerNode.length === 0) {
    return tickerNameFromFight ? sanitizeFighterName(tickerNameFromFight) : "";
  }

  const body = cornerNode
    .find(
      ".c-listing-fight__corner-body--red, " +
        ".c-listing-fight__corner-body--blue, " +
        ".c-listing-fight__corner-body"
    )
    .first();

  let raw =
    body.find(".c-listing-fight__name, .c-listing-fight__person-name").first().text() || "";

  if (!raw.trim()) {
    raw = body.find("a[href*='/athlete/']").first().text() || "";
  }

  if (!raw.trim()) {
    const img = cornerNode.find("img[alt]").first();
    const altRaw = img.attr("alt") || "";
    const altClean = cleanAlt(altRaw);
    if (altClean.trim()) raw = altClean;
  }

  if (!raw.trim()) {
    const link = cornerNode.find("a[href*='/athlete/']").first();
    const href = link.attr("href") || "";
    const slug = href.split("/").filter(Boolean).pop() || "";
    if (slug) {
      raw = slug
        .split("-")
        .map((part) =>
          part.length ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part
        )
        .join(" ");
    }
  }

  if (!raw.trim()) {
    const text = cornerNode.text().replace(/\s+/g, " ").trim();
    if (text) {
      const tokens = text.split(" ");
      const filtered = tokens.filter((tok) => {
        const l = tok.toLowerCase();
        if (l === "red" || l === "blue" || l === "corner") return false;
        if (l === "record" || l === "rank" || l === "division") return false;
        return true;
      });
      if (filtered.length >= 2) raw = filtered.slice(0, 3).join(" ");
    }
  }

  if (!raw.trim() && tickerNameFromFight) {
    raw = tickerNameFromFight;
  }

  const sanitized = sanitizeFighterName(raw);
  if (!sanitized && tickerNameFromFight) return sanitizeFighterName(tickerNameFromFight);
  return sanitized;
}

/**
 * Belirli bir event için UFC web sayfasından fight card detaylarını çeker.
 */
export async function scrapeUfcEventDetailsFromWeb(
  ufcId: string,
  eventNameForFallback?: string
): Promise<IEventFight[]> {
  // Guard: Render'da kapalı olsun, localde açık olsun
  if (isScrapingDisabled()) {
    throw new Error("Scraping is disabled (DISABLE_UFC_SCRAPING=true).");
  }

  const path = `/event/${ufcId}`;

  // ✅ Soft & yüksek olasılıklı yöntem: retry/backoff ile çek
  const html = await fetchHtmlWithRetry(path, { attempts: 3, baseDelayMs: 700 });

  const $ = cheerio.load(html);

  let container = $(".c-card-event--fight-card").first();
  if (!container || container.length === 0) container = $(".view-grouping-content").first();
  if (!container || container.length === 0) container = $(".l-page__content").first();

  const fightRoot: cheerio.Cheerio =
    container && container.length > 0 ? container : $.root();

  const tickerRoot: cheerio.Cheerio = $.root();

  const rawTickerRedNames: string[] = [];
  const rawTickerBlueNames: string[] = [];

  tickerRoot
    .find(
      ".c-listing-ticker_fightcard_red_corner_name, " +
        ".c-listing-ticker-fightcard__red_corner_name"
    )
    .each((_, el) => {
      const name = sanitizeFighterName($(el).text());
      rawTickerRedNames.push(name);
    });

  tickerRoot
    .find(
      ".c-listing-ticker_fightcard_blue_corner_name, " +
        ".c-listing-ticker-fightcard__blue_corner_name"
    )
    .each((_, el) => {
      const name = sanitizeFighterName($(el).text());
      rawTickerBlueNames.push(name);
    });

  const tickerRedNames = rawTickerRedNames.filter(Boolean).reverse();
  const tickerBlueNames = rawTickerBlueNames.filter(Boolean).reverse();

  const nodes = fightRoot.find(
    "h2, h3, " +
      ".c-card-event--fight-card__headline, " +
      ".c-card-event--fight-card__subheadline, " +
      ".c-card-event--fight-card__header, " +
      ".c-card-event--fight-card__title, " +
      ".c-card-event--fight-card__subtitle, " +
      ".c-listing-fight, " +
      ".c-card-event--fight-card__item"
  );

  const fights: IEventFight[] = [];
  let currentSection: CardSection = "Unknown";
  let boutOrder = 0;

  nodes.each((_: number, el: cheerio.Element) => {
    const node = $(el);

    const tag = (node.prop("tagName") || "").toString().toLowerCase();
    const isHeadingTag = tag === "h2" || tag === "h3";
    const isHeadingClass = node.is(
      ".c-card-event--fight-card__headline, " +
        ".c-card-event--fight-card__subheadline, " +
        ".c-card-event--fight-card__header, " +
        ".c-card-event--fight-card__title, " +
        ".c-card-event--fight-card__subtitle"
    );

    if (isHeadingTag || isHeadingClass) {
      const text = node.text().trim();
      if (text) currentSection = detectSectionFromHeading(text);
      return;
    }

    const isFightNode =
      node.is(".c-listing-fight") ||
      node.is(".c-card-event--fight-card__item") ||
      node.find(".c-listing-fight").length > 0;

    if (!isFightNode) return;

    const fightNode = node.is(".c-listing-fight")
      ? node
      : node.find(".c-listing-fight").first() || node;

    boutOrder += 1;

    const rawWeightClass =
      fightNode
        .find(
          ".c-listing-fight__class, " +
            ".c-card-event--fight-card__weight-text, " +
            ".c-listing-fight__title"
        )
        .first()
        .text() || "";

    const redCornerNode = fightNode.find(".c-listing-fight__corner--red").first();
    const blueCornerNode = fightNode.find(".c-listing-fight__corner--blue").first();

    const tickerIndex = boutOrder - 1;
    const tickerRedName = tickerRedNames[tickerIndex] || "";
    const tickerBlueName = tickerBlueNames[tickerIndex] || "";

    let redName = extractFighterNameFromCorner(redCornerNode, tickerRedName);
    let blueName = extractFighterNameFromCorner(blueCornerNode, tickerBlueName);

    if (!redName && tickerRedName) redName = tickerRedName;
    if (!blueName && tickerBlueName) blueName = tickerBlueName;

    if (!redName && !blueName && boutOrder === 1 && eventNameForFallback) {
      const inferred = inferNamesFromEventTitle(eventNameForFallback);
      if (inferred.left) redName = inferred.left;
      if (inferred.right) blueName = inferred.right;
    }

    const isPlaceholder = !redName && !blueName;

    if (!redName) redName = "TBD";
    if (!blueName) blueName = "TBD";

    const weightClass = normalizeWeightClass(rawWeightClass);

    const redImgNode = redCornerNode
      .find("img.image-style-event-fight-card-upper-body-of-standing-athlete")
      .first();
    const blueImgNode = blueCornerNode
      .find("img.image-style-event-fight-card-upper-body-of-standing-athlete")
      .first();

    const redImageUrlRaw = redImgNode.attr("src") || undefined;
    const blueImageUrlRaw = blueImgNode.attr("src") || undefined;

    const redImageUrl = normalizeImageUrl(redImageUrlRaw);
    const blueImageUrl = normalizeImageUrl(blueImageUrlRaw);

    const redCountryInfo = extractCountryInfo(fightNode, "red");
    const blueCountryInfo = extractCountryInfo(fightNode, "blue");

    const resultsInfo = extractFightResults(fightNode);

    const fight: IEventFight = {
      id: `${ufcId}-${boutOrder}`,
      boutOrder,
      weightClass,
      redName,
      blueName,
      cardSection: currentSection,
      isPlaceholder,
      redImageUrl,
      blueImageUrl,
      redCountry: redCountryInfo.country,
      blueCountry: blueCountryInfo.country,
      redCountryCode: redCountryInfo.countryCode,
      blueCountryCode: blueCountryInfo.countryCode,
      fightBonus: resultsInfo.fightBonus,
      resultRound: resultsInfo.resultRound,
      resultMethod: resultsInfo.resultMethod,
      resultTime: resultsInfo.resultTime,
      winnerSide: resultsInfo.winnerSide,
    };

    fights.push(fight);
  });

  return fights;
}

export async function refreshEventDetailsInDb(ufcId: string): Promise<IUfcEvent> {
  if (isScrapingDisabled()) {
    throw new Error("Scraping is disabled (DISABLE_UFC_SCRAPING=true).");
  }

  const event = await UfcEvent.findOne({ ufcId });
  if (!event) throw new Error("Event not found in DB");

  const fights = await scrapeUfcEventDetailsFromWeb(ufcId, event.name);

  event.fights = fights;
  event.lastDetailsRefreshedAt = new Date();
  await event.save();

  const savedEvent = await UfcEvent.findOne({ ufcId }).lean<IUfcEvent>().exec();
  return savedEvent || event.toObject();
}

export async function getEventWithFights(ufcId: string): Promise<IUfcEvent | null> {
  return UfcEvent.findOne({ ufcId }).lean<IUfcEvent>().exec();
}

export interface IBulkRefreshResult {
  totalEvents: number;
  updatedCount: number;
  failedCount: number;
  errors: { ufcId: string; error: string }[];
}

async function bulkRefreshEventDetailsInternal(
  isUpcoming: boolean,
  logPrefix: string
): Promise<IBulkRefreshResult> {
  if (isScrapingDisabled()) {
    throw new Error("Scraping is disabled (DISABLE_UFC_SCRAPING=true).");
  }

  const events = await UfcEvent.find({ isUpcoming }).select("ufcId name isUpcoming");

  const result: IBulkRefreshResult = {
    totalEvents: events.length,
    updatedCount: 0,
    failedCount: 0,
    errors: [],
  };

  for (const ev of events) {
    try {
      await refreshEventDetailsInDb(ev.ufcId);
      result.updatedCount += 1;
    } catch (err: any) {
      console.error(`[${logPrefix}] Failed to refresh event ${ev.ufcId}:`, err?.message || err);
      result.failedCount += 1;
      result.errors.push({
        ufcId: ev.ufcId,
        error: err?.message || "Unknown error",
      });
    }
  }

  return result;
}

export async function bulkRefreshUpcomingEventDetails(): Promise<IBulkRefreshResult> {
  return bulkRefreshEventDetailsInternal(true, "BULK UPCOMING");
}

export async function bulkRefreshPastEventDetails(): Promise<IBulkRefreshResult> {
  return bulkRefreshEventDetailsInternal(false, "BULK PAST");
}