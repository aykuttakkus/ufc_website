// src/services/ufcEventsDetail.ts
import * as cheerio from "cheerio";
import {
  UfcEvent,
  IUfcEvent,
  IEventFight,
  CardSection,
  WinnerSide,
} from "../models/UfcEvent";
import { fetchUfcHtml } from "../clients/Client"; // 👈 yeni client import'u

// Köşe için asla gerçek isim olmayacak string / pattern’ler
const BAD_CORNER_PATTERNS = [
  "red corner",
  "blue corner",
  "full body silhouette image",
  "silhouette image",
  "corner image",
];

/**
 * alt text içindeki "…image" kısmını at, sonrasını isim olarak kullanmaya çalış.
 * Örn:
 *  "Men's full body silhouette image Neil Magny" → "Neil Magny"
 *  "Men's full body silhouette image"           → "" (isim yok)
 */
function cleanAlt(raw?: string | null): string {
  if (!raw) return "";

  // Tek satır, ekstra boşlukları kırp
  let alt = raw.replace(/\s+/g, " ").trim();
  if (!alt) return "";

  // Gürültü ifadeleri (yön, poz, gövde, “image” vb.)
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
    // Sık görülen siklet kelimelerini de temizle
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

  // Sadece harf, boşluk, apostrof ve tire kalsın
  alt = alt.replace(/[^a-zA-Z\s'’-]/g, " ").replace(/\s+/g, " ").trim();
  if (!alt) return "";

  return alt;
}

function sanitizeFighterName(raw: string | undefined | null): string {
  if (!raw) return "";
  const t = raw.replace(/\s+/g, " ").trim();
  if (!t) return "";

  const lower = t.toLowerCase();

  // Bu pattern'lerden biri geçiyorsa, bu gerçek isim değildir → boş dön
  if (BAD_CORNER_PATTERNS.some((p) => lower.includes(p))) {
    return "";
  }

  return t;
}

function normalizeWeightClass(raw?: string | null): string {
  if (!raw) return "";
  let t = raw.replace(/\s+/g, " ").trim();

  // "#3 Flyweight Bout #6" → "Flyweight Bout"
  t = t.replace(/#\d+/g, "").replace(/\s+/g, " ").trim();

  // "Middleweight Bout Middleweight Bout" gibi tekrarları temizle
  const mid = Math.floor(t.length / 2);
  const first = t.slice(0, mid).trim();
  const second = t.slice(mid).trim();
  if (first && first === second) return first;

  return t;
}

/**
 * Relative veya absolute URL'yi normalize et
 * Relative URL'ler için base URL ekle (Safari uyumluluğu için)
 */
function normalizeImageUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;

  // Zaten tam URL ise (http:// veya https:// ile başlıyorsa) olduğu gibi dön
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Relative URL ise base URL ekle
  // Eğer / ile başlıyorsa root-relative, değilse current path-relative
  if (url.startsWith("/")) {
    return `https://www.ufc.com${url}`;
  }

  // Current path-relative için de base URL ekle
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

/**
 * DOM içindeki bir heading node'un text’ine göre card section belirle.
 */
function detectSectionFromHeading(text: string): CardSection {
  const t = text.trim();
  for (const m of SECTION_MAPPERS) {
    if (m.regex.test(t)) return m.value;
  }
  return "Unknown";
}

/**
 * Flag URL'den ülke kodunu çıkar (örn: .../flags/PT.PNG → PT)
 */
function extractCountryCodeFromFlagSrc(src?: string | null): string | undefined {
  if (!src) return undefined;
  const match = src.match(/\/flags\/([^/.]+)\./i);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }
  return undefined;
}

/**
 * Fight node içinden ülke text + flag code çıkar.
 */
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

/**
 * Past event’ler için sonuç / ödül bilgilerini çıkar:
 * - Fight/Performance of the Night
 * - Round
 * - Method (KO/TKO, Decision, Submission)
 * - Kazanan köşe (red / blue / draw / no-contest)
 */
function extractFightResults(
  fightNode: cheerio.Cheerio
): {
  fightBonus?: string;
  resultRound?: number;
  resultMethod?: string;
  resultTime?: string;
  winnerSide?: WinnerSide;
} {
  // 🎖 Bonus banner: Fight of the Night / Performance of the Night
  let bonusText: string | undefined = undefined;

  // 1) Standart banner selector'ları
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

  // 2) Attribute-based arama
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

  // 3) Parent node'larda da ara
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

  // 4) Tüm node içinde regex ile ara
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

  // 5) Normalize bonus text
  if (bonusText) {
    const normalized = bonusText
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    if (normalized.includes("fight of the night")) {
      bonusText = "Fight of the Night";
    } else if (
      normalized.includes("performance of the night") ||
      normalized.includes("performance")
    ) {
      bonusText = "Performance of the Night";
    }
  }

  // 📊 Round, Method & Time
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
    resultItems.each((idx, _el) => {
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

      if (
        !labelElement ||
        !valueElement ||
        labelElement.length === 0 ||
        valueElement.length === 0
      ) {
        return;
      }

      const label = labelElement
        .text()
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      const valueText = valueElement.text().replace(/\s+/g, " ").trim();

      if (!label || !valueText) {
        return;
      }

      if (label.includes("round")) {
        const parsed = parseInt(valueText, 10);
        if (!Number.isNaN(parsed)) {
          resultRound = parsed;
        }
      } else if (label.includes("method")) {
        resultMethod = valueText;
      } else if (label.includes("time")) {
        resultTime = valueText;
      }
    });
  }

  // 🥇 Winner side
  let winnerSide: WinnerSide | undefined;

  const redCornerNode = fightNode
    .find(".c-listing-fight__corner--red")
    .first();
  const blueCornerNode = fightNode
    .find(".c-listing-fight__corner--blue")
    .first();

  const hasDrawOutcome =
    fightNode.find(".c-listing-fight__outcome--draw").length > 0;
  const hasNoContestOutcome =
    fightNode.find(".c-listing-fight__outcome--nc").length > 0;

  const redHasWin =
    redCornerNode.find(".c-listing-fight__outcome--win").length > 0;
  const blueHasWin =
    blueCornerNode.find(".c-listing-fight__outcome--win").length > 0;

  if (hasDrawOutcome) {
    winnerSide = "draw";
  } else if (hasNoContestOutcome) {
    winnerSide = "no-contest";
  } else if (redHasWin && !blueHasWin) {
    winnerSide = "red";
  } else if (blueHasWin && !redHasWin) {
    winnerSide = "blue";
  }

  return {
    fightBonus: bonusText,
    resultRound,
    resultMethod,
    resultTime,
    winnerSide,
  };
}

/**
 * Köşe node'undan (red / blue) ismi çıkar.
 */
function extractFighterNameFromCorner(
  cornerNode: cheerio.Cheerio,
  tickerNameFromFight?: string
): string {
  // 0) Corner yok ama ticker'da isim varsa → direkt onu kullan
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
    body
      .find(".c-listing-fight__name, .c-listing-fight__person-name")
      .first()
      .text() || "";

  if (!raw.trim()) {
    raw =
      body
        .find("a[href*='/athlete/']")
        .first()
        .text() || "";
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
      const pretty = slug
        .split("-")
        .map((part) =>
          part.length
            ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            : part
        )
        .join(" ");
      raw = pretty;
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

      if (filtered.length >= 2) {
        const candidate = filtered.slice(0, 3).join(" ");
        raw = candidate;
      }
    }
  }

  if (!raw.trim() && tickerNameFromFight) {
    raw = tickerNameFromFight;
  }

  const sanitized = sanitizeFighterName(raw);

  if (!sanitized && tickerNameFromFight) {
    return sanitizeFighterName(tickerNameFromFight);
  }

  return sanitized;
}

/**
 * Belirli bir event için UFC web sayfasından fight card detaylarını çeker.
 */
export async function scrapeUfcEventDetailsFromWeb(
  ufcId: string,
  eventNameForFallback?: string
): Promise<IEventFight[]> {
  // 👇 Önceden axios ile full URL kullanıyorduk
  // const url = `https://www.ufc.com/event/${ufcId}`;
  // const res = await axios.get<string>(url, { ... });

  // ✅ Artık browser-like header'lı client üzerinden path ile çekiyoruz
  const path = `/event/${ufcId}`;
  const html = await fetchUfcHtml(path);

  const $ = cheerio.load(html);

  // Ana fight card container – UFC markup değişse bile birkaç class deniyoruz
  let container = $(".c-card-event--fight-card").first();
  if (!container || container.length === 0) {
    container = $(".view-grouping-content").first();
  }
  if (!container || container.length === 0) {
    container = $(".l-page__content").first();
  }

  const fightRoot: cheerio.Cheerio =
    container && container.length > 0 ? container : $.root();

  const tickerRoot: cheerio.Cheerio = $.root();

  // 🔁 Ticker isimleri
  const rawTickerRedNames: string[] = [];
  const rawTickerBlueNames: string[] = [];

  tickerRoot
    .find(
      ".c-listing-ticker_fightcard_red_corner_name, " +
        ".c-listing-ticker-fightcard__red_corner_name"
    )
    .each((i, el) => {
      const name = sanitizeFighterName($(el).text());
      rawTickerRedNames.push(name);
    });

  tickerRoot
    .find(
      ".c-listing-ticker_fightcard_blue_corner_name, " +
        ".c-listing-ticker-fightcard__blue_corner_name"
    )
    .each((i, el) => {
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
      if (text) {
        currentSection = detectSectionFromHeading(text);
      }
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

    const redCornerNode = fightNode
      .find(".c-listing-fight__corner--red")
      .first();
    const blueCornerNode = fightNode
      .find(".c-listing-fight__corner--blue")
      .first();

    const tickerIndex = boutOrder - 1;
    const tickerRedName = tickerRedNames[tickerIndex] || "";
    const tickerBlueName = tickerBlueNames[tickerIndex] || "";

    let redName = extractFighterNameFromCorner(redCornerNode, tickerRedName);
    let blueName = extractFighterNameFromCorner(blueCornerNode, tickerBlueName);

    if (!redName && tickerRedName) {
      redName = tickerRedName;
    }

    if (!blueName && tickerBlueName) {
      blueName = tickerBlueName;
    }

    if (!redName && !blueName && boutOrder === 1 && eventNameForFallback) {
      const inferred = inferNamesFromEventTitle(eventNameForFallback);
      if (inferred.left) redName = inferred.left;
      if (inferred.right) blueName = inferred.right;
    }

    const isRedPlaceholder = !redName;
    const isBluePlaceholder = !blueName;
    const isPlaceholder = isRedPlaceholder && isBluePlaceholder;

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

    const redCountry = redCountryInfo.country;
    const blueCountry = blueCountryInfo.country;
    const redCountryCode = redCountryInfo.countryCode;
    const blueCountryCode = blueCountryInfo.countryCode;

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
      redCountry,
      blueCountry,
      redCountryCode,
      blueCountryCode,
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

/**
 * Hem UFC'den detay scrape eder, hem de DB'deki event dokümanını günceller.
 */
export async function refreshEventDetailsInDb(
  ufcId: string
): Promise<IUfcEvent> {
  const event = await UfcEvent.findOne({ ufcId });

  if (!event) {
    throw new Error("Event not found in DB");
  }

  const fights = await scrapeUfcEventDetailsFromWeb(ufcId, event.name);

  event.fights = fights;
  event.lastDetailsRefreshedAt = new Date();

  await event.save();

  const savedEvent = await UfcEvent.findOne({ ufcId }).lean<IUfcEvent>().exec();
  return savedEvent || event.toObject();
}

/**
 * DB'den event + fights oku
 */
export async function getEventWithFights(
  ufcId: string
): Promise<IUfcEvent | null> {
  return UfcEvent.findOne({ ufcId }).lean<IUfcEvent>().exec();
}

/**
 * Bulk refresh sonuç tipi
 */
export interface IBulkRefreshResult {
  totalEvents: number;
  updatedCount: number;
  failedCount: number;
  errors: { ufcId: string; error: string }[];
}

/**
 * Helper: Bulk refresh için ortak mantık
 */
async function bulkRefreshEventDetailsInternal(
  isUpcoming: boolean,
  logPrefix: string
): Promise<IBulkRefreshResult> {
  const events = await UfcEvent.find({ isUpcoming }).select(
    "ufcId name isUpcoming"
  );

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
      console.error(
        `[${logPrefix}] Failed to refresh event ${ev.ufcId}:`,
        err.message
      );
      result.failedCount += 1;
      result.errors.push({
        ufcId: ev.ufcId,
        error: err.message || "Unknown error",
      });
    }
  }

  return result;
}

/**
 * SADECE isUpcoming = true eventler için bulk refresh.
 */
export async function bulkRefreshUpcomingEventDetails(): Promise<IBulkRefreshResult> {
  return bulkRefreshEventDetailsInternal(true, "BULK UPCOMING");
}

/**
 * SADECE isUpcoming = false (past) eventler için bulk refresh.
 */
export async function bulkRefreshPastEventDetails(): Promise<IBulkRefreshResult> {
  return bulkRefreshEventDetailsInternal(false, "BULK PAST");
}