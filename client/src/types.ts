// src/types.ts

// 🥊 Fighter tipi – ARTIK externalId zorunlu, _id opsiyonel
export interface Fighter {
  // Mongo _id artık sadece internal, UI için opsiyonel
  _id?: string;

  // Octagon'dan gelen slug/id (örn: "islam-makhachev") → ANA public ID
  externalId: string;

  name: string;

  // Lakap, her fighter’da olmayabilir
  nickname?: string;

  weightClass: string;

  // Bazı kayıtlarda boş olabilir
  country?: string;

  wins: number;
  losses: number;
  draws: number;

  // Örn: "Active", "Inactive", "Retired" vs.
  status?: string;

  // Octagon API'den aldığımız görsel url'si
  imageUrl?: string;

  createdAt?: string;
  updatedAt?: string;
}

// ⭐ Favorite tipi
export interface Favorite {
  _id: string;
  fighter: Fighter;
  note: string;
  createdAt?: string;
  updatedAt?: string;
}

// 👤 User tipi
export interface User {
  _id: string;
  name: string;
  email: string;
}

// 🔐 Auth response tipi (backend'e uygun)
export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string; // backend "id" gönderiyor, "_id" değil
      name: string;
      email: string;
    };
  };
}

// 🥋 UFC Rankings tipleri

// Tek bir UFC ranking satırı (champ + top 15)
export interface UfcFighterRank {
  rank: number | null;       // 1, 2, 3... ya da champ için 0
  rankText: string | null;   // "C", "1", "2"...
  isChampion: boolean;
  name: string;
}

// Bir siklet (division) yapısı
export interface UfcDivision {
  division: string;                 // "Lightweight", "Welterweight"...
  champion: UfcFighterRank | null;  // Şampiyon
  fighters: UfcFighterRank[];       // İlk 15
}

// /api/ufc/rankings response
export interface UfcDivisionsResponse {
  success: boolean;
  source: string;
  updatedAt: string | null;
  divisions: UfcDivision[];
}

// /api/ufc/rankings/:divisionName response
export interface UfcSingleDivisionResponse {
  success: boolean;
  source: string;
  updatedAt: string | null;
  division: UfcDivision;
}

// 🥊 Tek maç satırı (fight card item)
export type CardSection =
  | "Main Card"
  | "Prelims"
  | "Early Prelims"
  | "Unknown";

// 👑 Kazanan taraf tipi
export type WinnerSide = "red" | "blue" | "draw" | "no-contest";

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

  // 🖼 Event detail'ten gelen görsel URL'leri
  redImageUrl?: string;
  blueImageUrl?: string;

  cardSection?: CardSection;
  isPlaceholder?: boolean;

  // 🔥 Past event sonuç bilgileri
  fightBonus?: string;      // "Fight of the Night", "Performance of the Night" vb.
  resultRound?: number;     // maçın bittiği round
  resultMethod?: string;    // "KO/TKO", "Submission", "Decision - Unanimous" vb.
  resultTime?: string;      // "5:00", "3:45" vb. - round içi bitiş zamanı
  winnerSide?: WinnerSide;  // kim kazandı
}

// 🗓 UFC Event tipi (liste + detail ortak)
export interface UfcEvent {
  _id?: string;
  ufcId: string;
  name: string;
  subtitle?: string;
  date: string;           // backend Date → string
  location?: string;
  type?: string;          // "PPV", "Fight Night", "Event"...
  isUpcoming: boolean;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;

  // 🆕 detail tarafında gelen alanlar (liste için undefined olabilir)
  fights?: EventFight[];
  lastDetailsRefreshedAt?: string;
}

// Detail sayfasında daha strict tip
export interface EventWithFights extends UfcEvent {
  fights: EventFight[];
}

// 🔁 Backend model'lerin kullandığı Fight alias'ı
export type Fight = EventFight;