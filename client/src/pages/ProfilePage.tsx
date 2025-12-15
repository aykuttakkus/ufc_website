// src/pages/ProfilePage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Favorite } from "../types";
import { getFavorites, deleteFavorite } from "../api/favorites";

function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth yüklenene kadar bekle
    if (authLoading) return;
    
    // Auth yüklendi ve kullanıcı yoksa login'e yönlendir
    if (!user) {
      navigate("/login");
      return;
    }
    if (isAuthenticated) {
      loadFavorites();
    }
  }, [isAuthenticated, user, navigate, authLoading]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error("GET /favorites error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFavorite = async (fav: Favorite) => {
    const ok = window.confirm(
      `${fav.fighter.name} favorilerden silinsin mi?`
    );
    if (!ok) return;

    try {
      await deleteFavorite(fav._id);
      setFavorites((prev) => prev.filter((f) => f._id !== fav._id));
    } catch (err) {
      console.error("deleteFavorite error:", err);
      alert("Favori silinirken bir hata oluştu.");
    }
  };

  // Auth yüklenirken loading göster
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-slate-300 text-lg">Yükleniyor...</p>
      </div>
    );
  }

  // Auth yüklendi ama kullanıcı yoksa (useEffect zaten yönlendirecek)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8">⭐ Favorilerim</h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-slate-300 text-lg">Yükleniyor...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-slate-300 text-lg">
              Henüz hiç favorin yok. Fighters sayfasından ekleyebilirsin.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((fav) => (
              <div
                key={fav._id}
                className="rounded-xl border border-white/10 bg-black/70 p-6 shadow-lg backdrop-blur hover:border-white/20 transition-all duration-300 flex flex-col gap-4"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">
                    {fav.fighter.name}
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">
                    {fav.fighter.weightClass}
                  </p>

                  <div className="space-y-2 text-sm">
                    <p className="text-slate-300">
                      <span className="text-slate-400">Ülke:</span> {fav.fighter.country}
                    </p>
                    <div className="flex gap-4 text-slate-300">
                      <span>
                        <span className="text-slate-400">Kazandı:</span> {fav.fighter.wins}
                      </span>
                      <span>
                        <span className="text-slate-400">Kaybetti:</span> {fav.fighter.losses}
                      </span>
                      {fav.fighter.draws > 0 && (
                        <span>
                          <span className="text-slate-400">Berabere:</span> {fav.fighter.draws}
                        </span>
                      )}
                    </div>
                  </div>

                  {fav.note && (
                    <div className="mt-4 p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/30">
                      <p className="text-sm text-emerald-300">
                        <span className="text-emerald-400 font-medium">Not:</span> {fav.note}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteFavorite(fav)}
                  className="mt-auto w-full px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                >
                  🗑 Favorilerden Çıkar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;

