// src/pages/FightersPage.tsx
import { useEffect, useState } from "react";
import { api } from "../api/http";
import type { Fighter } from "../types";
import { Link } from "react-router-dom";

const PAGE_CLASS = "min-h-screen bg-black text-white px-6 py-10";
const CENTER_CLASS = `${PAGE_CLASS} flex flex-col items-center justify-center text-center`;

// Görsel yoksa isimden baş harf üretmek için
function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

// Weight class'tan gender tahmini (Women's Strawweight vs Lightweight)
function getGenderFromWeightClass(weightClass?: string): "MEN" | "WOMEN" {
  const wc = (weightClass || "").toLowerCase();
  if (wc.includes("women")) return "WOMEN";
  return "MEN";
}

export default function FightersPage() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtreler
  const [activeFilter, setActiveFilter] = useState<"ALL" | "MEN" | "WOMEN">(
    "ALL"
  );
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);

    api
      .get("/fighters")
      .then((res) => setFighters(res.data.data))
      .catch((err) => {
        console.error("GET /fighters error:", err);
        setError("Dövüşçüler yüklenirken bir hata oluştu.");
      })
      .finally(() => setLoading(false));
  }, []);


  if (loading) {
    return (
      <div className={CENTER_CLASS}>
        <h1 className="mb-4 text-3xl font-bold tracking-wide">Fighters</h1>
        <p className="text-slate-300">Yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={CENTER_CLASS}>
        <h1 className="mb-4 text-3xl font-bold tracking-wide">Fighters</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (fighters.length === 0) {
    return (
      <div className={CENTER_CLASS}>
        <h1 className="mb-4 text-3xl font-bold tracking-wide">Fighters</h1>
        <p className="max-w-md text-slate-300">
          Şu an listelenecek dövüşçü yok. Backend’den birkaç tane ekleyebilirsin.
        </p>
      </div>
    );
  }

  // ALL / MEN / WOMEN + search filtrelerine göre görünür liste
  const filteredFighters = fighters.filter((f) => {
    const gender = getGenderFromWeightClass(f.weightClass);

    if (activeFilter === "MEN" && gender !== "MEN") return false;
    if (activeFilter === "WOMEN" && gender !== "WOMEN") return false;

    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;

    const name = f.name.toLowerCase();
    const nickname = (f.nickname || "").toLowerCase();
    const wc = (f.weightClass || "").toLowerCase();

    return name.includes(term) || nickname.includes(term) || wc.includes(term);
  });

  const visibleCount = filteredFighters.length;

  // Tab buton class helper
  const tabClass = (active: boolean) =>
    `cursor-pointer text-lg sm:text-2xl font-black uppercase tracking-[0.3em] transition-colors ${
      active ? "text-white" : "text-zinc-600"
    }`;

  return (
    <div className={PAGE_CLASS}>
      <main className="mx-auto max-w-6xl">
        {/* TOP BAR: ALL / WOMEN / MEN + TOTAL + SEARCH */}
        <section className="mt-24 mb-24 flex flex-col items-center gap-24">
          {/* Tabs – sayfanın ortasında, üstten & alttan bol boşluklu */}
          <div className="flex items-center justify-center gap-12">
            <button
              type="button"
              className={tabClass(activeFilter === "ALL")}
              onClick={() => setActiveFilter("ALL")}
            >
              ALL
            </button>
            <button
              type="button"
              className={tabClass(activeFilter === "WOMEN")}
              onClick={() => setActiveFilter("WOMEN")}
            >
              WOMEN
            </button>
            <button
              type="button"
              className={tabClass(activeFilter === "MEN")}
              onClick={() => setActiveFilter("MEN")}
            >
              MEN
            </button>
          </div>

          {/* Total ortada, search sağda – aynı yükseklikte */}
          <div className="flex w-full flex-col items-center text-[10px] uppercase tracking-[0.22em] text-slate-400">
            <div className="relative w-full">
              {/* total fighters – satırın tam ortasında */}
              <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center">
                {visibleCount} fighters
              </p>

              {/* search – aynı satırda, sağa hizalı (biraz daha küçük) */}
              <div className="flex justify-end">
                <div className="w-full max-w-[220px] sm:max-w-[260px]">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">
                      🔍
                    </span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search for fighters"
                      className="w-full rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 pl-7 text-xs text-slate-100 placeholder:text-zinc-500 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Grid – her satırda 4 dövüşçü */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
          {visibleCount === 0 ? (
            <p className="col-span-full mt-4 text-center text-sm text-slate-400">
              Seçilen filtrelere uyan dövüşçü bulunamadı.
            </p>
          ) : (
            filteredFighters.map((f) => {
              const initials = getInitials(f.name);
              const wins = typeof f.wins === "number" ? f.wins : 0;
              const losses = typeof f.losses === "number" ? f.losses : 0;
              const draws = typeof f.draws === "number" ? f.draws : 0;

              return (
                <article
                  key={f.externalId}
                  className="flex flex-col overflow-hidden rounded-xl bg-transparent"
                >
                  {/* İç kart */}
                  <div className="relative mx-3">
                    {/* Kart içeriği */}
                    <div className="flex flex-col">
                      {/* ÜST: Görsel */}
                      <Link
                        to={`/fighters/${f.externalId}`}
                        className="block"
                      >
                        <div className="flex h-40 w-full items-end justify-center bg-black overflow-hidden">
                          {f.imageUrl ? (
                            <img
                              src={f.imageUrl}
                              alt={f.name}
                              className="h-full w-full object-cover object-top transform origin-bottom scale-[0.75] transition-transform duration-300 hover:scale-[0.82]"
                            />
                          ) : (
                            <div className="flex h-full w-full items-end justify-center bg-gradient-to-br from-zinc-800 to-zinc-700">
                              <span className="mb-2 text-2xl font-bold text-slate-200">
                                {initials}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* İnce çizgi */}
                      <div className="h-px w-3/4 mx-auto bg-zinc-800" />

                      {/* İsim + siklet + W-L-D */}
                      <div className="mt-1 pb-2 text-center">
                        <p
                          className="inline-block mt-1 mb-1 text-[1.1rem] md:text-[1.2rem] font-semibold uppercase leading-[1.1]"
                          style={{
                            fontFamily: '"Arial Narrow", Arial, sans-serif',
                            letterSpacing: "0.02em",
                          }}
                        >
                          {f.name}
                        </p>

                        {/* Badge alanı */}
                        <div className="mt-[1px] flex flex-wrap justify-center gap-1.5 text-[10px] uppercase tracking-[0.18em]">
                          <span className="rounded-sm bg-zinc-900 px-2 py-[4px] text-slate-200">
                            {f.weightClass}
                          </span>
                          {f.status && (
                            <span
                              className={`rounded-sm px-2 py-[4px] ${
                                f.status.toLowerCase() === "active"
                                  ? "bg-green-900/80 text-green-200"
                                  : "bg-red-900/80 text-red-200"
                              }`}
                            >
                              {f.status}
                            </span>
                          )}
                        </div>

                        <p className="mt-[1px] text-[11px] text-slate-400">
                          {wins}-{losses}-{draws}{" "}
                          <span className="text-[10px]">(W-L-D)</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}