// src/pages/FightersPage.tsx
import { useEffect, useState } from "react";
import { api } from "../api/http";
import type { Fighter } from "../types";
import { Link } from "react-router-dom";

const PAGE_CLASS = "min-h-screen bg-black text-white px-6 py-10";
const CENTER_CLASS = `${PAGE_CLASS} flex flex-col items-center justify-center text-center`;

// Skeleton Components
function SkeletonFighterCard() {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-transparent m-0 p-0">
      {/* Card container - relative mx-2 */}
      <div className="relative mx-2">
        <div className="flex flex-col">
          {/* Görsel container - h-36 w-full items-end justify-center bg-black overflow-hidden rounded-xl */}
          <div className="flex h-36 w-full items-end justify-center bg-black overflow-hidden rounded-xl">
            {/* Gerçek kartlarda: scale-[0.75] origin-bottom - görseli %75 boyutunda gösterir, sağdan soldan ve yukarıdan daraltır */}
            <div className="skeleton-item h-full w-full rounded-xl bg-zinc-900/50 transform origin-bottom scale-[0.75]" />
          </div>

          {/* İnce çizgi - h-px w-3/4 mx-auto bg-zinc-800 */}
          <div className="h-px w-3/4 mx-auto bg-zinc-800" />

          {/* İsim alanı - mt-0.5 pb-1 text-center */}
          <div className="mt-0.5 pb-1 text-center">
            {/* İsim text - inline-block mt-0.5 mb-0.5 text-[1.1rem] md:text-[1.2rem] font-semibold uppercase leading-[1.1] */}
            {/* Gerçek isim: text-[1.1rem] md:text-[1.2rem] leading-[1.1] = yaklaşık 19px (mobile) / 21px (desktop) */}
            {/* Gerçek kartta: inline-block mt-0.5 mb-0.5 - skeleton'da gap kaldırmak için mb-0 kullanıyoruz */}
            <div className="inline-block mt-0.5 mb-0">
              <div className="skeleton-item h-[19px] md:h-[21px] w-20 md:w-24 rounded bg-zinc-800/40" />
            </div>

            {/* Badge alanı - mt-[1px] flex flex-wrap justify-center gap-1.5 text-[10px] uppercase tracking-[0.18em] */}
            {/* Gerçek badge: text-[10px] + py-[4px] = 10px + 8px = 18px yükseklik */}
            {/* Gerçek badge genişlikleri içeriğe göre değişir, ortalama 20-24px (weight class) ve 16-18px (status) */}
            {/* Gerçek kartta: mt-[1px] - skeleton'da gap kaldırmak için mt-0 kullanıyoruz */}
            <div className="mt-0 flex flex-wrap justify-center gap-1.5">
              {/* Weight class badge - gerçek badge boyutuna göre */}
              <div className="skeleton-item h-[18px] w-20 md:w-24 rounded-sm bg-zinc-800/40" />
              {/* Status badge (conditional, bazı kartlarda olabilir) */}
              <div className="skeleton-item h-[18px] w-16 md:w-18 rounded-sm bg-zinc-800/40" />
            </div>

            {/* W-L-D text - mt-[1px] text-[11px] text-slate-400 */}
            {/* Gerçek W-L-D: text-[11px] = yaklaşık 16.5px yükseklik (line-height 1.5 varsayılan) */}
            {/* Gerçek kartta: mt-[1px] text-[11px], mx-auto yok çünkü parent text-center */}
            <div className="mt-[1px] inline-block">
              <div className="skeleton-item h-[16.5px] w-28 md:w-32 rounded bg-zinc-800/40" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function SkeletonFightersPage() {
  return (
    <div className={PAGE_CLASS}>
      <main className="mx-auto max-w-6xl">
        {/* TOP BAR: ALL / WOMEN / MEN + TOTAL + SEARCH */}
        {/* Madde 3: Top bar section - mt-24 mb-24 flex flex-col items-center gap-24 */}
        <section className="mt-24 mb-24 flex flex-col items-center gap-24">
          {/* Madde 4: Tabs – gerçek metin, skeleton değil */}
          {/* Ana ekran: flex items-center justify-center gap-12 */}
          <div className="flex items-center justify-center gap-12">
            {/* Ana ekran: text-lg sm:text-2xl font-black uppercase tracking-[0.3em] */}
            <button
              type="button"
              className="cursor-pointer text-lg sm:text-2xl font-black uppercase tracking-[0.3em] transition-colors text-white"
              disabled
            >
              ALL
            </button>
            <button
              type="button"
              className="cursor-pointer text-lg sm:text-2xl font-black uppercase tracking-[0.3em] transition-colors text-zinc-600"
              disabled
            >
              WOMEN
            </button>
            <button
              type="button"
              className="cursor-pointer text-lg sm:text-2xl font-black uppercase tracking-[0.3em] transition-colors text-zinc-600"
              disabled
            >
              MEN
            </button>
          </div>

          {/* Madde 5: Total + Search skeleton */}
          {/* Ana ekran: flex w-full flex-col items-center text-[10px] uppercase tracking-[0.22em] text-slate-400 */}
          <div className="flex w-full flex-col items-center text-[10px] uppercase tracking-[0.22em] text-slate-400">
            <div className="relative w-full">
              {/* Total fighters skeleton – satırın tam ortasında */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center">
                <div className="skeleton-item h-[15px] w-32 rounded bg-zinc-800/30" />
              </div>

              {/* Search skeleton – aynı satırda, sağa hizalı */}
              <div className="flex justify-end">
                <div className="w-full max-w-[220px] sm:max-w-[260px]">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-[10px] text-zinc-500">
                      🔍
                    </span>
                    <div className="skeleton-item h-8 w-full rounded-full border border-zinc-700 bg-zinc-900/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Madde 6: Grid container - grid grid-cols-2 gap-x-8 gap-y-16 md:grid-cols-4 */}
        {/* Grid gap değerleri - skeleton ekranında dikey gap artırıldı:
            - gap-x-8: 32px (yatay gap, kartlar arası)
            - gap-y-16: 64px (dikey gap, satırlar arası - artırıldı)
            - grid-cols-2: Mobile'da 2 sütun
            - md:grid-cols-4: Desktop'ta 4 sütun
            - Card margin: mx-2 (8px yatay, her tarafta)
        */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-16 md:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((i) => {
            // Satır belirleme: mobile'da her 2 kart bir satır, desktop'ta her 4 kart bir satır
            // Tüm satırlar arasındaki gap'leri eşitlemek için margin ayarlamaları
            // Ana ekrandaki gerçek kartlarla aynı mantık
            const index = i - 1; // i 1'den başlıyor, index 0'dan başlamalı
            const mobileRowIndex = Math.floor(index / 2); // Mobile'da satır index'i
            const desktopRowIndex = Math.floor(index / 4); // Desktop'ta satır index'i
            
            let marginClass = "";
            
            // Mobile için: İlk satır yukarı, diğer satırlar aşağı
            if (mobileRowIndex === 0) {
              marginClass = "-mt-1";
            } else {
              marginClass = "mt-1";
            }
            
            // Desktop için: İlk satır yukarı, diğer satırlar aşağı
            if (desktopRowIndex === 0) {
              marginClass += " md:-mt-1";
            } else {
              marginClass += " md:mt-1";
            }
            
            return (
              <div key={i} className={marginClass.trim() || ""}>
                <SkeletonFighterCard />
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

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

  // Error state
  if (error) {
    return (
      <div className={CENTER_CLASS}>
        <h1 className="mb-4 text-3xl font-bold tracking-wide">Fighters</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Empty state
  if (!loading && fighters.length === 0) {
    return (
      <div className={CENTER_CLASS}>
        <h1 className="mb-4 text-3xl font-bold tracking-wide">Fighters</h1>
        <p className="max-w-md text-slate-300">
          Şu an listelenecek dövüşçü yok. Backend'den birkaç tane ekleyebilirsin.
        </p>
      </div>
    );
  }

  return (
    <div className={`${PAGE_CLASS} relative`}>
      {/* SKELETON OVERLAY - Loading state */}
      <div
        className={`absolute inset-0 z-50 pointer-events-none transition-opacity duration-300 bg-black ${
          loading ? "opacity-100" : "opacity-0"
        }`}
      >
        <SkeletonFightersPage />
      </div>

      {/* ACTUAL CONTENT - Loaded state */}
      <div
        className={`relative z-10 transition-opacity duration-300 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
      >
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
              filteredFighters.map((f, index) => {
                const initials = getInitials(f.name);
                const wins = typeof f.wins === "number" ? f.wins : 0;
                const losses = typeof f.losses === "number" ? f.losses : 0;
                const draws = typeof f.draws === "number" ? f.draws : 0;

                // Satır belirleme: mobile'da her 2 kart bir satır, desktop'ta her 4 kart bir satır
                // Tüm satırlar arasındaki gap'leri eşitlemek için margin ayarlamaları
                // Her satırdaki tüm kartlara aynı margin'i ekle
                let marginClass = "";
                const mobileRowIndex = Math.floor(index / 2); // Mobile'da satır index'i
                const desktopRowIndex = Math.floor(index / 4); // Desktop'ta satır index'i
                
                // Mobile için: İlk satır yukarı, diğer satırlar aşağı
                if (mobileRowIndex === 0) {
                  marginClass = "-mt-1";
                } else {
                  marginClass = "mt-1";
                }
                
                // Desktop için: İlk satır yukarı, diğer satırlar aşağı
                if (desktopRowIndex === 0) {
                  marginClass += " md:-mt-1";
                } else {
                  marginClass += " md:mt-1";
                }

                return (
                  <div key={f.externalId} className={marginClass.trim() || ""}>
                    <article className="flex flex-col overflow-hidden rounded-xl bg-transparent m-0 p-0">
                    {/* İç kart */}
                    <div className="relative mx-2">
                      {/* Kart içeriği */}
                      <div className="flex flex-col">
                        {/* ÜST: Görsel - h-36 ile biraz uzaklaştırıldı */}
                        <Link
                          to={`/fighters/${f.externalId}`}
                          className="block"
                        >
                          <div className="flex h-36 w-full items-end justify-center bg-black overflow-hidden rounded-xl">
                            {f.imageUrl ? (
                              <img
                                src={f.imageUrl}
                                alt={f.name}
                                className="h-full w-full object-cover transform origin-bottom scale-[0.75] transition-transform duration-300 hover:scale-[0.82] rounded-xl"
                                style={{
                                  objectPosition: 'center top',
                                  objectFit: 'cover',
                                  width: '100%',
                                  height: '100%',
                                  display: 'block',
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-end justify-center bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-xl">
                                <span className="mb-2 text-2xl font-bold text-slate-200">
                                  {initials}
                                </span>
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* İnce çizgi */}
                        <div className="h-px w-3/4 mx-auto bg-zinc-800" />

                        {/* İsim + siklet + W-L-D - optimize edilmiş spacing */}
                        <div className="mt-0.5 pb-1 text-center">
                          <p
                            className="inline-block mt-0.5 mb-0.5 text-[1.1rem] md:text-[1.2rem] font-semibold uppercase leading-[1.1]"
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
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
}