// src/pages/FavoritesPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Favorite } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  getFavorites,
  updateFavoriteNote,
  deleteFavorite,
} from "../api/favorites";

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

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setFavorites([]);
      return;
    }

    void loadFavorites();
  }, [isAuthenticated]);

  const loadFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error("GET /favorites error:", err);
      setError("Favoriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // ✏️ NOT GÜNCELLEME → PATCH /api/favorites/:fighterExternalId
  const handleUpdateNote = async (fav: Favorite) => {
    const newNote = window.prompt("Yeni not:", fav.note || "");
    if (newNote === null) return; // iptal etti

    const slug = fav.fighter?.externalId;
    if (!slug) {
      console.error("Favorite içindeki fighter.externalId eksik:", fav);
      alert("Bu favori için slug bilgisi bulunamadı.");
      return;
    }

    try {
      // backend: PATCH /api/favorites/:fighterExternalId
      const updated = await updateFavoriteNote(slug, newNote);

      // state içinde ilgili favoriyi fighter.externalId'e göre güncelle
      setFavorites((prev) =>
        prev.map((f) =>
          f.fighter?.externalId === slug ? updated : f
        )
      );
    } catch (err) {
      console.error("updateFavoriteNote error:", err);
      alert("Not güncellenirken bir hata oluştu.");
    }
  };

  // 🗑 SİLME → DELETE /api/favorites/:fighterExternalId
  const handleDeleteFavorite = async (fav: Favorite) => {
    const name = fav.fighter?.name ?? "Bu dövüşçü";
    const ok = window.confirm(`${name} favorilerden silinsin mi?`);
    if (!ok) return;

    const slug = fav.fighter?.externalId;
    if (!slug) {
      console.error("Favorite içindeki fighter.externalId eksik:", fav);
      alert("Bu favori için slug bilgisi bulunamadı.");
      return;
    }

    try {
      // backend: DELETE /api/favorites/:fighterExternalId
      await deleteFavorite(slug);

      setFavorites((prev) =>
        prev.filter((f) => f.fighter?.externalId !== slug)
      );
    } catch (err) {
      console.error("deleteFavorite error:", err);
      alert("Favori silinirken bir hata oluştu.");
    }
  };

  // 🔒 Login değilse
  if (!isAuthenticated) {
    return (
      <div className={CENTER_CLASS}>
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-[0.3em] mb-6">
          Favorites
        </h1>
        <p className="text-slate-300 max-w-md">
          Favorilerini görmek için önce giriş yapmalısın.
        </p>
      </div>
    );
  }

  // ⏳ Loading
  if (loading) {
    return (
      <div className={CENTER_CLASS}>
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-[0.3em] mb-6">
          Favorites
        </h1>
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
      </div>
    );
  }

  // ❌ Error
  if (error) {
    return (
      <div className={CENTER_CLASS}>
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-[0.3em] mb-6">
          Favorites
        </h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // ⛔ Boş liste
  if (favorites.length === 0) {
    return (
      <div className={CENTER_CLASS}>
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-[0.3em] mb-6">
          Favorites
        </h1>
        <p className="text-slate-300 max-w-md">
          Henüz hiç favorin yok. Fighters sayfasından ekleyebilirsin.
        </p>
        <Link
          to="/fighters"
          className="mt-6 text-sm text-red-600 underline hover:text-red-600 transition-colors"
        >
          → Fighters sayfasına git
        </Link>
      </div>
    );
  }

  // ✅ Liste
  return (
    <div className={PAGE_CLASS}>
      <main className="mx-auto max-w-6xl">
        {/* Başlık */}
        <div className="mb-16 mt-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-[0.3em] mb-4">
            Favorites
          </h1>
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
            {favorites.length} {favorites.length === 1 ? "fighter" : "fighters"}
          </p>
        </div>

        {/* Kartlar Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
          {favorites.map((fav) => {
            const fighter = fav.fighter;
            if (!fighter) return null;

            const initials = getInitials(fighter.name);
            const wins = typeof fighter.wins === "number" ? fighter.wins : 0;
            const losses = typeof fighter.losses === "number" ? fighter.losses : 0;
            const draws = typeof fighter.draws === "number" ? fighter.draws : 0;

            return (
              <article
                key={fav._id}
                className="flex flex-col overflow-hidden rounded-xl bg-transparent group"
              >
                {/* İç kart */}
                <div className="relative mx-3">
                  {/* Favori ikonu - sol üst */}
                  <div className="absolute left-1 top-1 z-10 flex h-6 w-6 items-center justify-center text-red-600">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        d="M21 8.25c0-2.485-2.015-4.5-4.5-4.5-1.77 0-3.298 1.012-4.05 2.475C11.698 4.762 10.17 3.75 8.4 3.75 5.915 3.75 3.9 5.765 3.9 8.25c0 7.22 8.1 11 8.1 11s9-3.78 9-11Z"
                        className="fill-current"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Kart içeriği */}
                  <div className="flex flex-col">
                    {/* ÜST: Görsel */}
                    <Link
                      to={`/fighters/${fighter.externalId}`}
                      className="block"
                    >
                      <div className="flex h-40 w-full items-end justify-center bg-black overflow-hidden">
                        {fighter.imageUrl ? (
                          <img
                            src={fighter.imageUrl}
                            alt={fighter.name}
                            className="h-full w-full object-cover object-top transform origin-bottom scale-[0.75] transition-transform duration-300 group-hover:scale-[0.82]"
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
                        {fighter.name}
                      </p>

                      {/* Badge alanı */}
                      <div className="mt-[1px] flex flex-wrap justify-center gap-1.5 text-[10px] uppercase tracking-[0.18em]">
                        <span className="rounded-sm bg-zinc-900 px-2 py-[4px] text-slate-200">
                          {fighter.weightClass}
                        </span>
                        {fighter.status && (
                          <span
                            className={`rounded-sm px-2 py-[4px] ${
                              fighter.status.toLowerCase() === "active"
                                ? "bg-green-900/80 text-green-200"
                                : "bg-red-900/80 text-red-200"
                            }`}
                          >
                            {fighter.status}
                          </span>
                        )}
                      </div>

                      <p className="mt-[1px] text-[11px] text-slate-400">
                        {wins}-{losses}-{draws}{" "}
                        <span className="text-[10px]">(W-L-D)</span>
                      </p>

                      {/* Not varsa göster */}
                      {fav.note && (
                        <div className="mt-2 mx-auto max-w-full">
                          <div className="rounded-sm bg-emerald-900/20 border border-emerald-500/30 px-2 py-1.5">
                            <p className="text-[10px] text-emerald-300 leading-tight">
                              {fav.note}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Butonlar */}
                    <div className="mt-2 flex gap-1.5 px-2">
                      <button
                        onClick={() => handleUpdateNote(fav)}
                        className="flex-1 text-[10px] px-2 py-1.5 rounded-lg bg-amber-500/80 hover:bg-amber-500 text-slate-900 font-medium transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFavorite(fav)}
                        className="flex-1 text-[10px] px-2 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-600 text-white font-medium transition-colors"
                      >
                        🗑 Remove
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
