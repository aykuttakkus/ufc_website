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

        // Featured Event - İlk upcoming event (sadece ilk yüklemede set et, sabit kal)
        if (eventsData.length > 0 && !featuredEvent) {
          const firstEvent = eventsData[0];
          // Eğer fight card detayları yoksa çek
          if (!firstEvent.fights || firstEvent.fights.length === 0) {
            try {
              const eventDetail = await fetchEventDetail(firstEvent.ufcId);
              setFeaturedEvent(eventDetail);
            } catch {
              // Detay yüklenemezse sadece temel bilgileri kullan
              setFeaturedEvent(firstEvent);
            }
          } else {
            setFeaturedEvent(firstEvent);
          }
        }

        // Past Event - İlk past event (sadece ilk yüklemede set et, sabit kal)
        if (pastEventsData.length > 0 && !pastEvent) {
          const firstPastEvent = pastEventsData[0];
          // Eğer fight card detayları yoksa çek
          if (!firstPastEvent.fights || firstPastEvent.fights.length === 0) {
            try {
              const eventDetail = await fetchEventDetail(firstPastEvent.ufcId);
              setPastEvent(eventDetail);
            } catch {
              // Detay yüklenemezse sadece temel bilgileri kullan
              setPastEvent(firstPastEvent);
            }
          } else {
            setPastEvent(firstPastEvent);
          }
        }

        // Upcoming Events - İlk 3 event (featured hariç)
        setUpcomingEvents(eventsData.slice(1, 4));

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
      } catch (err: any) {
        console.error("[HomePage] Error loading data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <section className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-12 min-h-[60vh]">
          <div className="text-slate-400">Loading...</div>
        </div>
      </section>
    );
  }

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
    <section className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        {/* HERO – FEATURED EVENT & PAST EVENT */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {featuredEvent && <HeroSection event={featuredEvent} isNext={true} />}
          {pastEvent && <HeroSection event={pastEvent} isNext={false} />}
        </div>

        {/* UPCOMING EVENTS */}
        {upcomingEvents.length > 0 && <UpcomingEvents events={upcomingEvents} />}

        {/* CHAMPIONS ROW */}
        {champions.length > 0 && <ChampionsRow champions={champions} />}
      </div>
    </section>
  );
}

// --- HERO SECTION (NO GLOW, NO CORNER LABELS, PURE BLACK, CLEAN VS) ---

function HeroSection({ event, isNext }: { event: UfcEvent; isNext: boolean }) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = React.useState(false);

  // Main card fights
  const mainCardFights =
    event.fights?.filter((f) => f.cardSection === "Main Card").slice(0, 2) ||
    [];

  // Main event fighters
  const mainEvent = mainCardFights[0];
  const redCorner = mainEvent?.redName || "";
  const blueCorner = mainEvent?.blueName || "";

  // 🔹 Burada event görsellerini normalize ediyoruz (proxy yok)
  const redImgSrc = normalizeImageUrl(mainEvent?.redImageUrl);
  const blueImgSrc = normalizeImageUrl(mainEvent?.blueImageUrl);

  // Event tag
  const getEventTag = () => {
    if (event.type) return event.type;
    if (event.name.includes("UFC")) {
      const match = event.name.match(/UFC\s*(\d+)/i);
      if (match) return isNext ? "Numbered Event" : "Fight Night";
    }
    return isNext ? "Upcoming Event" : "Past Event";
  };

  // 3D tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0.5, y: 0.5 });
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  // Calculate transforms
  const tiltX = (mousePos.y - 0.5) * -8;
  const tiltY = (mousePos.x - 0.5) * 8;

  // Color scheme based on event type
  const colorScheme = isNext
    ? {
        primary: "#dc2626", // red
        secondary: "#ea580c", // orange
        badgeBg: "bg-red-700/30",
        badgeText: "text-red-500",
      }
    : {
        primary: "#3b82f6", // blue
        secondary: "#8b5cf6", // purple
        badgeBg: "bg-blue-700/30",
        badgeText: "text-blue-400",
      };

  return (
    <Link
      to={event.ufcId ? `/events/${event.ufcId}` : "/events"}
      className={`hero-card-wrapper ${isNext ? "hero-next" : "hero-past"}`}
    >
      <div
        ref={cardRef}
        className="hero-card"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        style={{
          transform: `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
        }}
      >
        {/* Animated SVG Border (sadece border draw, glow yok) */}
        <svg className="hero-border-svg" width="100%" height="100%">
          <defs>
            <linearGradient
              id={`heroGradient-${event.ufcId}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={colorScheme.primary} />
              <stop offset="50%" stopColor={colorScheme.secondary} />
              <stop offset="100%" stopColor={colorScheme.primary} />
            </linearGradient>
          </defs>

          {/* Main border path */}
          <rect
            className="hero-border-path"
            x="1"
            y="1"
            width="calc(100% - 2px)"
            height="calc(100% - 2px)"
            rx="24"
            ry="24"
            pathLength={1}
            fill="none"
            stroke={`url(#heroGradient-${event.ufcId})`}
            strokeWidth="2"
          />
        </svg>

        {/* Background noise layer (glow yok, sadece texture) */}
        <div className={`hero-bg-noise ${isHovered ? "active" : ""}`} />

        {/* Content wrapper */}
        <div className="hero-content">
          {/* Event Info Header */}
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

              {/* Date badge */}
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

            {/* NEXT kartında subtitle yok (tarih satırı burada geliyordu) */}
            {event.subtitle && !isNext && (
              <p className="hero-subtitle">{event.subtitle}</p>
            )}
          </div>

          {/* Fighters Section */}
          {mainEvent && (
            <div className="hero-fighters-container">
              {/* Red Corner Fighter */}
              <div className="hero-fighter-wrapper left">
                <div className="hero-fighter-card red">
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

              {/* VS – sadece text, çerçeve yok */}
              <div className="hero-vs-badge-wrapper">
                <span className="hero-vs-text">VS</span>
              </div>

              {/* Blue Corner Fighter */}
              <div className="hero-fighter-wrapper right">
                <div className="hero-fighter-card blue">
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

          {/* VIEW EVENT DETAILS tamamen kaldırıldı */}
        </div>
      </div>

      {/* Styles */}
      <style>{`
        /* WRAPPER */
        .hero-card-wrapper {
          display: block;
          position: relative;
          width: 100%;
        }

        /* MAIN CARD – FULL BLACK */
        .hero-card {
          position: relative;
          min-height: 440px;
          border-radius: 1.5rem;
          background: #000000;
          overflow: hidden;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.05);
        }

        .hero-card:hover {
          box-shadow: 
            0 30px 80px rgba(0, 0, 0, 0.8),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        /* SVG BORDER */
        .hero-border-svg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 5;
        }

        .hero-border-path {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
        }

        .hero-card:hover .hero-border-path {
          animation: heroBorderDraw 2s ease-out forwards;
        }

        @keyframes heroBorderDraw {
          to {
            stroke-dashoffset: 0;
          }
        }

        /* BACKGROUND NOISE */
        .hero-bg-noise {
          position: absolute;
          inset: 0;
          background-image:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255, 255, 255, 0.03) 2px,
              rgba(255, 255, 255, 0.03) 4px
            );
          opacity: 0;
          transition: opacity 0.5s ease;
          pointer-events: none;
        }

        .hero-bg-noise.active {
          opacity: 0.3;
          animation: heroNoiseScroll 20s linear infinite;
        }

        @keyframes heroNoiseScroll {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(100px);
          }
        }

        /* CONTENT WRAPPER */
        .hero-content {
          position: relative;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 2rem;
          z-index: 10;
        }

        /* HEADER */
        .hero-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .hero-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: all 0.3s ease;
        }

        .hero-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: heroBadgePulse 2s ease-in-out infinite;
        }

        @keyframes heroBadgePulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
        }

        .hero-date-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.9rem;
          border-radius: 9999px;
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.8);
        }

        .hero-title {
          position: relative;
          font-size: 2.4rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: white;
          line-height: 1.2;
        }

        @media (min-width: 640px) {
          .hero-title {
            font-size: 3rem;
          }
        }

        .hero-title-text {
          position: relative;
          display: inline-block;
        }

        .hero-title-text::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 3px;
          background: linear-gradient(90deg, #dc2626, #ea580c);
          transition: width 0.6s ease;
        }

        .hero-past .hero-title-text::after {
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        }

        .hero-card:hover .hero-title-text::after {
          width: 100%;
        }

        .hero-subtitle {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 0.03em;
        }

        /* FIGHTERS CONTAINER */
        .hero-fighters-container {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 1.5rem;
          align-items: center;
          flex: 1;
        }

        @media (max-width: 640px) {
          .hero-fighters-container {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        .hero-fighter-wrapper {
          display: flex;
        }

        .hero-fighter-wrapper.left {
          justify-content: flex-end;
        }

        .hero-fighter-wrapper.right {
          justify-content: flex-start;
        }

        .hero-fighter-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hero-card:hover .hero-fighter-card {
          transform: translateY(-8px);
        }

        /* FIGHTER IMAGE CONTAINER */
        .hero-fighter-image-container {
          position: relative;
          width: 160px;
          height: 160px;
          border-radius: 1rem;
          overflow: hidden;
          background: #000000;
          transition: all 0.5s ease;
        }

        @media (min-width: 640px) {
          .hero-fighter-image-container {
            width: 200px;
            height: 200px;
          }
        }

        .hero-card:hover .hero-fighter-image-container {
          transform: scale(1.08);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
        }

        .hero-fighter-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top;
          transition: all 0.5s ease;
          filter: brightness(0.9) contrast(1.1);
        }

        .hero-card:hover .hero-fighter-image {
          filter: brightness(1.05) contrast(1.15);
        }

        .hero-fighter-info {
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 0.7rem;
        }

        .hero-fighter-name {
          display: block;
          color: white;
          font-weight: 700;
          font-size: 0.85rem;
        }

        /* VS – sadece text, çerçevesiz */
        .hero-vs-badge-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-vs-text {
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 0.2em;
          color: white;
        }

        /* RESPONSIVE TWEAKS */
        @media (max-width: 640px) {
          .hero-content {
            padding: 1.5rem;
          }
          .hero-card {
            min-height: 480px;
          }
          .hero-title {
            font-size: 2rem;
          }
        }
      `}</style>
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
          className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-600 hover:text-red-600"
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

      <style>{`
        @keyframes drawBorder {
          from {
            stroke-dashoffset: 1;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes glowPulse {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }

        .group:hover .card-border-path {
          animation: drawBorder 1.8s ease-in-out forwards;
        }

        .group:hover .card-border-glow-path {
          animation:
            drawBorder 1.8s ease-in-out forwards,
            glowPulse 1s ease-in-out infinite;
          opacity: 0.8;
        }
      `}</style>
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
      <h2 className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-300">
        Champions
      </h2>

      <div className="h-px w-full bg-gradient-to-r from-amber-500 via-zinc-700/70 to-transparent opacity-70 champion-glow-line" />

      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-8 flex items-center justify-center">
          {showLeftArrow && (
            <button
              onClick={scrollLeft}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/80 active:scale-95"
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
        </div>

        <div
          ref={scrollContainerRef}
          className="flex flex-1 gap-2 overflow-x-auto pb-1 scrollbar-hide champions-scroll-container"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {champions.map((c, index) => (
            <ChampionCard key={c.division} champion={c} index={index} />
          ))}
        </div>

        <div className="flex-shrink-0 w-8 flex items-center justify-center">
          {showRightArrow && (
            <button
              onClick={scrollRight}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/80 active:scale-95"
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
      </div>

      <style>{`
        @keyframes championGlowPulse {
          0%, 100% {
            opacity: 0.7;
            filter: drop-shadow(0 0 2px #f59e0b);
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 8px #f59e0b);
          }
        }

        .champion-glow-line {
          animation: championGlowPulse 3s ease-in-out infinite;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
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
  const glowX = mousePos.x * 100;
  const glowY = mousePos.y * 100;

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

        <div
          className="champion-glow"
          style={{
            background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(245, 158, 11, 0.3) 0%, transparent 70%)`,
          }}
        />

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

      <style>{`
        .champions-scroll-container {
          scroll-snap-type: x mandatory;
          scroll-padding: 0 8px;
        }

        .champion-card-wrapper {
          display: block;
          flex-shrink: 0;
          width: calc((100% - 32px) / 5);
          min-width: 150px;
          max-width: 200px;
          scroll-snap-align: start;
          scroll-snap-stop: always;
          animation: championFadeIn 0.6s ease-out forwards;
          opacity: 0;
        }

        @media (max-width: 768px) {
          .champion-card-wrapper {
            width: calc((100% - 16px) / 3);
            min-width: 140px;
          }
        }

        @media (min-width: 1024px) {
          .champion-card-wrapper {
            width: calc((100% - 32px) / 5);
          }
        }

        @keyframes championFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .champion-card {
          position: relative;
          overflow: hidden;
          border-radius: 1rem;
          background: transparent;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }

        .champion-card:hover {
          background: transparent;
          box-shadow: 
            0 20px 40px rgba(245, 158, 11, 0.15),
            0 0 60px rgba(245, 158, 11, 0.1),
            inset 0 0 20px rgba(245, 158, 11, 0.05);
        }

        .champion-border {
          position: absolute;
          inset: 0;
          border-radius: 1rem;
          padding: 2px;
          background: linear-gradient(
            45deg,
            transparent,
            transparent,
            #f59e0b,
            transparent,
            transparent
          );
          background-size: 300% 300%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        .champion-card:hover .champion-border {
          opacity: 1;
          animation: championBorderRotate 3s linear infinite;
        }

        @keyframes championBorderRotate {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .champion-glow {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          border-radius: 1rem;
        }

        .champion-card:hover .champion-glow {
          opacity: 1;
        }

        .champion-spotlight {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            to bottom,
            rgba(245, 158, 11, 0.2) 0%,
            transparent 50%
          );
          opacity: 0;
          transition: all 0.6s ease;
          pointer-events: none;
          animation: championSpotlight 8s ease-in-out infinite;
        }

        .champion-card:hover .champion-spotlight {
          opacity: 1;
        }

        @keyframes championSpotlight {
          0%, 100% {
            transform: translateY(-10%) rotate(0deg);
          }
          50% {
            transform: translateY(10%) rotate(5deg);
          }
        }

        .champion-image-container {
          position: relative;
          display: flex;
          height: 10rem;
          width: 100%;
          align-items: end;
          justify-content: center;
          overflow: hidden;
          background: transparent;
        }

        .champion-image {
          height: 100%;
          width: 100%;
          object-fit: contain;
          object-position: bottom;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          filter: brightness(0.95) contrast(1.05);
        }

        .champion-card:hover .champion-image {
          transform: scale(1.08) rotate(2deg);
          filter: brightness(1.1) contrast(1.1) saturate(1.2);
        }

        .champion-placeholder {
          display: flex;
          height: 100%;
          width: 100%;
          align-items: center;
          justify-content: center;
          background: transparent;
        }

        .champion-belt-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          transform: skewX(-20deg);
          opacity: 0;
        }

        .champion-card:hover .champion-belt-shine {
          animation: championShine 1.5s ease-in-out;
        }

        @keyframes championShine {
          0% {
            left: -100%;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            left: 200%;
            opacity: 0;
          }
        }

        .champion-info {
          position: relative;
          padding: 0.75rem 1rem;
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          z-index: 10;
        }

        .champion-division {
          font-size: 0.625rem;
          color: #f59e0b;
          font-weight: 600;
          letter-spacing: 0.1em;
          margin-bottom: 0.25rem;
        }

        .champion-name {
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .champion-card:hover .champion-name {
          color: #f59e0b;
        }

        .champion-name-text {
          position: relative;
          display: inline-block;
        }

        .champion-name-text::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.6),
            transparent
          );
          opacity: 0;
        }

        .champion-card:hover .champion-name-text::after {
          animation: championTextShine 1.2s ease-in-out 0.3s;
        }

        @keyframes championTextShine {
          0% {
            left: -100%;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            left: 200%;
            opacity: 0;
          }
        }
      `}</style>
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