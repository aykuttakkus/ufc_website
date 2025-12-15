// src/services/ufcEventsService.ts
import axios from "axios";
import * as cheerio from "cheerio";
import { UfcEvent } from "../models/UfcEvent";

// 🔗 Temel events sayfası
const UFC_EVENTS_URL = "https://www.ufc.com/events";

type RawUfcEvent = {
  ufcId: string;
  name: string;
  subtitle?: string;
  date: Date;
  location?: string;
  type?: string; // "PPV" | "Fight Night" | vs.
  isUpcoming: boolean;
};

// 🔢 Ay kısaltmalarını index'e çeviren map
const MONTH_MAP: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

/**
 * Örnek format:
 * "Sat, Dec 13 / 10:00 PM EST / Main Card"
 * "Sat, Nov 1 / 7:00 PM EDT / Main Card"
 *
 * Buradan "Dec 13" / "Nov 1" kısmını çekip,
 * isUpcoming bilgisine göre yılı tahmin ediyoruz.
 */
function parseUfcDate(rawDateText: string, isUpcoming: boolean): Date | null {
  if (!rawDateText) return null;

  // "Sat, Dec 13 / 10:00 PM EST / Main Card" → "Sat, Dec 13"
  const [datePartRaw] = rawDateText.split("/");
  if (!datePartRaw) return null;

  // "Sat, Dec 13" → "Dec 13"
  const commaIndex = datePartRaw.indexOf(",");
  let core = commaIndex >= 0 ? datePartRaw.slice(commaIndex + 1) : datePartRaw;
  core = core.trim(); // "Dec 13"

  const [monthStr, dayStr] = core.split(/\s+/);
  const monthIndex = MONTH_MAP[monthStr as keyof typeof MONTH_MAP];
  const day = parseInt(dayStr, 10);

  if (
    monthIndex === undefined ||
    Number.isNaN(day) ||
    day <= 0 ||
    day > 31
  ) {
    return null;
  }

  const now = new Date();
  let year = now.getFullYear();
  const currentMonth = now.getMonth();

  // upcoming kartlarda, ay şimdiki aydan çok küçükse muhtemelen gelecek yıl
  if (isUpcoming && monthIndex < currentMonth - 1) {
    year += 1;
  }

  // past kartlarda, ay şimdiki aydan çok büyükse muhtemelen geçen yıl
  if (!isUpcoming && monthIndex > currentMonth + 1) {
    year -= 1;
  }

  const result = new Date(Date.UTC(year, monthIndex, day, 0, 0, 0));
  return result;
}

/**
 * UFC web sitesinden eventleri çeker.
 * - #events-list-upcoming içindeki kartları upcoming
 * - #events-list-past içindeki kartları past
 * olarak işliyoruz.
 */
async function fetchUfcEventsFromWeb(): Promise<RawUfcEvent[]> {
  let html: string;

  try {
    const response = await axios.get(UFC_EVENTS_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 15000,
    });

    html = response.data as string;
  } catch (err: any) {
    console.error(
      "[UFC SCRAPER] Failed to fetch events:",
      err?.response?.status,
      err?.response?.statusText,
      err?.message
    );
    throw err;
  }

  const $ = cheerio.load(html);
  const events: RawUfcEvent[] = [];

  // Upcoming / Past container'ları
  const upcomingSection = $("#events-list-upcoming");
  const pastSection = $("#events-list-past");

  // Kartları daha geniş selector'larla bul
  const selectCards = (section: cheerio.Cheerio) =>
    section
      .find(".c-card-event--result, .c-card-event, .c-card")
      .filter((_, el) => {
        const node = $(el);
        const hasHeadline =
          node.find(
            ".c-card-event__headline, .c-card-event--result__headline, .c-card-event__title"
          ).length > 0;
        return hasHeadline;
      });

  const upcomingCards = selectCards(upcomingSection);
  const pastCards = selectCards(pastSection);

  // Tek bir event kartını parse eden helper
  const parseCard = (card: cheerio.Cheerio, isUpcoming: boolean) => {
    // Başlık
    const name =
      card
        .find(
          ".c-card-event__headline, .c-card-event--result__headline, .c-card-event__title"
        )
        .first()
        .text()
        .trim() || "";

    if (!name) {
      return;
    }

    const subtitleText =
      card
        .find(
          ".c-card-event__subtitle, .c-card-event--result__subtitle, .field--name-field-subheadline"
        )
        .first()
        .text()
        .trim() || "";

    const locationText =
      card
        .find(
          ".c-card-event__location, .c-card-event--result__location, .field--name-venue"
        )
        .first()
        .text()
        .trim() || "";

    const typeText =
      card
        .find(
          ".c-card-event__title-tag, .c-card-event__title, .c-card-event--result__title"
        )
        .first()
        .text()
        .trim() || "";

    // Tarih – önce data attribute deneriz, yoksa manuel parse
    const rawDateAttr =
      card
        .find("[data-main-card-datetime], [data-main-card-date]")
        .first()
        .attr("data-main-card-datetime") ||
      card
        .find("[data-main-card-date]")
        .first()
        .attr("data-main-card-date") ||
      "";

    const rawDateText =
      card
        .find(".c-card-event__date, .c-card-event--result__date")
        .first()
        .text()
        .trim() || "";

    let parsedDate: Date | null = null;

    if (rawDateAttr && !Number.isNaN(Date.parse(rawDateAttr))) {
      parsedDate = new Date(rawDateAttr);
    } else {
      // 🔥 Özel UFC date parser’ı
      parsedDate = parseUfcDate(rawDateText, isUpcoming);
    }

    // Tarihi çözemiyorsak kartı atla
    if (!parsedDate) {
      return;
    }

    const date = parsedDate;

    // Linkten slug/ufcId üret
    const href =
      card
        .find(
          "a.c-card-event--result__link, a.c-card-event--result__headline, a.c-card, a"
        )
        .first()
        .attr("href") || "";
    const slug =
      href
        .split("/")
        .filter(Boolean)
        .pop() || name.toLowerCase().replace(/\s+/g, "-");

    // type normalize
    let normalizedType: string | undefined;
    const t = typeText.toLowerCase();
    if (t.includes("ppv")) normalizedType = "PPV";
    else if (t.includes("fight night")) normalizedType = "Fight Night";
    else if (typeText) normalizedType = typeText;
    else normalizedType = "Event";

    const ev: RawUfcEvent = {
      ufcId: slug,
      name,
      subtitle: subtitleText || undefined,
      date,
      location: locationText || undefined,
      type: normalizedType,
      isUpcoming,
    };

    events.push(ev);
  };

  // Upcoming kartlar
  upcomingCards.each((_, el) => {
    parseCard($(el), true);
  });

  // Past kartlar
  pastCards.each((_, el) => {
    parseCard($(el), false);
  });

  return events;
}

/**
 * Swagger’dan tetiklenecek refresh fonksiyonu:
 * - UFC'den full listeyi çeker
 * - Tüm upcoming + tüm past eventleri Mongo'ya upsert eder
 */
export async function refreshUfcEvents() {
  const rawEvents = await fetchUfcEventsFromWeb();

  const upcomingEvents = rawEvents
    .filter((e) => e.isUpcoming)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const pastEvents = rawEvents
    .filter((e) => !e.isUpcoming)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const allEvents = [...upcomingEvents, ...pastEvents];

  const bulkOps =
    allEvents.length > 0
      ? allEvents.map((e) => ({
          updateOne: {
            filter: { ufcId: e.ufcId },
            update: {
              $set: {
                name: e.name,
                subtitle: e.subtitle,
                date: e.date,
                location: e.location,
                type: e.type,
                isUpcoming: e.isUpcoming,
              },
            },
            upsert: true,
          },
        }))
      : [];

  if (bulkOps.length > 0) {
    await UfcEvent.bulkWrite(bulkOps);
  }

  return {
    upcomingCount: upcomingEvents.length,
    pastCount: pastEvents.length,
    total: allEvents.length,
  };
}

/** DB'den upcoming events (date ASC) – tüm gelecek eventler */
export async function getUpcomingEvents() {
  const now = new Date();

  const events = await UfcEvent.find({
    date: { $gte: now },
  })
    .sort({ date: 1 }) // en yakın olandan ileriye doğru
    .lean();           // limit yok

  return events;
}

/** DB'den past events (date DESC) – sadece son 10 */
export async function getPastEvents() {
  const now = new Date();

  const events = await UfcEvent.find({
    date: { $lt: now },
  })
    .sort({ date: -1 }) // en yeni geçmişten en eskiye
    .limit(10)          // sadece son 10 event
    .lean();

  return events;
}