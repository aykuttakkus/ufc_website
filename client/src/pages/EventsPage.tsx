// src/pages/EventsPage.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { UfcEvent, Fighter } from "../types";
import { getUpcomingEvents, getPastEvents } from "../api/eventsApi";
import { api } from "../api/http";
import { Link } from "react-router-dom";
import nonameImg from "../assets/noname.avif";

type Tab = "upcoming" | "past";

const PAGE_CLASS = "min-h-screen bg-black text-white px-6 py-10";
const CENTER_CLASS = `${PAGE_CLASS} flex flex-col items-center justify-center text-center`;

// FightersPage'teki ile AYNI tabClass
const tabClass = (active: boolean) =>
  `cursor-pointer text-lg sm:text-2xl font-black uppercase tracking-[0.3em] transition-colors ${
    active ? "text-white" : "text-zinc-600"
  }`;

// Tarih format helper
type FormattedDate = {
  day: string;
  month: string;
  weekday: string;
};

function formatEventDate(dateInput: string | Date): FormattedDate {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  if (Number.isNaN(d.getTime())) {
    return {
      day: "",
      month: "",
      weekday: "",
    };
  }

  const day = d.getUTCDate().toString().padStart(2, "0");
  const month = d.toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  const weekday = d.toLocaleString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });

  return { day, month, weekday };
}

// "Gaethje vs Pimblett" → { left: "Gaethje", right: "Pimblett" }
function parseMainEventNames(eventName: string): { left?: string; right?: string } {
  const parts = eventName.split(/vs/i);
  if (parts.length < 2) return {};

  const leftRaw = parts[0];
  const rightRaw = parts[1];

  const clean = (s: string) =>
    s
      .replace(/\d+/, "")
      .replace(/UFC\s*\d+/i, "")
      .replace(/Fight\s*Night/i, "")
      .replace(/[–\-:]/g, "")
      .trim();

  const left = clean(leftRaw);
  const right = clean(rightRaw);

  if (!left || !right) return {};
  return { left, right };
}

// 🧠 Fighters listesinde isme göre eşleşen dövüşçü
// Daha akıllı: önce kelime bazlı exact match, sonra startsWith, en son includes
function findFighterByNameFragment(
  fighters: Fighter[],
  fragment: string
): Fighter | undefined {
  const lower = fragment.toLowerCase();

  // 1) Herhangi bir kelime tam eşit mi?
  const exact = fighters.find((f) =>
    f.name
      .toLowerCase()
      .split(/\s+/)
      .some((w) => w === lower)
  );
  if (exact) return exact;

  // 2) Herhangi bir kelime fragment ile başlıyor mu?
  const starts = fighters.find((f) =>
    f.name
      .toLowerCase()
      .split(/\s+/)
      .some((w) => w.startsWith(lower))
  );
  if (starts) return starts;

  // 3) En son çare: includes (eski davranış)
  return fighters.find((f) => f.name.toLowerCase().includes(lower));
}

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const initialTab: Tab = tabParam === "past" ? "past" : "upcoming";
  
  const [tab, setTab] = useState<Tab>(initialTab);
  const [events, setEvents] = useState<UfcEvent[]>([]);
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [fightersLoading, setFightersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL'deki tab parametresini senkronize et
  useEffect(() => {
    if (tabParam && (tabParam === "upcoming" || tabParam === "past") && tabParam !== tab) {
      setTab(tabParam);
    }
  }, [tabParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tab değiştiğinde URL'yi güncelle
  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Events (upcoming/past) - localStorage'dan oku (portfolio için sabit kalacak)
  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // localStorage key'leri
        const UPCOMING_STORAGE_KEY = "ufc_portfolio_events_page_upcoming";
        const PAST_STORAGE_KEY = "ufc_portfolio_events_page_past";
        const storageKey = tab === "upcoming" ? UPCOMING_STORAGE_KEY : PAST_STORAGE_KEY;
        
        // localStorage'dan oku
        const storedEvents = localStorage.getItem(storageKey);
        
        if (storedEvents) {
          // localStorage'da varsa oradan kullan (API'den çekme)
          try {
            const parsed = JSON.parse(storedEvents);
            if (!active) return;
            setEvents(parsed);
          } catch {
            // Parse hatası varsa localStorage'ı temizle
            localStorage.removeItem(storageKey);
            if (!active) return;
            setEvents([]);
          }
        } else {
          // localStorage'da yoksa API'den çek ve kaydet (sadece ilk sefer)
          const data =
            tab === "upcoming" ? await getUpcomingEvents() : await getPastEvents();
          if (!active) return;
          setEvents(data);
          // localStorage'a kaydet (portfolio için kalıcı)
          localStorage.setItem(storageKey, JSON.stringify(data));
        }
      } catch (err) {
        console.error("GET events error:", err);
        if (!active) return;
        setError("Event verileri yüklenirken bir hata oluştu.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [tab]);

  // Fighters (ana maç görselleri için)
  useEffect(() => {
    let active = true;

    const loadFighters = async () => {
      try {
        setFightersLoading(true);
        const res = await api.get("/fighters");
        if (!active) return;
        setFighters(res.data.data || []);
      } catch (err) {
        console.error("GET /fighters for events main card error:", err);
      } finally {
        if (active) setFightersLoading(false);
      }
    };

    loadFighters();

    return () => {
      active = false;
    };
  }, []);

  // Loading / Error / Empty
  if (loading) {
    return (
      <div className={CENTER_CLASS}>
        <p className="text-slate-300">Event verileri yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={CENTER_CLASS}>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={CENTER_CLASS}>
        <p className="text-slate-300 text-sm max-w-md">
          Şu anda listelenecek {tab === "upcoming" ? "yaklaşan" : "geçmiş"} event
          bulunmuyor.
        </p>
      </div>
    );
  }

  const visibleCount = events.length;

  return (
    <section className={PAGE_CLASS}>
      <main className="mx-auto max-w-6xl">
        {/* TOP BAR: UPCOMING / PAST – Fighters ALL/WOMEN/MEN ile aynı stil */}
        <section className="mt-24 mb-24 flex flex-col items-center gap-24">
          {/* Tabs */}
          <div className="flex items-center justify-center gap-12">
                <button
                  type="button"
                  className={tabClass(tab === "upcoming")}
                  onClick={() => handleTabChange("upcoming")}
                >
                  UPCOMING
                </button>
                <button
                  type="button"
                  className={tabClass(tab === "past")}
                  onClick={() => handleTabChange("past")}
                >
                  PAST
                </button>
          </div>

          {/* Ortada toplam event sayısı */}
          <div className="flex w-full flex-col items-center text-[10px] uppercase tracking-[0.22em] text-slate-400">
            <div className="relative w-full">
              <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center">
                {visibleCount} events
              </p>
            </div>
          </div>
        </section>

        {/* Kartlar ALT ALTA */}
        <section className="mt-8 space-y-5">
          {events.map((ev, index) => (
            <EventCard
              key={ev.ufcId}
              event={ev}
              tab={tab}
              isPrimary={index === 0}
              fighters={fighters}
              fightersLoading={fightersLoading}
            />
          ))}
        </section>
      </main>
    </section>
  );
}

// Tek event kartı
function EventCard({
  event,
  tab,
  isPrimary,
  fighters,
  fightersLoading,
}: {
  event: UfcEvent;
  tab: Tab;
  isPrimary: boolean;
  fighters: Fighter[];
  fightersLoading: boolean;
}) {
  const { day, month, weekday } = formatEventDate(event.date);
  const locationClean = (event.location || "")
    .replace(/\s+\n\s+/g, " ")
    .replace(/\n+/g, ", ")
    .trim();

  const label =
    tab === "upcoming"
      ? isPrimary
        ? "Next"
        : "Upcoming"
      : isPrimary
      ? "Last"
      : "Past";

  const isUpcomingLabel = label.toLowerCase().includes("upcoming");
  const isNextEvent = label.toLowerCase().includes("next");
  const isLastEvent = label.toLowerCase().includes("last");
  const isPastEvent = label.toLowerCase().includes("past");

  const { left: leftName, right: rightName } = parseMainEventNames(event.name);

  const leftFighter =
    leftName && !fightersLoading
      ? findFighterByNameFragment(fighters, leftName)
      : undefined;

  const rightFighter =
    rightName && !fightersLoading
      ? findFighterByNameFragment(fighters, rightName)
      : undefined;

  const leftImg = leftFighter?.imageUrl;
  const rightImg = rightFighter?.imageUrl;

  const dateLine =
    day && month && weekday ? `${weekday}, ${month} ${day}` : "";

  return (
    <Link
      to={`/events/${event.ufcId}`}
      className="
        group flex items-center gap-6
        px-5 py-4
        transition
      "
    >
      {/* Sol küçük label */}
      <div className="hidden shrink-0 flex-col items-start justify-center pr-4 sm:flex sm:w-32">
        <span
          className={`text-[0.7rem] font-semibold uppercase tracking-[0.28em] ${
            isUpcomingLabel || isNextEvent || isLastEvent || isPastEvent
              ? "text-red-600"
              : "text-slate-300"
          }`}
        >
          {label}
        </span>

        {(isUpcomingLabel || isNextEvent || isLastEvent || isPastEvent) && (
          <>
            <div className="mt-1 h-[2px] w-8 bg-red-500" />
            <span className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-200">
              Event
            </span>
          </>
        )}

        {!isUpcomingLabel &&
          !isNextEvent &&
          !isLastEvent &&
          !isPastEvent && (
            <span className="mt-2 text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-slate-200">
              {event.type || "Event"}
            </span>
          )}
      </div>

      {/* Orta: iki ana dövüşçü görseli */}
      {leftName && rightName && (
        <div className="flex flex-1 items-stretch justify-center gap-6">
          {/* Sol dövüşçü */}
          <div className="flex w-28 sm:w-36 flex-col items-center text-center">
            <div className="flex h-32 w-full items-start justify-center bg-black overflow-hidden">
              {leftImg ? (
                <img
                  src={leftImg}
                  alt={leftName}
                  className="
                    h-full w-full
                    object-cover object-top
                    transition-transform duration-300
                    group-hover:scale-[1.04]
                  "
                />
              ) : (
                <img
                  src={nonameImg}
                  alt="Unknown fighter"
                  className="
                    h-full w-full
                    object-cover
                    object-[center_25%]
                    opacity-80
                    transition-transform duration-300
                    group-hover:scale-[1.04]
                  "
                />
              )}
            </div>

            {/* İSİM: sabit yükseklik + 2 satır clamp */}
            <span
              className="
                event-text-wipe event-fighter-name
                mt-3
                text-[0.8rem] font-semibold uppercase
                tracking-[0.24em] text-slate-200
              "
            >
              {leftFighter?.name ?? leftName}
            </span>
          </div>

          {/* VS – her zaman ortada */}
          <span className="self-center text-sm font-bold uppercase tracking-[0.32em] text-slate-500">
            VS
          </span>

          {/* Sağ dövüşçü */}
          <div className="flex w-28 sm:w-36 flex-col items-center text-center">
            <div className="flex h-32 w-full items-start justify-center bg-black overflow-hidden">
              {rightImg ? (
                <img
                  src={rightImg}
                  alt={rightName}
                  className="
                    h-full w-full
                    object-cover object-top
                    transition-transform duration-300
                    group-hover:scale-[1.04]
                  "
                />
              ) : (
                <img
                  src={nonameImg}
                  alt="Unknown fighter"
                  className="
                    h-full w-full
                    object-cover
                    object-[center_25%]
                    opacity-80
                    transition-transform duration-300
                    group-hover:scale-[1.04]
                  "
                />
              )}
            </div>

            <span
              className="
                event-text-wipe event-fighter-name
                mt-3
                text-[0.8rem] font-semibold uppercase
                tracking-[0.24em] text-slate-200
              "
            >
              {rightFighter?.name ?? rightName}
            </span>
          </div>
        </div>
      )}

      {/* Sağ: başlık + tarih + lokasyon */}
      <div className="flex w-full max-w-xs flex-col items-start gap-1 sm:w-64">
        <h2 className="event-text-wipe line-clamp-2 text-lg font-bold uppercase tracking-[0.22em] text-white">
          {event.name}
        </h2>

        {dateLine && (
          <p className="event-text-wipe mt-1 text-[0.8rem] font-semibold uppercase tracking-[0.22em] text-slate-300">
            {dateLine}
          </p>
        )}

        {locationClean && (
          <p className="event-text-wipe line-clamp-2 mt-1 text-xs text-slate-400">
            {locationClean}
          </p>
        )}
      </div>
    </Link>
  );
}























