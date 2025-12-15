// src/pages/HomePage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Fighter, UfcEvent, UfcDivision } from "../types";
import {
  getUpcomingEvents,
  getPastEvents,
  fetchEventDetail,
} from "../api/eventsApi";
import { getAllUfcDivisions } from "../api/rankApi";
import { getFighters } from "../api/fighters";

// UFC görsel URL'lerini normalize et (her zaman https://www.ufc.com/... yap)
function normalizeImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  let u = url.trim();

  // http -> https
  if (u.startsWith("http://")) {
    u = u.replace("http://", "https://");
  }

  // Tam https URL ise
  if (u.startsWith("https://")) {
    // https://ufc.com -> https://www.ufc.com
    if (u.startsWith("https://ufc.com")) {
      u = u.replace("https://ufc.com", "https://www.ufc.com");
    }
    return u;
  }

  // /images/... gibi relative URL
  if (u.startsWith("/")) {
    return `https://www.ufc.com${u}`;
  }

  // Diğer durumlarda da base ekle
  return `https://www.ufc.com/${u}`;
}

import aspirallBelt from "../assets/champions_belt_img/ASPINALL_TOM_BELT_10-25.avif";
import chimaevBelt from "../assets/champions_belt_img/CHIMAEV_KHAMZAT_BELTMOCK.avif";
import dernBelt from "../assets/champions_belt_img/DERN_MACKENZIE_BELT.avif";
import dvalishviliBelt from "../assets/champions_belt_img/DVALISHVILI_MERAB_BELT_12-06.avif";
import harrisonBelt from "../assets/champions_belt_img/HARRISON_KAYLA_BELTMOCK.avif";
import makhachevBelt from "../assets/champions_belt_img/MAKHACHEV_ISLAM_BELT_01-18.avif";
import pantojaBelt from "../assets/champions_belt_img/PANTOJA_ALEXANDRE_BELT_12-06.avif";
import pereiraBelt from "../assets/champions_belt_img/PEREIRA_ALEX_BELT_03-08.avif";
import shevchenkoBelt from "../assets/champions_belt_img/SHEVCHENKO_VALENTINA_BELT_11-15.avif";
import topuriaBelt from "../assets/champions_belt_img/TOPURIA_ILIA_BELT_10-26.avif";
import vanBelt from "../assets/champions_belt_img/VAN_JOSHUA_BELT.avif";
import volkanovskiBelt from "../assets/champions_belt_img/VOLKANOVSKI_ALEXANDER_BELT_02-17.avif";
import yanBelt from "../assets/champions_belt_img/YAN_PETR_BELT.avif";

// Şampiyon ismine göre belt görseli döndürür
function getChampionBeltImage(championName: string): string | null {
  const nameLower = championName.toLowerCase();

  if (nameLower.includes("tom aspinall")) return aspirallBelt;
  if (nameLower.includes("khamzat chimaev")) return chimaevBelt;
  if (nameLower.includes("mackenzie dern")) return dernBelt;
  if (nameLower.includes("merab dvalishvili")) return dvalishviliBelt;
  if (nameLower.includes("kayla harrison")) return harrisonBelt;
  if (nameLower.includes("islam makhachev")) return makhachevBelt;
  if (nameLower.includes("alexandre pantoja")) return pantojaBelt;
  if (nameLower.includes("alex pereira")) return pereiraBelt;
  if (nameLower.includes("valentina shevchenko")) return shevchenkoBelt;
  if (nameLower.includes("ilia topuria")) return topuriaBelt;
  if (nameLower.includes("joshua van")) return vanBelt;
  if (nameLower.includes("alexander volkanovski")) return volkanovskiBelt;
  if (nameLower.includes("petr yan")) return yanBelt;

  return null;
}

// --- SKELETON LOADING COMPONENTS ---

function SkeletonHeroCard({ isNext }: { isNext: boolean }) {
  const colorScheme = isNext
    ? {
        badgeBg: "bg-red-700/30",
        badgeText: "text-red-500",
        primary: "#dc2626",
      }
    : {
        badgeBg: "bg-blue-700/30",
        badgeText: "text-blue-400",
        primary: "#3b82f6",
      };

  return (
    <div className="skeleton-card">
      <div className="rounded-3xl bg-black p-8 min-h-[440px] flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* NEXT/PAST EVENT Badge */}
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[0.625rem] font-bold uppercase tracking-[0.1em] ${colorScheme.badgeBg} ${colorScheme.badgeText}`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: colorScheme.primary }}
              />
              {isNext ? "NEXT" : "PAST"} EVENT
            </span>
            {/* Date Badge Placeholder */}
            <div className="skeleton-item h-7 w-24 rounded-full" />
          </div>
          {/* Title Placeholder - text-4xl (2.25rem) line-height 1.15 */}
          <div className="skeleton-item h-14 w-3/4 rounded-lg" />
        </div>

        {/* Fighters */}
        <div className="flex-1 grid grid-cols-3 gap-6 items-center">
          <div className="flex flex-col items-end gap-4">
            <div className="skeleton-item h-48 w-48 sm:h-52 sm:w-52 rounded-xl mx-auto" />
            <div className="skeleton-item h-4 w-24 rounded" />
          </div>
          <div className="skeleton-item h-8 w-12 rounded mx-auto" />
          <div className="flex flex-col items-start gap-4">
            <div className="skeleton-item h-48 w-48 sm:h-52 sm:w-52 rounded-xl mx-auto" />
            <div className="skeleton-item h-4 w-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonUpcomingEvents() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-300">
          Upcoming Events
        </h2>
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-600 hover:text-red-500 transition-colors cursor-pointer">
          View all
        </span>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-[#dc2626] via-[#ea580c] via-zinc-700/70 to-transparent" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-card group relative">
            <div className="rounded-2xl bg-transparent p-5 flex flex-col relative overflow-hidden">
              {/* Date - text-[10px] = 10px font-size, gerçek yükseklik ~10-11px */}
              <div className="relative z-10 skeleton-item h-[10px] w-20 rounded" />
              {/* Title - text-base (16px) line-clamp-2, mt-3 - gerçek kart gibi tek block, minimum yükseklik h-6 (24px) */}
              <div className="relative z-10 mt-3 skeleton-item h-6 w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SkeletonChampionsRow() {
  return (
    <section className="space-y-4 mt-[4.5px]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-300">
          Champions
        </h2>
        <Link
          to="/rankings"
          className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-500 hover:text-amber-400 transition-colors"
        >
          View all
        </Link>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-amber-500 via-zinc-700/70 to-transparent opacity-70" />
      <div className="relative flex items-center">
        {/* Scroll Container */}
        <div className="flex w-full gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              className="skeleton-card skeleton-champion-card flex-shrink-0"
              style={i === 6 ? { width: '40%', minWidth: '60px', maxWidth: '80px' } : {}}
            >
              <div className="rounded-2xl bg-black overflow-hidden flex flex-col">
                <div className="skeleton-item h-40 w-full" />
                <div className="p-3 px-4 flex flex-col gap-2 min-h-[4.5rem]">
                  <div className="skeleton-item h-3 w-20 rounded" />
                  <div className="skeleton-item h-4 w-full rounded" />
                  <div className="skeleton-item h-4 w-3/4 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Left Arrow Placeholder */}
        <div className="absolute left-0 z-10 flex h-8 w-8 -translate-x-10 items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-black/80" />
        </div>

        {/* Right Arrow Placeholder */}
        <div className="absolute right-0 z-10 flex h-8 w-8 translate-x-10 items-center justify-center">
          <div className="skeleton-item h-8 w-8 rounded-full" />
        </div>
      </div>
    </section>
  );
}


export default function HomePage() {
  const [featuredEvent, setFeaturedEvent] = useState<UfcEvent | null>(null);
  const [pastEvent, setPastEvent] = useState<UfcEvent | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UfcEvent[]>([]);
  const [champions, setChampions] = useState<
    {
      division: string;
      champion: string;
      imageUrl?: string;
      externalId?: string;
    }[]
  >([]);
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Paralel olarak tüm verileri yükle
        const [eventsData, pastEventsData, rankingsData, fightersData] =
          await Promise.all([
            getUpcomingEvents(),
            getPastEvents(),
            getAllUfcDivisions(),
            getFighters(),
          ]);

        // Featured Event - Royval vs Kape (sabit, sadece ilk yüklemede set et)
        if (!featuredEvent) {
          // Royval vs Kape dövüşünü upcoming veya past'tan bul
          const royvalKapeEvent = 
            eventsData.find((ev) => 
              ev.name.toLowerCase().includes("royval") && 
              ev.name.toLowerCase().includes("kape")
            ) ||
            pastEventsData.find((ev) => 
              ev.name.toLowerCase().includes("royval") && 
              ev.name.toLowerCase().includes("kape")
            );
          
          if (royvalKapeEvent) {
            // Eğer fight card detayları yoksa çek
            if (!royvalKapeEvent.fights || royvalKapeEvent.fights.length === 0) {
              try {
                const eventDetail = await fetchEventDetail(royvalKapeEvent.ufcId);
                setFeaturedEvent(eventDetail);
              } catch {
                // Detay yüklenemezse sadece temel bilgileri kullan
                setFeaturedEvent(royvalKapeEvent);
              }
            } else {
              setFeaturedEvent(royvalKapeEvent);
            }
          } else if (eventsData.length > 0) {
            // Fallback: İlk upcoming event
            const firstEvent = eventsData[0];
            if (!firstEvent.fights || firstEvent.fights.length === 0) {
              try {
                const eventDetail = await fetchEventDetail(firstEvent.ufcId);
                setFeaturedEvent(eventDetail);
              } catch {
                setFeaturedEvent(firstEvent);
              }
            } else {
              setFeaturedEvent(firstEvent);
            }
          }
        }

        // Past Event - Dvalishvili vs Yan (sabit, sadece ilk yüklemede set et)
        if (!pastEvent) {
          // Dvalishvili vs Yan dövüşünü past'tan bul
          const dvalishviliYanEvent = pastEventsData.find((ev) => 
            ev.name.toLowerCase().includes("dvalishvili") && 
            ev.name.toLowerCase().includes("yan")
          );
          
          if (dvalishviliYanEvent) {
            // Eğer fight card detayları yoksa çek
            if (!dvalishviliYanEvent.fights || dvalishviliYanEvent.fights.length === 0) {
              try {
                const eventDetail = await fetchEventDetail(dvalishviliYanEvent.ufcId);
                setPastEvent(eventDetail);
              } catch {
                // Detay yüklenemezse sadece temel bilgileri kullan
                setPastEvent(dvalishviliYanEvent);
              }
            } else {
              setPastEvent(dvalishviliYanEvent);
            }
          } else if (pastEventsData.length > 0) {
            // Fallback: İlk past event
            const firstPastEvent = pastEventsData[0];
            if (!firstPastEvent.fights || firstPastEvent.fights.length === 0) {
              try {
                const eventDetail = await fetchEventDetail(firstPastEvent.ufcId);
                setPastEvent(eventDetail);
              } catch {
                setPastEvent(firstPastEvent);
              }
            } else {
              setPastEvent(firstPastEvent);
            }
          }
        }

        // Upcoming Events - İlk 3 event (sabit, sadece ilk yüklemede set et)
        if (upcomingEvents.length === 0) {
          setUpcomingEvents(eventsData.slice(0, 3));
        }

        // Champions - Rankings'ten şampiyonları çıkar ve görselleri eşleştir
        // Men's ve Women's Pound for Pound'u filtrele (sadece sikletler)
        const weightClassDivisions = rankingsData.divisions.filter(
          (div: UfcDivision) => {
            const divLower = div.division.toLowerCase();
            return (
              !divLower.includes("men's pound") &&
              !divLower.includes("women's pound") &&
              !divLower.includes("pound for pound") &&
              !divLower.includes("p4p")
            );
          }
        );

        const championsList: {
          division: string;
          champion: string;
          imageUrl?: string;
          externalId?: string;
        }[] = [];

        weightClassDivisions.forEach((division: UfcDivision) => {
          if (division.champion) {
            // Şampiyonun görselini belt assets'ten çek
            const beltImage = getChampionBeltImage(division.champion.name);

            // Şampiyonun externalId'sini fighters listesinden bul
            const championFighter = fightersData.find((f: Fighter) => {
              const championName = division.champion!.name.toLowerCase();
              const fighterName = f.name.toLowerCase();
              // İsim eşleştirmesi - tam eşleşme veya kelime bazlı
              return (
                fighterName === championName ||
                fighterName.includes(championName) ||
                championName.includes(fighterName)
              );
            });

            championsList.push({
              division: division.division,
              champion: division.champion.name,
              imageUrl: beltImage || championFighter?.imageUrl,
              externalId: championFighter?.externalId,
            });
          }
        });
        setChampions(championsList);
        
        // Fighters verisini state'e kaydet (HeroSection için gerekli)
        setFighters(fightersData);
      } catch (err: any) {
        console.error("[HomePage] Error loading data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (error) {
    return (
      <section className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-12 min-h-[60vh]">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-black px-4 py-10 text-white relative">
      {/* SKELETON OVERLAY - Loading state */}
      <div
        className={`absolute inset-0 z-50 pointer-events-none transition-opacity duration-300 bg-black ${
          loading ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="px-4 py-10">
          <div className="mx-auto max-w-6xl flex flex-col gap-12">
            {/* HERO SKELETON */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <SkeletonHeroCard isNext={true} />
              <SkeletonHeroCard isNext={false} />
            </div>

            {/* UPCOMING EVENTS SKELETON */}
            <SkeletonUpcomingEvents />

            {/* CHAMPIONS SKELETON */}
            <SkeletonChampionsRow />
          </div>
        </div>
      </div>

      {/* ACTUAL CONTENT - Loaded state */}
      <div
        className={`relative z-10 transition-opacity duration-300 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-12">
          {/* HERO – FEATURED EVENT & PAST EVENT */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {featuredEvent && <HeroSection event={featuredEvent} isNext={true} fighters={fighters} />}
            {pastEvent && <HeroSection event={pastEvent} isNext={false} fighters={fighters} />}
          </div>

          {/* UPCOMING EVENTS */}
          {upcomingEvents.length > 0 && <UpcomingEvents events={upcomingEvents} />}

          {/* CHAMPIONS ROW */}
          {champions.length > 0 && <ChampionsRow champions={champions} />}
        </div>
      </div>
    </section>
  );
}

// --- HERO SECTION (FLIP ON HOVER: FRONT -> BACK WITH FULL-BODY FIGHTERS + DB STATS) ---

function HeroSection({
  event,
  isNext,
  fighters,
}: {
  event: UfcEvent;
  isNext: boolean;
  fighters?: Fighter[];
}) {
  // Main card fights
  const mainCardFights =
    event.fights?.filter((f) => f.cardSection === "Main Card").slice(0, 2) || [];

  // Main event fighters
  const mainEvent = mainCardFights[0];
  const coMain = mainCardFights[1];

  const redCorner = mainEvent?.redName || "";
  const blueCorner = mainEvent?.blueName || "";

  const redImgSrc = normalizeImageUrl(mainEvent?.redImageUrl);
  const blueImgSrc = normalizeImageUrl(mainEvent?.blueImageUrl);

  const RED_ACCENT = "#dc2626";
  const BLUE_ACCENT = "#3b82f6";

  const normalizeName = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

  const pickNumberLike = (v: any) => {
    if (v === 0) return 0;
    if (v === null || v === undefined) return undefined;
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };

  // ✅ DB-based: ufc_fighters (fighters) tablosundan isme göre bulup W/L/D çek
  const getFighterStatsFromDb = (fighterName: string) => {
    if (!fighters || fighters.length === 0 || !fighterName) {
      return { wins: "—", losses: "—", draws: "—" };
    }

    const target = normalizeName(fighterName);

    // 1) exact match
    let found = fighters.find((f) => normalizeName((f as any).name || "") === target);

    // 2) includes fallback
    if (!found) {
      found = fighters.find((f) => {
        const n = normalizeName((f as any).name || "");
        return n.includes(target) || target.includes(n);
      });
    }

    if (!found) return { wins: "—", losses: "—", draws: "—" };

    const ff: any = found;

    // common shapes:
    // wins/losses/draws OR record {wins,losses,draws} OR "12-3-0"
    const wins =
      pickNumberLike(ff.wins) ??
      pickNumberLike(ff.record?.wins) ??
      pickNumberLike(ff.stats?.wins);

    const losses =
      pickNumberLike(ff.losses) ??
      pickNumberLike(ff.record?.losses) ??
      pickNumberLike(ff.stats?.losses);

    const draws =
      pickNumberLike(ff.draws) ??
      pickNumberLike(ff.record?.draws) ??
      pickNumberLike(ff.stats?.draws);

    // record string parse e.g. "12-3-0"
    let rw = wins,
      rl = losses,
      rd = draws;

    if ((rw === undefined || rl === undefined) && typeof ff.record === "string") {
      const parts = String(ff.record).split("-").map((x) => x.trim());
      const w = pickNumberLike(parts[0]);
      const l = pickNumberLike(parts[1]);
      const d = pickNumberLike(parts[2]) ?? 0;
      if (rw === undefined) rw = w;
      if (rl === undefined) rl = l;
      if (rd === undefined) rd = d;
    }

    return {
      wins: rw ?? "—",
      losses: rl ?? "—",
      draws: rd ?? "—",
    };
  };

  const redStats = getFighterStatsFromDb(redCorner);
  const blueStats = getFighterStatsFromDb(blueCorner);

  // Event tag
  const getEventTag = () => {
    if (event.type) return event.type;
    if (event.name.includes("UFC")) {
      const match = event.name.match(/UFC\s*(\d+)/i);
      if (match) return isNext ? "Numbered Event" : "Fight Night";
    }
    return isNext ? "Upcoming Event" : "Past Event";
  };

  const colorScheme = isNext
    ? {
        primary: "#dc2626",
        secondary: "#ea580c",
        badgeBg: "bg-red-700/30",
        badgeText: "text-red-500",
      }
    : {
        primary: "#3b82f6",
        secondary: "#8b5cf6",
        badgeBg: "bg-blue-700/30",
        badgeText: "text-blue-400",
      };

  return (
    <Link
      to={event.ufcId ? `/events/${event.ufcId}` : "/events"}
      className={`hero-card-wrapper ${isNext ? "hero-next" : "hero-past"}`}
      aria-label={`${isNext ? "Next" : "Past"} event: ${event.name}`}
    >
      {/* Flip Scene */}
      <div className="hero-flip-scene">
        <div className="hero-flip-card">
          {/* FRONT FACE */}
          <div className="hero-face hero-front">
            <div className="hero-static-border" />

            <div className="hero-content">
              <div className="hero-header">
                <div className="hero-badges">
                  <span
                    className={`hero-badge ${colorScheme.badgeBg} ${colorScheme.badgeText}`}
                  >
                    <span
                      className="hero-badge-dot"
                      style={{ backgroundColor: colorScheme.primary }}
                    />
                    {isNext ? "NEXT" : "PAST"} {getEventTag()}
                  </span>

                  <span className={`hero-date-badge ${colorScheme.badgeBg}`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-3 h-3"
                    >
                      <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                      <path
                        fillRule="evenodd"
                        d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {new Date(event.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <h1 className="hero-title">
                  <span className="hero-title-text">{event.name}</span>
                </h1>
              </div>

              {/* Fighters (front) */}
              {mainEvent && (
                <div className="hero-fighters-container">
                  <div className="hero-fighter-wrapper left">
                    <div className="hero-fighter-card">
                      {redImgSrc && (
                        <div className="hero-fighter-image-container">
                          <img
                            src={redImgSrc}
                            alt={redCorner}
                            className="hero-fighter-image"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <div className="hero-fighter-info">
                        <span className="hero-fighter-name">{redCorner}</span>
                      </div>
                    </div>
                  </div>

                  <div className="hero-vs-badge-wrapper">
                    <span className="hero-vs-text">VS</span>
                  </div>

                  <div className="hero-fighter-wrapper right">
                    <div className="hero-fighter-card">
                      {blueImgSrc && (
                        <div className="hero-fighter-image-container">
                          <img
                            src={blueImgSrc}
                            alt={blueCorner}
                            className="hero-fighter-image"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <div className="hero-fighter-info">
                        <span className="hero-fighter-name">{blueCorner}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BACK FACE */}
          <div className="hero-face hero-back">
            <div className="hero-static-border" />

            <div className="hero-back-content">
              {/* LEFT fighter */}
              <div className="hero-back-fighter red">
                {redImgSrc ? (
                  <img
                    src={redImgSrc}
                    alt={redCorner}
                    className="hero-back-fighter-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="hero-back-placeholder" />
                )}

                <div className="hero-back-name">{redCorner}</div>

                <div
                  className="hero-back-stat-pill"
                  style={{
                    borderColor: `${RED_ACCENT}66`,
                    background: `linear-gradient(90deg, ${RED_ACCENT}22 0%, rgba(0,0,0,0.45) 55%, transparent 100%)`,
                  }}
                >
                  <span className="hero-stat-k">W</span> {redStats.wins}
                  <span className="hero-stat-dot">•</span>
                  <span className="hero-stat-k">L</span> {redStats.losses}
                  <span className="hero-stat-dot">•</span>
                  <span className="hero-stat-k">D</span> {redStats.draws}
                </div>
              </div>

              {/* CENTER */}
              <div className="hero-back-center">
                <div
                  className="hero-back-pill"
                  style={{
                    borderColor: "rgba(245, 158, 11, 0.5)",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  MAIN EVENT
                </div>

                <div className="hero-back-vs">VS</div>

                {coMain?.redName && coMain?.blueName && (
                  <div className="hero-back-comain-line">
                    <span className="hero-back-label">CO-MAIN</span>
                    <div className="hero-back-comain-fighters">
                      <span className="hero-back-comain-fighter-name">{coMain.redName}</span>
                      <span className="hero-back-comain-vs">VS</span>
                      <span className="hero-back-comain-fighter-name">{coMain.blueName}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT fighter */}
              <div className="hero-back-fighter blue">
                {blueImgSrc ? (
                  <img
                    src={blueImgSrc}
                    alt={blueCorner}
                    className="hero-back-fighter-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="hero-back-placeholder" />
                )}

                <div className="hero-back-name">{blueCorner}</div>

                <div
                  className="hero-back-stat-pill"
                  style={{
                    borderColor: `${BLUE_ACCENT}66`,
                    background: `linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.45) 45%, ${BLUE_ACCENT}22 100%)`,
                  }}
                >
                  <span className="hero-stat-k">W</span> {blueStats.wins}
                  <span className="hero-stat-dot">•</span>
                  <span className="hero-stat-k">L</span> {blueStats.losses}
                  <span className="hero-stat-dot">•</span>
                  <span className="hero-stat-k">D</span> {blueStats.draws}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </Link>
  );
}

// --- UPCOMING EVENTS ---

function UpcomingEvents({ events }: { events: UfcEvent[] }) {
  const formatShortDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        month: "short",
        day: "numeric",
      };
      return date.toLocaleDateString("en-US", options);
    } catch {
      return dateString;
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-300">
          Upcoming Events
        </h2>
        <Link
          to="/events"
          className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-600 hover:text-red-500 transition-colors"
        >
          View all
        </Link>
      </div>

      {/* 🔻 Upcoming section highlight line */}
      <div className="h-px w-full bg-gradient-to-r from-[#dc2626] via-[#ea580c] via-zinc-700/70 to-transparent" />

      <div className="grid gap-4 sm:grid-cols-3">
        {events.map((e) => (
          <Link
            key={e.ufcId}
            to={`/events/${e.ufcId}`}
            className="
              group relative flex flex-col
              rounded-2xl bg-transparent p-5
              overflow-hidden
              transition-all duration-300
              hover:-translate-y-0.5
            "
          >
            {/* 🔥 Border draw + glow SVG overlay */}
            <svg
              className="pointer-events-none absolute inset-0"
              width="100%"
              height="100%"
            >
              <defs>
                {/* Hero section ile aynı gradient (Next renkleri) */}
                <linearGradient
                  id={`upcomingGradient-${e.ufcId}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#dc2626" />
                  <stop offset="50%" stopColor="#ea580c" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
                <filter id={`cardBorderGlow-${e.ufcId}`}>
                  <feGaussianBlur
                    in="SourceGraphic"
                    stdDeviation="3"
                    result="blur"
                  />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Ana gradient çizgi */}
              <rect
                className="card-border-path"
                x="0.5"
                y="0.5"
                width="calc(100% - 1px)"
                height="calc(100% - 1px)"
                rx="16"
                ry="16"
                pathLength={1}
                fill="none"
                stroke={`url(#upcomingGradient-${e.ufcId})`}
                style={{
                  strokeWidth: 2,
                  strokeDasharray: 1,
                  strokeDashoffset: 1,
                }}
              />

              {/* Parlak uç (glow) – gradient ile uyumlu */}
              <rect
                className="card-border-glow-path"
                x="0.5"
                y="0.5"
                width="calc(100% - 1px)"
                height="calc(100% - 1px)"
                rx="16"
                ry="16"
                pathLength={1}
                fill="none"
                stroke={`url(#upcomingGradient-${e.ufcId})`}
                style={{
                  strokeWidth: 4,
                  strokeDasharray: "0.12 1",
                  strokeDashoffset: 1,
                  strokeLinecap: "round",
                  opacity: 0,
                  filter: `url(#cardBorderGlow-${e.ufcId})`,
                }}
              />
            </svg>

            <span className="relative z-10 text-[10px] uppercase tracking-[0.22em] text-red-600 font-semibold">
              {formatShortDate(e.date)}
            </span>
            <h3 className="relative z-10 mt-3 text-base font-bold text-white transition-colors duration-300 line-clamp-2 group-hover:text-red-600">
              {e.name}
            </h3>
            {e.subtitle && (
              <p className="relative z-10 mt-2 text-xs text-slate-400 line-clamp-1">
                {e.subtitle}
              </p>
            )}
          </Link>
        ))}
      </div>

    </section>
  );
}

// --- CHAMPIONS ROW WITH ENHANCED EFFECTS ---

function ChampionsRow({
  champions,
}: {
  champions: {
    division: string;
    champion: string;
    imageUrl?: string;
    externalId?: string;
  }[];
}) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollTimeoutRef =
    React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkScrollPosition = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const tolerance = 5;

    if (scrollWidth === 0 || clientWidth === 0) {
      setTimeout(() => checkScrollPosition(), 50);
      return;
    }

    const canScrollRight = scrollLeft < scrollWidth - clientWidth - tolerance;
    const canScrollLeft = scrollLeft > tolerance;

    setShowLeftArrow(canScrollLeft);
    setShowRightArrow(canScrollRight);
  }, []);

  const handleScroll = React.useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      checkScrollPosition();
    }, 10);
  }, [checkScrollPosition]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const timeoutId = setTimeout(() => {
        checkScrollPosition();
      }, 100);

      container.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", checkScrollPosition);

      const resizeObserver = new ResizeObserver(() => {
        checkScrollPosition();
      });
      resizeObserver.observe(container);

      return () => {
        clearTimeout(timeoutId);
        container.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", checkScrollPosition);
        resizeObserver.disconnect();
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, [champions, checkScrollPosition, handleScroll]);

  const scrollLeft = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cards = Array.from(container.children) as HTMLElement[];
    if (cards.length === 0) return;

    const firstCard = cards[0];
    if (!firstCard) return;

    const cardWidth = firstCard.offsetWidth;
    const gap = 8;
    const scrollAmount = cardWidth + gap;

    container.scrollBy({
      left: -scrollAmount,
      behavior: "smooth",
    });
  }, []);

  const scrollRight = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cards = Array.from(container.children) as HTMLElement[];
    if (cards.length === 0) return;

    const firstCard = cards[0];
    if (!firstCard) return;

    const cardWidth = firstCard.offsetWidth;
    const gap = 8;
    const scrollAmount = cardWidth + gap;

    container.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-300">
          Champions
        </h2>
        <Link
          to="/rankings"
          className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-500 hover:text-amber-400 transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-amber-500 via-zinc-700/70 to-transparent opacity-70 champion-glow-line" />

      <div className="relative flex items-center">
        <div
          ref={scrollContainerRef}
          className="flex w-full gap-2 overflow-x-auto pb-1 scrollbar-hide champions-scroll-container"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {champions.map((c, index) => (
            <ChampionCard key={c.division} champion={c} index={index} />
          ))}
        </div>

        {showLeftArrow && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 z-10 flex h-8 w-8 -translate-x-10 items-center justify-center rounded-full bg-black/80 active:scale-95"
            aria-label="Scroll left"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
        )}

        {showRightArrow && (
          <button
            onClick={scrollRight}
            className="absolute right-0 z-10 flex h-8 w-8 translate-x-10 items-center justify-center rounded-full bg-black/80 active:scale-95"
            aria-label="Scroll right"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        )}
      </div>

    </section>
  );
}

// --- CHAMPION CARD COMPONENT WITH ADVANCED EFFECTS ---

function ChampionCard({
  champion,
  index,
}: {
  champion: {
    division: string;
    champion: string;
    imageUrl?: string;
    externalId?: string;
  };
  index: number;
}) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0.5, y: 0.5 });
  };

  const tiltX = (mousePos.y - 0.5) * -10;
  const tiltY = (mousePos.x - 0.5) * 10;

  return (
        <Link
      to={champion.externalId ? `/fighters/${champion.externalId}` : "/fighters"}
      className="champion-card-wrapper"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div
        ref={cardRef}
        className="champion-card group"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
        }}
      >
        <div className="champion-border" />

        <div className="champion-spotlight" />

        <div className="champion-image-container">
          {champion.imageUrl ? (
            <img
              src={champion.imageUrl}
              alt={champion.champion}
              className="champion-image"
                />
              ) : (
            <div className="champion-placeholder">
                  <span className="text-lg font-semibold text-slate-200">
                {getInitials(champion.champion)}
                  </span>
                </div>
              )}

          <div className="champion-belt-shine" />
        </div>

        <div className="champion-info">
          <p className="champion-division">{champion.division}</p>
          <p className="champion-name">
            <span className="champion-name-text">{champion.champion}</span>
                </p>
              </div>
            </div>

          </Link>
  );
}

// İsimden baş harf üretmek için
function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}
