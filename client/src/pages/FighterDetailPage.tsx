// src/pages/FighterDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Fighter } from "../types";
import { getFighterByExternalId } from "../api/fighters";

const PAGE_CLASS = "min-h-screen bg-black text-white";
const CENTER_CLASS = `${PAGE_CLASS} flex flex-col items-center justify-center text-center px-6 py-10`;

function FighterDetailPage() {
  const { externalId } = useParams<{ externalId: string }>();
  const navigate = useNavigate();

  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleGoBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (!externalId) {
      setError("Geçersiz fighter slug/externalId");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getFighterByExternalId(externalId);
        setFighter(data);
      } catch (err) {
        console.error("getFighterByExternalId error", err);
        setError("Dövüşçü bulunamadı.");
        setFighter(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [externalId]);

  if (loading) {
    return (
      <div className={CENTER_CLASS}>
        <h1 className="mb-4 text-3xl font-bold tracking-wide">
          Fighter Detail
        </h1>
        <p className="text-slate-300">Yükleniyor...</p>
      </div>
    );
  }

  if (error || !fighter) {
    return (
      <div className={CENTER_CLASS}>
        <h1 className="mb-4 text-3xl font-bold tracking-wide">
          Fighter Detail
        </h1>
        <p className="mb-4 text-red-600">{error || "Dövüşçü bulunamadı."}</p>
        <button
          type="button"
          onClick={handleGoBack}
          className="flex items-center text-slate-300 hover:text-red-600 transition-colors group"
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
      </div>
    );
  }

  const wins = fighter.wins ?? 0;
  const losses = fighter.losses ?? 0;
  const draws = typeof fighter.draws === "number" ? fighter.draws : 0;
  const totalFights = wins + losses + draws;

  return (
    <div className={PAGE_CLASS}>
      {/* Üstte geri dön linki */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6 text-xs">
        <button
          type="button"
          onClick={handleGoBack}
          className="flex items-center text-slate-300 hover:text-red-600 transition-colors group"
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
      </header>

      {/* Ana hero alanı */}
      <main className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-10 px-6 pb-10 pt-8 lg:flex-row lg:items-end">
        {/* Sol taraf – metin ve istatistikler */}
        <section className="flex-1 space-y-6">
          {/* Badge alanı */}
          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em]">
            <span className="rounded-sm bg-zinc-900 px-3 py-[6px] text-slate-200">
              {fighter.weightClass} Division
            </span>
            {fighter.status && (
              <span className="rounded-sm bg-zinc-900 px-3 py-[6px] text-slate-200">
                {fighter.status}
              </span>
            )}
            {draws > 0 && (
              <span className="rounded-sm bg-zinc-900 px-3 py-[6px] text-slate-200">
                {draws} Draw{draws > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* İsim */}
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[0.28em] leading-tight">
              {fighter.name}
            </h1>
          </div>

          {/* Weight class + country */}
          <div className="space-y-1 text-sm sm:text-base">
            <p className="font-semibold text-slate-200">
              {fighter.weightClass} Division
            </p>
            <p className="text-xs text-slate-500">
              Country:{" "}
              <span className="font-medium text-slate-300">
                {fighter.country || "Unknown"}
              </span>
            </p>
          </div>

          {/* İstatistik kutuları */}
          <div className="mt-6 grid max-w-xl grid-cols-4 gap-3 border-t border-zinc-800 pt-6">
            <StatBox value={totalFights} label="Total Fights" />
            <StatBox value={wins} label="Wins" />
            <StatBox value={losses} label="Losses" />
            <StatBox value={draws} label="Draws" />
          </div>
        </section>

        {/* Sağ taraf – büyük görsel */}
        <section className="flex-1">
          <div className="flex items-end justify-center lg:justify-end">
            {fighter.imageUrl ? (
              <img
                src={fighter.imageUrl}
                alt={fighter.name}
                className="max-h-[420px] w-auto object-contain drop-shadow-[0_0_40px_rgba(0,0,0,0.9)]"
              />
            ) : (
              <div className="flex h-64 w-48 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-sm text-slate-400">
                No image
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatBox({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-l border-zinc-800 pl-3 first:border-l-0 first:pl-0">
      <div className="text-2xl font-extrabold tracking-tight text-white">
        {value}
      </div>
      <div className="h-[2px] w-8 bg-red-500" />
      <div className="text-[10px] uppercase tracking-[0.16em] text-white">
        {label}
      </div>
    </div>
  );
}

export default FighterDetailPage;