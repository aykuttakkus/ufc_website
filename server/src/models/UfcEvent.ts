// src/models/UfcEvent.ts
import { Schema, model, Document } from "mongoose";

export type CardSection = "Main Card" | "Prelims" | "Early Prelims" | "Unknown";

export type WinnerSide = "red" | "blue" | "draw" | "no-contest";

export interface IEventFight {
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

  redImageUrl?: string;
  blueImageUrl?: string;

  cardSection?: CardSection;
  isPlaceholder?: boolean;

  // 🔥 YENİ – sadece geçmiş event'lerde dolu
  fightBonus?: string | null; // "Fight of the Night" / "Performance of the Night"
  resultRound?: number | null; // kaçıncı raundda bitti
  resultMethod?: string | null; // "KO/TKO", "Submission", "Decision - Unanimous" vb.
  resultTime?: string | null; // "5:00", "3:45" vb. - maçın bittiği zaman
  winnerSide?: WinnerSide | null; // "red" | "blue" | "draw" | "no-contest"
}

export interface IUfcEvent extends Document {
  ufcId: string;
  name: string;
  subtitle?: string;
  date?: Date;
  location?: string;
  type?: string;
  isUpcoming: boolean;

  fights: IEventFight[];

  lastDetailsRefreshedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const EventFightSchema = new Schema<IEventFight>(
  {
    id: { type: String, required: true },
    boutOrder: { type: Number, required: true },
    weightClass: { type: String },

    redName: { type: String, required: true },
    blueName: { type: String, required: true },

    redRank: { type: Number },
    blueRank: { type: Number },

    redCountry: { type: String },
    blueCountry: { type: String },
    redCountryCode: { type: String },
    blueCountryCode: { type: String },

    redOdds: { type: String },
    blueOdds: { type: String },

    redImageUrl: { type: String },
    blueImageUrl: { type: String },

    cardSection: {
      type: String,
      enum: ["Main Card", "Prelims", "Early Prelims", "Unknown"],
      default: "Unknown",
    },

    isPlaceholder: { type: Boolean, default: false },

    // 🔥 YENİ ALANLAR
    fightBonus: { type: String, default: null },
    resultRound: { type: Number, default: null },
    resultMethod: { type: String, default: null },
    resultTime: { type: String, default: null },
    winnerSide: {
      type: String,
      enum: ["red", "blue", "draw", "no-contest"],
      default: null,
    },
  },
  { _id: false }
);

const UfcEventSchema = new Schema<IUfcEvent>(
  {
    ufcId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    subtitle: { type: String },
    date: { type: Date },
    location: { type: String },
    type: { type: String },
    isUpcoming: { type: Boolean, default: true },

    fights: { type: [EventFightSchema], default: [] },

    lastDetailsRefreshedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const UfcEvent = model<IUfcEvent>("UfcEvent", UfcEventSchema);