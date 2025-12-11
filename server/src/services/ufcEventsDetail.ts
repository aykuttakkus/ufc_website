// src/services/ufcEventsDetail.ts
import axios from "axios";
import * as cheerio from "cheerio";
import {
  UfcEvent,
  IUfcEvent,
  IEventFight,
  CardSection,
  WinnerSide,
} from "../models/UfcEvent";

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
 * HTML örneği:
 * <div class="c-listing-fight__country--red">
 *   <img alt="Portugal Flag" src="https://ufc.com/images/flags/PT.PNG">
 *   <div class="c-listing-fight__country-text">Portugal</div>
 * </div>
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
  // Farklı HTML yapılarını desteklemek için birden fazla selector dene
  let bonusText: string | undefined = undefined;

  // 1) Standart banner selector'ları (CSS class-based)
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
      if (text && (text.toLowerCase().includes("fight") || text.toLowerCase().includes("performance"))) {
        bonusText = text;
        break;
      }
    }
  }

  // 2) Attribute-based arama (data-*, aria-label, title vb.)
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

  // 3) Parent node'larda da ara (banner fight node'un dışında olabilir)
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

  // 4) Eğer hala bulunamadıysa, tüm fight node içinde regex ile ara
  if (!bonusText) {
    const fightText = fightNode.text();
    const fightTextLower = fightText.toLowerCase();

    // "Fight of the Night" için regex
    const fightMatch = fightText.match(/fight\s+of\s+the\s+night/gi);
    if (fightMatch && fightMatch[0]) {
      bonusText = fightMatch[0];
    }
    // "Performance of the Night" için regex
    else {
      const performanceMatch = fightText.match(
        /performance\s+of\s+the\s+night/gi
      );
      if (performanceMatch && performanceMatch[0]) {
        bonusText = performanceMatch[0];
      }
      // Sadece "Performance" kelimesi varsa
      else if (fightTextLower.includes("performance")) {
        // Daha spesifik pattern'ler dene
        const perfPatterns = [
          /performance\s+bonus/gi,
          /performance\s+award/gi,
          /potn/gi, // Performance of the Night kısaltması
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

  // 5) Normalize bonus text (tutarlılık için)
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


  // 📊 Round, Method & Time (Results)
  let resultRound: number | undefined;
  let resultMethod: string | undefined;
  let resultTime: string | undefined;

  // Results container'ı bul - farklı selector'ları dene
  let resultsRoot = fightNode
    .find(".c-listing-fight__results.c-listing-fight__results--desktop")
    .first();
  
  if (!resultsRoot || resultsRoot.length === 0) {
    resultsRoot = fightNode.find(".c-listing-fight__results").first();
  }
  
  // Eğer hala bulunamadıysa, alternatif selector'ları dene
  if (!resultsRoot || resultsRoot.length === 0) {
    resultsRoot = fightNode.find("[class*='results']").first();
  }

  // Eğer hala bulunamadıysa, direkt fight node içinde result item'ları ara
  let resultItems = resultsRoot && resultsRoot.length > 0
    ? resultsRoot.find(".c-listing-fight__result")
    : fightNode.find(".c-listing-fight__result");
  
  if (resultItems && resultItems.length > 0) {
    resultItems.each((idx, _el) => {
      // Cheerio node oluştur
      const node = resultItems.eq(idx);

      // Label'ı bul - farklı selector'ları dene
      let labelElement = node.find(".c-listing-fight__result-label").first();
      if (!labelElement || labelElement.length === 0) {
        labelElement = node.find("[class*='result-label']").first();
      }
      if (!labelElement || labelElement.length === 0) {
        labelElement = node.find(".c-listing-fight_result-label").first();
      }

      // Value text'i bul - farklı selector'ları dene
      let valueElement = node.find(".c-listing-fight__result-text").first();
      if (!valueElement || valueElement.length === 0) {
        valueElement = node.find("[class*='result-text']").first();
      }
      if (!valueElement || valueElement.length === 0) {
        valueElement = node.find(".c-listing-fight_result-text").first();
      }

      if (!labelElement || !valueElement || labelElement.length === 0 || valueElement.length === 0) {
        return;
      }

      const label = labelElement
        .text()
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      const valueText = valueElement
        .text()
        .replace(/\s+/g, " ")
        .trim();

      if (!label || !valueText) {
        return;
      }

      // Label matching - daha esnek (includes kullanarak)
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

  // 🥇 Winner side (red / blue / draw / no-contest)
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
 * Öncelik sırası:
 *  0. corner yoksa → ticker
 *  1. corner-body içindeki name/person-name text
 *  2. body içindeki athlete link text
 *  3. img alt (cleanAlt ile)
 *  4. athlete slug → "brandon-royval" → "Brandon Royval"
 *  5. corner text heuristik
 *  6. ticker fallback
 *  7. sanitize sonrası yine boşsa → tekrar ticker fallback
 */
function extractFighterNameFromCorner(
  cornerNode: cheerio.Cheerio,
  tickerNameFromFight?: string
): string {
  // 0) Corner yok ama ticker'da isim varsa → direkt onu kullan
  if (!cornerNode || cornerNode.length === 0) {
    return tickerNameFromFight ? sanitizeFighterName(tickerNameFromFight) : "";
  }

  // 1) corner body
  const body = cornerNode
    .find(
      ".c-listing-fight__corner-body--red, " +
        ".c-listing-fight__corner-body--blue, " +
        ".c-listing-fight__corner-body"
    )
    .first();

  // 1.a) name / person-name class
  let raw =
    body
      .find(".c-listing-fight__name, .c-listing-fight__person-name")
      .first()
      .text() || "";

  // 1.b) body içindeki athlete link text
  if (!raw.trim()) {
    raw =
      body
        .find("a[href*='/athlete/']")
        .first()
        .text() || "";
  }

  // 2) img alt → cleanAlt
  if (!raw.trim()) {
    const img = cornerNode.find("img[alt]").first();
    const altRaw = img.attr("alt") || "";
    const altClean = cleanAlt(altRaw);
    if (altClean.trim()) raw = altClean;
  }

  // 3) athlete slug → Pretty name
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

  // 4) corner text'inden isim çıkarmaya çalış (son çarelerden biri)
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

  // 5) ⭐ ÖNEMLİ: DOM'dan hiçbir şey bulamadıysak, ticker'ı kullan
  if (!raw.trim() && tickerNameFromFight) {
    raw = tickerNameFromFight;
  }

  const sanitized = sanitizeFighterName(raw);

  // 6) ⭐ EKSTRA GÜVENLİK: Sanitize sonrası boşsa ve ticker varsa, ticker'ı dene
  if (!sanitized && tickerNameFromFight) {
    return sanitizeFighterName(tickerNameFromFight);
  }

  return sanitized;
}

/**
 * Belirli bir event için UFC web sayfasından fight card detaylarını çeker.
 * → TÜM maçları döner (main + prelims + early prelims), isim yoksa bile placeholder olarak kaydeder.
 * → Geçmiş event’lerde bonus / round / method / kazanan bilgilerini de döndürür.
 */
// Delay helper - rate limiting için
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry helper - 403 hatası için
async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 2000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (error.response?.status === 403 && i < maxRetries - 1) {
        console.log(`[retryRequest] 403 error, retrying ${i + 1}/${maxRetries} after ${delayMs}ms delay`);
        await delay(delayMs * (i + 1)); // Exponential backoff
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

export async function scrapeUfcEventDetailsFromWeb(
  ufcId: string,
  eventNameForFallback?: string
): Promise<IEventFight[]> {
  const url = `https://www.ufc.com/event/${ufcId}`;

  // Daha gerçekçi browser headers
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.ufc.com/",
    "Origin": "https://www.ufc.com",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
  };

  const res = await retryRequest(
    async () => {
      try {
        const response = await axios.get<string>(url, {
          headers,
          timeout: 20000,
          maxRedirects: 5,
        });
        return response;
      } catch (error: any) {
        // Axios error handling - 403 gibi status kodlarını throw et
        if (error.response) {
          // Server responded with error status
          if (error.response.status === 403) {
            throw new Error(`Request failed with status code 403 - UFC website blocked the request for ${ufcId}`);
          }
          throw new Error(`Request failed with status code ${error.response.status}`);
        }
        throw error;
      }
    },
    3,
    3000 // 3 saniye delay
  );

  const html = res.data;
  const $ = cheerio.load(html);

  // Ana fight card container – UFC markup değişse bile birkaç class deniyoruz
  let container = $(".c-card-event--fight-card").first();
  if (!container || container.length === 0) {
    container = $(".view-grouping-content").first();
  }
  if (!container || container.length === 0) {
    container = $(".l-page__content").first();
  }


  // Dövüş kartlarını okumak için root
  const fightRoot: cheerio.Cheerio =
    container && container.length > 0 ? container : $.root();

  // Ticker isimleri için her zaman global root
  const tickerRoot: cheerio.Cheerio = $.root();

  // 🔁 Ticker isimleri (bazı fightlarda sadece burada var: Allen Frye Jr. gibi) topla
  const rawTickerRedNames: string[] = [];
  const rawTickerBlueNames: string[] = [];

  // Red corner: hem underscore'lı hem hyphen + __'li yapıyı destekle
  tickerRoot
    .find(
      ".c-listing-ticker_fightcard_red_corner_name, " +
        ".c-listing-ticker-fightcard__red_corner_name"
    )
    .each((i, el) => {
      const name = sanitizeFighterName($(el).text());
      rawTickerRedNames.push(name);
    });

  // Blue corner: hem underscore'lı hem hyphen + __'li yapıyı destekle
  tickerRoot
    .find(
      ".c-listing-ticker_fightcard_blue_corner_name, " +
        ".c-listing-ticker-fightcard__blue_corner_name"
    )
    .each((i, el) => {
      const name = sanitizeFighterName($(el).text());
      rawTickerBlueNames.push(name);
    });

  // 🧠 ÖNEMLİ: Ticker sırası genelde bottom → top (erken maç → main event).
  // Bizim boutOrder sıramız ise top → bottom (main event → en alttaki).
  // Bu yüzden dizileri ters çevirip boutOrder ile eşliyoruz.
  const tickerRedNames = rawTickerRedNames.filter(Boolean).reverse();
  const tickerBlueNames = rawTickerBlueNames.filter(Boolean).reverse();

  // Heading + fight item’ları sırasıyla gezeceğiz
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

    // 1) Heading mi? (Main Card / Prelims / Early Prelims)
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
      return; // bir fight değil, sadece bölüm başlığı
    }

    // 2) Fight item mi?
    const isFightNode =
      node.is(".c-listing-fight") ||
      node.is(".c-card-event--fight-card__item") ||
      node.find(".c-listing-fight").length > 0;

    if (!isFightNode) return;

    // Eğer wrapper ise içindeki asıl .c-listing-fight’ı al
    const fightNode = node.is(".c-listing-fight")
      ? node
      : node.find(".c-listing-fight").first() || node;

    boutOrder += 1;

    // Weight class
    const rawWeightClass =
      fightNode
        .find(
          ".c-listing-fight__class, " +
            ".c-card-event--fight-card__weight-text, " +
            ".c-listing-fight__title"
        )
        .first()
        .text() || "";

    // Red / blue corner root node’ları
    const redCornerNode = fightNode
      .find(".c-listing-fight__corner--red")
      .first();
    const blueCornerNode = fightNode
      .find(".c-listing-fight__corner--blue")
      .first();

    // Ticker dizilerinden bu bout'a denk gelen isimler (REVERSE edilmiş array’den)
    const tickerIndex = boutOrder - 1;
    const tickerRedName = tickerRedNames[tickerIndex] || "";
    const tickerBlueName = tickerBlueNames[tickerIndex] || "";

    // 🔑 İsimleri helper ile çıkar (ticker fallback'li)
    let redName = extractFighterNameFromCorner(
      redCornerNode,
      tickerRedName
    );
    let blueName = extractFighterNameFromCorner(
      blueCornerNode,
      tickerBlueName
    );

    // ⭐ EKSTRA FALLBACK: Hâlâ boşsa ticker'ı direkt kullan
    if (!redName && tickerRedName) {
      redName = tickerRedName;
    }

    if (!blueName && tickerBlueName) {
      blueName = tickerBlueName;
    }

    // Eğer ilk bout’ta isim yoksa, event title’dan tahmin et (Royval vs Kape gibi)
    if (!redName && !blueName && boutOrder === 1 && eventNameForFallback) {
      const inferred = inferNamesFromEventTitle(eventNameForFallback);
      if (inferred.left) redName = inferred.left;
      if (inferred.right) blueName = inferred.right;
    }

    const isRedPlaceholder = !redName;
    const isBluePlaceholder = !blueName;
    const isPlaceholder = isRedPlaceholder && isBluePlaceholder;

    // Son safety: yine de isim yoksa, UI için nötr placeholder string ver
    if (!redName) redName = "TBD";
    if (!blueName) blueName = "TBD";

    const weightClass = normalizeWeightClass(rawWeightClass);

    // 🔹 Dövüşçü görselleri (upper body images)
    const redImgNode = redCornerNode
      .find("img.image-style-event-fight-card-upper-body-of-standing-athlete")
      .first();
    const blueImgNode = blueCornerNode
      .find("img.image-style-event-fight-card-upper-body-of-standing-athlete")
      .first();

    const redImageUrlRaw = redImgNode.attr("src") || undefined;
    const blueImageUrlRaw = blueImgNode.attr("src") || undefined;
    
    // URL'leri normalize et (relative → absolute) - Safari uyumluluğu için
    const redImageUrl = normalizeImageUrl(redImageUrlRaw);
    const blueImageUrl = normalizeImageUrl(blueImageUrlRaw);

    // 🔹 Ülke + bayrak bilgisi (country row)
    const redCountryInfo = extractCountryInfo(fightNode, "red");
    const blueCountryInfo = extractCountryInfo(fightNode, "blue");

    const redCountry = redCountryInfo.country;
    const blueCountry = blueCountryInfo.country;
    const redCountryCode = redCountryInfo.countryCode;
    const blueCountryCode = blueCountryInfo.countryCode;

    // 🔹 Past event sonuç bilgileri (bonus, round, method, winner)
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
      // Yeni alanlar:
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
  
  // Return lean object instead of Mongoose document for consistency
  const savedEvent = await UfcEvent.findOne({ ufcId }).lean<IUfcEvent>().exec();
  return savedEvent || event.toObject();
}

/**
 * DB'den event + fights oku
 */
export async function getEventWithFights(
  ufcId: string
): Promise<IUfcEvent | null> {
  const event = await UfcEvent.findOne({ ufcId }).lean<IUfcEvent>().exec();
  
  if (!event) {
    console.log(`[getEventWithFights] Event not found with ufcId: ${ufcId}`);
    // Debug: Benzer ufcId'leri ara
    const similar = await UfcEvent.find({
      ufcId: { $regex: new RegExp(ufcId.replace(/-/g, ".*"), "i") }
    }).select("ufcId name").lean().exec();
    
    if (similar.length > 0) {
      console.log(`[getEventWithFights] Similar ufcIds found:`, similar.map(e => e.ufcId));
    }
  }
  
  return event;
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

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    try {
      console.log(`[${logPrefix}] Refreshing ${i + 1}/${events.length}: ${ev.ufcId}`);
      await refreshEventDetailsInDb(ev.ufcId);
      result.updatedCount += 1;
      
      // Rate limiting için delay - her request arasında 2-3 saniye bekle
      // Son event'te delay'e gerek yok
      if (i < events.length - 1) {
        const delayTime = 2500 + Math.random() * 1000; // 2.5-3.5 saniye arası random delay
        console.log(`[${logPrefix}] Waiting ${Math.round(delayTime)}ms before next request...`);
        await delay(delayTime);
      }
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
      
      // Hata olsa bile delay yap - rate limiting'i aşmak için
      if (i < events.length - 1) {
        await delay(2000);
      }
    }
  }

  return result;
}

/**
 * SADECE isUpcoming = true eventler için bulk refresh.
 * → "Refresh All" butonunun arkasında BUNU kullanırsan,
 *    sadece upcoming event'ler güncellenir.
 */
export async function bulkRefreshUpcomingEventDetails(): Promise<IBulkRefreshResult> {
  return bulkRefreshEventDetailsInternal(true, "BULK UPCOMING");
}

/**
 * SADECE isUpcoming = false (past) eventler için bulk refresh.
 * → Bunu ayrı "Refresh Past" butonunda kullanırsın.
 */
export async function bulkRefreshPastEventDetails(): Promise<IBulkRefreshResult> {
  return bulkRefreshEventDetailsInternal(false, "BULK PAST");
}