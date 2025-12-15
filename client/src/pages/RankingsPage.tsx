// src/pages/RankingsPage.tsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { UfcDivision, Fighter } from "../types";
import { getAllUfcDivisions } from "../api/rankApi";
import { getFighters } from "../api/fighters";

// --- SKELETON LOADING COMPONENTS ---

function SkeletonDivisionColumn({ 
  isP4P = false, 
  hasChampionImage = true, 
  hasChampionText = true 
}: { 
  isP4P?: boolean; 
  hasChampionImage?: boolean; 
  hasChampionText?: boolean;
}) {
  return (
    <article className="flex flex-col px-2">
      {/* Üst kısım: division + champion */}
      <div className="relative pb-3">
        {/* Sol taraf: Siklet adı + Champion bilgisi */}
        <div 
          className="flex flex-col gap-2 pr-[130px]" 
          style={{ minHeight: hasChampionImage ? '79px' : 'auto' }}
        >
          {/* DIVISION LABEL skeleton - text-[9px] (normal) veya text-[8px] (P4P), leading-none, whitespace-nowrap */}
          <div className={`skeleton-item rounded ${isP4P ? 'h-[8px] w-20' : 'h-[9px] w-24'}`} />
          
          {/* Champion ismi skeleton - text-[13px] (normal) veya text-[14px] (P4P), leading-tight, uppercase */}
          <div className={`skeleton-item rounded ${isP4P ? 'h-[17px] w-28' : 'h-[16px] w-32'}`} />
          
          {/* Champion yazısı skeleton - text-[9px], line-height ~1.5 = ~13.5px (P4P'de yok) */}
          {hasChampionText && (
            <div className="skeleton-item h-[13px] w-16 rounded" />
          )}
        </div>

        {/* Sağ taraf: Champion görseli skeleton (conditional) */}
        {hasChampionImage && (
          <div className="absolute top-4 right-0 w-[120px]">
            <div className="skeleton-item h-[79px] w-full rounded" />
          </div>
        )}
      </div>

      {/* Alt çizgi + liste */}
      <div className="border-t border-zinc-800 pt-4">
        <ol className="flex-1 space-y-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
            <li key={i} className="flex items-baseline py-1.5">
              {/* Rank skeleton - text-[12px], line-height ~1.5 = ~18px */}
              <div className="mr-3 skeleton-item h-[18px] w-6 rounded" />
              
              {/* Fighter ismi skeleton - text-[12px], line-height ~1.5 = ~18px */}
              <div className="flex-1 skeleton-item h-[18px] rounded" />
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}

function SkeletonRankingsPage() {
  // Gerçek divisions sayısına yakın skeleton column'lar oluştur (genellikle 12-15 arası)
  // Farklı varyasyonlar: P4P, normal, görsel var/yok, champion yazısı var/yok
  const skeletonColumns = [
    { isP4P: true, hasChampionImage: false, hasChampionText: false }, // Men's P4P
    { isP4P: true, hasChampionImage: false, hasChampionText: false }, // Women's P4P
    { isP4P: false, hasChampionImage: true, hasChampionText: true },  // Flyweight
    { isP4P: false, hasChampionImage: true, hasChampionText: true },  // Bantamweight
    { isP4P: false, hasChampionImage: true, hasChampionText: true },  // Featherweight
    { isP4P: false, hasChampionImage: true, hasChampionText: true },  // Lightweight
    { isP4P: false, hasChampionImage: true, hasChampionText: true },  // Welterweight
    { isP4P: false, hasChampionImage: true, hasChampionText: true },  // Middleweight
    { isP4P: false, hasChampionImage: true, hasChampionText: true },  // Light Heavyweight
    { isP4P: false, hasChampionImage: true, hasChampionText: true },  // Heavyweight
    { isP4P: false, hasChampionImage: true, hasChampionText: true },  // Women's Flyweight
    { isP4P: false, hasChampionImage: true, hasChampionText: true },  // Women's Bantamweight
    { isP4P: false, hasChampionImage: false, hasChampionText: true }, // Women's Featherweight (görsel olmayabilir)
    { isP4P: false, hasChampionImage: true, hasChampionText: true },  // Women's Strawweight
  ];

  return (
    <section className="min-h-screen bg-black px-3 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {skeletonColumns.map((config, index) => (
            <SkeletonDivisionColumn 
              key={index}
              isP4P={config.isP4P}
              hasChampionImage={config.hasChampionImage}
              hasChampionText={config.hasChampionText}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Champion görselleri için import
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

// İsmi normalize et (karşılaştırma için)
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")      // Diacritical marks
    .replace(/[^a-z0-9\s]/g, "")          // Sadece harf, rakam ve boşluk tut
    .replace(/\s+/g, " ")
    .trim();
}

// İsimden slug üret (fallback için)
function nameToSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")      // Diacritical marks
    .replace(/[^a-z0-9\s]/g, "")          // Sadece harf, rakam ve boşluk tut
    .replace(/\s+/g, "-")                 // Boşlukları tire yap
    .replace(/-+/g, "-")                  // Çoklu tireleri teke indir
    .replace(/^-|-$/g, "");               // Baş ve sondaki tireleri sil
}

// Champion ismine göre kemer görselini döndürür
function getChampionBeltImage(championName: string): string | null {
  const nameLower = championName.toLowerCase().trim();
  
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

// İsim -> externalId eşleşme haritası oluştur
function buildNameToIdMap(fighters: Fighter[]): Map<string, string> {
  const map = new Map<string, string>();
  
  for (const fighter of fighters) {
    if (!fighter.externalId) continue;
    
    // Orijinal isim
    const normalizedName = normalizeName(fighter.name);
    map.set(normalizedName, fighter.externalId);
    
    // Ayrıca her kelimeyi ayrı ayrı da ekle (fuzzy matching için)
    // Örn: "Islam Makhachev" -> "islam makhachev", "makhachev islam"
    const words = normalizedName.split(" ");
    if (words.length >= 2) {
      // Ters sıralama da ekle
      const reversed = [...words].reverse().join(" ");
      if (!map.has(reversed)) {
        map.set(reversed, fighter.externalId);
      }
    }
  }
  
  return map;
}

// Dövüşçü isminden externalId bul
function findExternalId(
  fighterName: string,
  nameMap: Map<string, string>,
  fighters: Fighter[]
): string {
  const normalized = normalizeName(fighterName);
  
  // 1. Direkt eşleşme
  if (nameMap.has(normalized)) {
    return nameMap.get(normalized)!;
  }
  
  // 2. Kelimelerle kısmi eşleşme (her iki ismin kelimeleri örtüşüyorsa)
  const searchWords = normalized.split(" ");
  for (const fighter of fighters) {
    if (!fighter.externalId) continue;
    
    const fighterNormalized = normalizeName(fighter.name);
    const fighterWords = fighterNormalized.split(" ");
    
    // Her iki taraftaki kelimelerin en az %60'ı eşleşiyorsa
    const matchCount = searchWords.filter(sw => 
      fighterWords.some(fw => fw.includes(sw) || sw.includes(fw))
    ).length;
    
    if (matchCount >= Math.ceil(searchWords.length * 0.6) && 
        matchCount >= Math.ceil(fighterWords.length * 0.6)) {
      return fighter.externalId;
    }
  }
  
  // 3. Fallback: slug oluştur (backend'deki akıllı arama devreye girer)
  return nameToSlug(fighterName);
}

export default function RankingsPage() {
  const [divisions, setDivisions] = useState<UfcDivision[]>([]);
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // İsim -> externalId haritası (memoized)
  const nameToIdMap = useMemo(() => buildNameToIdMap(fighters), [fighters]);

  useEffect(() => {
    // Hem rankings hem de fighters'ı paralel yükle
    Promise.all([
      getAllUfcDivisions(),
      getFighters()
    ])
      .then(([rankingsData, fightersData]) => {
        setDivisions(rankingsData.divisions);
        setFighters(fightersData);
      })
      .catch((err) => {
        console.error(err);
        setError("Veriler yüklenirken bir hata oluştu.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="min-h-screen bg-black px-3 py-8 text-white relative">
      {/* SKELETON OVERLAY - Loading state */}
      <div
        className={`absolute inset-0 z-50 pointer-events-none transition-opacity duration-300 bg-black ${
          loading ? "opacity-100" : "opacity-0"
        }`}
      >
        <SkeletonRankingsPage />
      </div>

      {/* ACTUAL CONTENT - Loaded state */}
      <div
        className={`relative z-10 transition-opacity duration-300 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="mx-auto max-w-6xl">
          {error && (
            <p className="mt-6 text-center text-xs text-red-600">{error}</p>
          )}

          {!error && (
            <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
              {divisions.map((division) => (
                <DivisionColumn 
                  key={division.division} 
                  division={division}
                  nameToIdMap={nameToIdMap}
                  fighters={fighters}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

interface DivisionColumnProps {
  division: UfcDivision;
  nameToIdMap: Map<string, string>;
  fighters: Fighter[];
}

function DivisionColumn({ division, nameToIdMap, fighters }: DivisionColumnProps) {
  const navigate = useNavigate();

  const championName =
    division.champion?.name ?? division.fighters[0]?.name ?? "Champion";
  
  const championBeltImage = getChampionBeltImage(championName);

  const handleFighterClick = (fighterName: string) => {
    // Veritabanındaki gerçek externalId'yi bul
    const externalId = findExternalId(fighterName, nameToIdMap, fighters);
    navigate(`/fighters/${externalId}`);
  };

  const isP4P = division.division.toLowerCase().includes("pound-for-pound");

  return (
    <article className="flex flex-col px-2">
      {/* Üst kısım: division + champion */}
      <div className="relative pb-3">
        {/* Sol taraf: Siklet adı + Champion bilgisi */}
        <div className="flex flex-col gap-2 pr-[130px]" style={{ minHeight: championBeltImage ? '79px' : 'auto' }}>
          {/* DIVISION LABEL – UFC tarzı, tek satır */}
          <p
            className={[
              "whitespace-nowrap",
              "uppercase",
              "font-black",
              "leading-none",
              "text-[#e30613]",
              "tracking-[0.20em]",
              isP4P ? "text-[8px]" : "text-[9px]",
            ].join(" ")}
          >
            {division.division}
          </p>

          {/* Şampiyon/P4P #1 ismi */}
          <span
            className={[
              "font-black",
              "tracking-tight",
              "leading-tight",
              "uppercase",
              isP4P ? "text-[14px]" : "text-[13px]",
            ].join(" ")}
          >
            {championName}
          </span>

          {/* Champion yazısı (P4P'de yok) */}
          {!isP4P && (
            <span className="text-[9px] uppercase tracking-[0.18em] text-slate-500">
              Champion
            </span>
          )}
        </div>

        {/* Sağ taraf: Champion görseli - sabit pozisyon */}
        {championBeltImage && (
          <div className="absolute top-4 right-0 w-[120px]">
            <img 
              src={championBeltImage} 
              alt={`${championName} ${isP4P ? 'P4P #1' : 'Belt'}`}
              className="w-full h-auto object-contain"
            />
          </div>
        )}
      </div>

      {/* Alt çizgi + liste */}
      <div className="border-t border-zinc-800 pt-4">
        <ol className="flex-1 space-y-1">
          {division.fighters.map((fighter) => (
            <li
              key={`${division.division}-${fighter.name}`}
              className="flex items-baseline py-1.5"
            >
              <span className="mr-3 w-6 text-left text-[12px] font-medium text-white">
                {fighter.rankText}
              </span>

              <button
                type="button"
                onClick={() => handleFighterClick(fighter.name)}
                className="flex-1 cursor-pointer text-left text-[12px] font-normal text-slate-400 transition-colors hover:text-white"
              >
                {fighter.name}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}