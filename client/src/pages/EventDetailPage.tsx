// client/src/pages/EventDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../index.css"; // 🔹 Yeni CSS buradan geliyor

// Backend base URL (gerekirse .env ile VITE_API_BASE_URL tanımlayabilirsin)
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5050";

// 🔹 Frontend tarafı için sadece type tanımları (mongoose YOK)
export type CardSection = "Main Card" | "Prelims" | "Early Prelims" | "Unknown";

export interface EventFight {
  id: string;
  boutOrder: number;
  weightClass?: string;

  redName: string;
  blueName: string;

  redRank?: number;
  blueRank?: number;

  redCountry?: string;
  blueCountry?: string;

  redCountryCode?: string;
  blueCountryCode?: string;

  redOdds?: string;
  blueOdds?: string;

  // DB'den gelecek görseller (fighters koleksiyonundan veya UFC scrape'den)
  redImageUrl?: string;
  blueImageUrl?: string;

  cardSection?: CardSection;
  isPlaceholder?: boolean;

  // 🔥 Past event sonuç bilgileri
  fightBonus?: string; // "Fight of the Night", "Performance of the Night" vb.
  resultRound?: number; // maçın bittiği round
  resultMethod?: string; // "KO/TKO", "Submission", "Decision - Unanimous" vb.
  resultTime?: string; // "5:00", "3:45" vb. - maçın bittiği zaman
  winnerSide?: "red" | "blue" | "draw" | "no-contest"; // kim kazandı
}

export interface UfcEvent {
  _id?: string;
  ufcId: string;
  name: string;
  subtitle?: string;
  date: string; // backend Date → string
  location?: string;
  type?: string;
  isUpcoming: boolean;

  fights?: EventFight[];
  lastDetailsRefreshedAt?: string;

  createdAt?: string;
  updatedAt?: string;
}

// Bölümleri belli bir sırada göstermek için
const SECTION_ORDER: CardSection[] = [
  "Main Card",
  "Prelims",
  "Early Prelims",
  "Unknown",
];

// HTML vs JSON ayrımını düzgün görebilmek için helper
async function safeFetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const text = await res.text();

  let json: any;
  try {
    json = JSON.parse(text);
  } catch (e) {
    console.error(
      "[EventDetailPage] Non-JSON response from API:",
      text.slice(0, 500)
    );
    throw new Error(
      `API non-JSON response (status ${res.status}). Check if the URL is correct and backend is running.`
    );
  }

  return { res, json };
}

// URL'yi normalize et - relative URL'leri tam URL'ye çevir (Safari uyumluluğu)
function normalizeImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  
  // Zaten tam URL ise olduğu gibi dön
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // Relative URL ise base URL ekle
  if (url.startsWith("/")) {
    return `https://www.ufc.com${url}`;
  }
  
  return `https://www.ufc.com/${url}`;
}

// Proxy URL oluştur - CORS sorunlarını bypass etmek için
function getProxiedImageUrl(originalUrl: string | undefined): string | undefined {
  if (!originalUrl) return undefined;
  
  const normalized = normalizeImageUrl(originalUrl);
  if (!normalized) return undefined;
  
  // Eğer UFC URL'i ise proxy üzerinden getir
  if (normalized.includes("ufc.com")) {
    return `${API_BASE}/api/ufc/proxy-image?url=${encodeURIComponent(normalized)}`;
  }
  
  return normalized;
}

const EventDetailPage: React.FC = () => {
  const { ufcId } = useParams<{ ufcId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<UfcEvent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Event detayını API'den çek
  const loadEvent = async () => {
    if (!ufcId) return;

    try {
      setLoading(true);
      setError(null);

      const { res, json } = await safeFetchJson(
        `${API_BASE}/api/ufc/events/${ufcId}`
      );

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load event");
      }

      const eventData = json.data as UfcEvent;
      setEvent(eventData);
    } catch (err: any) {
      console.error("[EventDetailPage] loadEvent error:", err);
      setError(err.message || "Event load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ufcId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center text-slate-300 hover:text-red-600 transition-colors group"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 transition-transform group-hover:-translate-x-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 12H3.75"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 19.5L2.25 12l6-7.5"
              />
            </svg>
          </button>
          <div className="p-6 text-neutral-200">Loading event details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center text-slate-300 hover:text-red-600 transition-colors group"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 transition-transform group-hover:-translate-x-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 12H3.75"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 19.5L2.25 12l6-7.5"
              />
            </svg>
          </button>
          <div className="p-6 text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center text-slate-300 hover:text-red-600 transition-colors group"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 transition-transform group-hover:-translate-x-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 12H3.75"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 19.5L2.25 12l6-7.5"
              />
            </svg>
          </button>
          <div className="p-6 text-neutral-200">Event not found.</div>
        </div>
      </div>
    );
  }

  const fights = event.fights || [];

  // Bölümlere göre grupla
  const groupedBySection = SECTION_ORDER.map((section) => ({
    section,
    fights: fights.filter((f) => (f.cardSection || "Unknown") === section),
  })).filter((g) => g.fights.length > 0);

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Go Back Button */}
        <button
          onClick={() => {
            if (event) {
              // Event durumuna göre doğru tab'a yönlendir
              const tab = event.isUpcoming ? "upcoming" : "past";
              navigate(`/events?tab=${tab}`);
            } else {
              navigate(-1);
            }
          }}
          className="mb-8 flex items-center text-slate-300 hover:text-red-600 transition-colors group"
          aria-label="Go back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6 transition-transform group-hover:-translate-x-1"
          >
            {/* Sap (gövde) */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 12H3.75"
            />
            {/* Ok ucu */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 19.5L2.25 12l6-7.5"
            />
          </svg>
        </button>

        {/* Fight Card */}
        <div className="space-y-6">
          {groupedBySection.map((group) => (
            <div key={group.section}>
              {/* Section Title: Main Card / Prelims vs. */}
              <div className="w-[98%] md:w-[95%] mx-auto mb-4">
                <h2 className="ufc-section-title leading-tight">
                  {group.section}
                </h2>
              </div>

              {/* KARTLAR ARASI MESAFE: space-y-6 */}
              <div className="space-y-6">
                {group.fights.map((fight) => {
                  // Bonus bilgisi var mı? (her zaman gösterilmeli)
                  const hasBonus = !event.isUpcoming && !!fight.fightBonus;

                  // 🔎 Bonus türünü ayrıştır: Fight of the Night / Performance of the Night
                  const bonusText = (fight.fightBonus || "").toLowerCase();
                  const isFightOfNight =
                    bonusText.includes("fight of the night");
                  const isPerformanceNight =
                    bonusText.includes("performance of the night") ||
                    bonusText.includes("performance");

                  // 🏆 Şampiyon kontrolü: Weight class'ta "C" varsa bu bir şampiyonluk maçıdır
                  // UFC'de genellikle şampiyon red corner'da başlar
                  const isChampionshipBout =
                    fight.weightClass?.toUpperCase().includes(" C ") ||
                    fight.weightClass
                      ?.trim()
                      .toUpperCase()
                      .startsWith("C ");
                  const cleanWeightClass =
                    fight.weightClass
                      ?.replace(/^\s*C\s+/i, "")
                      .replace(/\s+C\s+/i, " ")
                      .replace(/\s+C$/i, "")
                      .trim() || fight.weightClass;

                  // Maça başlarken şampiyon olan dövüşçü (genellikle red corner)
                  const isRedChampion = isChampionshipBout;
                  const isBlueChampion = false; // Şampiyon genellikle red corner'da başlar

                  return (
                    <div
                      key={fight.id}
                      className="group bg-black px-8 pt-0 pb-4 w-[98%] md:w-[95%] mx-auto"
                    >
                      {/* Weight class en üst satırda */}
                      {cleanWeightClass && (
                        <div className="ufc-weight-class text-center mb-4">
                          {cleanWeightClass}
                        </div>
                      )}

                      {/* Fight of the Night / Performance of the Night (weight class'ın altında) */}
                      {hasBonus && (isFightOfNight || isPerformanceNight) && (
                        <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
                          {isFightOfNight && (
                            <div className="inline-flex items-center justify-center px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/60 text-amber-300 text-[11px] font-semibold uppercase tracking-wide">
                              Fight of the Night
                            </div>
                          )}
                          {isPerformanceNight && (
                            <div className="inline-flex items-center justify-center px-3 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/50 text-orange-400/90 text-[11px] uppercase tracking-wide">
                              Performance of the Night
                            </div>
                          )}
                        </div>
                      )}

                      {/* Kart içi: sol fighter en solda - orta VS - sağ fighter en sağda */}
                      <div className={`flex items-center justify-between gap-6 ${hasBonus && (isFightOfNight || isPerformanceNight) ? '-mt-16' : ''}`}>
                        {/* Sol fighter (red corner): [IMG + WIN BADGE][COUNTRY][NAME + C] */}
                        <div className="flex flex-col justify-center items-start flex-none w-[280px]">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-start gap-3 justify-center">
                              {fight.redImageUrl && (
                                <div className="w-44 h-40 overflow-hidden rounded-md bg-black flex items-start justify-start relative">
                                  <img
                                    src={getProxiedImageUrl(fight.redImageUrl)}
                                    alt={fight.redName}
                                    className="w-full h-full object-cover object-[center_top] scale-[1.05] origin-top"
                                    referrerPolicy="no-referrer"
                                    loading="lazy"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      // Fallback: parent div'e placeholder göster
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.style.backgroundColor = "#1a1a1a";
                                      }
                                    }}
                                  />
                                  {/* 🔥 Kazanan RED ise: görselin İÇİNDE en sağ altta Win */}
                                  {!event.isUpcoming &&
                                    fight.winnerSide === "red" && (
                                      <div className="absolute bottom-1 right-1 inline-flex items-center justify-center px-3 py-1 rounded-full bg-emerald-500/70 backdrop-blur-sm border border-emerald-300 text-emerald-50 font-semibold text-[11px] uppercase tracking-wide shadow-md cursor-default">
                                        Win
                                      </div>
                                    )}
                                </div>
                              )}

                              {fight.redCountry && (
                                <div className="flex items-center gap-2">
                                  {fight.redCountryCode && (
                                    <img
                                      src={`https://ufc.com/images/flags/${fight.redCountryCode}.PNG`}
                                      alt={fight.redCountry || "Flag"}
                                      className="w-8 h-5 object-cover rounded-sm"
                                      onError={(e) => {
                                        (
                                          e.target as HTMLImageElement
                                        ).style.display = "none";
                                      }}
                                    />
                                  )}
                                  <div className="ufc-country-text text-left">
                                    {fight.redCountry}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* İsim + Şampiyon Rozeti */}
                            <div className="relative flex items-center ml-12">
                              {/* 🏆 Şampiyon badge'i - adın tam başında (absolute position) */}
                              {isRedChampion && (
                                <div className="absolute -left-11 inline-flex items-center justify-center w-9 h-9 rounded-full bg-amber-500/15 border border-amber-300/90 shadow-[0_0_18px_rgba(245,158,11,0.75)] backdrop-blur-sm shrink-0">
                                  <span
                                    className="text-[13px] font-light tracking-tight text-amber-200 leading-none"
                                    style={{
                                      fontFamily:
                                        "'Rajdhani', 'Barlow Condensed', system-ui, -apple-system, sans-serif",
                                    }}
                                  >
                                    C
                                  </span>
                                </div>
                              )}
                              <div className="ufc-fighter-name text-left whitespace-nowrap text-stretch-vertical">
                                {fight.redName}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Orta (sadece VS) */}
                        <div className="flex items-center justify-center flex-1 px-4">
                          <div className="ufc-vs-text">VS</div>
                        </div>

                        {/* Sağ fighter (blue corner): [C + NAME][IMG + WIN BADGE][COUNTRY] */}
                        <div className="flex flex-col justify-center items-end flex-none w-[280px]">
                          <div className="flex items-center gap-4 justify-end">
                            {/* İsim + Şampiyon Rozeti */}
                            <div className="relative flex items-center mr-12">
                              {/* 🏆 Şampiyon badge'i - adın tam başında (absolute position, sağda) */}
                              {isBlueChampion && (
                                <div className="absolute -right-11 inline-flex items-center justify-center w-9 h-9 rounded-full bg-amber-500/15 border border-amber-300/90 shadow-[0_0_18px_rgba(245,158,11,0.75)] backdrop-blur-sm shrink-0">
                                  <span
                                    className="text-[13px] font-light tracking-tight text-amber-200 leading-none"
                                    style={{
                                      fontFamily:
                                        "'Rajdhani', 'Barlow Condensed', system-ui, -apple-system, sans-serif",
                                    }}
                                  >
                                    C
                                  </span>
                                </div>
                              )}
                              <div className="ufc-fighter-name text-right whitespace-nowrap text-stretch-vertical">
                                {fight.blueName}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-3 justify-center">
                              {fight.blueImageUrl && (
                                <div className="w-44 h-40 overflow-hidden rounded-md bg-black flex items-start justify-end relative">
                                  <img
                                    src={getProxiedImageUrl(fight.blueImageUrl)}
                                    alt={fight.blueName}
                                    className="w-full h-full object-cover object-[center_top] scale-[1.05] origin-top"
                                    referrerPolicy="no-referrer"
                                    loading="lazy"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      // Fallback: parent div'e placeholder göster
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.style.backgroundColor = "#1a1a1a";
                                      }
                                    }}
                                  />
                                  {/* 🔥 Kazanan BLUE ise: görselin İÇİNDE en sağ altta Win */}
                                  {!event.isUpcoming &&
                                    fight.winnerSide === "blue" && (
                                      <div className="absolute bottom-1 right-1 inline-flex items-center justify-center px-3 py-1 rounded-full bg-emerald-500/70 backdrop-blur-sm border border-emerald-300 text-emerald-50 font-semibold text-[11px] uppercase tracking-wide shadow-md cursor-default">
                                        Win
                                      </div>
                                    )}
                                </div>
                              )}

                              {fight.blueCountry && (
                                <div className="flex items-center gap-2">
                                  <div className="ufc-country-text text-right">
                                    {fight.blueCountry}
                                  </div>
                                  {fight.blueCountryCode && (
                                    <img
                                      src={`https://ufc.com/images/flags/${fight.blueCountryCode}.PNG`}
                                      alt={fight.blueCountry || "Flag"}
                                      className="w-8 h-5 object-cover rounded-sm"
                                      onError={(e) => {
                                        (
                                          e.target as HTMLImageElement
                                        ).style.display = "none";
                                      }}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 🔥 PAST EVENT SONUÇ BLOĞU – Round / Time / Method (AYRILMIŞ) */}
                      {!event.isUpcoming && (
                        <div className="-mt-8 flex justify-center">
                          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center text-[11px] md:text-xs w-full max-w-[600px] gap-x-4">
                            {/* ROUND - SOLDA */}
                            <div className="flex flex-col items-start justify-center">
                              <span className="uppercase tracking-[0.16em] text-[9px] text-neutral-400">
                                Round
                              </span>
                              <span className="mt-0.5 font-semibold text-neutral-50">
                                {fight.resultRound ?? "-"}
                              </span>
                            </div>

                            {/* Çizgi */}
                            <div className="h-8 w-px bg-neutral-700/60" />

                            {/* TIME - ORTADA */}
                            <div className="flex flex-col items-center justify-center">
                              <span className="uppercase tracking-[0.16em] text-[9px] text-neutral-400">
                                Time
                              </span>
                              <span className="mt-0.5 font-mono font-medium text-neutral-100">
                                {fight.resultTime ?? "-"}
                              </span>
                            </div>

                            {/* Çizgi */}
                            <div className="h-8 w-px bg-neutral-700/60" />

                            {/* METHOD - SAĞDA */}
                            <div className="flex flex-col items-end justify-center">
                              <span className="uppercase tracking-[0.16em] text-[9px] text-neutral-400">
                                Method
                              </span>
                              <span className="mt-0.5 text-[10px] md:text-[11px] font-semibold text-red-600 text-right leading-snug">
                                {fight.resultMethod ?? "-"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 🔹 Her kartın altına ince çizgi */}
                      <div className="mt-4 h-px w-full bg-neutral-800/70" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;